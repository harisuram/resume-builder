import {
  MAX_SKILL_GROUPS,
  MAX_SKILL_GROUP_TITLE_LENGTH,
  MAX_SKILLS_PER_GROUP,
  flattenSkillGroups,
  reconcileSkillGroups,
  renderableSkillGroups,
  sanitizeSkillGroups,
} from "./skillGroups";
import { MAX_CHIP_LENGTH } from "./validation";

describe("flattenSkillGroups", () => {
  it("lists every skill once, in group order", () => {
    expect(
      flattenSkillGroups([
        { title: "Frontend", skills: ["React", "CSS"] },
        { title: "Backend", skills: ["Node", "SQL"] },
      ]),
    ).toEqual(["React", "CSS", "Node", "SQL"]);
  });

  it("keeps a skill typed into two groups only once, in the first, ignoring case", () => {
    expect(
      flattenSkillGroups([
        { title: "A", skills: ["React"] },
        { title: "B", skills: ["react", "Go"] },
      ]),
    ).toEqual(["React", "Go"]);
  });

  it("drops blank skills and returns [] for no groups", () => {
    expect(flattenSkillGroups([{ title: "A", skills: ["  ", ""] }])).toEqual([]);
    expect(flattenSkillGroups([])).toEqual([]);
  });
});

describe("reconcileSkillGroups", () => {
  it("puts every skill in one untitled group the first time", () => {
    expect(reconcileSkillGroups(["React", "Go"], [])).toEqual([{ title: "", skills: ["React", "Go"] }]);
  });

  it("opens on one empty group when there are no skills and no groups", () => {
    expect(reconcileSkillGroups([], [])).toEqual([{ title: "", skills: [] }]);
  });

  it("keeps titles and order, drops skills removed from the list, and files new ones untitled", () => {
    const groups = [
      { title: "Frontend", skills: ["React", "CSS"] },
      { title: "Backend", skills: ["Node", "SQL"] },
    ];
    expect(reconcileSkillGroups(["React", "SQL", "Docker"], groups)).toEqual([
      { title: "Frontend", skills: ["React"] },
      { title: "Backend", skills: ["SQL"] },
      { title: "", skills: ["Docker"] },
    ]);
  });

  it("adds new skills to an existing untitled group rather than making another", () => {
    const groups = [
      { title: "", skills: ["Git"] },
      { title: "Backend", skills: ["Node"] },
    ];
    expect(reconcileSkillGroups(["Git", "Node", "Docker"], groups)).toEqual([
      { title: "", skills: ["Git", "Docker"] },
      { title: "Backend", skills: ["Node"] },
    ]);
  });

  it("keeps a group that lost all its skills, so its title isn't lost", () => {
    expect(reconcileSkillGroups([], [{ title: "Cloud", skills: ["AWS"] }])).toEqual([{ title: "Cloud", skills: [] }]);
  });

  it("matches skills ignoring case and keeps a skill in only one group", () => {
    const groups = [
      { title: "A", skills: ["react"] },
      { title: "B", skills: ["React"] },
    ];
    expect(reconcileSkillGroups(["React"], groups)).toEqual([
      { title: "A", skills: ["react"] },
      { title: "B", skills: [] },
    ]);
  });
});

describe("sanitizeSkillGroups", () => {
  it("returns [] for anything that isn't an array", () => {
    expect(sanitizeSkillGroups(undefined)).toEqual([]);
    expect(sanitizeSkillGroups(null)).toEqual([]);
    expect(sanitizeSkillGroups("Frontend")).toEqual([]);
    expect(sanitizeSkillGroups({ title: "x", skills: [] })).toEqual([]);
  });

  it("skips non-objects, coerces bad fields, trims and de-duplicates skills", () => {
    expect(
      sanitizeSkillGroups([
        null,
        "oops",
        { title: 42, skills: ["  React ", "react", 7, "", "CSS"] },
        { title: "Backend" },
      ]),
    ).toEqual([
      { title: "", skills: ["React", "CSS"] },
      { title: "Backend", skills: [] },
    ]);
  });

  it("caps title length, skill length, skills per group and group count", () => {
    const long = "x".repeat(500);
    const many = Array.from({ length: 100 }, (_, i) => `s${i}`);
    const groups = sanitizeSkillGroups(Array.from({ length: 30 }, () => ({ title: long, skills: [long, ...many] })));
    expect(groups).toHaveLength(MAX_SKILL_GROUPS);
    expect(groups[0].title).toHaveLength(MAX_SKILL_GROUP_TITLE_LENGTH);
    expect(groups[0].skills[0]).toHaveLength(MAX_CHIP_LENGTH);
    expect(groups[0].skills).toHaveLength(MAX_SKILLS_PER_GROUP);
  });
});

describe("renderableSkillGroups", () => {
  const groups = [
    { title: "Frontend", skills: ["React"] },
    { title: "Backend", skills: ["Node"] },
  ];

  it("is null in list mode, or when the layout is missing (every resume saved before groups)", () => {
    expect(renderableSkillGroups({ skillGroups: groups })).toBeNull();
    expect(renderableSkillGroups({ skillsLayout: "list", skillGroups: groups })).toBeNull();
  });

  it("returns the groups in grouped mode", () => {
    expect(renderableSkillGroups({ skillsLayout: "grouped", skillGroups: groups })).toEqual(groups);
  });

  it("is null when no group has a title — that is just the flat list", () => {
    expect(renderableSkillGroups({ skillsLayout: "grouped", skillGroups: [{ title: " ", skills: ["React"] }] })).toBeNull();
    expect(renderableSkillGroups({ skillsLayout: "grouped", skillGroups: [] })).toBeNull();
    expect(renderableSkillGroups({ skillsLayout: "grouped" })).toBeNull();
  });

  it("drops empty groups (titled or not) and keeps untitled groups that have skills", () => {
    expect(
      renderableSkillGroups({
        skillsLayout: "grouped",
        skillGroups: [
          { title: "Empty", skills: [] },
          { title: " Frontend ", skills: ["React"] },
          { title: "", skills: ["Git"] },
        ],
      }),
    ).toEqual([
      { title: "Frontend", skills: ["React"] },
      { title: "", skills: ["Git"] },
    ]);
  });

  it("prints a skill that is in two groups only in the first", () => {
    expect(
      renderableSkillGroups({
        skillsLayout: "grouped",
        skillGroups: [
          { title: "A", skills: ["React", "Go"] },
          { title: "B", skills: ["go"] },
        ],
      }),
    ).toEqual([{ title: "A", skills: ["React", "Go"] }]);
  });

  it("survives malformed saved data", () => {
    expect(
      renderableSkillGroups({
        skillsLayout: "grouped",
        skillGroups: [{ title: "A", skills: "React" }, 5] as never,
      }),
    ).toBeNull();
  });
});
