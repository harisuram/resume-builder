import { resolveSectionOrder } from "@/lib/persona";
import type { SectionKey } from "@/lib/types";

export type NavKey = "basicInfo" | "photo" | SectionKey | "export";

/** Full linear order the step wizard walks: basic info, summary, then the
 * optional photo (pinned, like summary — it isn't in the reorderable
 * content list), then the rest of the content sections, then export.
 * Content section order is the default until the user has moved anything
 * via the section nav. */
export function getWizardOrder(sectionOrder?: SectionKey[] | null): NavKey[] {
  return ["basicInfo", "summary", "photo", ...resolveSectionOrder(sectionOrder), "export"];
}
