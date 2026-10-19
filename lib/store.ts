import type { BrokerReceipt, Report } from "./types";

const REPORT_KEY = "erasure:report:v1";
const RECEIPTS_KEY = "erasure:receipts:v1";

export function saveReport(report: Report): void {
  localStorage.setItem(REPORT_KEY, JSON.stringify(report));
}

export function loadReport(): Report | null {
  try {
    const raw = localStorage.getItem(REPORT_KEY);
    return raw ? (JSON.parse(raw) as Report) : null;
  } catch {
    return null;
  }
}

export function saveReceipts(receipts: BrokerReceipt[]): void {
  localStorage.setItem(RECEIPTS_KEY, JSON.stringify(receipts));
}

export function loadReceipts(): BrokerReceipt[] {
  try {
    const raw = localStorage.getItem(RECEIPTS_KEY);
    return raw ? (JSON.parse(raw) as BrokerReceipt[]) : [];
  } catch {
    return [];
  }
}

export function maskEmail(email?: string): string {
  if (!email) return "anonymous";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local!.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(2, local!.length - 2))}@${domain}`;
}
