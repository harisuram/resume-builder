/**
 * The publisher id is this site's AdSense account (the `ca-pub-…` in the
 * snippet Google gives you). Slot ids stay environment-driven so in-page
 * units stay collapsed until real slot numbers are set.
 *
 * Override `NEXT_PUBLIC_ADSENSE_CLIENT_ID` if you need a different account.
 * Empty values and the all-zero placeholders (`ca-pub-000…`, slot `0000000000`)
 * are treated as unset so a preview build can disable ads entirely.
 */

/** True for empty values and the all-zero placeholders in `.env.example`. */
export function isPlaceholderAdId(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length === 0 || /^0+$/.test(digits);
}

function liveId(value: string | undefined): string {
  const raw = value ?? "";
  return isPlaceholderAdId(raw) ? "" : raw;
}

/** From the AdSense snippet: `adsbygoogle.js?client=ca-pub-…`. */
export const DEFAULT_ADSENSE_CLIENT_ID = "ca-pub-9224755974440077";

export const ADSENSE_CLIENT_ID = liveId(
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? DEFAULT_ADSENSE_CLIENT_ID,
);

export const ADSENSE_SLOTS = {
  landing: liveId(process.env.NEXT_PUBLIC_ADSENSE_SLOT_LANDING),
  builderPreview: liveId(process.env.NEXT_PUBLIC_ADSENSE_SLOT_BUILDER),
  builderPreviewTop: liveId(process.env.NEXT_PUBLIC_ADSENSE_SLOT_BUILDER_TOP),
  builderNav: liveId(process.env.NEXT_PUBLIC_ADSENSE_SLOT_NAV),
  builderExport: liveId(process.env.NEXT_PUBLIC_ADSENSE_SLOT_EXPORT),
  builderSectionFooter: liveId(process.env.NEXT_PUBLIC_ADSENSE_SLOT_SECTION_FOOTER),
};

export function isAdsenseConfigured(): boolean {
  return ADSENSE_CLIENT_ID.length > 0;
}

/** `ca-pub-…` form used by the loader script, the meta tag, and each `ins`. */
export function adsenseClientAttr(clientId = ADSENSE_CLIENT_ID): string {
  if (!clientId) return "";
  return clientId.startsWith("ca-") ? clientId : `ca-${clientId}`;
}

/** `pub-…` form ads.txt requires (no `ca-` prefix). */
export function adsensePublisherId(clientId = ADSENSE_CLIENT_ID): string {
  return clientId.replace(/^ca-/, "");
}

/** IAB ads.txt line that authorizes Google to sell this site's inventory. */
export function adsTxtBody(clientId = ADSENSE_CLIENT_ID): string {
  if (!clientId) return "";
  return `google.com, ${adsensePublisherId(clientId)}, DIRECT, f08c47fec0942fa0\n`;
}
