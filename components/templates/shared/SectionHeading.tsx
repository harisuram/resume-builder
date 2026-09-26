import type { SectionKey } from "@/lib/types";
import { SectionIcon } from "./icons";
import { DISPLAY_FONT_CSS, headerColor, tint, type TemplateTheme } from "./theme";

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
    case "tracked-rule":
      return (
        <div className="mb-2.5 flex items-center gap-3 break-after-avoid">
          <h3 className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ color }}>
            {title}
          </h3>
          <span className="h-px flex-1" style={{ background: light ? "rgba(255,255,255,0.35)" : tint(accent, 22) }} />
        </div>
      );
    case "serif-title":
      return (
        <h3
          className="mb-2.5 text-[17px] font-semibold leading-tight break-after-avoid"
          style={{
            color: light ? "#ffffff" : headerColor(theme),
            fontFamily: theme.displayFont ? DISPLAY_FONT_CSS[theme.displayFont] : undefined,
          }}
        >
          {title}
        </h3>
      );
    case "centered":
      return (
        <div className="mb-2.5 flex items-center justify-center gap-3 break-after-avoid">
          <span className="h-px w-10" style={{ background: tint(accent, 45) }} />
          <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.24em]" style={{ color }}>
            {title}
          </h3>
          <span className="h-px w-10" style={{ background: tint(accent, 45) }} />
        </div>
      );
    case "code":
      return (
        <div className="mb-2.5 flex items-center gap-2.5 break-after-avoid">
          <h3
            className="shrink-0 text-[12px] font-semibold lowercase"
            style={{ color: headerColor(theme), fontFamily: DISPLAY_FONT_CSS.mono }}
          >
            <span style={{ color: accent }}>~/</span>
            {title}
          </h3>
          <span className="flex-1 border-t border-dashed" style={{ borderColor: tint(headerColor(theme), 22) }} />
        </div>
      );
    case "bar":
      return (
        <h3
          className="mb-2.5 border-l-[3px] pl-2.5 text-[11.5px] font-semibold uppercase tracking-[0.2em] break-after-avoid"
          style={{ borderColor: accent, color: headerColor(theme) }}
        >
          {title}
        </h3>
      );
    case "tile":
      return (
        <div className="mb-2.5 flex items-center gap-2 break-after-avoid">
          <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ background: accent }} />
          <h3
            className="text-[12px] font-bold uppercase tracking-[0.14em]"
            style={{
              color: headerColor(theme),
              fontFamily: theme.displayFont ? DISPLAY_FONT_CSS[theme.displayFont] : undefined,
            }}
          >
            {title}
          </h3>
        </div>
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
