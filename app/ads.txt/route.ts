import { adsTxtBody, DEFAULT_ADSENSE_CLIENT_ID } from "@/lib/ads";

export const dynamic = "force-static";

export async function GET() {
  // Never serve an empty ads.txt — Google reports that as “Ads.txt status:
  // Not found”. Fall back to the site publisher if the env id is unset.
  const body = adsTxtBody() || adsTxtBody(DEFAULT_ADSENSE_CLIENT_ID);

  return new Response(body, {
    headers: {
      // ads.txt must be served as plain text at https://<domain>/ads.txt
      // — Google's crawler rejects HTML wrappers and odd content types.
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
