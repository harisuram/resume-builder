import { render } from "@testing-library/react";
import { ResumePdfDocument } from "@/components/pdf/ResumePdfDocument";
import { makeFullResumeData } from "@/test-utils/fixtures";
import type { Education } from "@/lib/types";
import { TEMPLATE_COMPONENTS, TEMPLATE_LIST } from "./registry";

jest.mock("@react-pdf/renderer", () => jest.requireActual<typeof import("../../test-utils/reactPdfMock")>("../../test-utils/reactPdfMock").reactPdfMock());

const DETAILS = { dateOfBirth: "1996-03-15", gender: "Female", maritalStatus: "Single", nationality: "Indian" };
const EDUCATION: Education[] = [
  { institution: "IIT Delhi", degree: "B.Tech", startDate: "2014-07", endDate: "2018-05", gpa: "8.6", gradeType: "cgpa10" },
  { institution: "Oxford", degree: "MSc", startDate: "2018-09", endDate: "2019-09", gpa: "First Class Honours", gradeType: "ukClass" },
  { institution: "State College", degree: "BA", startDate: "2010-09", endDate: "2014-05", gpa: "3.7" },
];

function data(id: string) {
  return makeFullResumeData({
    templateId: id,
    sections: { personalDetails: DETAILS, education: EDUCATION },
    sectionStatus: { personalDetails: "complete", education: "complete" },
  });
}

describe.each(TEMPLATE_LIST.map((t) => [t.id] as const))("%s", (id) => {
  it("prints personal details and every grade on its own scale — preview", () => {
    const Template = TEMPLATE_COMPONENTS[id];
    const { container } = render(<Template data={data(id)} />);
    const text = container.textContent ?? "";
    expect(container.querySelector('[data-section-key="personalDetails"]')).not.toBeNull();
    expect(text).toContain("Personal Details");
    expect(text).toContain("Date of birth: 15 March 1996");
    expect(text).toContain("Gender: Female");
    expect(text).toContain("Marital status: Single");
    expect(text).toContain("Nationality: Indian");
    expect(text).toContain("CGPA 8.6/10");
    expect(text).toContain("First Class Honours");
    expect(text).toContain("GPA 3.7");
  });

  it("prints the same in the PDF", () => {
    const { container } = render(<ResumePdfDocument data={data(id)} />);
    const text = container.textContent ?? "";
    expect(text).toContain("Date of birth: 15 March 1996");
    expect(text).toContain("Nationality: Indian");
    expect(text).toContain("CGPA 8.6/10");
    expect(text).toContain("First Class Honours");
    expect(text).toContain("GPA 3.7");
  });
});

describe("personal details stay off the page when", () => {
  const Template = TEMPLATE_COMPONENTS[TEMPLATE_LIST[0].id];

  it("the section is skipped", () => {
    const skipped = makeFullResumeData({ sections: { personalDetails: DETAILS }, sectionStatus: { personalDetails: "skipped" } });
    expect(render(<Template data={skipped} />).container.textContent).not.toContain("Date of birth");
    expect(render(<ResumePdfDocument data={skipped} />).container.textContent).not.toContain("Date of birth");
  });

  it("every field is empty", () => {
    const empty = makeFullResumeData({ sections: { personalDetails: { gender: "  " } } });
    const { container } = render(<Template data={empty} />);
    expect(container.querySelector('[data-section-key="personalDetails"]')).toBeNull();
  });

  it("only some fields are filled — just those print", () => {
    const partial = makeFullResumeData({ sections: { personalDetails: { nationality: "Emirati" } } });
    const text = render(<Template data={partial} />).container.textContent ?? "";
    expect(text).toContain("Nationality: Emirati");
    expect(text).not.toContain("Gender:");
  });
});
