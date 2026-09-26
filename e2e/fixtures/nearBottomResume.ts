import type { ResumeData } from "@/lib/types";
import { PLACEHOLDER_PHOTO } from "./longResume";

/**
 * A resume rebuilt from a real user's download that came out with a blank
 * last page on Ledger: long, repetitive bullets, a photo, every section on.
 * Its size is what matters, not its words — tests grow it a line at a time to
 * park the end of the last page just above the bottom margin.
 */
const P = "Removed the extra top/bottom sheet pads — they were stacking on the template’s own padding and making the sidebar fill look different on page 1 vs later pages. Rail leftover fill still matches the 34% column. Refresh to check.";
const LONG = P + P.slice(0, 150);
const rep = (n: number) => Array.from({ length: n }, () => P);
export const nearBottomResume = (templateId: string): ResumeData => ({
  templateId,
  photo: PLACEHOLDER_PHOTO,
  basicInfo: { name: "harideep reddy suram", email: "harideepreddysuram@gmail.com", phone: "5346364574574", phoneCountryCode: "+1", location: "kavali", links: {} },
  sections: {
    summary: P + P + P + P.slice(0, 120),
    keyAchievements: rep(4),
    experience: [
      { role: "Accountant", company: "wefergerg", startDate: "", bullets: [LONG, P] },
      { role: "Accountant", company: "efwefwg", startDate: "", bullets: [LONG, P, P, P, "SGE"] },
      { role: "Accountant", company: "wefwefwgrerg", startDate: "", bullets: [LONG, P, LONG, LONG, P] },
    ],
    internships: [
      { role: "Real Estate Agent", company: "ergergerge", startDate: "", bullets: [LONG, P, P] },
      { role: "Analytics Engineer", company: "sdfserg" + P.slice(0, 160), startDate: "", bullets: [P, P, P, LONG] },
    ],
    partTime: [{ role: "Account Manager", company: "rgergerg", startDate: "", bullets: [LONG, P, P] }],
    projects: [
      { name: "efetrtrt", description: "wergergergaererbaerbarbaevafbaebrerb" + P + P, technologies: ["A/B Testing", "Active Directory", "Adobe Illustrator"] },
      { name: "wefawrgear", description: P + P + P.slice(0, 190), technologies: [".NET", "3D Modeling", "A/B Testing", "Active Directory", "Adobe Illustrator"] },
      { name: "wevwverb", description: P + P + P.slice(0, 190) },
      { name: "efwrgerg", description: P + P },
    ],
    education: [
      { institution: "wefwrger", degree: "A.A.", fieldOfStudy: "ergeb", startDate: "" },
      { institution: "abetbaet", degree: "Associate of Applied Science", fieldOfStudy: "arerbae", startDate: "" },
      { institution: "argaeraerberb", degree: "A.A.S.", startDate: "" },
    ],
    skills: ["3D Modeling", "A/B Testing", "Active Directory", "Adobe Illustrator", "Adobe InDesign", "Adobe Photoshop", "Adobe XD", "Agile", "Airflow", "Android", "Angular", ".NET", "Ansible", "Apache Spark", "ArchiCAD", "AutoCAD", "AWS"],
    certifications: [
      { name: "AWS Certified Cloud Practitioner", issuer: "Amazon Web Services", date: "" },
      { name: "AWS Certified Developer", issuer: "American Heart Association", date: "" },
      { name: "AWS Certified Developer", issuer: "American Heart Association", date: "" },
    ],
    patents: [{ title: "svaefaefbeab", number: "wrgwrwrbrwb", office: "wrvawrgwrgrwgwrb" }],
    languages: [
      { name: "American Sign Language", level: "Fluent" },
      { name: "American Sign Language", level: "Fluent" },
      { name: "American Sign Language", level: "Fluent" },
    ],
    hobbies: ["Camping", "Chess", "Cooking", "Cycling", "Dance", "Film", "Gardening", "Basketball", "Hiking", "Music", "Painting", "Photography-", "Reading", "Running", "Astronomy", "Soccer", "Swimming", "Tennis", "Theater", "Travel", "Volunteering", "Woodworking", "Yoga-", "wegewrg", "wegnwge", "Writing"],
    softSkills: ["Coaching", "Collaboration", "Communication", "Conflict Resolution", "Creativity", "Attention to Detail", "Critical Thinking", "Customer Service", "Decision Making", "Emotional Intelligence"],
  },
  sectionStatus: Object.fromEntries(["summary", "keyAchievements", "experience", "internships", "partTime", "projects", "education", "skills", "certifications", "patents", "languages", "hobbies", "softSkills"].map((k) => [k, "complete"])),
});

