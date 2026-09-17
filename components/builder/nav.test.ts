import { resolveSectionOrder } from "@/lib/persona";
import { getWizardOrder } from "./nav";

describe("getWizardOrder", () => {
  it("puts Photo immediately after Summary, then the content sections, then export", () => {
    expect(getWizardOrder()).toEqual(["basicInfo", "summary", "photo", ...resolveSectionOrder(), "export"]);
  });

  it("keeps a custom section order after Photo", () => {
    const custom = ["skills", "experience"] as const;
    expect(getWizardOrder([...custom])).toEqual(["basicInfo", "summary", "photo", ...custom, "export"]);
  });
});
