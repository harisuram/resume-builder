import { DETECTED_COUNTRY_KEY, GEO_ENDPOINT, detectCountry, dialCodeForCountry, normalizeCountry, readDetectedCountry } from "./geo";

function jsonFetch(body: unknown, ok = true) {
  return jest.fn(async () => ({ ok, json: async () => body }) as Response) as unknown as typeof fetch & jest.Mock;
}

beforeEach(() => localStorage.clear());

describe("normalizeCountry", () => {
  it("upper-cases two-letter codes", () => {
    expect(normalizeCountry("in")).toBe("IN");
    expect(normalizeCountry(" US ")).toBe("US");
  });

  it("drops Cloudflare's unknown and Tor codes, and anything malformed", () => {
    for (const value of ["XX", "T1", "ZZ", "EU", "", "IND", "1N", null, undefined, 42]) {
      expect(normalizeCountry(value)).toBeNull();
    }
  });
});

describe("detectCountry", () => {
  it("asks the geo endpoint once and saves the answer locally", async () => {
    const fetchMock = jsonFetch({ country: "IN" });
    await expect(detectCountry(fetchMock)).resolves.toBe("IN");
    expect(fetchMock).toHaveBeenCalledWith(GEO_ENDPOINT, expect.anything());
    expect(localStorage.getItem(DETECTED_COUNTRY_KEY)).toBe("IN");
    expect(readDetectedCountry()).toBe("IN");
  });

  it("uses the saved country without another request", async () => {
    localStorage.setItem(DETECTED_COUNTRY_KEY, "GB");
    const fetchMock = jsonFetch({ country: "IN" });
    await expect(detectCountry(fetchMock)).resolves.toBe("GB");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shares one request between callers that ask at the same time", async () => {
    const fetchMock = jsonFetch({ country: "US" });
    const [a, b] = await Promise.all([detectCountry(fetchMock), detectCountry(fetchMock)]);
    expect([a, b]).toEqual(["US", "US"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("resolves null and saves nothing when the country is unknown", async () => {
    await expect(detectCountry(jsonFetch({ country: null }))).resolves.toBeNull();
    await expect(detectCountry(jsonFetch({ country: "XX" }))).resolves.toBeNull();
    expect(localStorage.getItem(DETECTED_COUNTRY_KEY)).toBeNull();
  });

  it("resolves null on an error response or a network failure, never throwing", async () => {
    await expect(detectCountry(jsonFetch({ country: "IN" }, false))).resolves.toBeNull();
    const failing = jest.fn(async () => {
      throw new Error("offline");
    }) as unknown as typeof fetch;
    await expect(detectCountry(failing)).resolves.toBeNull();
  });

  it("ignores a tampered saved value and looks the country up again", async () => {
    localStorage.setItem(DETECTED_COUNTRY_KEY, "<script>");
    const fetchMock = jsonFetch({ country: "DE" });
    await expect(detectCountry(fetchMock)).resolves.toBe("DE");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("dialCodeForCountry", () => {
  it("maps a country to its phone dial code", () => {
    expect(dialCodeForCountry("IN")).toBe("+91");
    expect(dialCodeForCountry("us")).toBe("+1");
    expect(dialCodeForCountry("GB")).toBe("+44");
  });

  it("returns undefined for unknown countries", () => {
    expect(dialCodeForCountry(null)).toBeUndefined();
    expect(dialCodeForCountry("ZZ")).toBeUndefined();
  });
});
