import { ADSENSE_CLIENT_ID, isAdsenseConfigured } from "./ads";

describe("ads config", () => {
  it("defaults to unconfigured when no env vars are set", () => {
    expect(ADSENSE_CLIENT_ID).toBe("");
    expect(isAdsenseConfigured()).toBe(false);
  });
});
