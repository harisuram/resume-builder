import type { SectionKey } from "@/lib/types";
import { SectionIcon } from "./icons";
import { tint, type TemplateTheme } from "./theme";

export function SectionHeading({
  theme,
  section,
  title,
  light = false,
}: {
  theme: TemplateTheme;
  section: SectionKey;
  title: string;
  /** Render against a dark/colored background (sidebar, dark header). */
  light?: boolean;
}) {
  const { accent, headingStyle, italicHeadings } = theme;
  const color = light ? "#ffffff" : accent;
  const base = `text-[12.5px] font-semibold uppercase tracking-wide ${italicHeadings ? "italic" : ""}`;

  switch (headingStyle) {
    case "icon":
      return (
        <div
          className="mb-2 flex items-center gap-1.5 border-b pb-1 break-after-avoid"
          style={{ borderColor: light ? "rgba(255,255,255,0.35)" : tint(accent, 35) }}
        >
          <span className="shrink-0" style={{ color }}>
            <SectionIcon section={section} />
          </span>
          <h3 className={`${base} min-w-0`} style={{ color }}>
            {title}
          </h3>
        </div>
      );
    case "rule-partial":
      return (
        <div className="mb-2 break-after-avoid">
          <h3 className={base} style={{ color }}>
            {title}
          </h3>
          <div className="mt-1 h-[2px] w-9" style={{ background: color }} />
        </div>
      );
    case "rule-full":
      return (
        <div className="mb-2 border-b-2 pb-1 break-after-avoid" style={{ borderColor: color }}>
          <h3 className={base} style={{ color }}>
            {title}
          </h3>
        </div>
      );
    case "boxed":
      return (
        <div
          className="mb-2 inline-block rounded px-2 py-0.5 break-after-avoid"
          style={{ background: light ? "rgba(255,255,255,0.16)" : tint(accent, 16) }}
        >
          <h3 className={base} style={{ color }}>
            {title}
          </h3>
        </div>
      );
    case "tracked":
      return (
        <h3 className={`mb-2 ${base} tracking-[0.2em] break-after-avoid`} style={{ color }}>
          {title}
        </h3>
      );
    case "plain":
    default:
      return (
        <h3 className={`mb-2 ${base} tracking-normal break-after-avoid`} style={{ color }}>
          {title}
        </h3>
      );
  }
}
