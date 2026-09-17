import { formatDateRange, formatMonth, isCurrentExperience, PRESENT_LABEL } from "./date";

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

  it("uses 'Present' when present is forced, even if an end date exists", () => {
    expect(formatDateRange("2019-03", "2022-08", true)).toBe(`Mar 2019 – ${PRESENT_LABEL}`);
  });

  it("omits Present when the role is not current and there is no end date", () => {
    expect(formatDateRange("2019-03", undefined, false)).toBe("Mar 2019");
  });

  it("returns just the end label when the start is missing but end is not 'Present'", () => {
    expect(formatDateRange(undefined, "2022-08")).toBe("Aug 2022");
  });

  it("returns an empty string when both are missing", () => {
    expect(formatDateRange(undefined, undefined)).toBe("");
  });
});

describe("isCurrentExperience", () => {
  it("is true when the Present checkbox is on", () => {
    expect(isCurrentExperience({ current: true, endDate: "2022-08" })).toBe(true);
  });

  it("is false when the checkbox is off", () => {
    expect(isCurrentExperience({ current: false })).toBe(false);
    expect(isCurrentExperience({ current: false, endDate: "2022-08" })).toBe(false);
  });

  it("treats a missing end date as present for legacy entries", () => {
    expect(isCurrentExperience({})).toBe(true);
    expect(isCurrentExperience({ endDate: "2022-08" })).toBe(false);
  });
});
