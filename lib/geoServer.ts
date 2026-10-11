import { normalizeCountry } from "./geo";

/** GET /api/geo — the visitor's country as Cloudflare geolocated it.
 * `request.cf.country` in the Worker; the `cf-ipcountry` header is the same
 * value when the zone's IP Geolocation header is on (and the only source
 * under `next dev`). Returns `{ country: null }` when unknown. Never cached
 * by a shared cache: the answer differs per visitor. */
export function handleGeoGet(request: Request): Response {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(JSON.stringify({ error: "Method not allowed." }), {
      status: 405,
      headers: { "content-type": "application/json", allow: "GET" },
    });
  }
  const cf = (request as Request & { cf?: { country?: unknown } }).cf;
  const country = normalizeCountry(cf?.country) ?? normalizeCountry(request.headers.get("cf-ipcountry"));
  return new Response(JSON.stringify({ country }), {
    status: 200,
    headers: { "content-type": "application/json", "cache-control": "private, no-store" },
  });
}
