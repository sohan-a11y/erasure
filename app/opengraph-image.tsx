import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Erasure — find your exposure, erase it, prove it stayed gone";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #05070d 0%, #0b1524 100%)",
          padding: 64,
          color: "#e7eaf2",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "rgba(56,189,248,0.15)",
              color: "#38bdf8",
              fontSize: 34,
            }}
          >
            ⌫
          </div>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700 }}>Erasure</div>
          <div
            style={{
              display: "flex",
              marginLeft: 16,
              padding: "6px 16px",
              borderRadius: 999,
              border: "1px solid rgba(56,189,248,0.4)",
              color: "#7dd3fc",
              fontSize: 22,
            }}
          >
            free · open source · self-defense OSINT
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", fontSize: 72, fontWeight: 700, color: "#ffffff" }}>
            Find it. Erase it.
          </div>
          <div style={{ display: "flex", fontSize: 72, fontWeight: 700, color: "#38bdf8" }}>
            Prove it stayed gone.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", fontSize: 30, color: "rgba(231,234,242,0.85)" }}>
            Detect breaches &amp; handle footprint → deletion letters (CCPA/GDPR) → receipts
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "rgba(231,234,242,0.85)" }}>
            → the public Broker Compliance Index nobody publishes
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "rgba(148,163,184,0.7)" }}>
            github.com/sohan-a11y/erasure — MIT
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
