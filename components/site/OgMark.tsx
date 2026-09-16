const ACCENT = "#7a2e2e";
const PAPER = "#faf7f0";

/** Simple mark for generated icons / OG images (Satori, not the inline SVG logo). */
export function OgMark({ size }: { size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.22),
        background: ACCENT,
        color: PAPER,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.round(size * 0.48),
        fontWeight: 700,
        letterSpacing: "-0.04em",
      }}
    >
      R
    </div>
  );
}
