import { COUNTRY_CODES } from "./countryCodes";

/** Where the visitor's country (ISO 3166 alpha-2, e.g. "IN") is kept once
 * looked up, so the lookup runs once per browser rather than per visit. */
export const DETECTED_COUNTRY_KEY = "detectedCountry";

/** Served by workers/index.ts from Cloudflare's own geolocation of the
 * request — no third-party lookup, and only the two letters come back. */
export const GEO_ENDPOINT = "/api/geo";

const KNOWN_COUNTRIES = new Set(COUNTRY_CODES.map((c) => c.iso2));

/** A real ISO country code, upper-cased, or null. Cloudflare's "XX"
 * (unknown) and "T1" (Tor) aren't countries, so they come back null too. */
export function normalizeCountry(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) && KNOWN_COUNTRIES.has(code) ? code : null;
}

export function readDetectedCountry(): string | null {
  try {
    return normalizeCountry(localStorage.getItem(DETECTED_COUNTRY_KEY));
  } catch {
    return null;
  }
}

function saveDetectedCountry(code: string) {
  try {
    localStorage.setItem(DETECTED_COUNTRY_KEY, code);
  } catch {
    // Private mode or blocked storage — detection just runs again next time.
  }
}

let pending: Promise<string | null> | null = null;

/** The saved country, else one lookup against GEO_ENDPOINT whose answer is
 * saved. Never throws: offline, blocked, or unknown all resolve to null. */
export function detectCountry(fetchImpl?: typeof fetch): Promise<string | null> {
  const saved = readDetectedCountry();
  if (saved) return Promise.resolve(saved);
  const request = fetchImpl ?? (typeof fetch === "function" ? fetch : null);
  if (!request) return Promise.resolve(null);
  pending ??= request(GEO_ENDPOINT, { headers: { accept: "application/json" } })
    .then(async (res) => {
      if (!res.ok) return null;
      const code = normalizeCountry(((await res.json()) as { country?: unknown }).country);
      if (code) saveDetectedCountry(code);
      return code;
    })
    .catch(() => null)
    .finally(() => {
      pending = null;
    });
  return pending;
}

/** The phone dial code for a country, e.g. "IN" → "+91". */
export function dialCodeForCountry(iso2: string | null | undefined): string | undefined {
  if (!iso2) return undefined;
  return COUNTRY_CODES.find((c) => c.iso2 === iso2.toUpperCase())?.dialCode;
}

