/** Who runs the site and how to reach them — shown on the About, Contact,
 * Privacy, Terms, and Disclaimer pages. Keep these real: AdSense reviewers
 * and visitors both check that a working contact exists. */
export const CONTACT_EMAIL = "runsonyourdevice@gmail.com";

/** How the pages refer to whoever runs the site. Swap in a personal or
 * business name here and it appears everywhere at once. */
export const OPERATOR = "an independent developer based in India";

/** Governing law and courts named in the Terms. */
export const JURISDICTION = "India";

/** Bump when the wording of the legal pages changes in substance. */
export const LEGAL_UPDATED = "2026-10-07";

export function formatLegalDate(iso: string = LEGAL_UPDATED): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
