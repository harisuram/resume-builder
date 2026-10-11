import { readdirSync } from "fs";
import { join } from "path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import RootLayout, { metadata } from "./layout";

/* Search Console keeps a property verified only while its proof is still
 * served. This one is a meta tag in the root layout, so it reaches every page
 * — dropping it silently unverifies the domain and the reporting stops. */
describe("site verification", () => {
  it("carries the Search Console token in the root metadata", () => {
    expect(metadata.verification?.google).toBe("GFCWGpyf43Ywu3vECFLTdOx2zbeppn9f7YZazzcGFqM");
  });

  /* Search Console's other method drops a `google*.html` file at the site root,
   * which cannot work here: `html_handling` is `auto-trailing-slash`, so any
   * `*.html` request 307s to its extensionless form and never returns 200 at
   * the URL Google fetches — and a redirected verification file reads as
   * missing. Anyone reaching for that method should use the tag above. */
  it("keeps no verification file, which this host would redirect away", () => {
    const publicFiles = readdirSync(join(__dirname, "..", "public"));
    expect(publicFiles.filter((name) => /^google.*\.html$/.test(name))).toEqual([]);
  });
});

/* Ahrefs verifies the site, and counts visits, through its analytics tag.
 * Like the Search Console token, it has to stay in every page's <head> as
 * Ahrefs issued it — a plain async script with the site's data-key. */
describe("Ahrefs Web Analytics", () => {
  it("puts the Ahrefs tag, with the site's key, in the <head> of every page", () => {
    const html = renderToStaticMarkup(
      createElement(RootLayout, { children: createElement("main"), params: Promise.resolve({}) } as never),
    );
    const head = html.slice(html.indexOf("<head>"), html.indexOf("</head>"));
    expect(head).toContain(
      '<script src="https://analytics.ahrefs.com/analytics.js" data-key="bbGTEVcNqkuomWTkVPr0ag" async="">',
    );
  });
});
