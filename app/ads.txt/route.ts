import { ADSENSE_CLIENT_ID, isAdsenseConfigured } from "@/lib/ads";

export const dynamic = "force-static";

export function GET() {
  if (!isAdsenseConfigured()) {
    return new Response("", { headers: { "Content-Type": "text/plain" } });
  }

  // AdSense's own account id, without the "ca-" prefix used elsewhere.
  const publisherId = ADSENSE_CLIENT_ID.replace(/^ca-/, "");
  const body = `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`;

  return new Response(body, { headers: { "Content-Type": "text/plain" } });
}
