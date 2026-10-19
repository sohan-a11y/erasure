# Reporting a vulnerability

Open a GitHub issue describing the problem (public repo, MIT — treat everything
here as open until proven otherwise). For anything that would endanger users
(e.g. a way to use scan features against non-consenting identities), cut the
severity by shipping a fix, not a CVE.

## Scope guarantees we maintain

- No server-side persistence of identity inputs (v1 keeps identity data in browser localStorage).
- All outbound scanning is rate-limited per IP and consent-gated in UI.
- We never implement features targeting arbitrary third parties' identities.
