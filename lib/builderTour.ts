import { hasAnyResumeValue } from "./store";
import { loadResumeData } from "./storage";

/** Set when the first-run builder tour is skipped or finished, so an empty
 * draft doesn't replay it on every visit. Independent of `resumeData`. */
export const TOUR_DISMISSED_KEY = "builderTourDismissed";

/** Matches the builder's `md:` layout. Tour targets (skip switch, sort
 * handle) are `hidden` below this width. */
export const BUILDER_TOUR_MEDIA = "(min-width: 768px)";

export function isBuilderTourViewport(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return true;
  return window.matchMedia(BUILDER_TOUR_MEDIA).matches;
}

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

/** The phone tour walks a different layout (menu, bottom bar, preview
 * sheet), so it keeps its own flag — seeing one tour doesn't mark the
 * other as seen. */
export const MOBILE_TOUR_DISMISSED_KEY = "builderMobileTourDismissed";

export function isMobileBuilderTourDismissed(): boolean {
  return localStorage.getItem(MOBILE_TOUR_DISMISSED_KEY) === "1";
}

export function dismissMobileBuilderTour(): void {
  localStorage.setItem(MOBILE_TOUR_DISMISSED_KEY, "1");
}

export function shouldOfferMobileBuilderTour(): boolean {
  if (isMobileBuilderTourDismissed()) return false;
  return !hasAnyResumeValue(loadResumeData());
}
