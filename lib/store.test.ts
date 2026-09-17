import { act, renderHook } from "@testing-library/react";
import { hasBasicInfoContent, hasSectionContent, useBuilderStore, useResumeData } from "./store";
import type { Education, Experience } from "./types";

const EDU: Education = { institution: "MIT", degree: "B.S.", startDate: "2020-01" };
const EXP: Experience = { company: "Acme", role: "Engineer", startDate: "2020-01", bullets: ["Did a thing"] };

beforeEach(() => {
  act(() => {
    useBuilderStore.getState().resetStore();
  });
});

describe("initial state", () => {
  it("starts with empty content", () => {
    const state = useBuilderStore.getState();
    expect(state.basicInfo).toEqual({ name: "", email: "", phone: "", location: "", links: {} });
    expect(state.sections).toEqual({});
    expect(state.sectionStatus).toEqual({});
    expect(state.hasSavedCopy).toBe(false);
    expect(state.saveConsent).toBeNull();
  });
});

describe("updateBasicInfo / updateLinks", () => {
  it("merges partial patches without clobbering other fields", () => {
    const { updateBasicInfo, updateLinks } = useBuilderStore.getState();
    updateBasicInfo({ name: "Jamie" });
    updateBasicInfo({ email: "jamie@example.com" });
    updateLinks({ github: "github.com/jamie" });
    updateLinks({ linkedin: "linkedin.com/in/jamie" });

    const { basicInfo } = useBuilderStore.getState();
    expect(basicInfo.name).toBe("Jamie");
    expect(basicInfo.email).toBe("jamie@example.com");
    expect(basicInfo.links).toEqual({ github: "github.com/jamie", linkedin: "linkedin.com/in/jamie" });
  });
});

describe("setSummary", () => {
  it("marks the section complete once there is text", () => {
    useBuilderStore.getState().setSummary("Backend engineer.");
    const state = useBuilderStore.getState();
    expect(state.sections.summary).toBe("Backend engineer.");
    expect(state.sectionStatus.summary).toBe("complete");
  });

  it("marks the section not_started for blank text", () => {
    useBuilderStore.getState().setSummary("   ");
    expect(useBuilderStore.getState().sectionStatus.summary).toBe("not_started");
  });

  it("leaves a skipped section skipped even if text is set underneath it", () => {
    const store = useBuilderStore.getState();
    store.toggleSkipSection("summary");
    store.setSummary("Backend engineer.");
    expect(useBuilderStore.getState().sectionStatus.summary).toBe("skipped");
  });
});

describe("setSkills", () => {
  it("derives complete/not_started from array length", () => {
    const { setSkills } = useBuilderStore.getState();
    setSkills(["TypeScript"]);
    expect(useBuilderStore.getState().sectionStatus.skills).toBe("complete");
    setSkills([]);
    expect(useBuilderStore.getState().sectionStatus.skills).toBe("not_started");
  });
});

describe("setHobbies / setSoftSkills", () => {
  it("marks each chip list complete from array length", () => {
    const { setHobbies, setSoftSkills } = useBuilderStore.getState();
    setHobbies(["Chess"]);
    setSoftSkills(["Mentoring"]);
    expect(useBuilderStore.getState().sectionStatus.hobbies).toBe("complete");
    expect(useBuilderStore.getState().sectionStatus.softSkills).toBe("complete");
    setHobbies([]);
    setSoftSkills([]);
    expect(useBuilderStore.getState().sectionStatus.hobbies).toBe("not_started");
    expect(useBuilderStore.getState().sectionStatus.softSkills).toBe("not_started");
  });
});

describe("additional section", () => {
  it("stays not_started when only a heading is set", () => {
    useBuilderStore.getState().setAdditionalHeading("Publications");
    expect(useBuilderStore.getState().sectionStatus.additional).toBe("not_started");
  });

  it("marks complete once an item is added, and not_started again when the last item is removed", () => {
    const { addAdditionalItem, removeAdditionalItem } = useBuilderStore.getState();
    addAdditionalItem({ title: "A paper", bullets: [] });
    expect(useBuilderStore.getState().sectionStatus.additional).toBe("complete");
    removeAdditionalItem(0);
    expect(useBuilderStore.getState().sectionStatus.additional).toBe("not_started");
  });
});

describe("setKeyAchievements", () => {
  it("derives complete/not_started from array length", () => {
    const { setKeyAchievements } = useBuilderStore.getState();
    setKeyAchievements(["Grew revenue by 30%"]);
    const state = useBuilderStore.getState();
    expect(state.sections.keyAchievements).toEqual(["Grew revenue by 30%"]);
    expect(state.sectionStatus.keyAchievements).toBe("complete");

    setKeyAchievements([]);
    expect(useBuilderStore.getState().sectionStatus.keyAchievements).toBe("not_started");
  });

  it("leaves a skipped section skipped even if achievements are set underneath it", () => {
    const store = useBuilderStore.getState();
    store.toggleSkipSection("keyAchievements");
    store.setKeyAchievements(["Something"]);
    expect(useBuilderStore.getState().sectionStatus.keyAchievements).toBe("skipped");
  });
});

describe("list section CRUD (education/experience/projects/certifications)", () => {
  it("addListItem appends and marks the section complete", () => {
    useBuilderStore.getState().addListItem("education", EDU);
    const state = useBuilderStore.getState();
    expect(state.sections.education).toEqual([EDU]);
    expect(state.sectionStatus.education).toBe("complete");
  });

  it("does not mark a list section complete until required fields are filled", () => {
    useBuilderStore.getState().addListItem("education", { institution: "", degree: "", startDate: "" });
    expect(useBuilderStore.getState().sectionStatus.education).toBe("not_started");
    useBuilderStore.getState().updateListItem("education", 0, { institution: "MIT", degree: "B.S." });
    expect(useBuilderStore.getState().sectionStatus.education).toBe("complete");
  });

  it("addListItem appends a second item after the first", () => {
    const { addListItem } = useBuilderStore.getState();
    addListItem("education", EDU);
    addListItem("education", { ...EDU, institution: "Stanford" });
    expect(useBuilderStore.getState().sections.education).toHaveLength(2);
  });

  it("updateListItem patches only the targeted index", () => {
    const { addListItem, updateListItem } = useBuilderStore.getState();
    addListItem("education", EDU);
    addListItem("education", { ...EDU, institution: "Stanford" });
    updateListItem("education", 1, { institution: "Berkeley" });

    const education = useBuilderStore.getState().sections.education!;
    expect(education[0].institution).toBe("MIT");
    expect(education[1].institution).toBe("Berkeley");
  });

  it("updateListItem is a no-op for an out-of-range index", () => {
    useBuilderStore.getState().addListItem("education", EDU);
    const before = useBuilderStore.getState();
    useBuilderStore.getState().updateListItem("education", 5, { institution: "Nope" });
    expect(useBuilderStore.getState()).toBe(before);
  });

  it("removeListItem removes by index and recomputes status to not_started when empty", () => {
    const { addListItem, removeListItem } = useBuilderStore.getState();
    addListItem("experience", EXP);
    removeListItem("experience", 0);
    const state = useBuilderStore.getState();
    expect(state.sections.experience).toEqual([]);
    expect(state.sectionStatus.experience).toBe("not_started");
  });

  it("removeListItem keeps status complete when items remain", () => {
    const { addListItem, removeListItem } = useBuilderStore.getState();
    addListItem("experience", EXP);
    addListItem("experience", { ...EXP, company: "Second Co" });
    removeListItem("experience", 0);
    const state = useBuilderStore.getState();
    expect(state.sections.experience).toEqual([{ ...EXP, company: "Second Co" }]);
    expect(state.sectionStatus.experience).toBe("complete");
  });

  it("addListItem on a skipped section leaves it skipped (defensive)", () => {
    const store = useBuilderStore.getState();
    store.toggleSkipSection("education");
    store.addListItem("education", EDU);
    expect(useBuilderStore.getState().sectionStatus.education).toBe("skipped");
  });
});

describe("toggleSkipSection", () => {
  it("skips a not_started section and restores it to not_started when unskipped", () => {
    const { toggleSkipSection } = useBuilderStore.getState();
    toggleSkipSection("skills");
    expect(useBuilderStore.getState().sectionStatus.skills).toBe("skipped");
    toggleSkipSection("skills");
    expect(useBuilderStore.getState().sectionStatus.skills).toBe("not_started");
  });

  it("restores a completed section to complete when unskipped", () => {
    const { addListItem, toggleSkipSection } = useBuilderStore.getState();
    addListItem("certifications", { name: "AWS", issuer: "Amazon", date: "2022-01" });
    toggleSkipSection("certifications");
    expect(useBuilderStore.getState().sectionStatus.certifications).toBe("skipped");
    toggleSkipSection("certifications");
    expect(useBuilderStore.getState().sectionStatus.certifications).toBe("complete");
  });

  it("skips Photo without deleting it, and restores complete when unskipped", () => {
    const { setPhoto, toggleSkipSection } = useBuilderStore.getState();
    setPhoto("data:image/jpeg;base64,abc123");
    toggleSkipSection("photo");
    expect(useBuilderStore.getState().sectionStatus.photo).toBe("skipped");
    expect(useBuilderStore.getState().photo).toBe("data:image/jpeg;base64,abc123");
    toggleSkipSection("photo");
    expect(useBuilderStore.getState().sectionStatus.photo).toBe("complete");
  });
});

describe("clearSection / clearBasicInfo", () => {
  it("drops a list section's entries, skip flag, and page breaks without touching neighbors", () => {
    const store = useBuilderStore.getState();
    store.addListItem("projects", { name: "One", description: "d" });
    store.addListItem("projects", { name: "Two", description: "d" });
    store.setSkills(["TypeScript"]);
    store.toggleItemPageBreak("projects", 1);
    store.toggleSectionPageBreak("projects");
    store.toggleSkipSection("projects");

    store.clearSection("projects");

    const next = useBuilderStore.getState();
    expect(next.sections.projects).toBeUndefined();
    expect(next.sectionStatus.projects).toBe("not_started");
    expect(next.sections.skills).toEqual(["TypeScript"]);
    expect(next.pageBreakSections).toEqual([]);
    expect(next.pageBreakItems).toEqual([]);
  });

  it("clearPhoto drops the image and skip flag", () => {
    const store = useBuilderStore.getState();
    store.setPhoto("data:image/jpeg;base64,abc123");
    store.toggleSkipSection("photo");
    store.clearPhoto();
    expect(useBuilderStore.getState().photo).toBeNull();
    expect(useBuilderStore.getState().sectionStatus.photo).toBe("not_started");
  });

  it("clears an additional block including a heading with no items yet", () => {
    useBuilderStore.getState().setAdditionalHeading("Publications");
    expect(hasSectionContent("additional", useBuilderStore.getState().sections)).toBe(true);

    useBuilderStore.getState().clearSection("additional");
    expect(useBuilderStore.getState().sections.additional).toBeUndefined();
    expect(hasSectionContent("additional", useBuilderStore.getState().sections)).toBe(false);
  });

  it("resets basic info to empty fields, including links", () => {
    useBuilderStore.getState().updateBasicInfo({ name: "Jamie", email: "j@x.com", location: "Austin" });
    useBuilderStore.getState().updateLinks({ github: "github.com/jamie" });
    expect(hasBasicInfoContent(useBuilderStore.getState().basicInfo)).toBe(true);

    useBuilderStore.getState().clearBasicInfo();
    expect(useBuilderStore.getState().basicInfo).toEqual({
      name: "",
      email: "",
      phone: "",
      location: "",
      links: {},
    });
    expect(hasBasicInfoContent(useBuilderStore.getState().basicInfo)).toBe(false);
  });
});

describe("setPhoto", () => {
  it("stores and clears the photo data URL", () => {
    useBuilderStore.getState().setPhoto("data:image/jpeg;base64,abc123");
    expect(useBuilderStore.getState().photo).toBe("data:image/jpeg;base64,abc123");
    expect(useBuilderStore.getState().sectionStatus.photo).toBe("complete");

    useBuilderStore.getState().setPhoto(null);
    expect(useBuilderStore.getState().photo).toBeNull();
    expect(useBuilderStore.getState().sectionStatus.photo).toBe("not_started");
  });

  it("leaves a skipped photo skipped even if one is set underneath it", () => {
    const store = useBuilderStore.getState();
    store.toggleSkipSection("photo");
    store.setPhoto("data:image/jpeg;base64,abc123");
    expect(useBuilderStore.getState().sectionStatus.photo).toBe("skipped");
    expect(useBuilderStore.getState().photo).toBe("data:image/jpeg;base64,abc123");
  });
});

describe("setTemplateId", () => {
  it("updates the selected template", () => {
    useBuilderStore.getState().setTemplateId("bre-creative");
    expect(useBuilderStore.getState().templateId).toBe("bre-creative");
  });
});

describe("toggleSectionPageBreak", () => {
  it("adds a section on first toggle and removes it on the second", () => {
    const { toggleSectionPageBreak } = useBuilderStore.getState();
    toggleSectionPageBreak("experience");
    expect(useBuilderStore.getState().pageBreakSections).toEqual(["experience"]);

    toggleSectionPageBreak("experience");
    expect(useBuilderStore.getState().pageBreakSections).toEqual([]);
  });

  it("tracks multiple sections independently", () => {
    const { toggleSectionPageBreak } = useBuilderStore.getState();
    toggleSectionPageBreak("experience");
    toggleSectionPageBreak("certifications");
    expect(useBuilderStore.getState().pageBreakSections).toEqual(["experience", "certifications"]);

    toggleSectionPageBreak("experience");
    expect(useBuilderStore.getState().pageBreakSections).toEqual(["certifications"]);
  });
});

describe("toggleItemPageBreak", () => {
  it("adds an entry on first toggle and removes it on the second", () => {
    const { toggleItemPageBreak } = useBuilderStore.getState();
    toggleItemPageBreak("projects", 2);
    expect(useBuilderStore.getState().pageBreakItems).toEqual(["projects:2"]);

    toggleItemPageBreak("projects", 2);
    expect(useBuilderStore.getState().pageBreakItems).toEqual([]);
  });

  it("tracks entries of the same section independently, and leaves the section break alone", () => {
    const { toggleItemPageBreak } = useBuilderStore.getState();
    toggleItemPageBreak("projects", 2);
    toggleItemPageBreak("projects", 0);
    toggleItemPageBreak("experience", 1);
    expect(useBuilderStore.getState().pageBreakItems).toEqual(["projects:2", "projects:0", "experience:1"]);
    expect(useBuilderStore.getState().pageBreakSections).toEqual([]);
  });

  it("re-points entry breaks below a deleted entry, and drops the deleted one's own", () => {
    const { addListItem, removeListItem, toggleItemPageBreak } = useBuilderStore.getState();
    for (const name of ["First", "Second", "Third", "Fourth"]) {
      addListItem("projects", { name, description: "d" });
    }
    toggleItemPageBreak("projects", 1); // Second
    toggleItemPageBreak("projects", 3); // Fourth
    toggleItemPageBreak("experience", 2);

    removeListItem("projects", 1); // deletes Second, so Fourth is now index 2

    expect(useBuilderStore.getState().pageBreakItems).toEqual(["projects:2", "experience:2"]);
  });

  it("leaves entry breaks above a deleted entry where they are", () => {
    const { addListItem, removeListItem, toggleItemPageBreak } = useBuilderStore.getState();
    for (const name of ["First", "Second", "Third"]) {
      addListItem("projects", { name, description: "d" });
    }
    toggleItemPageBreak("projects", 1);

    removeListItem("projects", 2);

    expect(useBuilderStore.getState().pageBreakItems).toEqual(["projects:1"]);
  });
});

describe("moveSection", () => {
  it("defaults to null (default order) until something is moved", () => {
    expect(useBuilderStore.getState().sectionOrder).toBeNull();
  });

  it("materializes the default and swaps two neighbors on first move", () => {
    useBuilderStore.getState().moveSection("experience", "up");
    // default leads keyAchievements, experience, ... —
    // moving "experience" up swaps it with "keyAchievements".
    const order = useBuilderStore.getState().sectionOrder;
    expect(order?.[0]).toBe("experience");
    expect(order?.[1]).toBe("keyAchievements");
  });

  it("is a no-op past either boundary", () => {
    useBuilderStore.getState().moveSection("keyAchievements", "up");
    expect(useBuilderStore.getState().sectionOrder).toBeNull();

    useBuilderStore.getState().moveSection("additional", "down");
    expect(useBuilderStore.getState().sectionOrder).toBeNull();
  });

  it("is a no-op for a key that isn't in the order", () => {
    useBuilderStore.getState().moveSection("summary", "down");
    expect(useBuilderStore.getState().sectionOrder).toBeNull();
  });

  it("is a no-op for a skipped section", () => {
    useBuilderStore.getState().toggleSkipSection("experience");
    useBuilderStore.getState().moveSection("experience", "up");
    expect(useBuilderStore.getState().sectionOrder).toBeNull();
  });

  it("moves back and forth correctly across repeated calls", () => {
    useBuilderStore.getState().moveSection("experience", "up");
    useBuilderStore.getState().moveSection("internships", "up");
    expect(useBuilderStore.getState().sectionOrder).toEqual([
      "experience",
      "internships",
      "keyAchievements",
      "partTime",
      "projects",
      "education",
      "skills",
      "certifications",
      "patents",
      "languages",
      "hobbies",
      "softSkills",
      "additional",
    ]);
  });
});

describe("reorderSection", () => {
  it("places a section at an arbitrary index and materializes the default", () => {
    useBuilderStore.getState().reorderSection("skills", 0);
    expect(useBuilderStore.getState().sectionOrder?.[0]).toBe("skills");
    expect(useBuilderStore.getState().sectionOrder?.[1]).toBe("keyAchievements");
  });

  it("is a no-op at the current index", () => {
    useBuilderStore.getState().reorderSection("keyAchievements", 0);
    expect(useBuilderStore.getState().sectionOrder).toBeNull();
  });

  it("is a no-op for a skipped section", () => {
    useBuilderStore.getState().toggleSkipSection("skills");
    useBuilderStore.getState().reorderSection("skills", 0);
    expect(useBuilderStore.getState().sectionOrder).toBeNull();
  });
});

describe("loadFromData / resetStore", () => {
  it("loadFromData replaces the whole store", () => {
    useBuilderStore.getState().loadFromData({
      basicInfo: { name: "Loaded", email: "x@example.com", phone: "", location: "", links: {} },
      photo: "data:image/jpeg;base64,abc123",
      sections: { skills: ["Go"] },
      sectionStatus: { skills: "complete" },
      templateId: "bre-cool",
    });
    const state = useBuilderStore.getState();
    expect(state.basicInfo.name).toBe("Loaded");
    expect(state.photo).toBe("data:image/jpeg;base64,abc123");
    expect(state.templateId).toBe("bre-cool");
  });

  it("loadFromData defaults photo to null and pageBreakSections to empty when absent", () => {
    useBuilderStore.getState().loadFromData({
      basicInfo: { name: "Loaded", email: "", phone: "", location: "", links: {} },
      sections: {},
      sectionStatus: {},
      templateId: "bre-cool",
    });
    expect(useBuilderStore.getState().photo).toBeNull();
    expect(useBuilderStore.getState().pageBreakSections).toEqual([]);
  });

  it("loadFromData restores previously forced page breaks", () => {
    useBuilderStore.getState().loadFromData({
      basicInfo: { name: "Loaded", email: "", phone: "", location: "", links: {} },
      sections: {},
      sectionStatus: {},
      templateId: "bre-cool",
      pageBreakSections: ["certifications"],
    });
    expect(useBuilderStore.getState().pageBreakSections).toEqual(["certifications"]);
  });

  it("loadFromData restores a previously customized section order, defaulting to null when absent", () => {
    useBuilderStore.getState().loadFromData({
      basicInfo: { name: "Loaded", email: "", phone: "", location: "", links: {} },
      sections: {},
      sectionStatus: {},
      templateId: "bre-cool",
      sectionOrder: ["skills", "experience"],
    });
    expect(useBuilderStore.getState().sectionOrder).toEqual(["skills", "experience"]);

    useBuilderStore.getState().loadFromData({
      basicInfo: { name: "Loaded", email: "", phone: "", location: "", links: {} },
      sections: {},
      sectionStatus: {},
      templateId: "bre-cool",
    });
    expect(useBuilderStore.getState().sectionOrder).toBeNull();
  });

  it("resetStore returns to the initial empty state", () => {
    useBuilderStore.getState().setSkills(["TypeScript"]);
    useBuilderStore.getState().setPhoto("data:image/jpeg;base64,abc123");
    useBuilderStore.getState().setHasSavedCopy(true);
    useBuilderStore.getState().setSaveConsent("yes");
    useBuilderStore.getState().toggleSectionPageBreak("experience");
    useBuilderStore.getState().moveSection("skills", "up");
    useBuilderStore.getState().resetStore();
    const state = useBuilderStore.getState();
    expect(state.sections).toEqual({});
    expect(state.photo).toBeNull();
    expect(state.hasSavedCopy).toBe(false);
    expect(state.saveConsent).toBeNull();
    expect(state.pageBreakSections).toEqual([]);
    expect(state.sectionOrder).toBeNull();
  });
});

describe("getResumeData", () => {
  it("assembles the current state into a ResumeData snapshot", () => {
    useBuilderStore.getState().updateBasicInfo({ name: "Jamie" });
    useBuilderStore.getState().setSkills(["TypeScript"]);
    useBuilderStore.getState().setTemplateId("jsonresume-vitae");

    const data = useBuilderStore.getState().getResumeData();
    expect(data).toEqual({
      basicInfo: { name: "Jamie", email: "", phone: "", location: "", links: {} },
      photo: undefined,
      sections: { skills: ["TypeScript"] },
      sectionStatus: { skills: "complete" },
      templateId: "jsonresume-vitae",
      pageBreakSections: [],
      pageBreakItems: [],
    });
  });

  it("includes the photo when one is set, and omits it otherwise", () => {
    expect(useBuilderStore.getState().getResumeData().photo).toBeUndefined();

    useBuilderStore.getState().setPhoto("data:image/jpeg;base64,abc123");
    expect(useBuilderStore.getState().getResumeData().photo).toBe("data:image/jpeg;base64,abc123");
  });

  it("keeps a skipped photo in the snapshot so it can be shown again", () => {
    useBuilderStore.getState().setPhoto("data:image/jpeg;base64,abc123");
    useBuilderStore.getState().toggleSkipSection("photo");
    const data = useBuilderStore.getState().getResumeData();
    expect(data.photo).toBe("data:image/jpeg;base64,abc123");
    expect(data.sectionStatus.photo).toBe("skipped");
  });

  it("includes sectionOrder once something has been moved, and omits it otherwise", () => {
    expect(useBuilderStore.getState().getResumeData().sectionOrder).toBeUndefined();

    useBuilderStore.getState().moveSection("skills", "up");
    expect(useBuilderStore.getState().getResumeData().sectionOrder).toEqual(
      useBuilderStore.getState().sectionOrder,
    );
  });
});

describe("useResumeData", () => {
  it("returns a reactive, memoized snapshot that updates with the store", () => {
    const { result, rerender } = renderHook(() => useResumeData());
    expect(result.current.basicInfo.name).toBe("");

    act(() => {
      useBuilderStore.getState().updateBasicInfo({ name: "Jamie" });
    });
    rerender();

    expect(result.current.basicInfo.name).toBe("Jamie");
  });

  it("keeps the same object reference across renders when nothing relevant changed", () => {
    const { result, rerender } = renderHook(() => useResumeData());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
