import Image from "next/image";
import type { TemplateTheme } from "@/components/templates/shared/theme";

/** Pixel size of the files `npm run thumbs` writes (A4, 2x a ~270px tile). */
export const TEMPLATE_THUMB_WIDTH = 540;
export const TEMPLATE_THUMB_HEIGHT = 764;

export function templateThumbSrc(id: string) {
  return `/template-thumbs/${id}.webp`;
}

/* A picture of the template rather than a live render: a grid of live tiles
 * repeats the whole sample résumé as page text once per template, which
 * reads as duplicated filler to crawlers. The live render stays in the
 * preview dialog. Regenerate with `npm run thumbs` after a template changes. */
export function TemplateThumb({ theme, sizes, alt }: { theme: TemplateTheme; sizes: string; alt?: string }) {
  return (
    <Image
      src={templateThumbSrc(theme.id)}
      alt={alt ?? `${theme.name} resume template`}
      width={TEMPLATE_THUMB_WIDTH}
      height={TEMPLATE_THUMB_HEIGHT}
      sizes={sizes}
      className="absolute inset-0 h-full w-full object-cover object-top"
    />
  );
}
