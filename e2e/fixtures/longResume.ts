import type {
  AdditionalItem,
  Certification,
  Education,
  Experience,
  Language,
  Patent,
  Project,
  ResumeData,
  SectionKey,
  SectionStatus,
} from "@/lib/types";

/**
 * A deterministic resume big enough that every template prints a long
 * multi-page PDF (≥ `MIN_EXPECTED_PAGES`). The gap suite needs many
 * interior page boundaries per template — a two-page resume only exercises
 * one cut, and one cut is not enough to catch a pagination rule that
 * strands half a sheet on page 6.
 *
 * Nothing here is random: the same text produces the same page count on
 * every run, so a page-count or gap regression is a real layout change and
 * not fixture noise.
 */

/** Rough page target this fixture is calibrated to on the densest template. */
export const TARGET_PAGES = 10;

/** Volume knob. Raise it if templates get denser and drop under the floor. */
const BULK = 2.8;

function count(base: number): number {
  return Math.max(1, Math.round(base * BULK));
}

/** Indexed filler with stable, varied line lengths so wrapping differs per
 * entry the way a real resume does — uniform-length bullets would hide
 * break bugs that only show up on a 2-line bullet. */
function bullet(i: number, topic: string): string {
  const shapes = [
    `Led the ${topic} workstream end to end, taking it from a one-page proposal through design review, staged rollout, and the on-call rotation that now owns it.`,
    `Cut ${topic} latency by ${30 + (i % 9) * 4}% by replacing the synchronous fan-out with a batched queue.`,
    `Wrote the ${topic} runbook and trained ${3 + (i % 5)} engineers on it.`,
    `Partnered with product and design on ${topic}, shipping ${2 + (i % 4)} experiments that moved activation ${4 + (i % 7)}pp and became the default path for new accounts in the following quarter.`,
    `Reduced ${topic} incident volume from ${12 + (i % 6)} to ${2 + (i % 3)} per quarter.`,
    `Migrated ${topic} off the legacy monolith with zero downtime and no customer-visible regressions.`,
  ];
  return shapes[i % shapes.length];
}

const TOPICS = [
  "billing ledger",
  "identity platform",
  "event ingestion",
  "search relevance",
  "fraud scoring",
  "data warehouse",
  "mobile sync",
  "checkout flow",
  "notification fan-out",
  "policy engine",
  "media pipeline",
  "partner API",
  "usage metering",
  "release tooling",
];

const COMPANIES = [
  "Nimbus Systems International",
  "Halyard Data Works",
  "Cobalt & Finch Technologies",
  "Meridian Logistics Group",
  "Ardent Payments Corporation",
  "Northwind Analytics",
  "Saltmarsh Robotics",
  "Vireo Health Networks",
  "Pinebrook Capital Systems",
  "Lanternfish Media Labs",
  "Quarry Street Software",
  "Fieldstone Interactive",
  "Bright Harbor Logistics",
  "Terrace Point Security",
];

const ROLES = [
  "Principal Software Engineer",
  "Senior Staff Software Engineer",
  "Staff Platform Engineer",
  "Lead Backend Engineer",
  "Senior Software Engineer",
  "Software Engineer II",
];

function experience(n: number, bulletsEach: number, startYear: number): Experience[] {
  return Array.from({ length: n }, (_, i) => ({
    company: COMPANIES[i % COMPANIES.length],
    role: ROLES[i % ROLES.length],
    startDate: `${startYear - i * 2}-0${(i % 9) + 1}`,
    endDate: i === 0 ? undefined : `${startYear - i * 2 + 1}-1${i % 3}`,
    current: i === 0,
    bullets: Array.from({ length: bulletsEach }, (_, b) => bullet(i + b, TOPICS[(i + b) % TOPICS.length])),
  }));
}

function education(n: number): Education[] {
  const schools = [
    "Massachusetts Institute of Technology",
    "University of Illinois Urbana-Champaign",
    "Georgia Institute of Technology",
    "Carnegie Mellon University",
    "University of Waterloo",
  ];
  return Array.from({ length: n }, (_, i) => ({
    institution: schools[i % schools.length],
    degree: i % 2 === 0 ? "M.S. Computer Science" : "B.S. Computer Engineering",
    fieldOfStudy: i % 2 === 0 ? "Distributed Systems" : "Computer Architecture",
    startDate: `${2008 + i}-08`,
    endDate: `${2010 + i}-05`,
    gpa: `3.${9 - (i % 4)}`,
    coursework: [
      "Distributed Systems",
      "Compilers",
      "Advanced Operating Systems",
      "Database Internals",
      "Probabilistic Methods",
    ],
  }));
}

function projects(n: number): Project[] {
  return Array.from({ length: n }, (_, i) => ({
    name: `${TOPICS[i % TOPICS.length].replace(/\b\w/g, (c) => c.toUpperCase())} Toolkit`,
    description: `An open-source toolkit for ${TOPICS[i % TOPICS.length]} that streams change data into Kafka, replays it deterministically for tests, and exposes a typed client used by ${4 + (i % 6)} internal services.`,
    link: `github.com/alexandra/project-${i + 1}`,
    technologies: ["TypeScript", "Go", "Kafka", "PostgreSQL", "Terraform"].slice(0, 3 + (i % 3)),
  }));
}

function certifications(n: number): Certification[] {
  const names = [
    "AWS Certified Solutions Architect – Professional",
    "Google Cloud Professional Cloud Architect",
    "Certified Kubernetes Administrator",
    "HashiCorp Certified: Terraform Associate",
    "Certified Information Systems Security Professional",
  ];
  const issuers = ["Amazon Web Services", "Google Cloud", "CNCF", "HashiCorp", "ISC²"];
  return Array.from({ length: n }, (_, i) => ({
    name: names[i % names.length],
    issuer: issuers[i % issuers.length],
    date: `${2018 + (i % 7)}-0${(i % 9) + 1}`,
  }));
}

function patents(n: number): Patent[] {
  return Array.from({ length: n }, (_, i) => ({
    title: `Distributed cache coherency protocol for ${TOPICS[i % TOPICS.length]}`,
    number: `US 11,2${34 + i},567`,
    office: "USPTO",
    date: `${2019 + (i % 6)}-06`,
    link: `https://patents.google.com/patent/US112${34 + i}567`,
  }));
}

function additionalItems(n: number): AdditionalItem[] {
  return Array.from({ length: n }, (_, i) => ({
    title: `Conference talk: scaling ${TOPICS[i % TOPICS.length]}`,
    subtitle: `${["QCon", "SREcon", "KubeCon", "Strange Loop"][i % 4]} ${2019 + (i % 6)}`,
    date: `${2019 + (i % 6)}-09`,
    bullets: [
      `Presented the ${TOPICS[i % TOPICS.length]} rewrite to an audience of ${200 + i * 40} engineers.`,
      `Published the accompanying reference implementation and benchmark harness.`,
    ],
  }));
}

const LANGUAGES: Language[] = [
  { name: "English", level: "Native" },
  { name: "Spanish", level: "Fluent" },
  { name: "Portuguese", level: "Professional" },
  { name: "German", level: "Intermediate" },
  { name: "Japanese", level: "Basic" },
];

/** 1×1 transparent PNG — enough for the avatar slot on `showAvatar` themes
 * without checking a binary headshot into the repo. */
export const PLACEHOLDER_PHOTO =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const SECTIONS = {
  summary:
    "Staff-level backend engineer with 14 years building resilient payment, identity, and data infrastructure for companies between Series B and public. Comfortable owning a system from the capacity model through the on-call rotation, and equally comfortable handing it to the team that will run it next. Most recent work: a ledger rewrite that moved 40M daily postings off a monolith with no customer-visible downtime.",
  keyAchievements: [
    "Cut infrastructure spend by 22% through a ground-up migration to spot instances and right-sized reservations",
    "Grew the platform team from 3 to 12 engineers over two years and kept attrition at zero",
    "Took the payments ledger from 4 incidents a quarter to 4 in two years",
    "Shipped the multi-region failover design now used by every tier-1 service in the company",
    "Authored the internal migration guide adopted by 9 teams for their own monolith extractions",
    "Reduced median deploy time from 38 minutes to under 6 across the whole backend fleet",
  ],
  education: education(count(4)),
  experience: experience(count(11), 6, 2025),
  internships: experience(count(3), 4, 2012).map((e, i) => ({
    ...e,
    role: "Software Engineering Intern",
    company: COMPANIES[(i + 7) % COMPANIES.length],
    current: false,
    endDate: `${2012 - i * 2}-08`,
  })),
  partTime: experience(count(2), 3, 2009).map((e, i) => ({
    ...e,
    role: i === 0 ? "Teaching Assistant, Operating Systems" : "Circulation Assistant",
    company: i === 0 ? "University of Illinois Urbana-Champaign" : "Campus Library",
    current: false,
    endDate: `${2009 - i * 2}-05`,
  })),
  projects: projects(count(7)),
  skills: [
    "TypeScript", "Go", "Rust", "Python", "Java", "Kubernetes", "Terraform", "PostgreSQL",
    "Kafka", "Redis", "gRPC", "GraphQL", "AWS", "GCP", "Datadog", "OpenTelemetry",
    "ClickHouse", "Spark", "Airflow", "Envoy", "Vault", "Bazel",
  ],
  certifications: certifications(count(5)),
  patents: patents(count(3)),
  languages: LANGUAGES,
  hobbies: [
    "Long-distance cycling", "Analog photography", "Bread baking", "Trail running",
    "Chess", "Woodworking", "Birding",
  ],
  softSkills: [
    "Technical writing", "Incident command", "Mentoring", "Cross-team facilitation",
    "Hiring and interview design", "Roadmap negotiation",
  ],
  additional: {
    heading: "Talks & publications",
    items: additionalItems(count(4)),
  },
};

function completeStatus(): Record<string, SectionStatus> {
  const status: Record<string, SectionStatus> = { basicInfo: "complete", photo: "complete" };
  for (const key of Object.keys(SECTIONS) as SectionKey[]) status[key] = "complete";
  return status;
}

/** The full fixture, with every section filled, for one template. */
export function makeLongResume(templateId: string): ResumeData {
  return {
    basicInfo: {
      name: "Alexandra Montgomery-Whitfield",
      email: "alexandra.montgomery@example.com",
      phone: "5550100199",
      phoneCountryCode: "+1",
      location: "San Francisco, California",
      links: {
        linkedin: "linkedin.com/in/alexandra-montgomery",
        github: "github.com/alexandra",
        portfolio: "alexandra.dev",
      },
    },
    photo: PLACEHOLDER_PHOTO,
    sections: structuredClone(SECTIONS),
    sectionStatus: completeStatus(),
    templateId,
  };
}
