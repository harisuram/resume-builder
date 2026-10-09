import { linkHref } from "./link";

describe("linkHref", () => {
  it("adds https to a bare host so it doesn't resolve against this site", () => {
    expect(linkHref("github.com/alexandra-mw-sample/kafka-connector")).toBe(
      "https://github.com/alexandra-mw-sample/kafka-connector",
    );
    expect(linkHref("//example.com/a")).toBe("https://example.com/a");
    expect(linkHref("  example.com ")).toBe("https://example.com");
  });

  it("keeps http, https, and mailto links as typed", () => {
    expect(linkHref("http://example.com")).toBe("http://example.com");
    expect(linkHref("HTTPS://example.com/x")).toBe("HTTPS://example.com/x");
    expect(linkHref("mailto:me@example.com")).toBe("mailto:me@example.com");
  });

  it("never emits a javascript: href", () => {
    expect(linkHref("javascript:alert(1)")).toBe("https://alert(1)");
  });
});
