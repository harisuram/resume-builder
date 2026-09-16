import {
  CERTIFICATION_CATALOG,
  FIELD_CATALOG,
  filterCatalog,
  ROLE_CATALOG,
  SKILL_CATALOG,
} from "./catalogs";

describe("filterCatalog", () => {
  const catalog = ["TypeScript", "Python", "React"];

  it("returns the full catalog when the query is empty, minus selected values", () => {
    expect(filterCatalog(catalog, "", ["Python"])).toEqual(["TypeScript", "React"]);
  });

  it("filters by case-insensitive substring", () => {
    expect(filterCatalog(catalog, "script", [])).toEqual(["TypeScript"]);
  });

  it("hides already-selected items even when they match the query", () => {
    expect(filterCatalog(catalog, "script", ["TypeScript"])).toEqual([]);
  });

  it("ranks prefix matches ahead of later substring hits", () => {
    expect(filterCatalog(["Metadata", "Database", "Data Analysis"], "data", [])).toEqual([
      "Data Analysis",
      "Database",
      "Metadata",
    ]);
  });
});

describe("catalogs", () => {
  it("lists common skills and roles without duplicates", () => {
    expect(new Set(SKILL_CATALOG).size).toBe(SKILL_CATALOG.length);
    expect(new Set(ROLE_CATALOG).size).toBe(ROLE_CATALOG.length);
    expect(ROLE_CATALOG).toContain("Software Engineer");
    expect(SKILL_CATALOG).toContain("TypeScript");
  });

  it("covers pharma, architecture, construction, IT, networking, and data", () => {
    expect(SKILL_CATALOG).toEqual(expect.arrayContaining(["GMP", "Revit", "OSHA", "TCP/IP", "SQL Server"]));
    expect(ROLE_CATALOG).toEqual(
      expect.arrayContaining([
        "Pharmacist",
        "Architect",
        "Construction Manager",
        "Network Engineer",
        "Database Administrator",
      ]),
    );
    expect(FIELD_CATALOG).toEqual(expect.arrayContaining(["Pharmacy", "Architecture", "Construction Management"]));
    expect(CERTIFICATION_CATALOG).toEqual(expect.arrayContaining(["CCNA", "PMP", "OSHA 30"]));
  });
});
