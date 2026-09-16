import { ImageResponse } from "next/og";
import { OgMark } from "@/components/site/OgMark";
import { SITE_NAME } from "@/lib/seo";

export const alt = "Free Resume Maker — make a resume or curriculum vitae online, no account";
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
          background: "#faf7f0",
          color: "#1b1812",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 28 }}>
          <OgMark size={56} />
          <div
            style={{
              marginLeft: 20,
              fontSize: 22,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#8a8377",
            }}
          >
            Free · No account · Private
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 64, fontWeight: 700, lineHeight: 1.1, maxWidth: 980 }}>
          {SITE_NAME}
        </div>
        <div style={{ display: "flex", fontSize: 30, marginTop: 24, color: "#57524a", maxWidth: 920, lineHeight: 1.35 }}>
          Make a resume or curriculum vitae. Pick a template. Download a PDF.
        </div>
      </div>
    ),
    { ...size },
  );
}
