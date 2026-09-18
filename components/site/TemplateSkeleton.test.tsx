import { render } from "@testing-library/react";
import { getTheme, TEMPLATES, type TemplateTheme } from "@/components/templates/shared/theme";
import { TemplateSkeleton } from "./TemplateSkeleton";

function skeletonSnap(theme: TemplateTheme) {
  const { container, unmount } = render(<TemplateSkeleton theme={theme} />);
  const root = container.querySelector("[data-template-skeleton]");
  const header = container.querySelector(".resume-dark-header") as HTMLElement | null;
  const rail = container.querySelector("[data-resume-column='rail']") as HTMLElement | null;
  const snap = {
    id: root?.getAttribute("data-template-skeleton"),
    layout: root?.getAttribute("data-layout"),
    darkHeaderBg: header?.style.background || null,
    railBg: rail?.style.background || null,
    railOnRight: Boolean(rail?.parentElement?.className.includes("flex-row-reverse")),
    avatarSizes: Array.from(container.querySelectorAll(".skeleton-bone.shrink-0.rounded-full")).map(
      (el) => (el as HTMLElement).style.width,
    ),
    headings: Array.from(container.querySelectorAll("h3")).map((heading) => ({
      text: heading.textContent,
      italic: heading.className.includes("italic"),
      color: (heading as HTMLElement).style.color,
    })),
  };
  unmount();
  return snap;
}

describe("TemplateSkeleton", () => {
  it("keeps section titles and omits resume copy", () => {
    const { container } = render(<TemplateSkeleton theme={getTheme("jakes-resume")} />);
    expect(container.textContent).toContain("Summary");
    expect(container.textContent).toContain("Experience");
    expect(container.textContent).toContain("Projects");
    expect(container.textContent).toContain("Education");
    expect(container.textContent).toContain("Skills");
    expect(container.textContent).not.toMatch(/@|University|Engineer/i);
    expect(container.querySelector('[data-layout="single"]')).not.toBeNull();
  });

  it("puts compact sections in the sidebar rail", () => {
    const { container } = render(<TemplateSkeleton theme={getTheme("bre-creative")} />);
    const rail = container.querySelector("[data-resume-column='rail']");
    const main = container.querySelector("[data-resume-column='main']");
    expect(rail?.querySelector("[data-preview-section='education']")).not.toBeNull();
    expect(rail?.querySelector("[data-preview-section='skills']")).not.toBeNull();
    expect(main?.querySelector("[data-preview-section='summary']")).not.toBeNull();
    expect(main?.querySelector("[data-preview-section='experience']")).not.toBeNull();
    expect(container.querySelector('[data-layout="sidebar"]')).not.toBeNull();
  });

  it("renders only the sections it is given, including a custom additional title", () => {
    const { container } = render(
      <TemplateSkeleton
        theme={getTheme("jakes-resume")}
        sections={["summary", "additional"]}
        additionalTitle="Publications"
      />,
    );
    expect(container.querySelector("[data-preview-section='summary']")).not.toBeNull();
    expect(container.querySelector("[data-preview-section='additional']")?.textContent).toContain("Publications");
    expect(container.querySelector("[data-preview-section='experience']")).toBeNull();
  });

  it.each(TEMPLATES.map((theme) => [theme.id, theme.name] as const))(
    "matches the layout snap for %s (%s)",
    (id) => {
      expect(skeletonSnap(getTheme(id))).toMatchSnapshot();
    },
  );
});
