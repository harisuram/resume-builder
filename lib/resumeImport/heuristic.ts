import { MAX_CHIP_LENGTH } from "../validation";
import type { AdditionalItem, Education, Experience, Project } from "../types";
import {
  clip,
  extractDateRangeFromLine,
  normalizeParsedResume,
  parseLanguageLine,
  parseResumeMonth,
  splitChips,
  splitPhone,
  type ImportedResume,
} from "./normalize";
import { isLikelySectionHeading, resolveSectionHeading } from "./synonyms";

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const LINKEDIN_RE = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+\/?/i;
const GITHUB_RE = /(?:https?:\/\/)?(?:www\.)?github\.com\/[A-Za-z0-9_-]+\/?/i;
const URL_RE = /(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s|]*)?/i;
const LOCATION_RE = /\b([A-Z][A-Za-z.]+(?:,?\s+[A-Z][A-Za-z.]+){0,2},\s*(?:[A-Z]{2}|[A-Z][A-Za-z]+))\b/;

function linesOf(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\u00a0/g, " ").trimEnd())
    .map((line) => line.trim());
}

function isBullet(line: string): boolean {
  return /^([•●○◦▪▫–—\-*\u2022]|\d+[.)])\s+/.test(line);
}

function stripBullet(line: string): string {
  return line.replace(/^([•●○◦▪▫–—\-*\u2022]|\d+[.)])\s+/, "").trim();
}

interface SectionBlock {
  heading: string;
  body: string;
}

function splitIntoSections(text: string): { header: string; blocks: SectionBlock[] } {
  const lines = linesOf(text);
  const headingAt: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    if (isLikelySectionHeading(line) && resolveSectionHeading(line) !== "basicInfo") {
      headingAt.push(i);
    }
  }
  if (headingAt.length === 0) {
    return { header: lines.join("\n"), blocks: [] };
  }
  const header = lines.slice(0, headingAt[0]).join("\n");
  const blocks: SectionBlock[] = [];
  for (let i = 0; i < headingAt.length; i++) {
    const start = headingAt[i];
    const end = i + 1 < headingAt.length ? headingAt[i + 1] : lines.length;
    blocks.push({
      heading: lines[start],
      body: lines.slice(start + 1, end).join("\n").trim(),
    });
  }
  return { header, blocks };
}

function extractContact(header: string): ImportedResume["basicInfo"] {
  const emailMatch = header.match(EMAIL_RE);
  const linkedinMatch = header.match(LINKEDIN_RE);
  const githubMatch = header.match(GITHUB_RE);
  let portfolio: string | undefined;
  const urlMatch = header.match(URL_RE);
  if (urlMatch && !LINKEDIN_RE.test(urlMatch[0]) && !GITHUB_RE.test(urlMatch[0]) && !EMAIL_RE.test(urlMatch[0])) {
    portfolio = urlMatch[0].replace(/[.,;]+$/, "");
  }

  const phoneMatch = findPhone(header);
  const locationMatch = header.match(LOCATION_RE);

  const headerLines = linesOf(header).filter(Boolean);
  let name = "";
  for (const line of headerLines.slice(0, 4)) {
    if (EMAIL_RE.test(line) || line.includes("linkedin") || line.includes("github")) continue;
    if (findPhone(line)) continue;
    if (resolveSectionHeading(line)) continue;
    if (line.length < 2 || line.length > 80) continue;
    if (/https?:\/\//i.test(line)) continue;
    name = clip(line.split("|")[0] ?? line, 200);
    break;
  }

  return {
    name,
    email: emailMatch ? emailMatch[0] : "",
    ...splitPhone(phoneMatch ?? ""),
    location: locationMatch ? locationMatch[1] : "",
    links: {
      linkedin: linkedinMatch?.[0],
      github: githubMatch?.[0],
      portfolio,
    },
  };
}

function findPhone(text: string): string | undefined {
  const matches = text.match(/(?:\+\d{1,3}[\s.-]*)?(?:\(?\d{2,4}\)?[\s.-]*){1,3}\d{3,4}/g) ?? [];
  for (const match of matches) {
    const digits = match.replace(/\D/g, "");
    if (digits.length >= 10 && digits.length <= 15) return match;
  }
  return undefined;
}

function bodyLines(body: string): string[] {
  return linesOf(body).filter((line) => line.length > 0);
}

function splitEntries(body: string): string[] {
  const lines = linesOf(body);
  const chunks: string[][] = [[]];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const prev = chunks[chunks.length - 1];
    if (!line) {
      if (prev.length) chunks.push([]);
      continue;
    }
    const looksNew =
      prev.length > 0 &&
      !isBullet(line) &&
      (Boolean(extractDateRangeFromLine(line)) || (prev.some(isBullet) && !isBullet(line) && line.length < 80));
    if (looksNew) chunks.push([line]);
    else prev.push(line);
  }
  return chunks.map((c) => c.join("\n")).filter(Boolean);
}

const DATE_RANGE_STRIP =
  /\s*((?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+\d{4}|\d{4})\s*(?:–|—|-|to)\s*(?:present|current|now|ongoing|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+\d{4}|\d{4}).*$/i;

function parseExperienceBlock(block: string): Experience | null {
  const lines = bodyLines(block);
  if (!lines.length) return null;
  const bullets: string[] = [];
  const headers: string[] = [];
  for (const line of lines) {
    if (isBullet(line)) bullets.push(stripBullet(line));
    else headers.push(line);
  }
  const headerText = headers.join(" | ");
  const dates = extractDateRangeFromLine(headerText) ?? extractDateRangeFromLine(block);
  const rest = dates?.rest || headerText;
  const parts = rest
    .split(/\s*[|•·]\s*/)
    .map((p) => p.trim())
    .filter(Boolean);

  let role = "";
  let company = "";
  if (parts.length >= 2) {
    role = parts[0];
    company = parts[1];
  } else if (parts.length === 1) {
    const at = /^(.*?)\s+(?:at|@)\s+(.*)$/i.exec(parts[0]);
    const dash = /^(.*?)\s+[–—]\s+(.*)$/.exec(parts[0]);
    const comma = parts[0].split(/\s*,\s*/).map((p) => p.trim()).filter(Boolean);
    if (at) {
      role = at[1];
      company = at[2];
    } else if (dash) {
      role = dash[1];
      company = dash[2];
    } else if (comma.length >= 2) {
      role = comma[0];
      company = comma[1];
    } else if (headers.length >= 2) {
      role = headers[0];
      company = headers[1].replace(DATE_RANGE_STRIP, "").trim();
    } else {
      role = parts[0];
    }
  }
  role = clip(role, 200);
  company = clip(company, 200);
  if (!role && !company) return null;
  return {
    company: company || role,
    role: role || company,
    startDate: dates?.startDate ?? "",
    endDate: dates?.current ? undefined : dates?.endDate,
    current: dates?.current || undefined,
    bullets: bullets.map((b) => clip(b, 400)).filter(Boolean),
  };
}

function parseEducationBlock(block: string): Education | null {
  const lines = bodyLines(block);
  if (!lines.length) return null;
  const header = lines.filter((l) => !isBullet(l)).join(" | ");
  const dates = extractDateRangeFromLine(header);
  const rest = (dates?.rest || header).replace(/\s+/g, " ").trim();
  const gpaMatch = rest.match(/gpa[:\s]*([\d.]+(?:\s*\/\s*[\d.]+)?)/i);
  const withoutGpa = rest.replace(/gpa[:\s]*[\d.]+(?:\s*\/\s*[\d.]+)?/i, "").trim();
  const parts = withoutGpa
    .split(/\s*[|,•]\s*/)
    .map((p) => p.trim())
    .filter(Boolean);

  let institution = "";
  let degree = "";
  let fieldOfStudy: string | undefined;
  if (parts.length >= 2) {
    degree = parts[0];
    institution = parts[1];
    fieldOfStudy = parts[2];
  } else if (parts.length === 1) {
    const at = /^(.*?)\s+(?:at|from)\s+(.*)$/i.exec(parts[0]);
    if (at) {
      degree = at[1];
      institution = at[2];
    } else {
      institution = parts[0];
    }
  }
  const coursework = lines.filter(isBullet).flatMap((l) => splitChips(stripBullet(l), MAX_CHIP_LENGTH));
  institution = clip(institution, 200);
  degree = clip(degree, 200);
  if (!institution && !degree) return null;
  return {
    institution: institution || degree,
    degree: degree || institution,
    fieldOfStudy: fieldOfStudy ? clip(fieldOfStudy, 200) : undefined,
    startDate: dates?.startDate ?? "",
    endDate: dates?.endDate,
    gpa: gpaMatch?.[1],
    coursework: coursework.length ? coursework : undefined,
  };
}

function parseProjectBlock(block: string): Project | null {
  const lines = bodyLines(block);
  if (!lines.length) return null;
  const bullets = lines.filter(isBullet).map((l) => stripBullet(l));
  const headers = lines.filter((l) => !isBullet(l));
  const name = clip(headers[0] ?? "", 200);
  const linkLine = headers.find((h) => URL_RE.test(h) && h !== headers[0]);
  const description = clip(bullets.join(" ") || headers.slice(1).filter((h) => h !== linkLine).join(" "), 600);
  if (!name && !description) return null;
  const techLine = headers.find((h) => /tech|stack|built with/i.test(h));
  return {
    name: name || "Project",
    description: description || name,
    link: linkLine?.match(URL_RE)?.[0],
    technologies: techLine ? splitChips(techLine.replace(/^.*?:\s*/, ""), MAX_CHIP_LENGTH) : undefined,
  };
}

function parseAdditionalBlock(heading: string, body: string): AdditionalItem[] {
  return splitEntries(body).map((entry) => {
    const lines = bodyLines(entry);
    const bullets = lines.filter(isBullet).map((l) => stripBullet(l));
    const headers = lines.filter((l) => !isBullet(l));
    const dates = headers.map(extractDateRangeFromLine).find(Boolean);
    const title = clip(dates?.rest || headers[0] || heading, 200);
    return {
      title,
      subtitle: headers[1] && headers[1] !== headers[0] ? clip(headers[1], 200) : undefined,
      date: dates?.startDate ?? parseResumeMonth(headers.find((h) => parseResumeMonth(h) || "") ?? ""),
      bullets: bullets.map((b) => clip(b, 400)),
    };
  }).filter((item) => item.title);
}

/** Local, Groq-free parse used as the baseline (and as a fallback). */
export function parseResumeText(text: string): ImportedResume {
  const { header, blocks } = splitIntoSections(text);
  const basicInfo = extractContact(header);
  const imported: ImportedResume = { basicInfo, sections: {}, filled: [] };

  for (const block of blocks) {
    const resolved = resolveSectionHeading(block.heading);
    if (resolved === "skip") continue;
    if (!resolved || resolved === "basicInfo") {
      const items = parseAdditionalBlock(block.heading.replace(/:$/, ""), block.body);
      if (items.length) {
        const existing = imported.sections.additional;
        imported.sections.additional = {
          heading: existing?.heading || clip(block.heading.replace(/:$/, ""), 200),
          items: [...(existing?.items ?? []), ...items].slice(0, 16),
        };
      }
      continue;
    }
    switch (resolved) {
      case "summary": {
        const summary = clip(block.body.replace(/\n+/g, " "), 800);
        if (summary) imported.sections.summary = summary;
        break;
      }
      case "keyAchievements": {
        const items = bodyLines(block.body).map((l) => clip(stripBullet(l), 400)).filter(Boolean);
        if (items.length) imported.sections.keyAchievements = items;
        break;
      }
      case "skills":
      case "hobbies":
      case "softSkills": {
        const items = splitChips(block.body.replace(/\n/g, ", "), MAX_CHIP_LENGTH);
        if (items.length) imported.sections[resolved] = items;
        break;
      }
      case "experience":
      case "internships":
      case "partTime": {
        const items = splitEntries(block.body)
          .map(parseExperienceBlock)
          .filter((item): item is Experience => Boolean(item));
        if (items.length) imported.sections[resolved] = items;
        break;
      }
      case "education": {
        const items = splitEntries(block.body)
          .map(parseEducationBlock)
          .filter((item): item is Education => Boolean(item));
        if (items.length) imported.sections.education = items;
        break;
      }
      case "projects": {
        const items = splitEntries(block.body)
          .map(parseProjectBlock)
          .filter((item): item is Project => Boolean(item));
        if (items.length) imported.sections.projects = items;
        break;
      }
      case "certifications": {
        const items = splitEntries(block.body).map((entry) => {
          const line = bodyLines(entry).filter((l) => !isBullet(l)).join(" | ");
          const dates = extractDateRangeFromLine(line);
          const rest = (dates?.rest || line).split(/\s*[|,–—]\s*/).map((p) => p.trim()).filter(Boolean);
          const name = clip(rest[0] ?? "", 200);
          const issuer = clip(rest[1] ?? rest[0] ?? "", 200);
          if (!name) return null;
          return { name, issuer: issuer || name, date: dates?.startDate ?? parseResumeMonth(rest[2]) ?? "" };
        }).filter((item): item is NonNullable<typeof item> => Boolean(item));
        if (items.length) imported.sections.certifications = items;
        break;
      }
      case "patents": {
        const items = splitEntries(block.body).map((entry) => {
          const line = bodyLines(entry)[0] ?? "";
          const title = clip(line.split(/[|,–—]/)[0] ?? "", 200);
          if (!title) return null;
          const number = line.match(/\b((?:US|EP|WO)\s*\d[\d,]+)\b/i)?.[1];
          return { title, number };
        }).filter((item): item is NonNullable<typeof item> => Boolean(item));
        if (items.length) imported.sections.patents = items;
        break;
      }
      case "languages": {
        const items = bodyLines(block.body)
          .flatMap((l) => splitChips(stripBullet(l), 80))
          .map(parseLanguageLine)
          .filter((item): item is NonNullable<typeof item> => Boolean(item));
        if (items.length) imported.sections.languages = items;
        break;
      }
      case "additional": {
        const items = parseAdditionalBlock(block.heading.replace(/:$/, ""), block.body);
        if (items.length) {
          imported.sections.additional = {
            heading: clip(block.heading.replace(/:$/, ""), 200),
            items,
          };
        }
        break;
      }
    }
  }

  return normalizeParsedResume({ basicInfo: imported.basicInfo, sections: imported.sections });
}
