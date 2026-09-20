import { experienceTitle } from "@/components/templates/shared/atoms";
import { getSectionMeta } from "@/lib/persona";
import { itemBreakKey, parseItemBreakKey } from "@/lib/resume";
import type { SectionKey } from "@/lib/types";

export interface LineMarker {
  section: SectionKey;
  /** Set when the marker acts on a single list entry rather than the whole
   * section — its position in that section's list. */
  index?: number;
  /** On-screen (already scaled) vertical position. */
  y: number;
  label: string;
  /** Set when an avoid-break nudge already moved this entry to where the
   * offer would send it — the guide still claims the boundary but renders
   * as information, not an action. */
  resolved?: boolean;
}

export function sectionLabel(key: SectionKey): string {
  if (key === "experience" || key === "internships" || key === "partTime") return experienceTitle(key);
  return getSectionMeta(key).label;
}

/** Both the section wrappers and the individual list entries inside them
 * carry break metadata; this reads whichever one an element is. */
export function markerFor(el: HTMLElement): Omit<LineMarker, "y"> | null {
  const itemKey = el.getAttribute("data-item-key");
  if (itemKey) {
    const parsed = parseItemBreakKey(itemKey);
    if (!parsed) return null;
    const rawLabel = el.getAttribute("data-item-label")?.trim() ?? "";
    return {
      section: parsed.section,
      index: parsed.index,
      label: rawLabel || `${sectionLabel(parsed.section)} ${parsed.index + 1}`,
    };
  }
  const section = el.getAttribute("data-section-key") as SectionKey | null;
  if (!section) return null;
  return { section, label: sectionLabel(section) };
}

export function markerId(marker: Pick<LineMarker, "section" | "index">): string {
  return marker.index === undefined ? marker.section : itemBreakKey(marker.section, marker.index);
}

/** Which of two overlapping offers to make at the same page boundary.
 * A later list entry wins over its enclosing section. The first entry is
 * the exception: moving it alone would leave the section title stranded. */
export function offerRank(marker: Pick<LineMarker, "index">): number {
  return marker.index !== undefined && marker.index > 0 ? 1 : 0;
}

/** First list entry always moves with its section heading. */
export function promoteFirstEntryOffer(
  marker: Omit<LineMarker, "y"> & { y?: number },
): Omit<LineMarker, "y"> & { y?: number } {
  if (marker.index !== 0) return marker;
  const { y } = marker;
  return y === undefined
    ? { section: marker.section, label: sectionLabel(marker.section) }
    : { section: marker.section, label: sectionLabel(marker.section), y };
}

export function markersEqual(a: LineMarker[], b: LineMarker[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((left, i) => {
    const right = b[i];
    return (
      left.section === right.section &&
      left.index === right.index &&
      left.label === right.label &&
      Boolean(left.resolved) === Boolean(right.resolved) &&
      Math.abs(left.y - right.y) < 0.5
    );
  });
}
