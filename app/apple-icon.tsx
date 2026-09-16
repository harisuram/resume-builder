import { ImageResponse } from "next/og";
import { OgMark } from "@/components/site/OgMark";

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
          background: "#faf7f0",
        }}
      >
        <OgMark size={140} />
      </div>
    ),
    { ...size },
  );
}
