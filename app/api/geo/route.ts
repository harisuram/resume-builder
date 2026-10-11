import { handleGeoGet } from "@/lib/geoServer";

// `next dev` only — production serves /api/geo from workers/index.ts.
export function GET(request: Request) {
  return handleGeoGet(request);
}
