import {
  ADSENSE_CLIENT_ID,
  ADSENSE_SLOTS,
  DEFAULT_ADSENSE_CLIENT_ID,
  adsTxtBody,
  adsenseClientAttr,
  adsensePublisherId,
  adsenseScriptSrc,
  isAdsenseConfigured,
  isPlaceholderAdId,
} from "./ads";

describe("ads config", () => {
  it("defaults to the site publisher so the loader script and ads.txt ship", () => {
    expect(DEFAULT_ADSENSE_CLIENT_ID).toBe("ca-pub-9224755974440077");
    expect(ADSENSE_CLIENT_ID).toBe("ca-pub-9224755974440077");
    expect(isAdsenseConfigured()).toBe(true);
    expect(adsTxtBody()).toBe("google.com, pub-9224755974440077, DIRECT, f08c47fec0942fa0\n");
    expect(adsenseScriptSrc()).toBe(
      "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9224755974440077",
    );
  });

  it("exposes every slot AdsBot needs to find", () => {
    expect(Object.keys(ADSENSE_SLOTS)).toEqual([
      "landing",
      "builderPreview",
      "builderPreviewTop",
      "builderNav",
      "builderExport",
      "builderSectionFooter",
    ]);
  });
});

describe("isPlaceholderAdId", () => {
  it("treats empty and all-zero example ids as unset", () => {
    expect(isPlaceholderAdId("")).toBe(true);
    expect(isPlaceholderAdId("ca-pub-0000000000000000")).toBe(true);
    expect(isPlaceholderAdId("0000000000")).toBe(true);
  });

  it("accepts a real publisher or slot id", () => {
    expect(isPlaceholderAdId("ca-pub-1234567890123456")).toBe(false);
    expect(isPlaceholderAdId("1234567890")).toBe(false);
  });
});

describe("adsenseClientAttr / adsensePublisherId", () => {
  it("normalizes to ca-pub- for the script, ins, and meta tag", () => {
    expect(adsenseClientAttr("ca-pub-1234567890123456")).toBe("ca-pub-1234567890123456");
    expect(adsenseClientAttr("pub-1234567890123456")).toBe("ca-pub-1234567890123456");
  });

  it("strips ca- for the ads.txt publisher id", () => {
    expect(adsensePublisherId("ca-pub-1234567890123456")).toBe("pub-1234567890123456");
    expect(adsensePublisherId("pub-1234567890123456")).toBe("pub-1234567890123456");
  });
});

describe("adsTxtBody", () => {
  it("returns an empty body when there is no client id", () => {
    expect(adsTxtBody("")).toBe("");
  });

  it("returns the IAB line Google looks up at /ads.txt", () => {
    expect(adsTxtBody("ca-pub-1234567890123456")).toBe(
      "google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n",
    );
  });
});
