/**
 * @jest-environment node
 *
 * Route handlers use the Fetch API's Response/Request, which jsdom (the
 * suite's default test environment, needed for React DOM tests) doesn't
 * provide. Node's environment has them natively.
 */
import * as adsLib from "../../lib/ads";
import { GET } from "./route";

jest.mock("../../lib/ads", () => ({
  __esModule: true,
  ADSENSE_CLIENT_ID: "",
  isAdsenseConfigured: jest.fn(),
}));

describe("GET /ads.txt", () => {
  it("returns an empty body when AdSense isn't configured", async () => {
    (adsLib.isAdsenseConfigured as jest.Mock).mockReturnValue(false);
    const res = GET();
    expect(await res.text()).toBe("");
  });

  it("returns the standard ads.txt line with the publisher id when configured", async () => {
    (adsLib.isAdsenseConfigured as jest.Mock).mockReturnValue(true);
    (adsLib as { ADSENSE_CLIENT_ID: string }).ADSENSE_CLIENT_ID = "ca-pub-1234567890123456";
    const res = GET();
    expect(await res.text()).toBe("google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n");
    expect(res.headers.get("Content-Type")).toBe("text/plain");
  });
});
