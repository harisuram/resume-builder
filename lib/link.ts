/** Turns a link as typed into the builder ("github.com/me/app") into an
 * absolute href. Without a scheme the browser resolves it against the current
 * page, so the preview would point at freeresumebuilder.co.in/github.com/…
 * Anything that isn't http(s) or mailto is treated as a bare host too, which
 * also keeps `javascript:` out of the rendered anchor. */
export function linkHref(url: string): string {
  const trimmed = url.trim();
  if (/^(https?:\/\/|mailto:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^[a-z][a-z0-9+.-]*:\/*/i, "").replace(/^\/+/, "")}`;
}
