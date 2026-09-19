import type { ResumeData, ResumeSections, SectionKey, TemplateId } from "./types";

/** Demo resume shown in empty builder previews and the templates gallery.
 * Not written into the user's draft — preview-only. */
export const SAMPLE_RESUME: ResumeData = {
  basicInfo: {
    name: "Alexandra Montgomery-Whitfield",
    email: "alexandra@example.com",
    phone: "5550100199",
    phoneCountryCode: "+1",
    location: "San Francisco, CA",
    links: {
      linkedin: "linkedin.com/in/alexandra",
      github: "github.com/alexandra",
      portfolio: "alexandra.dev",
    },
  },
  sections: {
    summary: "Staff-level backend engineer with 9 years building resilient infrastructure.",
    keyAchievements: [
      "Cut infrastructure spend by 22% through a ground-up migration to spot instances",
      "Grew the platform team from 3 to 12 engineers over two years",
    ],
    education: [
      {
        institution: "Massachusetts Institute of Technology",
        degree: "M.S. Computer Science",
        fieldOfStudy: "Distributed Systems",
        startDate: "2014-08",
        endDate: "2016-05",
        gpa: "3.9",
        coursework: ["Distributed Systems", "Compilers"],
      },
    ],
    experience: [
      {
        company: "Nimbus Systems International",
        role: "Senior Staff Software Engineer",
        startDate: "2019-03",
        bullets: ["Led the redesign of the payments ledger", "Mentored a team of six engineers"],
      },
    ],
    internships: [
      {
        company: "Brightline Analytics",
        role: "Software Engineering Intern",
        startDate: "2015-06",
        endDate: "2015-08",
        bullets: ["Built an internal dashboard"],
      },
    ],
    partTime: [
      {
        company: "Campus Library",
        role: "Circulation Assistant",
        startDate: "2013-09",
        endDate: "2014-05",
        bullets: ["Staffed the front desk and managed reserve requests"],
      },
    ],
    projects: [
      {
        name: "Open-source Kafka connector",
        description: "A CDC connector bridging mainframe DB2 change streams into Kafka topics.",
        link: "github.com/alexandra/kafka-connector",
        technologies: ["Kafka", "Java"],
      },
    ],
    skills: ["TypeScript", "Kubernetes", "PostgreSQL", "Go", "AWS"],
    certifications: [{ name: "AWS Certified Solutions Architect", issuer: "Amazon Web Services", date: "2021-04" }],
    patents: [
      {
        title: "Distributed cache coherency protocol",
        number: "US 11,234,567",
        office: "USPTO",
        date: "2022-06",
        link: "https://patents.google.com/patent/US11234567",
      },
    ],
    languages: [
      { name: "English", level: "Native" },
      { name: "Spanish", level: "Professional" },
    ],
    hobbies: ["Trail running", "Film photography"],
    softSkills: ["Mentoring", "Stakeholder communication"],
    additional: {
      heading: "Publications",
      items: [
        {
          title: "Scaling ledger writes",
          subtitle: "ACM Queue",
          date: "2021",
          bullets: ["Surveyed consensus tradeoffs for payment systems"],
        },
      ],
    },
  },
  sectionStatus: {
    summary: "complete",
    keyAchievements: "complete",
    education: "complete",
    experience: "complete",
    internships: "complete",
    partTime: "complete",
    projects: "complete",
    skills: "complete",
    certifications: "complete",
    patents: "complete",
    languages: "complete",
    hobbies: "complete",
    softSkills: "complete",
    additional: "complete",
  },
  templateId: "jakes-resume",
};

/** Lean demo for gallery tiles — fewer sections so thumbnails stay readable. */
export const GALLERY_SAMPLE_RESUME: ResumeData = {
  ...SAMPLE_RESUME,
  sections: {
    summary: SAMPLE_RESUME.sections.summary,
    experience: SAMPLE_RESUME.sections.experience?.slice(0, 1),
    projects: SAMPLE_RESUME.sections.projects,
    education: SAMPLE_RESUME.sections.education,
    skills: SAMPLE_RESUME.sections.skills,
  },
  sectionStatus: {
    summary: "complete",
    experience: "complete",
    projects: "complete",
    education: "complete",
    skills: "complete",
  },
};

function omitSkippedSection(
  sections: Partial<ResumeSections>,
  key: SectionKey,
): Partial<ResumeSections> {
  const next = { ...sections };
  delete next[key];
  return next;
}

/** Sample resume for the empty builder preview: follows the user's template,
 * section order, and skipped sections so the sneak peek matches what they'll print. */
export function sampleResumeForPreview(
  data: Pick<ResumeData, "templateId" | "sectionStatus" | "sectionOrder" | "sections">,
): ResumeData {
  let sections: Partial<ResumeSections> = { ...SAMPLE_RESUME.sections };
  const sectionStatus: ResumeData["sectionStatus"] = { ...SAMPLE_RESUME.sectionStatus };

  for (const key of Object.keys(SAMPLE_RESUME.sectionStatus) as SectionKey[]) {
    if (data.sectionStatus[key] === "skipped") {
      sectionStatus[key] = "skipped";
      sections = omitSkippedSection(sections, key);
    }
  }

  if (data.sectionStatus.photo === "skipped") {
    sectionStatus.photo = "skipped";
  }

  const customHeading = data.sections.additional?.heading?.trim();
  if (customHeading && sections.additional) {
    sections = {
      ...sections,
      additional: { ...sections.additional, heading: customHeading },
    };
  }

  return {
    ...SAMPLE_RESUME,
    templateId: data.templateId,
    sectionOrder: data.sectionOrder,
    sections,
    sectionStatus,
  };
}

export function sampleResumeForTemplate(templateId: TemplateId): ResumeData {
  return { ...GALLERY_SAMPLE_RESUME, templateId };
}
