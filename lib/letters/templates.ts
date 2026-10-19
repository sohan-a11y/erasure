import { RECHECK_INTERVAL_DAYS } from "../config";
import type { BrokerEntry } from "../scans/broker-registry";
import type { IdentityInput } from "../types";

export type Letter = {
  brokerId: string;
  brokerName: string;
  toEmailHint: string;
  subject: string;
  body: string;
  referenceId: string;
  deadlineDays: number;
};

function legalBasis(identity: IdentityInput): string {
  switch (identity.jurisdiction) {
    case "ccpa":
      return "your obligations as a data broker under the California Consumer Privacy Act (Cal. Civ. Code §1798.100 et seq.), including the deletion right under §1798.105 and the One-Time Delete mechanism under the California Delete Act (SB 362)";
    case "gdpr":
      return "the right to erasure ('right to be forgotten') under Article 17 of Regulation (EU) 2016/679 (GDPR)";
    case "us-state":
      return "your obligations under my state's comprehensive consumer privacy law and its deletion rights";
    default:
      return "your obligations as a data broker to honor verified consumer deletion requests, including under applicable consumer privacy statutes";
  }
}

function deadline(identity: IdentityInput): number {
  switch (identity.jurisdiction) {
    case "ccpa": return 45;
    case "gdpr": return 30;
    case "us-state": return 45;
    default: return 45;
  }
}

function signature(identity: IdentityInput): string {
  const lines = [`Sincerely,`, ``, identity.fullName || "[Your full name]"];
  if (identity.email) lines.push(identity.email);
  if (identity.city || identity.state) {
    lines.push([identity.city, identity.state].filter(Boolean).join(", ") + (identity.country ? `, ${identity.country}` : ""));
  }
  return lines.join("\n");
}

export function buildLetter(broker: BrokerEntry, identity: IdentityInput): Letter {
  const now = new Date();
  const ref = `ER-${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}-${broker.id.toUpperCase().slice(0, 6)}`;
  const days = deadline(identity);

  const subject =
    identity.jurisdiction === "gdpr"
      ? `Deletion request (Art. 17 GDPR) — all personal data held about me — Ref ${ref}`
      : `Verified request to delete all personal information you hold about me — Ref ${ref}`;

  const body = `Date: ${now.toISOString().slice(0, 10)}
To: Privacy Office / Data Protection Officer — ${broker.name}
Ref: ${ref}

Dear ${broker.name} Privacy / Compliance Team,

I am exercising my legal right to have you delete the personal information
you hold about me, relying on ${legalBasis(identity)}.

REQUESTED ACTIONS

  1. Delete every record, index entry, derived profile, and cached page that
     associates personal information with me, including any listing generated
     for me on ${broker.name} properties.

  2. If you author or operate match/data feeds sold or syndicated to other
     sites, delete my record from those feeds as well, to the extent possible.

  3. Stop creating a new profile for me from previously collected data.
     I will check back — re-creating a deleted profile is a violation, not a
     technical quirk. I keep dated receipts of every step.

  4. Confirm in writing, per the statutory response window of ${days} days,
     that the deletion is complete. Please reply via email to the address
     below, quoting ref ${ref}.

My details (verification basis):
${identity.fullName ? `  Name:      ${identity.fullName}\n` : ""}${identity.email ? `  Email:     ${identity.email}\n` : ""}${identity.city ? `  City:      ${identity.city}\n` : ""}${identity.state ? `  State:     ${identity.state}\n` : ""}${identity.country ? `  Country:   ${identity.country}\n` : ""}
I can provide further verification through your published process if
required. I am not represented by a service; this is a personal request.

This request is made in good faith and may be shared — including with
regulators and public interest reporting on data-broker compliance — together
with the timestamped record of this letter, your response (or non-response),
and any re-listing I observe afterwards.

Please treat this letter as ${broker.effort === "email" ? "an formal removal request" : "a formal removal request"} irrespective of whether
your site also offers an automated form.

${signature(identity)}

--- Erasure open-source letter engine (https://github.com/your-handle/erasure) ---`;

  return {
    brokerId: broker.id,
    brokerName: broker.name,
    toEmailHint:
      broker.category === "data-broker" ? "privacy@<operator-domain>" : "support / privacy team",
    subject,
    body,
    referenceId: ref,
    deadlineDays: days,
  };
}

export function nextRecheckIso(from: Date = new Date()): string {
  const d = new Date(from.getTime() + RECHECK_INTERVAL_DAYS * 24 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}
