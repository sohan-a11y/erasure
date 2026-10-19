/**
 * Username probe engine (server-side).
 *
 * Data source: the open WhatsMyName dataset (WebBreacher/whatsmyname), which
 * lists hundreds of sites with per-site match rules, plus a small built-in
 * fallback list of well-behaved endpoints in case the remote list is down.
 *
 * IMPORTANT: probes are GET requests with 6-7s timeouts and low concurrency.
 * This tool is consent-scoped: the UI requires the user to confirm they are
 * scanning their OWN username. Do not remove that gate.
 */

export type ProbeEntry = {
  name: string;
  urlMain: string;
  uriCheck: string;
  category: string;
  eCode: number | false;
  eString?: string | false;
  mString?: string | false;
};

export type ProbeResult = {
  site: string;
  category: string;
  url: string;
  status: number;
  found: boolean;
  note?: string;
};

const UA =
  process.env.SCANNER_USER_AGENT ??
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 erasure-osint/0.9";

const LIST_URL =
  process.env.WHATSMYNAME_LIST_URL ??
  "https://raw.githubusercontent.com/WebBreacher/whatsmyname/main/web_accounts_list.json";

const LIST_TTL_MS = 6 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Fallback list (only used if the remote dataset fetch fails)
// ---------------------------------------------------------------------------

export const FALLBACK_LIST: ProbeEntry[] = [
  { name: "GitHub", urlMain: "https://github.com", uriCheck: "https://github.com/{account}", category: "coding", eCode: 200, eString: "profile", mString: "404 “This is not the web page" },
  { name: "Reddit", urlMain: "https://www.reddit.com", uriCheck: "https://www.reddit.com/user/{account}/about.json", category: "social", eCode: 200, eString: "name", mString: false },
  { name: "Telegram", urlMain: "https://t.me", uriCheck: "https://t.me/{account}", category: "messaging", eCode: 200, eString: "tgme_page", mString: false },
  { name: "Hacker News", urlMain: "https://news.ycombinator.com", uriCheck: "https://news.ycombinator.com/user?id={account}", category: "community", eCode: 200, eString: "created:", mString: false },
  { name: "npm", urlMain: "https://www.npmjs.com", uriCheck: "https://www.npmjs.com/~{account}", category: "coding", eCode: 200, eString: "npm", mString: "Page Not Found" },
  { name: "PyPI", urlMain: "https://pypi.org", uriCheck: "https://pypi.org/user/{account}/", category: "coding", eCode: 200, eString: "Profile", mString: "not found" },
  { name: "Docker Hub", urlMain: "https://hub.docker.com", uriCheck: "https://hub.docker.com/v2/users/{account}/", category: "coding", eCode: 200, eString: "username", mString: false },
  { name: "Chess.com", urlMain: "https://chess.com", uriCheck: "https://api.chess.com/pub/player/{account}", category: "gaming", eCode: 200, eString: "player_id", mString: false },
  { name: "SoundCloud", urlMain: "https://soundcloud.com", uriCheck: "https://soundcloud.com/{account}", category: "music", eCode: 200, eString: "sound", mString: false },
  { name: "Medium", urlMain: "https://medium.com", uriCheck: "https://medium.com/@{account}", category: "blogging", eCode: 200, eString: "medium", mString: "Out of nothing" },
  { name: "Tumblr", urlMain: "https://tumblr.com", uriCheck: "https://{account}.tumblr.com/", category: "blogging", eCode: 200, eString: "tumblr", mString: "there's nothing here" },
  { name: "Keybase", urlMain: "https://keybase.io", uriCheck: "https://keybase.io/{account}", category: "crypto", eCode: 200, eString: "keybase", mString: false },
  { name: "Dev Community", urlMain: "https://dev.to", uriCheck: "https://dev.to/{account}", category: "coding", eCode: 200, eString: "dev", mString: "This page does not exist" },
  { name: "Pastebin", urlMain: "https://pastebin.com", uriCheck: "https://pastebin.com/u/{account}", category: "community", eCode: 200, eString: "pastebin", mString: false },
  { name: "Bluesky", urlMain: "https://bsky.app", uriCheck: "https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle={account}.bsky.social", category: "social", eCode: 200, eString: "did:", mString: false },
];

// ---------------------------------------------------------------------------
// Remote dataset cache
// ---------------------------------------------------------------------------

let cacheEntry: { list: ProbeEntry[]; fetchedAt: number; source: "whatsmyname" | "fallback" } | null = null;
let inflight: Promise<void> | null = null;

type WmnEntry = Record<string, unknown>;

function normalize(raw: WmnEntry): ProbeEntry | null {
  const uriCheck = typeof raw.uri_check === "string" ? raw.uri_check : typeof raw.probe_url === "string" ? raw.probe_url : null;
  const name = typeof raw.name === "string" ? raw.name : typeof raw.site === "string" ? raw.site : null;
  if (!uriCheck || !name) return null;

  const eCodeRaw = raw.e_code ?? raw.probe_http_code;
  let eCode: number | false = false;
  if (typeof eCodeRaw === "number") eCode = eCodeRaw;
  else if (eCodeRaw === undefined) eCode = 200; // most entries expect 200

  const eString = (typeof raw.e_string === "string" ? raw.e_string : false) ?? (typeof raw.probe_body_string === "string" ? raw.probe_body_string : false);
  const mString = (typeof raw.m_string === "string" ? raw.m_string : false) ?? (typeof raw.detect_false_positive_string === "string" ? raw.detect_false_positive_string : false);

  const cat = typeof raw.cat === "string" ? raw.cat : "other";
  const urlMain = typeof raw.url_main === "string" ? raw.url_main : "";

  return { name, urlMain, uriCheck, category: cat, eCode, eString, mString };
}

export async function getProbeList(): Promise<{ list: ProbeEntry[]; source: string }> {
  if (cacheEntry && Date.now() - cacheEntry.fetchedAt < LIST_TTL_MS) {
    return { list: cacheEntry.list, source: cacheEntry.source };
  }
  if (inflight) {
    await inflight;
    if (cacheEntry) return { list: cacheEntry.list, source: cacheEntry.source };
  }
  inflight = (async () => {
    try {
      const res = await fetch(LIST_URL, { signal: AbortSignal.timeout(15_000) });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = (await res.json()) as { sites?: WmnEntry[] };
      const sites = Array.isArray(data.sites) ? data.sites : Array.isArray(data) ? (data as unknown as WmnEntry[]) : [];
      const normalized = sites.map(normalize).filter((e): e is ProbeEntry => e !== null);
      if (normalized.length > 0) {
        cacheEntry = { list: normalized, fetchedAt: Date.now(), source: "whatsmyname" };
        return;
      }
      throw new Error("empty dataset");
    } catch {
      cacheEntry ||= { list: FALLBACK_LIST, fetchedAt: Date.now(), source: "fallback" };
    }
  })();
  await inflight;
  inflight = null;
  return { list: cacheEntry!.list, source: cacheEntry!.source };
}

// ---------------------------------------------------------------------------
// Probe
// ---------------------------------------------------------------------------

export async function probeSite(entry: ProbeEntry, account: string): Promise<ProbeResult> {
  const url = entry.uriCheck.includes("{account}")
    ? entry.uriCheck.replace("{account}", encodeURIComponent(account))
    : entry.uriCheck.replace(/\{username\}/g, encodeURIComponent(account));

  const found: ProbeResult = {
    site: entry.name,
    category: entry.category,
    url: entry.urlMain || url,
    status: 0,
    found: false,
  };

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "*/*", "Accept-Language": "en" },
      redirect: "follow",
      signal: AbortSignal.timeout(7_000),
      cache: "no-store",
    });
    found.status = res.status;

    if (res.status === 429) {
      found.note = "rate-limited (try again later)";
      return found;
    }
    if (res.status === 403) {
      found.note = "blocked (anti-bot)";
      return found;
    }

    let body = "";
    if (entry.eString) body = (await res.text()).slice(0, 64_000);

    let ok = true;
    if (entry.eCode !== false && res.status !== entry.eCode) ok = false;
    else if (entry.eCode === false && res.status >= 400) ok = false;
    if (ok && entry.eString) ok = body.includes(entry.eString);
    if (ok && entry.mString) ok = !body.includes(entry.mString);

    // Some sites return soft-404s: 200 status but obviously-missing page.
    if (ok && entry.eCode === false && entry.eString === false) return found; // conservative: no signal

    found.found = ok;
    return found;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "error";
    found.note = msg.includes("aborted") || msg.includes("timeout") ? "timeout" : "network error";
    return found;
  }
}

export async function probeChunk(
  entries: ProbeEntry[],
  account: string,
  concurrency = 10,
): Promise<ProbeResult[]> {
  const results: ProbeResult[] = new Array(entries.length);
  let cursor = 0;
  async function worker() {
    while (true) {
      const i = cursor++;
      if (i >= entries.length) return;
      results[i] = await probeSite(entries[i]!, account);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, entries.length) }, worker),
  );
  return results;
}
