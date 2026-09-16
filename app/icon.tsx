import { ImageResponse } from "next/og";
import { OgMark } from "@/components/site/OgMark";

/** PNG fallback of the nav nib for browsers that don't use the SVG favicon. */
export const size = { width: 64, height: 64 };
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
        <OgMark size={56} />
      </div>
    ),
    { ...size },
  );
}
