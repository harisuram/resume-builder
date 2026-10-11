import { act, renderHook } from "@testing-library/react";
import { makeFullResumeData } from "@/test-utils/fixtures";
import { useBuilderStore, useResumeData } from "./store";
import type { ResumeData } from "./types";

const state = () => useBuilderStore.getState();

beforeEach(() => {
  act(() => state().resetStore());
});

describe("skills layout in the store", () => {
  it("starts on the flat list with no groups", () => {
    expect(state().skillsLayout).toBe("list");
    expect(state().skillGroups).toEqual([]);
  });

  it("switching to groups folds the existing skills into one untitled group", () => {
    act(() => state().setSkills(["React", "Node"]));
    act(() => state().setSkillsLayout("grouped"));
    expect(state().skillsLayout).toBe("grouped");
    expect(state().skillGroups).toEqual([{ title: "", skills: ["React", "Node"] }]);
    expect(state().sections.skills).toEqual(["React", "Node"]);
    expect(state().sectionStatus.skills).toBe("complete");
  });

  it("setSkillGroups keeps the flat list equal to the grouped skills and updates status", () => {
    act(() => state().setSkillsLayout("grouped"));
    act(() =>
      state().setSkillGroups([
        { title: "Frontend", skills: ["React", "CSS"] },
        { title: "Backend", skills: ["Node"] },
      ]),
    );
    expect(state().sections.skills).toEqual(["React", "CSS", "Node"]);
    expect(state().sectionStatus.skills).toBe("complete");

    act(() => state().setSkillGroups([{ title: "Frontend", skills: [] }]));
    expect(state().sections.skills).toEqual([]);
    expect(state().sectionStatus.skills).toBe("not_started");
  });

  it("going back to the list keeps every skill and remembers the groups for next time", () => {
    act(() => state().setSkillsLayout("grouped"));
    act(() =>
      state().setSkillGroups([
        { title: "Frontend", skills: ["React"] },
        { title: "Backend", skills: ["Node"] },
      ]),
    );
    act(() => state().setSkillsLayout("list"));
    expect(state().sections.skills).toEqual(["React", "Node"]);
    expect(state().skillGroups).toHaveLength(2);

    // Edits on the list carry over when switching back.
    act(() => state().setSkills(["React", "Docker"]));
    act(() => state().setSkillsLayout("grouped"));
    expect(state().skillGroups).toEqual([
      { title: "Frontend", skills: ["React"] },
      { title: "Backend", skills: [] },
      { title: "", skills: ["Docker"] },
    ]);
    expect(state().sections.skills).toEqual(["React", "Docker"]);
  });

  it("re-selecting the current layout is a no-op", () => {
    act(() => state().setSkills(["Go"]));
    const before = state();
    act(() => state().setSkillsLayout("list"));
    expect(state()).toBe(before);
  });

  it("never un-skips a skipped section when groups change", () => {
    act(() => state().toggleSkipSection("skills"));
    act(() => state().setSkillsLayout("grouped"));
    act(() => state().setSkillGroups([{ title: "A", skills: ["Go"] }]));
    expect(state().sectionStatus.skills).toBe("skipped");
  });

  it("Clear wipes the groups along with the skills but keeps the chosen layout", () => {
    act(() => state().setSkillsLayout("grouped"));
    act(() => state().setSkillGroups([{ title: "A", skills: ["Go"] }]));
    act(() => state().clearSection("skills"));
    expect(state().sections.skills).toBeUndefined();
    expect(state().skillGroups).toEqual([]);
    expect(state().skillsLayout).toBe("grouped");
  });

  it("clearing another section leaves the groups alone", () => {
    act(() => state().setSkillsLayout("grouped"));
    act(() => state().setSkillGroups([{ title: "A", skills: ["Go"] }]));
    act(() => state().clearSection("hobbies"));
    expect(state().skillGroups).toEqual([{ title: "A", skills: ["Go"] }]);
  });

  it("resetStore returns to the flat list", () => {
    act(() => state().setSkillsLayout("grouped"));
    act(() => state().setSkillGroups([{ title: "A", skills: ["Go"] }]));
    act(() => state().resetStore());
    expect(state().skillsLayout).toBe("list");
    expect(state().skillGroups).toEqual([]);
  });
});

describe("saving and loading", () => {
  it("adds nothing to the saved JSON of a resume that never used groups", () => {
    act(() => state().setSkills(["Go"]));
    const data = state().getResumeData();
    expect("skillsLayout" in data).toBe(false);
    expect("skillGroups" in data).toBe(false);
  });

  it("round-trips grouped skills through JSON", () => {
    act(() => state().setSkillsLayout("grouped"));
    act(() =>
      state().setSkillGroups([
        { title: "Frontend", skills: ["React"] },
        { title: "Backend", skills: ["Node"] },
      ]),
    );
    const saved = JSON.parse(JSON.stringify(state().getResumeData())) as ResumeData;
    act(() => state().resetStore());
    act(() => state().loadFromData(saved));
    expect(state().skillsLayout).toBe("grouped");
    expect(state().skillGroups).toEqual([
      { title: "Frontend", skills: ["React"] },
      { title: "Backend", skills: ["Node"] },
    ]);
    expect(state().sections.skills).toEqual(["React", "Node"]);
  });

  it("keeps the groups of a list-mode resume so switching back restores titles after a reload", () => {
    act(() => state().setSkillsLayout("grouped"));
    act(() => state().setSkillGroups([{ title: "Frontend", skills: ["React"] }]));
    act(() => state().setSkillsLayout("list"));
    const saved = state().getResumeData();
    expect(saved.skillsLayout).toBeUndefined();
    act(() => state().loadFromData(saved));
    expect(state().skillsLayout).toBe("list");
    act(() => state().setSkillsLayout("grouped"));
    expect(state().skillGroups).toEqual([{ title: "Frontend", skills: ["React"] }]);
  });

  it("loads an old resume (no layout, no groups) exactly as before", () => {
    const data = makeFullResumeData();
    act(() => state().loadFromData(data));
    expect(state().skillsLayout).toBe("list");
    expect(state().skillGroups).toEqual([]);
    expect(state().sections).toBe(data.sections);
  });

  it("re-derives the flat list from the groups when saved data disagrees", () => {
    const data = makeFullResumeData({
      skillsLayout: "grouped",
      skillGroups: [{ title: "Cloud", skills: ["AWS", "GCP"] }],
    });
    data.sections.skills = ["Stale"];
    act(() => state().loadFromData(data));
    expect(state().sections.skills).toEqual(["AWS", "GCP"]);
  });

  it("rebuilds groups from the flat list when grouped data has no grouped skills", () => {
    const data = makeFullResumeData({ skillsLayout: "grouped", skillGroups: [] });
    act(() => state().loadFromData(data));
    expect(state().skillGroups).toEqual([{ title: "", skills: data.sections.skills }]);
    expect(state().sections.skills).toEqual(data.sections.skills);
  });

  it("sanitizes malformed saved groups and an unknown layout", () => {
    const data = makeFullResumeData({
      skillsLayout: "weird" as never,
      skillGroups: [{ title: 5, skills: ["Go", 3] }, null] as never,
    });
    act(() => state().loadFromData(data));
    expect(state().skillsLayout).toBe("list");
    expect(state().skillGroups).toEqual([{ title: "", skills: ["Go"] }]);
  });
});

describe("import", () => {
  const imported = (skillGroups?: { title: string; skills: string[] }[]) => ({
    basicInfo: { name: "Ana", email: "", phone: "", location: "", links: {} },
    sections: { skills: ["React", "Node"] },
    filled: [],
    ...(skillGroups ? { skillGroups } : {}),
  });

  it("switches to groups when the file had them", () => {
    act(() =>
      state().applyImportedResume(
        imported([
          { title: "Frontend", skills: ["React"] },
          { title: "Backend", skills: ["Node"] },
        ]),
      ),
    );
    expect(state().skillsLayout).toBe("grouped");
    expect(state().skillGroups).toHaveLength(2);
    expect(state().sectionStatus.skills).toBe("complete");
  });

  it("goes back to the flat list and drops old groups when the file had none", () => {
    act(() => state().setSkillsLayout("grouped"));
    act(() => state().setSkillGroups([{ title: "Old", skills: ["Perl"] }]));
    act(() => state().applyImportedResume(imported()));
    expect(state().skillsLayout).toBe("list");
    expect(state().skillGroups).toEqual([]);
    expect(state().sections.skills).toEqual(["React", "Node"]);
  });
});

describe("useResumeData", () => {
  it("hands the preview the grouped layout and groups, and updates when they change", () => {
    const { result } = renderHook(() => useResumeData());
    expect(result.current.skillsLayout).toBeUndefined();
    act(() => state().setSkillsLayout("grouped"));
    act(() => state().setSkillGroups([{ title: "Frontend", skills: ["React"] }]));
    expect(result.current.skillsLayout).toBe("grouped");
    expect(result.current.skillGroups).toEqual([{ title: "Frontend", skills: ["React"] }]);
    expect(result.current.sections.skills).toEqual(["React"]);
  });
});
