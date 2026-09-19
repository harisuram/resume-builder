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

/** Loader URL from the AdSense snippet Google’s crawler looks for. */
export function adsenseScriptSrc(clientId = ADSENSE_CLIENT_ID): string {
  const client = adsenseClientAttr(clientId);
  if (!client) return "";
  return `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
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

/**
 * Funding Choices — Google's certified CMP. Required by Google's EU User
 * Consent Policy before ads can serve to EEA/UK visitors, and covers the
 * US-states (CCPA/CPRA) opt-out too. Keyed off the same publisher id as
 * AdSense; which regions get a message (and its content) is configured in
 * AdSense > Privacy & messaging, not in code — this just loads the CMP.
 */
export function fundingChoicesScriptSrc(clientId = ADSENSE_CLIENT_ID): string {
  const pub = adsensePublisherId(clientId);
  if (!pub) return "";
  return `https://fundingchoicesmessages.google.com/i/${pub}?ers=1`;
}

/**
 * Google's own snippet: signals to the CMP iframe that the page integrated
 * Funding Choices, by creating a hidden iframe named "googlefcPresent" once
 * <body> exists. Verbatim from Google's docs — don't reformat, some review
 * tooling matches on the exact source.
 */
export const FUNDING_CHOICES_PRESENT_SNIPPET = `(function() {function signalGooglefcPresent() {if (!window.frames['googlefcPresent']) {if (document.body) {const iframe = document.createElement('iframe'); iframe.style = 'width: 0; height: 0; border: none; z-index: -1000; left: -1000px; top: -1000px;'; iframe.style.display = 'none'; iframe.name = 'googlefcPresent'; document.body.appendChild(iframe);} else {setTimeout(signalGooglefcPresent, 0);}}}signalGooglefcPresent();})();`;
