import { BRAND } from "@/lib/brand";

const ACCENT = BRAND.accent;
const INK_ON_ACCENT = BRAND.accentInk;

/** Same nib geometry as the nav logo (`NibIcon` in Logo.tsx), sitting on a
 * rounded indigo tile so favicons and Open Graph images match the app mark.
 * Inline SVG + explicit colors: Satori doesn't resolve CSS variables or
 * `currentColor`. */
export function OgMark({ size }: { size: number }) {
  const inner = Math.round(size * 0.58);
  return (
    <div
      style={{
        display: "flex",
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
        background: ACCENT,
        borderRadius: Math.round(size * 0.22),
      }}
    >
      <svg
        width={inner}
        height={inner}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2 4 15.5c-.6 1 .5 2.1 1.5 1.5L12 13l6.5 4c1 .6 2.1-.5 1.5-1.5L12 2Z"
          fill={INK_ON_ACCENT}
        />
        <path
          d="M12 13 9 21.5c-.2.6.5 1.1 1 .7L12 20l2 2.2c.5.4 1.2-.1 1-.7L12 13Z"
          fill={INK_ON_ACCENT}
        />
        <circle cx="12" cy="10.5" r="1.3" fill={ACCENT} />
      </svg>
    </div>
  );
}
