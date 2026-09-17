import { resolveSectionOrder } from "@/lib/persona";
import { adjacentUnskippedStep, dropIndexFromY, getWizardOrder, isWizardStepSkipped } from "./nav";

describe("getWizardOrder", () => {
  it("puts Photo immediately after Summary, then the content sections, then export", () => {
    expect(getWizardOrder()).toEqual(["basicInfo", "summary", "photo", ...resolveSectionOrder(), "export"]);
  });

  it("keeps a custom section order after Photo", () => {
    const custom = ["skills", "experience"] as const;
    expect(getWizardOrder([...custom])).toEqual(["basicInfo", "summary", "photo", ...custom, "export"]);
  });
});

describe("adjacentUnskippedStep", () => {
  const order = getWizardOrder();

  it("treats basic info and export as never skipped", () => {
    expect(isWizardStepSkipped("basicInfo", { basicInfo: "skipped" })).toBe(false);
    expect(isWizardStepSkipped("export", { export: "skipped" })).toBe(false);
    expect(isWizardStepSkipped("photo", { photo: "skipped" })).toBe(true);
    expect(isWizardStepSkipped("skills", { skills: "skipped" })).toBe(true);
  });

  it("walks forward past skipped neighbors to the next included step", () => {
    const photoIndex = order.indexOf("photo");
    expect(adjacentUnskippedStep(order, photoIndex, 1, { keyAchievements: "skipped", internships: "skipped" })).toBe(
      "experience",
    );
  });

  it("walks backward past skipped neighbors", () => {
    const certificationsIndex = order.indexOf("certifications");
    expect(adjacentUnskippedStep(order, certificationsIndex, -1, { skills: "skipped" })).toBe("education");
  });

  it("lands on export when every remaining content step is skipped", () => {
    const additionalIndex = order.indexOf("additional");
    expect(adjacentUnskippedStep(order, additionalIndex, 1, {})).toBe("export");
  });
});

describe("dropIndexFromY", () => {
  const slots = [
    { top: 0, height: 40 },
    { top: 40, height: 40 },
    { top: 80, height: 40 },
  ];

  it("uses each row's midpoint as the boundary", () => {
    expect(dropIndexFromY(10, slots)).toBe(0);
    expect(dropIndexFromY(45, slots)).toBe(1);
    expect(dropIndexFromY(100, slots)).toBe(2);
  });

  it("returns 0 for an empty list", () => {
    expect(dropIndexFromY(0, [])).toBe(0);
  });
});
