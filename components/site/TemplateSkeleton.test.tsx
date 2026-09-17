import { render } from "@testing-library/react";
import { getTheme } from "@/components/templates/shared/theme";
import { TemplateSkeleton } from "./TemplateSkeleton";

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
});
