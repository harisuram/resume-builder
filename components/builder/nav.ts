import { resolveSectionOrder } from "@/lib/persona";
import type { SectionKey, SectionStatus } from "@/lib/types";

export type NavKey = "basicInfo" | "photo" | SectionKey | "export";

/** Full linear order the step wizard walks: basic info, summary, then the
 * optional photo (pinned, like summary — it isn't in the reorderable
 * content list), then the rest of the content sections, then export.
 * Content section order is the default until the user has moved anything
 * via the section nav. */
export function getWizardOrder(sectionOrder?: SectionKey[] | null): NavKey[] {
  return ["basicInfo", "summary", "photo", ...resolveSectionOrder(sectionOrder), "export"];
}

/** Basic info and export can't be turned off. Everything else follows the
 * section-nav switch. */
export function isWizardStepSkipped(
  key: NavKey,
  sectionStatus: Record<string, SectionStatus | undefined>,
): boolean {
  if (key === "basicInfo" || key === "export") return false;
  return sectionStatus[key] === "skipped";
}

/** Next/Back land on the nearest step that is still included. `fromIndex`
 * is the step being left, so a skipped current step is not a candidate. */
export function adjacentUnskippedStep(
  order: readonly NavKey[],
  fromIndex: number,
  direction: 1 | -1,
  sectionStatus: Record<string, SectionStatus | undefined>,
): NavKey | undefined {
  for (let i = fromIndex + direction; i >= 0 && i < order.length; i += direction) {
    if (!isWizardStepSkipped(order[i], sectionStatus)) return order[i];
  }
  return undefined;
}

/** Slot the pointer is over in a vertical list, using each row's midpoint. */
export function dropIndexFromY(y: number, slots: readonly { top: number; height: number }[]): number {
  if (slots.length === 0) return 0;
  for (let i = 0; i < slots.length; i++) {
    if (y < slots[i].top + slots[i].height / 2) return i;
  }
  return slots.length - 1;
}
