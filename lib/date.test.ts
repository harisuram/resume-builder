import { formatDateRange, formatMonth } from "./date";

describe("formatMonth", () => {
  it("formats a YYYY-MM string as 'Mon YYYY'", () => {
    expect(formatMonth("2022-08")).toBe("Aug 2022");
    expect(formatMonth("2019-01")).toBe("Jan 2019");
    expect(formatMonth("2019-12")).toBe("Dec 2019");
  });

  it("returns an empty string for undefined", () => {
    expect(formatMonth(undefined)).toBe("");
  });

  it("falls back to the raw string for anything that isn't YYYY-MM", () => {
    expect(formatMonth("hand-typed date")).toBe("hand-typed date");
    expect(formatMonth("2022")).toBe("2022");
  });

  it("falls back to the raw string for an out-of-range month", () => {
    expect(formatMonth("2022-13")).toBe("2022-13");
    expect(formatMonth("2022-00")).toBe("2022-00");
  });
});

describe("formatDateRange", () => {
  it("joins a start and end month", () => {
    expect(formatDateRange("2019-03", "2022-08")).toBe("Mar 2019 – Aug 2022");
  });

  it("uses 'Present' when the end date is absent", () => {
    expect(formatDateRange("2019-03")).toBe("Mar 2019 – Present");
    expect(formatDateRange("2019-03", undefined)).toBe("Mar 2019 – Present");
  });

  it("returns just the end label when the start is missing but end is not 'Present'", () => {
    expect(formatDateRange(undefined, "2022-08")).toBe("Aug 2022");
  });

  it("returns an empty string when both are missing", () => {
    expect(formatDateRange(undefined, undefined)).toBe("");
  });
});
