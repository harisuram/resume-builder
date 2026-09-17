import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useBuilderStore } from "@/lib/store";
import { SectionNav } from "./SectionNav";

beforeEach(() => {
  act(() => {
    useBuilderStore.getState().resetStore();
  });
});

function expectBadgesHiddenUntilMd(badges: string[]) {
  for (const badge of badges) {
    const className = screen.getByText(badge).className;
    expect(className).toContain("hidden");
    expect(className).toContain("md:inline");
  }
}

describe("SectionNav", () => {
  it("lists Basic info, Summary, Photo, the content sections, then Template & export", () => {
    render(<SectionNav active="basicInfo" onSelect={() => {}} />);

    const buttons = screen.getAllByRole("button").map((b) => b.textContent ?? "");
    expect(buttons[0]).toContain("Basic info");
    const summary = buttons.findIndex((t) => t.includes("Summary"));
    const photo = buttons.findIndex((t) => t.includes("Photo"));
    const keyAchievements = buttons.findIndex((t) => t.includes("Key achievements"));
    const additional = buttons.findIndex((t) => t.includes("Additional"));
    const exportIdx = buttons.findIndex((t) => t.includes("Template & export"));
    expect(summary).toBeGreaterThan(0);
    expect(photo).toBeGreaterThan(summary);
    expect(keyAchievements).toBeGreaterThan(photo);
    expect(additional).toBeGreaterThan(keyAchievements);
    expect(exportIdx).toBeGreaterThan(additional);
    expect(buttons[buttons.length - 1]).toContain("Template & export");
  });

  it("places a meaningful icon before every section label", () => {
    render(<SectionNav active="experience" onSelect={() => {}} />);
    const nav = screen.getByRole("navigation", { name: "Resume sections" });
    const expected: Array<[string, string]> = [
      ["Basic info", "basicInfo"],
      ["Summary", "summary"],
      ["Photo", "photo"],
      ["Key achievements", "keyAchievements"],
      ["Experience", "experience"],
      ["Internships", "internships"],
      ["Part-time work", "partTime"],
      ["Projects", "projects"],
      ["Education", "education"],
      ["Skills", "skills"],
      ["Certifications", "certifications"],
      ["Patents", "patents"],
      ["Languages", "languages"],
      ["Hobbies", "hobbies"],
      ["Soft skills", "softSkills"],
      ["Additional", "additional"],
      ["Template & export", "export"],
    ];

    for (const [label, key] of expected) {
      const button = screen.getByText(label).closest("button");
      expect(button).not.toBeNull();
      const icon = button!.querySelector(`[data-nav-icon="${key}"]`);
      expect(icon).not.toBeNull();
      expect(icon).toHaveAttribute("aria-hidden", "true");
      expect(icon!.querySelector("svg")).not.toBeNull();
    }

    expect(nav.querySelectorAll("[data-nav-icon]")).toHaveLength(expected.length);
    expect(nav.querySelector('[data-nav-icon="experience"]')).toHaveAttribute("data-active", "true");
    expect(nav.querySelector('[data-nav-icon="experience"] svg')).toHaveAttribute("fill", "currentColor");
    expect(nav.querySelector('[data-nav-icon="basicInfo"]')).not.toHaveAttribute("data-active");
    expect(nav.querySelector('[data-nav-icon="basicInfo"] svg')).toHaveAttribute("fill", "none");
  });

  it("labels the summary step Summary", () => {
    render(<SectionNav active="basicInfo" onSelect={() => {}} />);
    expect(screen.getByText("Summary")).toBeInTheDocument();
  });

  it("shows 'Required' for basic info until name, email, and location are filled", () => {
    const { rerender } = render(<SectionNav active="basicInfo" onSelect={() => {}} />);
    expect(screen.getByText("Required")).toBeInTheDocument();

    act(() => {
      useBuilderStore.getState().updateBasicInfo({ name: "Jamie", email: "jamie@example.com", location: "Austin" });
    });
    rerender(<SectionNav active="basicInfo" onSelect={() => {}} />);
    expect(screen.getByText("Complete")).toBeInTheDocument();
  });

  it("calls onSelect with the clicked section's key", async () => {
    const onSelect = jest.fn();
    render(<SectionNav active="basicInfo" onSelect={onSelect} />);
    await userEvent.click(screen.getByText("Skills"));
    expect(onSelect).toHaveBeenCalledWith("skills");
  });

  it("toggles a section's skip status without navigating", async () => {
    const onSelect = jest.fn();
    render(<SectionNav active="basicInfo" onSelect={onSelect} />);
    const skillsSwitch = screen.getByRole("switch", { name: "Skip Skills" });
    await userEvent.click(skillsSwitch);
    expect(useBuilderStore.getState().sectionStatus.skills).toBe("skipped");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("toggles Photo skip without navigating", async () => {
    const onSelect = jest.fn();
    render(<SectionNav active="basicInfo" onSelect={onSelect} />);
    await userEvent.click(screen.getByRole("switch", { name: "Skip Photo" }));
    expect(useBuilderStore.getState().sectionStatus.photo).toBe("skipped");
    expect(onSelect).not.toHaveBeenCalled();
  });

  describe("mobile strip", () => {
    it("keeps the status dot and skip switch off the row until md", () => {
      render(<SectionNav active="basicInfo" onSelect={() => {}} />);

      const trailing = screen.getByRole("switch", { name: "Skip Skills" }).closest("div.hidden");
      expect(trailing).not.toBeNull();
      expect(trailing!.className).toContain("md:flex");
    });

    it("shows no status badge at all — every one of them waits for md", () => {
      const { rerender } = render(<SectionNav active="basicInfo" onSelect={() => {}} />);
      expectBadgesHiddenUntilMd(["Required"]);

      act(() => {
        useBuilderStore
          .getState()
          .updateBasicInfo({ name: "Jamie", email: "jamie@example.com", location: "Austin" });
      });
      rerender(<SectionNav active="basicInfo" onSelect={() => {}} />);
      expectBadgesHiddenUntilMd(["Complete"]);
    });

    it("threads a connector line through every gap, keeping only the group rules at md", () => {
      const { container } = render(<SectionNav active="basicInfo" onSelect={() => {}} />);

      const children = Array.from(container.querySelectorAll("nav > *"));
      const lines = children.filter((el) => el.hasAttribute("aria-hidden"));
      const rows = children.filter((el) => !el.hasAttribute("aria-hidden"));

      expect(lines).toHaveLength(rows.length - 1);
      // The two group boundaries stay as full-width rules; the rest are mobile-only.
      expect(lines.filter((el) => el.className.includes("md:w-full"))).toHaveLength(2);
      expect(lines.filter((el) => el.className.includes("md:hidden"))).toHaveLength(lines.length - 2);
    });

    it("dims the Photo label when skipped, and undims it when included again", async () => {
      render(<SectionNav active="basicInfo" onSelect={() => {}} />);
      expect(screen.getByText("Photo").className).not.toContain("ink-faint");

      await userEvent.click(screen.getByRole("switch", { name: "Skip Photo" }));
      expect(useBuilderStore.getState().sectionStatus.photo).toBe("skipped");
      expect(screen.getByText("Photo").className).toContain("text-[var(--color-ink-faint)]");
      expect(screen.getByText("Photo").className).toContain("md:text-inherit");

      await userEvent.click(screen.getByRole("switch", { name: "Include Photo" }));
      expect(useBuilderStore.getState().sectionStatus.photo).not.toBe("skipped");
      expect(screen.getByText("Photo").className).not.toContain("ink-faint");
    });

    it("marks a skipped section by label color instead, mobile only", async () => {
      render(<SectionNav active="basicInfo" onSelect={() => {}} />);
      expect(screen.getByText("Skills").className).not.toContain("ink-faint");

      await userEvent.click(screen.getByRole("switch", { name: "Skip Skills" }));
      expect(screen.getByText("Skills").className).toContain("text-[var(--color-ink-faint)]");
      // Reverts from md up, where the dot and switch carry the same meaning.
      expect(screen.getByText("Skills").className).toContain("md:text-inherit");
    });
  });

  describe("reordering content sections", () => {
    it("keeps the default order until the user moves something", () => {
      render(<SectionNav active="basicInfo" onSelect={() => {}} />);
      expect(useBuilderStore.getState().sectionOrder).toBeNull();

      const buttons = screen.getAllByRole("button").map((b) => b.textContent ?? "");
      const keyAchievementsIndex = buttons.findIndex((t) => t.includes("Key achievements"));
      const experienceIndex = buttons.findIndex((t) => t.includes("Experience"));
      expect(keyAchievementsIndex).toBeGreaterThan(-1);
      expect(keyAchievementsIndex).toBeLessThan(experienceIndex);
    });

    it("moves a section with the keyboard handle, updating both the store and the rendered order", async () => {
      render(<SectionNav active="basicInfo" onSelect={() => {}} />);
      const handle = screen.getByRole("button", { name: "Reorder Key achievements" });
      handle.focus();
      await userEvent.keyboard("{ArrowDown}");

      expect(useBuilderStore.getState().sectionOrder?.[0]).toBe("experience");
      expect(useBuilderStore.getState().sectionOrder?.[1]).toBe("keyAchievements");

      const buttons = screen.getAllByRole("button").map((b) => b.textContent ?? "");
      const keyAchievementsIndex = buttons.findIndex((t) => t.includes("Key achievements"));
      const experienceIndex = buttons.findIndex((t) => t.includes("Experience"));
      expect(experienceIndex).toBeLessThan(keyAchievementsIndex);
    });

    it("does not navigate when the reorder handle is used", async () => {
      const onSelect = jest.fn();
      render(<SectionNav active="basicInfo" onSelect={onSelect} />);
      const handle = screen.getByRole("button", { name: "Reorder Key achievements" });
      handle.focus();
      await userEvent.keyboard("{ArrowDown}");
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("disables the reorder handle on a skipped section", async () => {
      render(<SectionNav active="basicInfo" onSelect={() => {}} />);
      await userEvent.click(screen.getByRole("switch", { name: "Skip Skills" }));
      expect(screen.getByRole("button", { name: "Skills is skipped and cannot be reordered" })).toBeDisabled();
    });
  });
});
