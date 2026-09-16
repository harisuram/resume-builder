import type { ResumeData } from "@/lib/types";

/** A resume with every section populated, so template smoke tests exercise
 * every layout branch (sidebar vs. main column, headings, list rendering). */
export function makeFullResumeData(overrides: Partial<ResumeData> = {}): ResumeData {
  return {
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
    ...overrides,
  };
}

/** A resume with nothing filled in — exercises every
 * "don't render an empty heading" branch. */
export function makeEmptyResumeData(overrides: Partial<ResumeData> = {}): ResumeData {
  return {
    basicInfo: { name: "", email: "", phone: "", location: "", links: {} },
    sections: {},
    sectionStatus: {},
    templateId: "jakes-resume",
    ...overrides,
  };
}
