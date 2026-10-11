import { mergeImportedResumes, normalizeParsedResume } from "./normalize";

describe("importing grouped skills", () => {
  it("keeps titled groups and makes skills their flat union", () => {
    const resume = normalizeParsedResume({
      skills: ["React", "Node"],
      skillGroups: [
        { title: "Frontend", skills: ["React", "CSS"] },
        { title: "Backend", skills: ["Node"] },
      ],
    });
    expect(resume.skillGroups).toEqual([
      { title: "Frontend", skills: ["React", "CSS"] },
      { title: "Backend", skills: ["Node"] },
    ]);
    expect(resume.sections.skills).toEqual(["React", "CSS", "Node"]);
    expect(resume.filled).toContain("skills");
  });

  it("keeps flat skills no group mentions in an untitled group, so none are lost", () => {
    const resume = normalizeParsedResume({
      skills: ["React", "Jira"],
      skillGroups: [{ title: "Frontend", skills: ["React"] }],
    });
    expect(resume.skillGroups).toEqual([
      { title: "Frontend", skills: ["React"] },
      { title: "", skills: ["Jira"] },
    ]);
    expect(resume.sections.skills).toEqual(["React", "Jira"]);
  });

  it("fills skills from the groups when the model left skills out", () => {
    const resume = normalizeParsedResume({ skillGroups: [{ title: "Data", skills: ["SQL"] }] });
    expect(resume.sections.skills).toEqual(["SQL"]);
    expect(resume.filled).toContain("skills");
  });

  it("ignores groups with no titles, empty groups, and junk", () => {
    expect(normalizeParsedResume({ skills: ["Go"], skillGroups: [{ title: "", skills: ["Go"] }] }).skillGroups).toBeUndefined();
    expect(normalizeParsedResume({ skills: ["Go"], skillGroups: [{ title: "Empty", skills: [] }] }).skillGroups).toBeUndefined();
    expect(normalizeParsedResume({ skills: ["Go"], skillGroups: "Frontend: React" }).skillGroups).toBeUndefined();
    expect(normalizeParsedResume({ skills: ["Go"] }).skillGroups).toBeUndefined();
  });

  it("never treats skillGroups as a section heading (it can't overwrite skills)", () => {
    const resume = normalizeParsedResume({ skills: ["Go", "Rust"], skillGroups: [{ title: "", skills: [] }] });
    expect(resume.sections.skills).toEqual(["Go", "Rust"]);
    expect(resume.sections.additional).toBeUndefined();
  });

  it("reads groups nested under sections too", () => {
    const resume = normalizeParsedResume({
      sections: { skills: ["React"], skillGroups: [{ title: "Frontend", skills: ["React"] }] },
    });
    expect(resume.skillGroups).toEqual([{ title: "Frontend", skills: ["React"] }]);
  });

  it("survives a round trip through the import endpoint's JSON", () => {
    const first = normalizeParsedResume({ skillGroups: [{ title: "Frontend", skills: ["React"] }] });
    const again = normalizeParsedResume(JSON.parse(JSON.stringify(first)));
    expect(again.skillGroups).toEqual(first.skillGroups);
    expect(again.sections.skills).toEqual(["React"]);
  });

  describe("merging the heuristic and AI passes", () => {
    const heuristic = normalizeParsedResume({ skills: ["React", "Node"] });

    it("takes the overlay's groups along with its skills", () => {
      const ai = normalizeParsedResume({ skillGroups: [{ title: "Frontend", skills: ["React"] }, { title: "Backend", skills: ["Node"] }] });
      const merged = mergeImportedResumes(heuristic, ai);
      expect(merged.skillGroups).toHaveLength(2);
      expect(merged.sections.skills).toEqual(["React", "Node"]);
    });

    it("keeps the base's groups when the overlay brought no skills", () => {
      const base = normalizeParsedResume({ skillGroups: [{ title: "Frontend", skills: ["React"] }] });
      const merged = mergeImportedResumes(base, normalizeParsedResume({ summary: "Engineer." }));
      expect(merged.skillGroups).toEqual([{ title: "Frontend", skills: ["React"] }]);
      expect(merged.sections.skills).toEqual(["React"]);
    });

    it("drops the base's groups when the overlay's flat skills replace them", () => {
      const base = normalizeParsedResume({ skillGroups: [{ title: "Frontend", skills: ["React"] }] });
      const merged = mergeImportedResumes(base, normalizeParsedResume({ skills: ["Go"] }));
      expect(merged.skillGroups).toBeUndefined();
      expect(merged.sections.skills).toEqual(["Go"]);
    });

    it("adds no skillGroups key when nobody grouped", () => {
      const merged = mergeImportedResumes(heuristic, normalizeParsedResume({ skills: ["Go"] }));
      expect("skillGroups" in merged).toBe(false);
    });
  });
});
