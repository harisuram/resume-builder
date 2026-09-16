/** Public origin used for canonical URLs, Open Graph, robots, and sitemap.
 * Set `NEXT_PUBLIC_SITE_URL` on the production build — the `.workers.dev`
 * fallback is only a placeholder so local `next build` still emits absolute
 * URLs. Trailing slashes are stripped so path joins stay predictable. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://resume-builder.workers.dev"
).replace(/\/+$/, "");

export const INDEXABLE_PATHS = [
  "/",
  "/how-to-make-a-resume",
  "/private",
  "/templates",
  "/ats",
  "/privacy",
  "/about",
] as const;

export type IndexablePath = (typeof INDEXABLE_PATHS)[number];

export function absoluteUrl(path: string): string {
  if (path === "/") return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
