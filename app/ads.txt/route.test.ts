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
  isAdsenseConfigured: jest.fn(),
  adsTxtBody: jest.fn(),
}));

describe("GET /ads.txt", () => {
  it("returns an empty body when AdSense isn't configured", async () => {
    (adsLib.isAdsenseConfigured as jest.Mock).mockReturnValue(false);
    const res = await GET();
    expect(await res.text()).toBe("");
  });

  it("returns the standard ads.txt line with the publisher id when configured", async () => {
    (adsLib.isAdsenseConfigured as jest.Mock).mockReturnValue(true);
    (adsLib.adsTxtBody as jest.Mock).mockReturnValue(
      "google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n",
    );
    const res = await GET();
    expect(await res.text()).toBe("google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n");
    expect(res.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
  });
});
