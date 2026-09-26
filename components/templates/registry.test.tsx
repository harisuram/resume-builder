import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getTemplateComponent, TEMPLATE_COMPONENTS, TEMPLATE_LIST } from "./registry";
import { makeEmptyResumeData, makeFullResumeData } from "@/test-utils/fixtures";

describe("TEMPLATE_COMPONENTS", () => {
  it("has a component for every template in the list", () => {
    for (const theme of TEMPLATE_LIST) {
      expect(TEMPLATE_COMPONENTS[theme.id]).toBeDefined();
    }
  });

  it.each(TEMPLATE_LIST.map((t) => [t.id, t.name] as const))(
    "renders %s (%s) with a full resume without crashing",
    (id) => {
      const Template = TEMPLATE_COMPONENTS[id];
      const data = makeFullResumeData({ templateId: id });
      render(<Template data={data} />);
      // By accessible name: Horizon sets the surname in its own italic span.
      expect(screen.getByRole("heading", { level: 1, name: "Alexandra Montgomery-Whitfield" })).toBeInTheDocument();
      expect(screen.getByText(/alexandra@example\.com/)).toBeInTheDocument();
      expect(screen.getByText(data.sections.keyAchievements![0])).toBeInTheDocument();
      expect(screen.getByText("Patents")).toBeInTheDocument();
      expect(screen.getByText("Languages")).toBeInTheDocument();
      expect(screen.getByText("Hobbies")).toBeInTheDocument();
      expect(screen.getByText("Soft Skills")).toBeInTheDocument();
      expect(screen.getByText("Publications")).toBeInTheDocument();
      expect(screen.getByText("Distributed cache coherency protocol")).toBeInTheDocument();
      expect(screen.getByText(/English/)).toBeInTheDocument();
      expect(screen.getByText(/Trail running/)).toBeInTheDocument();
      expect(screen.getByText(/Mentoring/)).toBeInTheDocument();
      expect(screen.getByText("Scaling ledger writes")).toBeInTheDocument();
    },
  );

  it.each(TEMPLATE_LIST.map((t) => [t.id, t.name] as const))(
    "renders %s (%s) with an empty resume and shows no section headings",
    (id) => {
      const Template = TEMPLATE_COMPONENTS[id];
      const data = makeEmptyResumeData({ templateId: id });
      render(<Template data={data} />);
      for (const heading of [
        "Key Achievements",
        "Education",
        "Experience",
        "Projects",
        "Skills",
        "Certifications",
        "Patents",
        "Languages",
        "Hobbies",
        "Soft Skills",
        "Additional",
        "Publications",
      ]) {
        expect(screen.queryByText(heading)).not.toBeInTheDocument();
      }
    },
  );

  it.each(TEMPLATE_LIST.map((t) => [t.id, t.name] as const))(
    "renders the uploaded photo on %s (%s)",
    (id) => {
      const photo = "data:image/jpeg;base64,abc123";
      const Template = TEMPLATE_COMPONENTS[id];
      const { container } = render(<Template data={makeFullResumeData({ templateId: id, photo })} />);
      const images = Array.from(container.querySelectorAll("img"));
      expect(images.map((img) => img.getAttribute("src"))).toContain(photo);
    },
  );

  it("shows no photo on templates without an avatar slot when none was uploaded", () => {
    const withAvatarSlot = new Set(TEMPLATE_LIST.filter((t) => t.showAvatar).map((t) => t.id));
    for (const theme of TEMPLATE_LIST) {
      if (withAvatarSlot.has(theme.id)) continue;
      const Template = TEMPLATE_COMPONENTS[theme.id];
      const { container, unmount } = render(<Template data={makeFullResumeData({ templateId: theme.id })} />);
      expect(container.querySelectorAll("img")).toHaveLength(0);
      unmount();
    }
  });

  it("hides a skipped photo on every template", () => {
    const photo = "data:image/jpeg;base64,abc123";
    for (const theme of TEMPLATE_LIST) {
      const base = makeFullResumeData({ templateId: theme.id, photo });
      const data = { ...base, sectionStatus: { ...base.sectionStatus, photo: "skipped" as const } };
      const Template = TEMPLATE_COMPONENTS[theme.id];
      const { container, unmount } = render(<Template data={data} />);
      expect(Array.from(container.querySelectorAll("img")).map((img) => img.getAttribute("src"))).not.toContain(photo);
      unmount();
    }
  });

  it("Nocturne toggles between its light and dark surface", async () => {
    const Template = TEMPLATE_COMPONENTS["nocturne"];
    render(<Template data={makeFullResumeData({ templateId: "nocturne" })} />);

    const toggle = screen.getByRole("button", { name: "Dark mode" });
    expect(document.querySelector('[data-resume-theme="dark"]')).not.toBeInTheDocument();

    await userEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Light mode" })).toBeInTheDocument();
    expect(document.querySelector('[data-resume-theme="dark"]')).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Light mode" }));
    expect(screen.getByRole("button", { name: "Dark mode" })).toBeInTheDocument();
  });

  it("falls back to the default template placeholder name for an unknown id", () => {
    const Template = getTemplateComponent("unknown-id");
    render(<Template data={makeFullResumeData({ templateId: "unknown-id" })} />);
    // Falls back to the first registered template (Atlas) rather than crashing.
    expect(screen.getByText("Alexandra Montgomery-Whitfield")).toBeInTheDocument();
  });
});
