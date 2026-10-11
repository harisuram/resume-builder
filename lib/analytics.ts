/**
 * Ahrefs Web Analytics: cookieless visit counts, and the snippet that lets
 * Ahrefs verify the site. The key is the `data-key` from the snippet Ahrefs
 * issued. Override it with `NEXT_PUBLIC_AHREFS_ANALYTICS_KEY`, or set that
 * to empty to leave the script off (a preview build, say).
 */
export const AHREFS_ANALYTICS_SRC = "https://analytics.ahrefs.com/analytics.js";

export const DEFAULT_AHREFS_ANALYTICS_KEY = "bbGTEVcNqkuomWTkVPr0ag";

export const AHREFS_ANALYTICS_KEY = (
  process.env.NEXT_PUBLIC_AHREFS_ANALYTICS_KEY ?? DEFAULT_AHREFS_ANALYTICS_KEY
).trim();

export function isAhrefsAnalyticsConfigured(): boolean {
  return AHREFS_ANALYTICS_KEY.length > 0;
}
