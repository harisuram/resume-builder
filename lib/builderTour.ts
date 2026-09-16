import { hasAnyResumeValue } from "./store";
import { loadResumeData } from "./storage";

/** Set when the first-run builder tour is skipped or finished, so an empty
 * draft doesn't replay it on every visit. Independent of `resumeData`. */
export const TOUR_DISMISSED_KEY = "builderTourDismissed";

export function isBuilderTourDismissed(): boolean {
  return localStorage.getItem(TOUR_DISMISSED_KEY) === "1";
}

export function dismissBuilderTour(): void {
  localStorage.setItem(TOUR_DISMISSED_KEY, "1");
}

/** A first-run visitor: nothing of theirs is in local storage, and they
 * haven't already skipped or finished the tour. */
export function shouldOfferBuilderTour(): boolean {
  if (isBuilderTourDismissed()) return false;
  return !hasAnyResumeValue(loadResumeData());
}
