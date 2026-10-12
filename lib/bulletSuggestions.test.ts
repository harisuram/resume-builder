import { ROLE_CATALOG } from "./catalogs";
import { BULLET_FAMILIES, bulletFamilyFor, fallbackBulletSuggestions } from "./bulletSuggestions";

describe("bullet families", () => {
  it.each(Object.entries(BULLET_FAMILIES))("%s has 20 distinct, first-person-free bullets", (_key, family) => {
    expect(family.bullets).toHaveLength(20);
    expect(new Set(family.bullets).size).toBe(20);
    for (const bullet of family.bullets) {
      expect(bullet).not.toMatch(/\b(I|me|my)\b/);
      expect(bullet.length).toBeLessThanOrEqual(300);
    }
  });
});

describe("bulletFamilyFor", () => {
  it.each([
    ["Software Engineer", "software"],
    ["Salesforce Developer", "software"],
    ["Sales Engineer", "sales"],
    ["Security Guard", "public"],
    ["Penetration Tester", "security"],
    ["Interior Designer", "architecture"],
    ["Game Designer", "design"],
    ["Community Manager", "marketing"],
    ["Credit Analyst", "banking"],
    ["Equity Research Analyst", "banking"],
    ["Data Entry Operator", "operations"],
    ["General Laborer", "trades"],
    ["Loss Prevention Officer", "retail"],
    ["Clinical Pharmacist", "pharmacy"],
    ["Registered Nurse", "nursing"],
    ["Massage Therapist", "services"],
    ["Personal Trainer", "education"],
    ["Air Traffic Controller", "logistics"],
    ["Chef", "hospitality"],
    ["Welder", "trades"],
  ])("maps %s to %s", (role, family) => {
    expect(bulletFamilyFor(role)).toBe(family);
  });

  it("puts interns in their field when the title names one", () => {
    expect(bulletFamilyFor("Software Engineer Intern")).toBe("software");
    expect(bulletFamilyFor("Pharmacy Intern")).toBe("pharmacy");
    expect(bulletFamilyFor("Design Intern")).toBe("design");
    expect(bulletFamilyFor("Intern")).toBe("intern");
    expect(bulletFamilyFor("Internal Auditor")).toBe("finance");
  });

  it("falls back to general points for blank or unknown titles", () => {
    expect(bulletFamilyFor("")).toBe("general");
    expect(bulletFamilyFor("Wizard of Light")).toBe("general");
  });

  it("gives almost every catalog role a specific family", () => {
    const general = ROLE_CATALOG.filter((role) => bulletFamilyFor(role) === "general");
    expect(general.length).toBeLessThanOrEqual(10);
  });

  it("returns the family's bullets as the fallback", () => {
    const { family, bullets } = fallbackBulletSuggestions("Pharmacist");
    expect(family).toBe(BULLET_FAMILIES.pharmacy);
    expect(bullets).toHaveLength(20);
  });
});
