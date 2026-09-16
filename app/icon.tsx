import { ImageResponse } from "next/og";
import { OgMark } from "@/components/site/OgMark";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default function Icon() {
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
        <OgMark size={32} />
      </div>
    ),
    { ...size },
  );
}
