import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useBuilderStore } from "@/lib/store";
import { SkillsForm } from "./SkillsForm";

beforeEach(() => {
  act(() => {
    useBuilderStore.getState().resetStore();
  });
});

describe("SkillsForm", () => {
  it("adds skills via the chip input and marks the section complete", async () => {
    render(<SkillsForm />);
    const input = screen.getByPlaceholderText("Add a skill, press Enter");
    await userEvent.type(input, "TypeScript{Enter}");
    expect(useBuilderStore.getState().sections.skills).toEqual(["TypeScript"]);
    expect(useBuilderStore.getState().sectionStatus.skills).toBe("complete");
  });

  it("shows a skipped notice when skipped and restores the input when un-skipped", () => {
    act(() => useBuilderStore.getState().toggleSkipSection("skills"));
    const { rerender } = render(<SkillsForm />);
    expect(screen.getByText(/Skills is skipped/)).toBeInTheDocument();

    act(() => useBuilderStore.getState().toggleSkipSection("skills"));
    rerender(<SkillsForm />);
    expect(screen.getByPlaceholderText("Add a skill, press Enter")).toBeInTheDocument();
  });

  it("offers a catalog of skills and hides ones already selected", async () => {
    render(<SkillsForm />);
    await userEvent.click(screen.getByPlaceholderText("Add a skill, press Enter"));
    expect(screen.getByRole("option", { name: "TypeScript" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("option", { name: "TypeScript" }));
    expect(useBuilderStore.getState().sections.skills).toEqual(["TypeScript"]);
    expect(screen.queryByRole("option", { name: "TypeScript" })).not.toBeInTheDocument();
  });
});

describe("SkillsForm — layout switch", () => {
  const radio = (name: string) => screen.getByRole("radio", { name });

  it("starts on the simple list, unchanged from before", () => {
    render(<SkillsForm />);
    expect(radio("Simple list")).toHaveAttribute("aria-checked", "true");
    expect(radio("Grouped")).toHaveAttribute("aria-checked", "false");
    expect(screen.getByPlaceholderText("Add a skill, press Enter")).toBeInTheDocument();
    expect(screen.queryByLabelText("Group title")).not.toBeInTheDocument();
  });

  it("switching to Grouped moves the current skills into one group you can title", async () => {
    act(() => useBuilderStore.getState().setSkills(["React", "Node"]));
    render(<SkillsForm />);
    await userEvent.click(radio("Grouped"));
    expect(radio("Grouped")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByLabelText("Group title")).toHaveValue("");
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("Node")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Group title"), "Frontend");
    expect(useBuilderStore.getState().skillGroups).toEqual([{ title: "Frontend", skills: ["React", "Node"] }]);
  });

  it("switching back shows every grouped skill in the simple list", async () => {
    act(() => {
      useBuilderStore.getState().setSkillsLayout("grouped");
      useBuilderStore.getState().setSkillGroups([
        { title: "Frontend", skills: ["React"] },
        { title: "Backend", skills: ["Node"] },
      ]);
    });
    render(<SkillsForm />);
    await userEvent.click(radio("Simple list"));
    expect(screen.getByPlaceholderText("Add a skill, press Enter")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("Node")).toBeInTheDocument();
    expect(useBuilderStore.getState().sections.skills).toEqual(["React", "Node"]);
  });

  it("hides the switch while the section is skipped", () => {
    act(() => useBuilderStore.getState().toggleSkipSection("skills"));
    render(<SkillsForm />);
    expect(screen.queryByRole("radiogroup", { name: "Skills layout" })).not.toBeInTheDocument();
  });
});

describe("SkillsForm — grouped editor", () => {
  function openGrouped(groups?: { title: string; skills: string[] }[]) {
    act(() => {
      useBuilderStore.getState().setSkillsLayout("grouped");
      if (groups) useBuilderStore.getState().setSkillGroups(groups);
    });
    return render(<SkillsForm />);
  }
  const groupsInStore = () => useBuilderStore.getState().skillGroups;

  it("adds skills to a group and marks the section complete", async () => {
    openGrouped();
    await userEvent.type(screen.getByLabelText("Group title"), "Frontend");
    await userEvent.type(screen.getByPlaceholderText("Add a skill to this group, press Enter"), "React{Enter}");
    expect(groupsInStore()).toEqual([{ title: "Frontend", skills: ["React"] }]);
    expect(useBuilderStore.getState().sections.skills).toEqual(["React"]);
    expect(useBuilderStore.getState().sectionStatus.skills).toBe("complete");
  });

  it("adds a second group, focuses its title, and keeps each group's skills separate", async () => {
    openGrouped([{ title: "Frontend", skills: ["React"] }]);
    await userEvent.click(screen.getByRole("button", { name: "+ Add group" }));
    const titles = screen.getAllByLabelText("Group title");
    expect(titles).toHaveLength(2);
    expect(titles[1]).toHaveFocus();
    await userEvent.type(titles[1], "Backend");
    const inputs = screen.getAllByPlaceholderText("Add a skill to this group, press Enter");
    await userEvent.type(inputs[1], "Node{Enter}");
    expect(groupsInStore()).toEqual([
      { title: "Frontend", skills: ["React"] },
      { title: "Backend", skills: ["Node"] },
    ]);
  });

  it("refuses a skill that is already in another group, with a message", async () => {
    openGrouped([
      { title: "Frontend", skills: ["React"] },
      { title: "Backend", skills: [] },
    ]);
    const inputs = screen.getAllByPlaceholderText("Add a skill to this group, press Enter");
    await userEvent.type(inputs[1], "react{Enter}");
    expect(screen.getByText("That skill is already in another group.")).toBeInTheDocument();
    expect(groupsInStore()[1].skills).toEqual([]);
  });

  it("doesn't suggest skills another group already has", async () => {
    openGrouped([
      { title: "Frontend", skills: ["TypeScript"] },
      { title: "Backend", skills: [] },
    ]);
    const inputs = screen.getAllByPlaceholderText("Add a skill to this group, press Enter");
    await userEvent.click(inputs[1]);
    expect(screen.queryByRole("option", { name: "TypeScript" })).not.toBeInTheDocument();
  });

  it("removes a group and its skills", async () => {
    openGrouped([
      { title: "Frontend", skills: ["React"] },
      { title: "Backend", skills: ["Node"] },
    ]);
    await userEvent.click(screen.getByRole("button", { name: "Remove group Frontend" }));
    expect(groupsInStore()).toEqual([{ title: "Backend", skills: ["Node"] }]);
    expect(useBuilderStore.getState().sections.skills).toEqual(["Node"]);
  });

  it("still offers a group to type into after the last one is removed", async () => {
    openGrouped([{ title: "Frontend", skills: ["React"] }]);
    await userEvent.click(screen.getByRole("button", { name: "Remove group Frontend" }));
    expect(groupsInStore()).toEqual([]);
    expect(screen.getByLabelText("Group title")).toHaveValue("");
    await userEvent.type(screen.getByLabelText("Group title"), "Tools");
    expect(groupsInStore()).toEqual([{ title: "Tools", skills: [] }]);
  });

  it("moves groups up and down, with the ends disabled", async () => {
    openGrouped([
      { title: "Frontend", skills: ["React"] },
      { title: "Backend", skills: ["Node"] },
    ]);
    expect(screen.getByRole("button", { name: "Move Frontend up" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Move Backend down" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Move Backend up" }));
    expect(groupsInStore().map((g) => g.title)).toEqual(["Backend", "Frontend"]);
    expect(useBuilderStore.getState().sections.skills).toEqual(["Node", "React"]);
  });

  it("hides the move buttons when there is only one group", () => {
    openGrouped([{ title: "Frontend", skills: ["React"] }]);
    expect(screen.queryByRole("button", { name: /^Move / })).not.toBeInTheDocument();
  });

  it("stops at the group limit", async () => {
    openGrouped(Array.from({ length: 12 }, (_, i) => ({ title: `G${i}`, skills: [] })));
    expect(screen.getByRole("button", { name: "+ Add group" })).toBeDisabled();
    expect(screen.getByText("You can have up to 12 groups.")).toBeInTheDocument();
  });

  describe("on phones", () => {
    it("collapses all but one group to a title-and-count row", () => {
      openGrouped([
        { title: "Frontend", skills: ["React", "CSS"] },
        { title: "Backend", skills: ["Node"] },
      ]);
      const toggles = screen.getAllByRole("button", { expanded: true }).concat(screen.getAllByRole("button", { expanded: false }));
      expect(toggles).toHaveLength(2);
      const first = screen.getByRole("button", { name: /Frontend 2 skills/ });
      const second = screen.getByRole("button", { name: /Backend 1 skill$/ });
      expect(first).toHaveAttribute("aria-expanded", "true");
      expect(second).toHaveAttribute("aria-expanded", "false");
      // The row is phone-only. A closed body eases shut below md; tablets and
      // desktops keep every group open.
      expect(first).toHaveClass("md:hidden");
      const closed = document.getElementById(second.getAttribute("aria-controls")!)!;
      const opened = document.getElementById(first.getAttribute("aria-controls")!)!;
      expect(closed).toHaveClass("max-md:grid-rows-[0fr]");
      expect(closed.className).toContain("transition-[grid-template-rows]");
      expect(opened).not.toHaveClass("max-md:grid-rows-[0fr]");
      expect(opened).toHaveClass("grid-rows-[1fr]");
    });

    it("opens one group at a time", async () => {
      openGrouped([
        { title: "Frontend", skills: ["React"] },
        { title: "Backend", skills: ["Node"] },
      ]);
      await userEvent.click(screen.getByRole("button", { name: /Backend/, expanded: false }));
      expect(screen.getByRole("button", { name: /Backend 1 skill/ })).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByRole("button", { name: /Frontend 1 skill/ })).toHaveAttribute("aria-expanded", "false");
    });

    it("names an untitled group by its position", () => {
      openGrouped([{ title: "", skills: [] }]);
      expect(screen.getByRole("button", { name: /Group 1 0 skills/ })).toBeInTheDocument();
    });

    it("opens a newly added group", async () => {
      openGrouped([{ title: "Frontend", skills: ["React"] }]);
      await userEvent.click(screen.getByRole("button", { name: "+ Add group" }));
      expect(screen.getByRole("button", { name: /Group 2 0 skills/ })).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByRole("button", { name: /Frontend 1 skill/ })).toHaveAttribute("aria-expanded", "false");
    });

    it("uses full-width, 44px-tall controls on small screens", () => {
      openGrouped();
      expect(screen.getByRole("button", { name: "+ Add group" })).toHaveClass("w-full", "min-h-11", "sm:w-auto");
      expect(screen.getByRole("radiogroup", { name: "Skills layout" })).toHaveClass("grid-cols-2", "sm:inline-grid");
      for (const option of screen.getAllByRole("radio")) expect(option).toHaveClass("min-h-11");
    });
  });
});
