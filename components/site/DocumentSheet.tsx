import Image from "next/image";
import { TEMPLATE_THUMB_HEIGHT, TEMPLATE_THUMB_WIDTH, templateThumbSrc } from "./TemplateThumb";

/** Templates with a cover letter thumbnail as well as a resume one — the
 * homepage's matching sets. Keep in sync with SHOWCASE in
 * scripts/cover-letter-thumbs.mjs, which writes the letter pictures. */
export const SHOWCASE_TEMPLATE_IDS = ["atlas", "ember", "fern", "marquee", "vellum"] as const;
export type ShowcaseTemplateId = (typeof SHOWCASE_TEMPLATE_IDS)[number];

export function coverLetterThumbSrc(id: ShowcaseTemplateId) {
  return `/cover-letter-thumbs/${id}.webp`;
}

/** One printed page — a resume or a cover letter thumbnail on a paper sheet
 * with a soft drop shadow. Pictures rather than live renders, like the
 * template strip (see TemplateThumb). */
export function DocumentSheet({
  kind,
  templateId,
  alt,
  sizes,
  className = "",
  priority = false,
}: {
  kind: "resume" | "letter";
  templateId: ShowcaseTemplateId;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[6px] bg-white shadow-[0_1px_2px_rgb(15_23_42_/_0.08),0_18px_40px_-18px_rgb(15_23_42_/_0.45)] ring-1 ring-black/5 ${className}`}
    >
      <Image
        src={kind === "resume" ? templateThumbSrc(templateId) : coverLetterThumbSrc(templateId)}
        alt={alt}
        width={TEMPLATE_THUMB_WIDTH}
        height={TEMPLATE_THUMB_HEIGHT}
        sizes={sizes}
        priority={priority}
        className="block h-auto w-full"
      />
    </div>
  );
}
