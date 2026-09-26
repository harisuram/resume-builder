import { zipSync, strToU8 } from "fflate";
import type { SectionKey } from "@/lib/types";

/**
 * Fictional resumes for the import tests, written the way real ones are:
 * headings worded differently from the builder's section names ("Career
 * Objective", "Employment History", "Languages Known"), dates in mixed
 * formats, Word bullets that come from list numbering rather than a typed
 * "•", and one two-column PDF. Every name, company, address and link is
 * invented; links use handles checked unregistered or example.com.
 */

export interface DummyBlock {
  /** Heading as it appears in the file. */
  heading: string;
  /** An entry: a title line, a sub line (company · dates), then bullets. */
  entries?: { title: string; sub?: string; bullets?: string[] }[];
  /** Plain lines (summary paragraph, skill list…). */
  lines?: string[];
}

export interface DummyResume {
  id: string;
  format: "pdf" | "docx";
  /** Two-column layout (PDF only): `side` blocks render in a left rail. */
  twoColumn?: boolean;
  name: string;
  contact: string[];
  blocks: DummyBlock[];
  side?: DummyBlock[];
  /** What the import must produce. */
  expect: {
    basicInfo: { name: string; email: string; phone: string; location: string; linkedin?: string; github?: string; portfolio?: string };
    /** Each string must appear (case-insensitive) somewhere in that section. */
    sections: Partial<Record<SectionKey, string[]>>;
  };
}

export const DUMMY_RESUMES: DummyResume[] = [
  {
    id: "priya-data-analyst",
    format: "pdf",
    name: "Priya Raghavan",
    contact: [
      "Pune, Maharashtra",
      "priya.raghavan@example.com",
      "+91 98200 01234",
      "linkedin.com/in/priya-raghavan-sample",
      "github.com/priya-raghavan-sample",
    ],
    blocks: [
      {
        heading: "Professional Summary",
        lines: [
          "Data analyst with 5 years turning messy operational data into dashboards that finance and supply-chain teams use every week.",
        ],
      },
      {
        heading: "Work History",
        entries: [
          {
            title: "Senior Data Analyst",
            sub: "Tamarind Retail Analytics | Jan 2022 – Present",
            bullets: [
              "Built a demand-forecasting model that cut stock-outs by 18% across 40 stores",
              "Automated the weekly sales report, saving 6 analyst hours a week",
            ],
          },
          {
            title: "Data Analyst",
            sub: "Kestrel Point Logistics | 06/2019 – 12/2021",
            bullets: ["Designed Power BI dashboards for 12 regional managers"],
          },
        ],
      },
      {
        heading: "Academic Background",
        entries: [{ title: "Savitribai Phule Pune University", sub: "B.Sc. Statistics | 2015 – 2018" }],
      },
      { heading: "Technical Skills", lines: ["SQL, Python, Power BI, Excel, Tableau"] },
      {
        heading: "Trainings & Certifications",
        lines: ["Microsoft Certified: Power BI Data Analyst Associate — Microsoft — 2023"],
      },
      { heading: "Languages Known", lines: ["English – Fluent", "Hindi – Native", "Marathi – Native"] },
      { heading: "Hobbies & Interests", lines: ["Carnatic music, Trekking"] },
    ],
    expect: {
      basicInfo: {
        name: "Priya Raghavan",
        email: "priya.raghavan@example.com",
        phone: "9820001234",
        location: "Pune",
        linkedin: "priya-raghavan-sample",
        github: "priya-raghavan-sample",
      },
      sections: {
        summary: ["dashboards that finance and supply-chain teams"],
        experience: ["Senior Data Analyst", "Tamarind Retail Analytics", "stock-outs by 18%", "Kestrel Point Logistics", "Power BI dashboards for 12"],
        education: ["Savitribai Phule Pune University", "Statistics"],
        skills: ["SQL", "Python", "Power BI", "Tableau"],
        certifications: ["Power BI Data Analyst Associate"],
        languages: ["English", "Hindi", "Marathi"],
        hobbies: ["Trekking"],
      },
    },
  },
  {
    id: "daniel-pharmacist",
    format: "docx",
    name: "Daniel Okafor-Hale",
    contact: ["Leeds, United Kingdom", "daniel.okaforhale@example.com", "+44 7700 900123", "danielokaforhale.example.com"],
    blocks: [
      {
        heading: "CAREER OBJECTIVE",
        lines: ["Registered pharmacist seeking a clinical role where medicines optimisation improves patient outcomes on busy wards."],
      },
      {
        heading: "EMPLOYMENT HISTORY",
        entries: [
          {
            title: "Clinical Pharmacist",
            sub: "Wrenfield Community Hospital, March 2021 - Present",
            bullets: [
              "Reviewed medication charts for 30 inpatients a day",
              "Led antimicrobial stewardship rounds that reduced broad-spectrum use by 12%",
            ],
          },
          {
            title: "Pharmacy Intern",
            sub: "Corvid Health Pharmacy, July 2019 - June 2020",
            bullets: ["Dispensed prescriptions under supervision and counselled patients"],
          },
        ],
      },
      {
        heading: "EDUCATION & TRAINING",
        entries: [{ title: "University of Bradford", sub: "Master of Pharmacy (MPharm), 2015 - 2019" }],
      },
      { heading: "CORE COMPETENCIES", lines: ["Medicines reconciliation", "Clinical audit", "Antimicrobial stewardship"] },
      { heading: "STRENGTHS", lines: ["Clear communicator", "Calm under pressure"] },
      {
        heading: "VOLUNTEERING",
        entries: [{ title: "Community Health Volunteer", sub: "Leeds Food Bank, 2018 - 2020", bullets: ["Ran monthly blood-pressure checks"] }],
      },
    ],
    expect: {
      basicInfo: {
        name: "Daniel Okafor-Hale",
        email: "daniel.okaforhale@example.com",
        phone: "7700900123",
        location: "Leeds",
        portfolio: "danielokaforhale.example.com",
      },
      sections: {
        summary: ["medicines optimisation"],
        experience: ["Clinical Pharmacist", "Wrenfield Community Hospital", "antimicrobial stewardship rounds"],
        internships: ["Pharmacy Intern", "Corvid Health Pharmacy"],
        education: ["University of Bradford", "Pharmacy"],
        skills: ["Medicines reconciliation", "Clinical audit"],
        softSkills: ["Clear communicator", "Calm under pressure"],
        additional: ["Community Health Volunteer", "blood-pressure checks"],
      },
    },
  },
  {
    id: "mei-architect-two-column",
    format: "pdf",
    twoColumn: true,
    name: "Mei Lindqvist-Tan",
    contact: ["Singapore", "mei.lindqvisttan@example.com", "+65 8123 4567", "linkedin.com/in/mei-lindqvist-tan-sample"],
    side: [
      { heading: "Key Skills", lines: ["Revit", "Rhino", "AutoCAD", "Passive design"] },
      { heading: "Languages", lines: ["English (Fluent)", "Mandarin (Native)"] },
      { heading: "Personal Interests", lines: ["Urban sketching", "Bouldering"] },
    ],
    blocks: [
      {
        heading: "About Me",
        lines: ["Architect focused on low-carbon housing, from feasibility studies through to site delivery."],
      },
      {
        heading: "Professional Experience",
        entries: [
          {
            title: "Project Architect",
            sub: "Studio Halde, Aug 2020 – Present",
            bullets: ["Delivered a 120-unit timber housing block 4 weeks ahead of programme", "Coordinated 9 consultants through BIM reviews"],
          },
        ],
      },
      {
        heading: "Internship Experience",
        entries: [{ title: "Architectural Intern", sub: "Linden & Vale Architects, May 2018 – Aug 2018", bullets: ["Produced planning drawings for two schools"] }],
      },
      {
        heading: "Academic Credentials",
        entries: [{ title: "National University of Singapore", sub: "Master of Architecture, 2016 – 2020" }],
      },
      { heading: "Awards & Honours", lines: ["Young Architect Prize — Singapore Design Council — 2022"] },
      { heading: "Patents", lines: ["Modular timber joint system — SG 10202201234Q — 2023"] },
    ],
    expect: {
      basicInfo: {
        name: "Mei Lindqvist-Tan",
        email: "mei.lindqvisttan@example.com",
        phone: "81234567",
        location: "Singapore",
        linkedin: "mei-lindqvist-tan-sample",
      },
      sections: {
        summary: ["low-carbon housing"],
        experience: ["Project Architect", "Studio Halde", "120-unit timber housing"],
        internships: ["Architectural Intern", "Linden & Vale"],
        education: ["National University of Singapore", "Architecture"],
        skills: ["Revit", "Rhino", "AutoCAD"],
        languages: ["English", "Mandarin"],
        hobbies: ["Urban sketching", "Bouldering"],
        patents: ["Modular timber joint system"],
      },
    },
  },
];

/* ------------------------------------------------------------------ HTML */

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function blockHtml(block: DummyBlock): string {
  const entries = (block.entries ?? [])
    .map(
      (e) =>
        `<div class="entry"><p class="t">${esc(e.title)}</p>${e.sub ? `<p class="s">${esc(e.sub)}</p>` : ""}${
          e.bullets?.length ? `<ul>${e.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""
        }</div>`,
    )
    .join("");
  const lines = (block.lines ?? []).map((l) => `<p>${esc(l)}</p>`).join("");
  return `<section><h2>${esc(block.heading)}</h2>${entries}${lines}</section>`;
}

/** Printable HTML for a PDF fixture (rendered with page.pdf()). */
export function dummyResumeHtml(resume: DummyResume): string {
  const main = resume.blocks.map(blockHtml).join("");
  const side = (resume.side ?? []).map(blockHtml).join("");
  const body = resume.twoColumn
    ? `<div class="cols"><aside>${side}</aside><main>${main}</main></div>`
    : main;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: A4; margin: 18mm 16mm; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 10.5pt; color: #111; }
    h1 { font-size: 22pt; margin: 0 0 4pt; }
    .contact { color: #444; margin: 0 0 12pt; }
    h2 { font-size: 11pt; text-transform: uppercase; letter-spacing: .06em; border-bottom: 1px solid #999; margin: 12pt 0 5pt; }
    p { margin: 0 0 3pt; } .t { font-weight: bold; } .s { color: #444; }
    ul { margin: 2pt 0 6pt 16pt; padding: 0; } .entry { margin-bottom: 6pt; }
    .cols { display: flex; gap: 18pt; } aside { width: 32%; } main { flex: 1; }
  </style></head><body><h1>${esc(resume.name)}</h1><p class="contact">${resume.contact.map(esc).join(" &nbsp;|&nbsp; ")}</p>${body}</body></html>`;
}

/* ------------------------------------------------------------------ DOCX */

const run = (text: string, bold = false) =>
  `<w:r>${bold ? "<w:rPr><w:b/></w:rPr>" : ""}<w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
const para = (text: string, bold = false) => `<w:p>${run(text, bold)}</w:p>`;
/** A real Word bullet: list numbering, no "•" in the text itself. */
const bullet = (text: string) => `<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr>${run(text)}</w:p>`;

/** A minimal but valid .docx (document, styles-free, one bullet list). */
export function dummyResumeDocx(resume: DummyResume): Uint8Array {
  const body = [
    para(resume.name, true),
    para(resume.contact.join(" | ")),
    ...resume.blocks.flatMap((block) => [
      para(block.heading, true),
      ...(block.entries ?? []).flatMap((e) => [para(e.title, true), ...(e.sub ? [para(e.sub)] : []), ...(e.bullets ?? []).map(bullet)]),
      ...(block.lines ?? []).map((l) => para(l)),
    ]),
  ].join("");
  const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
  return zipSync({
    "[Content_Types].xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/></Types>`,
    ),
    "_rels/.rels": strToU8(
      `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
    ),
    "word/_rels/document.xml.rels": strToU8(
      `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/></Relationships>`,
    ),
    "word/numbering.xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8"?><w:numbering ${W}><w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>`,
    ),
    "word/document.xml": strToU8(`<?xml version="1.0" encoding="UTF-8"?><w:document ${W}><w:body>${body}</w:body></w:document>`),
  });
}
