import { adsTxtBody, isAdsenseConfigured } from "@/lib/ads";

export const dynamic = "force-static";

export async function GET() {
  const body = isAdsenseConfigured() ? adsTxtBody() : "";

  return new Response(body, {
    headers: {
      // ads.txt must be served as plain text at https://<domain>/ads.txt
      // — Google's crawler rejects HTML wrappers and odd content types.
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
