import { capitalizedNumberWords, numberToWords } from "./numberWords";

describe("numberToWords", () => {
  it("spells out 0–19", () => {
    expect(numberToWords(0)).toBe("zero");
    expect(numberToWords(8)).toBe("eight");
    expect(numberToWords(13)).toBe("thirteen");
    expect(numberToWords(19)).toBe("nineteen");
  });

  it("spells out round tens and hyphenates the rest", () => {
    expect(numberToWords(20)).toBe("twenty");
    expect(numberToWords(31)).toBe("thirty-one");
    expect(numberToWords(40)).toBe("forty");
    expect(numberToWords(99)).toBe("ninety-nine");
  });

  it("falls back to digits outside 0–99 or for non-integers", () => {
    expect(numberToWords(100)).toBe("100");
    expect(numberToWords(-1)).toBe("-1");
    expect(numberToWords(2.5)).toBe("2.5");
  });

  it("capitalises for sentence starts", () => {
    expect(capitalizedNumberWords(40)).toBe("Forty");
    expect(capitalizedNumberWords(31)).toBe("Thirty-one");
  });
});
