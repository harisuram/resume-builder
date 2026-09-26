import { mixHex, tintHex } from "./color";

describe("mixHex", () => {
  it("returns the colour at 100% and the base at 0%", () => {
    expect(mixHex("#2F5D8A", 100)).toBe("#2f5d8a");
    expect(mixHex("#2F5D8A", 0)).toBe("#ffffff");
    expect(mixHex("#2F5D8A", 0, "#000000")).toBe("#000000");
  });

  it("blends channel by channel like color-mix(in srgb)", () => {
    // 50% of #000000 into white is mid grey (127.5 rounds to 128).
    expect(mixHex("#000000", 50)).toBe("#808080");
    // White text at 85% over a navy band — the PDF stand-in for text-white/85.
    expect(mixHex("#ffffff", 85, "#0f2a44")).toBe("#dbdfe3");
  });

  it("accepts three-digit hex and clamps the weight", () => {
    expect(mixHex("#f00", 100)).toBe("#ff0000");
    expect(mixHex("#f00", 150)).toBe("#ff0000");
    expect(mixHex("#f00", -10)).toBe("#ffffff");
  });

  it("rejects anything that isn't hex rather than guessing", () => {
    expect(() => mixHex("rgb(0,0,0)", 50)).toThrow(/hex/);
    expect(() => mixHex("#ffffff33", 50)).toThrow(/hex/);
  });
});

describe("tintHex", () => {
  it("washes the accent toward white, defaulting to 12%", () => {
    expect(tintHex("#2F5D8A")).toBe(mixHex("#2F5D8A", 12));
    expect(tintHex("#2F5D8A", 16)).toBe(mixHex("#2F5D8A", 16));
  });
});
