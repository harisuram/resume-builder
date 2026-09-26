import { render } from "@testing-library/react";
import { getNavSectionOrder } from "@/lib/persona";
import { itemBreakKey } from "@/lib/resume";
import { makeFullResumeData } from "@/test-utils/fixtures";
import type { SectionKey } from "@/lib/types";
import { TEMPLATE_COMPONENTS, TEMPLATE_LIST } from "./registry";
import { NARROW_SECTION_KEYS } from "./shared/ResumeSection";

const ITEM_SECTIONS: SectionKey[] = [
  "keyAchievements",
  "education",
  "experience",
  "internships",
  "partTime",
  "projects",
  "certifications",
  "patents",
  "languages",
  "additional",
];

const EVERY_SECTION: SectionKey[] = getNavSectionOrder();

describe("section / item tags across every template", () => {
  it.each(TEMPLATE_LIST.map((t) => [t.id, t.name, t.layout] as const))(
    "%s (%s, %s) tags summary and every content section",
    (id) => {
      const Template = TEMPLATE_COMPONENTS[id];
      const { container, unmount } = render(<Template data={makeFullResumeData({ templateId: id })} />);
      for (const key of EVERY_SECTION) {
        expect(container.querySelector(`[data-section-key="${key}"]`)).not.toBeNull();
      }
      expect(container.querySelector("[data-force-break]")).toBeNull();
      unmount();
    },
  );

  it.each(TEMPLATE_LIST.map((t) => [t.id, t.name] as const))("%s tags list entries without force-break", (id) => {
    const Template = TEMPLATE_COMPONENTS[id];
    for (const key of ITEM_SECTIONS) {
      const itemKey = itemBreakKey(key, 0);
      const { container, unmount } = render(
        <Template data={makeFullResumeData({ templateId: id, pageBreakItems: [itemKey] })} />,
      );
      const el = container.querySelector(`[data-item-key="${itemKey}"]`);
      expect(el).not.toBeNull();
      expect(el).not.toHaveAttribute("data-force-break");
      unmount();
    }
  });
});

describe("narrow vs wide split", () => {
  it("keeps compact sections in the rail", () => {
    const Template = TEMPLATE_COMPONENTS["ember"];
    const { container } = render(
      <Template data={makeFullResumeData({ templateId: "ember" })} />,
    );
    const rail = container.querySelector(".resume-sidebar-rail")!;
    const main = container.querySelector(".resume-main-column")!;
    for (const key of NARROW_SECTION_KEYS) {
      expect(rail.querySelector(`[data-section-key="${key}"]`)).not.toBeNull();
      expect(main.querySelector(`[data-section-key="${key}"]`)).toBeNull();
    }
    expect(main.querySelector('[data-section-key="experience"]')).not.toBeNull();
    expect(main.querySelector('[data-section-key="experience"]')).not.toHaveAttribute("data-force-break");
  });
});
