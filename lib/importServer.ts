import { callGroqChat, extractJsonObject, jsonResponse, type OptimizeEnv } from "./optimizeServer";
import { MAX_RESUME_CHARS, MIN_RESUME_CHARS } from "./resumeImport/limits";
import { normalizeParsedResume, type ImportedResume } from "./resumeImport/normalize";

const IMPORT_SYSTEM_PROMPT = `You extract structured resume data. Never invent employers, titles, dates, skills, or facts that are not in the input. Omit empty fields. Return strict JSON with this shape:
{
  "basicInfo": {
    "name": "",
    "email": "",
    "phone": "",
    "phoneCountryCode": "+1",
    "location": "",
    "links": { "linkedin": "", "github": "", "portfolio": "" }
  },
  "summary": "",
  "keyAchievements": ["..."],
  "experience": [{"company":"","role":"","startDate":"YYYY-MM","endDate":"YYYY-MM","current":false,"bullets":["..."]}],
  "internships": [{"company":"","role":"","startDate":"YYYY-MM","endDate":"YYYY-MM","current":false,"bullets":["..."]}],
  "partTime": [{"company":"","role":"","startDate":"YYYY-MM","endDate":"YYYY-MM","current":false,"bullets":["..."]}],
  "education": [{"institution":"","degree":"","fieldOfStudy":"","startDate":"YYYY-MM","endDate":"YYYY-MM","gpa":"","coursework":["..."]}],
  "projects": [{"name":"","description":"","link":"","technologies":["..."]}],
  "skills": ["..."],
  "certifications": [{"name":"","issuer":"","date":"YYYY-MM"}],
  "patents": [{"title":"","number":"","date":"YYYY-MM","office":"","link":""}],
  "languages": [{"name":"","level":"Native|Fluent|Professional|Intermediate|Basic"}],
  "hobbies": ["..."],
  "softSkills": ["..."],
  "additional": {"heading":"","items":[{"title":"","subtitle":"","date":"","bullets":["..."]}]}
}

Map section headings by meaning, including synonyms:
- Work History, Employment, Professional Experience → experience
- Internships, Co-op, Industrial Training → internships
- Part-time, Campus jobs → partTime
- Academic Background, Qualifications → education
- Technical Skills, Core Competencies, Tools, Tech Stack, Programming Languages → skills
- Profile, About Me, Objective, Professional Summary → summary
- Achievements, Highlights, Accomplishments → keyAchievements
- Licenses, Certificates, Credentials → certifications
- Spoken Languages, Language Proficiency (not programming languages) → languages
- Interests, Activities → hobbies
- Interpersonal / People skills → softSkills
- Volunteer, Publications, Awards, Affiliations, Research → additional (keep the original heading)

Split mixed work history: intern/co-op roles go in internships, part-time jobs in partTime, full-time in experience.
phone is digits only; phoneCountryCode is an E.164 dial code like "+1" or "+91".
Dates are YYYY-MM. Use current:true and omit endDate for ongoing roles.
Language levels must be one of Native, Fluent, Professional, Intermediate, Basic.
Do not copy References.`;

export function parseImportBody(body: unknown): { text: string } | { error: string } {
  const text = (body as { text?: unknown } | null)?.text;
  if (typeof text !== "string") return { error: "Invalid resume text." };
  const trimmed = text.trim();
  if (trimmed.length < MIN_RESUME_CHARS) return { error: "That resume is too short to parse." };
  return { text: trimmed.slice(0, MAX_RESUME_CHARS) };
}

export function parseImportedResumeContent(content: string | undefined): ImportedResume | null {
  if (!content) return null;
  const jsonText = extractJsonObject(content);
  if (!jsonText) return null;
  try {
    const parsed = JSON.parse(jsonText) as unknown;
    const resume = normalizeParsedResume(parsed);
    return resume.filled.length > 0 ? resume : null;
  } catch {
    return null;
  }
}

export async function handleImportPost(request: Request, env: OptimizeEnv): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request body." }, 400);
  }

  const parsed = parseImportBody(body);
  if ("error" in parsed) return jsonResponse({ error: parsed.error }, 400);

  const result = await callGroqChat(env, IMPORT_SYSTEM_PROMPT, `Resume text:\n${parsed.text}`, {
    temperature: 0.1,
    maxCompletionTokens: 6000,
    missingKeyError:
      "Resume import isn't configured. Add GROQ_API_KEY to .env.local (local) or as a Cloudflare Worker secret (production).",
  });
  if ("error" in result) return jsonResponse({ error: result.error }, result.status);

  const resume = parseImportedResumeContent(result.content);
  if (!resume) return jsonResponse({ error: "AI response was malformed. Try again." }, 502);
  return jsonResponse({ resume }, 200);
}
