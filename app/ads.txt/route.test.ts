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
  DEFAULT_ADSENSE_CLIENT_ID: "ca-pub-9224755974440077",
  adsTxtBody: jest.fn(),
}));

const LINE = "google.com, pub-9224755974440077, DIRECT, f08c47fec0942fa0\n";

describe("GET /ads.txt", () => {
  it("returns the site publisher line when the live client id is unset", async () => {
    (adsLib.adsTxtBody as jest.Mock).mockImplementation((id?: string) => (id ? LINE : ""));
    const res = await GET();
    expect(await res.text()).toBe(LINE);
    expect(res.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
  });

  it("returns the standard ads.txt line with the publisher id when configured", async () => {
    (adsLib.adsTxtBody as jest.Mock).mockReturnValue(LINE);
    const res = await GET();
    expect(await res.text()).toBe(LINE);
    expect(res.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
  });
});
