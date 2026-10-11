import { render } from "@testing-library/react";
import { ResumePdfDocument } from "@/components/pdf/ResumePdfDocument";
import { makeFullResumeData } from "@/test-utils/fixtures";
import type { ResumeData, SkillGroup } from "@/lib/types";
import { TEMPLATE_COMPONENTS, TEMPLATE_LIST } from "./registry";

jest.mock("@react-pdf/renderer", () =>
  jest.requireActual<typeof import("../../test-utils/reactPdfMock")>("../../test-utils/reactPdfMock").reactPdfMock(),
);

/**
 * Grouped skills on every template, in both engines. The builder's preview
 * and the download are the same react-pdf file, so they can't disagree; this
 * pins the HTML templates (gallery, print) to the same lines, and checks the
 * page-break rule each engine uses to keep a group whole.
 */

const GROUPS: SkillGroup[] = [
  { title: "Frontend", skills: ["React", "TypeScript", "CSS"] },
  { title: "Backend", skills: ["Node", "PostgreSQL", "Redis"] },
  { title: "", skills: ["Git"] },
  { title: "Empty group", skills: [] },
];
const EXPECTED_LINES = ["Frontend: React, TypeScript, CSS", "Backend: Node, PostgreSQL, Redis", "Git"];

function grouped(templateId: string, overrides: Partial<ResumeData> = {}): ResumeData {
  return makeFullResumeData({
    templateId,
    skillsLayout: "grouped",
    skillGroups: GROUPS,
    ...overrides,
    sections: { skills: ["React", "TypeScript", "CSS", "Node", "PostgreSQL", "Redis", "Git"], ...overrides.sections },
  });
}

function htmlLines(data: ResumeData) {
  const Template = TEMPLATE_COMPONENTS[data.templateId];
  const view = render(<Template data={data} />);
  const rows = Array.from(view.container.querySelectorAll<HTMLElement>("[data-skill-group]"));
  const lines = rows.map((row) => row.textContent ?? "");
  view.unmount();
  return { rows, lines };
}

function pdfGroupTexts(container: HTMLElement): HTMLElement[] {
  // Each group is one top-level Text; its title is a nested Text.
  return Array.from(container.querySelectorAll<HTMLElement>('[data-pdf="Text"]')).filter(
    (el) => !el.parentElement?.closest('[data-pdf="Text"]') && EXPECTED_LINES.includes(el.textContent ?? ""),
  );
}

describe.each(TEMPLATE_LIST.map((t) => [t.id, t.name] as const))("%s (%s) with grouped skills", (id) => {
  it("prints one 'Title: a, b, c' line per non-empty group in the HTML template", () => {
    const { lines } = htmlLines(grouped(id));
    expect(lines).toEqual(EXPECTED_LINES);
  });

  it("keeps each HTML group whole across a page break (div, break-inside-avoid)", () => {
    const Template = TEMPLATE_COMPONENTS[id];
    const { container } = render(<Template data={grouped(id)} />);
    const rows = container.querySelectorAll<HTMLElement>("[data-skill-group]");
    expect(rows.length).toBe(3);
    for (const row of Array.from(rows)) {
      // Not a <p>: print CSS resets break-inside on p, which would let a
      // group split in the print but not in the measurement.
      expect(row.tagName).toBe("DIV");
      expect(row).toHaveClass("break-inside-avoid");
    }
    // Long unbroken skill names wrap instead of running out of a narrow rail.
    expect(rows[0]).toHaveClass("[overflow-wrap:anywhere]");
    // Inside the skills section, not some other block.
    expect(rows[0].closest('[data-section-key="skills"]')).not.toBeNull();
  });

  it("prints exactly the same lines in the PDF, in the same order", () => {
    const data = grouped(id);
    const { container } = render(<ResumePdfDocument data={data} />);
    expect(pdfGroupTexts(container).map((el) => el.textContent)).toEqual(htmlLines(data).lines);
  });

  it("holds each PDF group on one page and the titles in bold", () => {
    const { container } = render(<ResumePdfDocument data={grouped(id)} />);
    const groups = pdfGroupTexts(container);
    expect(groups).toHaveLength(3);
    for (const group of groups) expect(group).toHaveAttribute("data-wrap", "false");
    const title = groups[0].querySelector('[data-pdf="Text"]')!;
    expect(title.textContent).toBe("Frontend: ");
    expect(JSON.parse(title.getAttribute("data-style") ?? "{}").fontWeight).toBe(600);
  });

  it("keeps the Skills heading with the first group in the PDF", () => {
    const { container } = render(<ResumePdfDocument data={grouped(id)} />);
    const heading = Array.from(container.querySelectorAll('[data-pdf="Text"]')).find(
      (el) => el.textContent === "Skills" || el.textContent === "SKILLS",
    );
    if (heading) expect(heading.closest("[data-min-presence]")).not.toBeNull();
  });

  it("is unchanged from before in list mode: no group lines in either engine", () => {
    const data = grouped(id, { skillsLayout: "list" });
    expect(htmlLines(data).lines).toEqual([]);
    const { container } = render(<ResumePdfDocument data={data} />);
    // "Git" alone is also a flat chip, so look for the titled lines.
    expect(pdfGroupTexts(container).filter((el) => el.textContent!.includes(": "))).toEqual([]);
    expect(container.textContent).not.toContain("Frontend: ");
    expect(container.textContent).toContain("TypeScript");
  });

  it("falls back to the flat list when no group has a title", () => {
    const data = grouped(id, { skillGroups: [{ title: "", skills: ["React", "Node"] }] });
    expect(htmlLines(data).lines).toEqual([]);
  });

  it("prints nothing for skills when the section is skipped", () => {
    const data = grouped(id, { sectionStatus: { ...makeFullResumeData().sectionStatus, skills: "skipped" } });
    expect(htmlLines(data).lines).toEqual([]);
    const { container } = render(<ResumePdfDocument data={data} />);
    expect(container.textContent).not.toContain("Frontend: ");
  });
});

describe("variant treatments", () => {
  it("Sterling and Kernel keep their flat-list styling scoped away from grouped skills", () => {
    for (const id of ["sterling", "kernel"]) {
      if (!TEMPLATE_COMPONENTS[id]) continue;
      const Template = TEMPLATE_COMPONENTS[id];
      const { container, unmount } = render(<Template data={grouped(id)} />);
      const wrapper = container.querySelector('[data-section-key="skills"] > [data-skill-groups]');
      expect(wrapper).not.toBeNull();
      unmount();
    }
  });

  it("Sterling and Kernel PDFs draw the group lines instead of the grid / mono chips", () => {
    for (const id of ["sterling", "kernel"]) {
      if (!TEMPLATE_COMPONENTS[id]) continue;
      const { container, unmount } = render(<ResumePdfDocument data={grouped(id)} />);
      expect(pdfGroupTexts(container).map((el) => el.textContent)).toEqual(EXPECTED_LINES);
      unmount();
    }
  });
});

describe("long content", () => {
  it("prints every skill of a long group and a long title in both engines", () => {
    const many = Array.from({ length: 30 }, (_, i) => `Skill number ${i + 1}`);
    const longTitle = "Cloud infrastructure and platform engineering";
    const data = makeFullResumeData({
      templateId: "atlas",
      skillsLayout: "grouped",
      skillGroups: [{ title: longTitle, skills: many }],
      sections: { skills: many },
    });
    const line = `${longTitle}: ${many.join(", ")}`;
    expect(htmlLines(data).lines).toEqual([line]);
    const { container } = render(<ResumePdfDocument data={data} />);
    expect(container.textContent).toContain(line);
  });
});

describe("spacing between groups", () => {
  it("is 6px in both engines", () => {
    const data = grouped("atlas");
    const Template = TEMPLATE_COMPONENTS.atlas;
    const html = render(<Template data={data} />);
    expect(html.container.querySelector("[data-skill-groups]")).toHaveClass("space-y-1.5");
    html.unmount();
    const { container } = render(<ResumePdfDocument data={data} />);
    const wrapper = pdfGroupTexts(container)[0].parentElement!;
    expect(JSON.parse(wrapper.getAttribute("data-style")!).gap).toBe(6 * 0.75);
  });
});
