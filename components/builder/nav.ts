import { getNavSectionOrder } from "@/lib/persona";
import type { SectionKey } from "@/lib/types";

export type NavKey = "basicInfo" | "photo" | SectionKey | "export";

/** Full linear order the step wizard walks: basic info, then the (optional)
 * photo, then the content sections (summary leading), then export. Content
 * section order is the default until the user has moved anything via the
 * section nav. */
export function getWizardOrder(sectionOrder?: SectionKey[] | null): NavKey[] {
  return ["basicInfo", "photo", ...getNavSectionOrder(sectionOrder), "export"];
}
