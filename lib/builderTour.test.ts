import { saveResumeData } from "./storage";
import {
  BUILDER_TOUR_MEDIA,
  dismissBuilderTour,
  isBuilderTourViewport,
  shouldOfferBuilderTour,
  TOUR_DISMISSED_KEY,
} from "./builderTour";
import { hasAnyResumeValue } from "./store";
import { makeFullResumeData } from "@/test-utils/fixtures";

beforeEach(() => {
  localStorage.clear();
});

describe("hasAnyResumeValue", () => {
  it("is false for an empty or missing draft", () => {
    expect(hasAnyResumeValue(null)).toBe(false);
    expect(hasAnyResumeValue({})).toBe(false);
    expect(
      hasAnyResumeValue({
        basicInfo: { name: "", email: "", phone: "", location: "", links: {} },
        sections: {},
      }),
    ).toBe(false);
  });

  it("is true when any basic-info field, photo, or section has a value", () => {
    expect(hasAnyResumeValue({ basicInfo: { name: "Jamie", email: "", phone: "", location: "", links: {} } })).toBe(
      true,
    );
    expect(hasAnyResumeValue({ photo: "data:image/png;base64,abc" })).toBe(true);
    expect(hasAnyResumeValue({ sections: { skills: ["TypeScript"] } })).toBe(true);
    expect(hasAnyResumeValue({ sections: { summary: "Backend engineer." } })).toBe(true);
    expect(hasAnyResumeValue({ sections: { additional: { heading: "Awards", items: [] } } })).toBe(true);
  });
});

describe("isBuilderTourViewport", () => {
  it("is true when matchMedia is missing (jsdom / SSR)", () => {
    const original = window.matchMedia;
    // @ts-expect-error jsdom may omit matchMedia
    delete window.matchMedia;
    expect(isBuilderTourViewport()).toBe(true);
    window.matchMedia = original;
  });

  it("follows the md breakpoint the builder layout uses", () => {
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: query === BUILDER_TOUR_MEDIA,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
    expect(isBuilderTourViewport()).toBe(true);

    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
    expect(isBuilderTourViewport()).toBe(false);
  });
});

describe("shouldOfferBuilderTour", () => {
  it("offers the tour when local storage has no section values", () => {
    expect(shouldOfferBuilderTour()).toBe(true);
  });

  it("does not offer the tour once any saved section has a value", () => {
    saveResumeData(makeFullResumeData());
    expect(shouldOfferBuilderTour()).toBe(false);
  });

  it("does not offer the tour after it has been dismissed, even on an empty draft", () => {
    dismissBuilderTour();
    expect(localStorage.getItem(TOUR_DISMISSED_KEY)).toBe("1");
    expect(shouldOfferBuilderTour()).toBe(false);
  });
});
