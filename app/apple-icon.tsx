import { ImageResponse } from "next/og";
import { OgMark } from "@/components/site/OgMark";
import { BRAND } from "@/lib/brand";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND.paper,
        }}
      >
        <OgMark size={132} />
      </div>
    ),
    { ...size },
  );
}
