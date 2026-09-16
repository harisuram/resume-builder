import { ImageResponse } from "next/og";
import { OgMark } from "@/components/site/OgMark";
import { BRAND } from "@/lib/brand";
import { SITE_NAME } from "@/lib/seo";

export const alt = "The best free, unlimited AI-powered resume builder — no account";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: BRAND.paper,
          color: BRAND.ink,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -40,
            width: 420,
            height: 420,
            borderRadius: 420,
            background: "rgba(79, 70, 229, 0.12)",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", marginBottom: 28 }}>
          <OgMark size={56} />
          <div
            style={{
              marginLeft: 18,
              fontSize: 20,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: BRAND.inkFaint,
            }}
          >
            Free · Unlimited · AI-powered
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 64, fontWeight: 700, lineHeight: 1.08, maxWidth: 980 }}>
          {SITE_NAME}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 28,
            marginTop: 22,
            color: BRAND.inkSoft,
            maxWidth: 880,
            lineHeight: 1.35,
          }}
        >
          The best free, unlimited AI-powered resume builder. Pick a template. Download a PDF.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 36,
            width: 72,
            height: 4,
            borderRadius: 4,
            background: BRAND.accent,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
