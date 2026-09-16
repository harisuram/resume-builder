/**
 * All AdSense identifiers are environment-driven — never hardcode a real
 * publisher/slot id in source. Nothing here renders anything: it just
 * answers "is this configured," which is what lets every ad slot decide to
 * render nothing at all rather than an empty placeholder when it isn't.
 */
export const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? "";

export const ADSENSE_SLOTS = {
  landing: process.env.NEXT_PUBLIC_ADSENSE_SLOT_LANDING ?? "",
  builderPreview: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BUILDER ?? "",
  builderNav: process.env.NEXT_PUBLIC_ADSENSE_SLOT_NAV ?? "",
  builderExport: process.env.NEXT_PUBLIC_ADSENSE_SLOT_EXPORT ?? "",
  builderSectionFooter: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SECTION_FOOTER ?? "",
};

export function isAdsenseConfigured(): boolean {
  return ADSENSE_CLIENT_ID.length > 0;
}
