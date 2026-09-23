import { readdirSync } from "fs";
import { join } from "path";
import { metadata } from "./layout";

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
