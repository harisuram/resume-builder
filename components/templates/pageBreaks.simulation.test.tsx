import { render } from "@testing-library/react";
import { getNavSectionOrder } from "@/lib/persona";
import { itemBreakKey } from "@/lib/resume";
import { makeFullResumeData } from "@/test-utils/fixtures";
import type { SectionKey } from "@/lib/types";
import { TEMPLATE_COMPONENTS, TEMPLATE_LIST } from "./registry";
import { NARROW_SECTION_KEYS } from "./shared/ResumeSection";

/** List sections whose individual entries can start a page. Chip-style
 * sections (skills, hobbies, soft skills) only break as a whole block. */
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

describe("page-break simulation across every template", () => {
  it.each(TEMPLATE_LIST.map((t) => [t.id, t.name, t.layout] as const))(
    "%s (%s, %s) tags summary and every content section so a break can land anywhere",
    (id) => {
      const Template = TEMPLATE_COMPONENTS[id];
      const { container, unmount } = render(<Template data={makeFullResumeData({ templateId: id })} />);
      for (const key of EVERY_SECTION) {
        expect(container.querySelector(`[data-section-key="${key}"]`)).not.toBeNull();
      }
      unmount();
    },
  );

  it.each(TEMPLATE_LIST.map((t) => [t.id, t.name] as const))(
    "%s honors a forced section break on every section, including rail vs main",
    (id) => {
      const Template = TEMPLATE_COMPONENTS[id];
      for (const key of EVERY_SECTION) {
        const { container, unmount } = render(
          <Template data={makeFullResumeData({ templateId: id, pageBreakSections: [key] })} />,
        );
        const el = container.querySelector(`[data-section-key="${key}"]`);
        expect(el).not.toBeNull();
        expect(el).toHaveAttribute("data-force-break", "true");
        for (const other of EVERY_SECTION) {
          if (other === key) continue;
          expect(container.querySelector(`[data-section-key="${other}"]`)).not.toHaveAttribute("data-force-break");
        }
        unmount();
      }
    },
  );

  it.each(TEMPLATE_LIST.map((t) => [t.id, t.name] as const))(
    "%s honors a forced entry break on every list section",
    (id) => {
      const Template = TEMPLATE_COMPONENTS[id];
      for (const key of ITEM_SECTIONS) {
        const itemKey = itemBreakKey(key, 0);
        const { container, unmount } = render(
          <Template data={makeFullResumeData({ templateId: id, pageBreakItems: [itemKey] })} />,
        );
        const el = container.querySelector(`[data-item-key="${itemKey}"]`);
        expect(el).not.toBeNull();
        expect(el).toHaveAttribute("data-force-break", "true");
        unmount();
      }
    },
  );

  it("can force a later language and a later achievement, not only the first entry", () => {
    const Template = TEMPLATE_COMPONENTS["jakes-resume"];
    const { container } = render(
      <Template
        data={makeFullResumeData({
          pageBreakItems: ["languages:1", "keyAchievements:1"],
        })}
      />,
    );
    expect(container.querySelector('[data-item-key="languages:1"]')).toHaveAttribute("data-force-break", "true");
    expect(container.querySelector('[data-item-key="languages:0"]')).not.toHaveAttribute("data-force-break");
    expect(container.querySelector('[data-item-key="keyAchievements:1"]')).toHaveAttribute("data-force-break", "true");
    expect(container.querySelector('[data-item-key="keyAchievements:0"]')).not.toHaveAttribute("data-force-break");
  });
});

describe("narrow vs wide split stays consistent under a forced break", () => {
  it("keeps compact sections in the rail when a main-column section starts a page", () => {
    const Template = TEMPLATE_COMPONENTS["bre-creative"];
    const { container } = render(
      <Template data={makeFullResumeData({ templateId: "bre-creative", pageBreakSections: ["experience"] })} />,
    );
    const rail = container.querySelector(".resume-sidebar-rail")!;
    const main = container.querySelector(".resume-main-column")!;
    for (const key of NARROW_SECTION_KEYS) {
      expect(rail.querySelector(`[data-section-key="${key}"]`)).not.toBeNull();
      expect(main.querySelector(`[data-section-key="${key}"]`)).toBeNull();
    }
    expect(main.querySelector('[data-section-key="experience"]')).toHaveAttribute("data-force-break", "true");
  });
});
