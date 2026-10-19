export type ScanConsent = {
  /** The user confirmed the identity being scanned belongs to them. */
  ownIdentity: boolean;
  /** Optional: reached 18+ (letters include legal statements). */
  adult: boolean;
  grantedAt: string;
};

export type IdentityInput = {
  username?: string;
  email?: string;
  fullName?: string;
  city?: string;
  state?: string;
  country?: string;
  jurisdiction: "ccpa" | "gdpr" | "us-state" | "generic";
};

export type UsernameHit = {
  site: string;
  category: string;
  url: string
  status: number;
};

export type BreachUnauthorized = {
  skipped: true;
  reason: "no-hibp-key";
  howTo: string;
  manualCheckUrl: string;
};

export type BreachFinding = {
  name: string;
  title: string;
  breachDate: string;
  dataClasses: string[];
  domain: string;
};

export type PasswordCheck = {
  checked: boolean;
  exposed: boolean;
  seenCount?: number;
};

export type ExifFinding = {
  fileName: string;
  hasGps: boolean;
  lat?: number;
  lon?: number;
  takenAt?: string;
  camera?: string;
};

export type BrokerLetterStatus =
  | "pending"
  | "sent"
  | "acknowledged"
  | "erased"
  | "refused"
  | "relisted";

export type BrokerReceipt = {
  brokerId: string;
  brokerName: string;
  status: BrokerLetterStatus;
  letterSentAt?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  nextRecheckAt?: string;
  note?: string;
};

export type Report = {
  id: string;
  createdAt: string;
  consent: ScanConsent;
  identity: IdentityInput;
  breaches: BreachUnauthorized | BreachFinding[];
  breachesIncludedInScore: boolean;
  passwords: PasswordCheck;
  usernameHits: UsernameHit[];
  usernameScanned: number;
  exifFindings: ExifFinding[];
};

export type Score = {
  total: number; // 0-100, higher = more exposed
  grade: "A" | "B" | "C" | "D" | "F";
  parts: {
    breaches?: number;
    usernames?: number;
    passwords?: number;
    brokers?: number;
  };
  weightsUsed: string[];
};

export type ComplianceStat = {
  broker: string;
  honorRate: number | null; // 0..1 fraction of deletions honored (null = unknown)
  relistReported: number; // count of crowd-verified re-listing reports
  source: string;
};
