import type { Guide } from "../types";

export const guide: Guide = {
  slug: "how-to-write-work-experience-bullet-points",
  title: "How to Write Work Experience Bullet Points That Get Read",
  description:
    "Turn duty lists into achievement bullets: a clear structure, ways to show impact without hard numbers, tense rules, and before-and-after examples by field.",
  category: "Writing",
  published: "2026-10-06",
  updated: "2026-10-06",
  intro:
    "Your experience section is where a recruiter decides whether you can actually do the job, and it is built almost entirely from bullet points. Most people write those bullets as a list of duties copied from their job description. That tells the reader what you were supposed to do, not what you did or how well. This guide shows how to write bullets that show results, including when you do not have neat numbers, with rewrites from several fields.",
  sections: [
    {
      heading: "Why duty lists don’t work",
      blocks: [
        {
          type: "p",
          text: "“Responsible for managing social media accounts” describes the job, not the person in it. Everyone who has held that title could write the same line, whether they doubled engagement or let the accounts go quiet for months. The person reading your resume is trying to tell those two candidates apart, and duty bullets give them nothing to go on.",
        },
        {
          type: "p",
          text: "Achievement bullets solve that by answering three questions: what did you do, how did you do it, and what changed because you did it. You will not have a dramatic result for every line, and that is fine. The aim is to move each bullet as far as honestly possible from “I was there” towards “this is what I made happen”.",
        },
      ],
    },
    {
      heading: "The structure: action, task, result",
      blocks: [
        {
          type: "p",
          text: "A dependable pattern for a bullet is: strong action verb + what you did (with scope or method) + the result or why it mattered. You will see this called various names, including the XYZ formula and CAR (challenge, action, result). The labels don’t matter; the ingredients do.",
        },
        {
          type: "ol",
          items: [
            "Start with a verb that says what you did: built, reduced, negotiated, launched, trained, redesigned. Not “responsible for”, “helped with” or “worked on”.",
            "Say what you did it to, and add the detail that shows scale or difficulty: how many customers, which system, what budget, for which team.",
            "Finish with the outcome: what got faster, cheaper, more accurate, bigger, safer or easier, or what the work enabled someone else to do.",
          ],
        },
        {
          type: "compare",
          weak: "Responsible for handling customer complaints.",
          strong:
            "Resolved escalated billing complaints for a 40,000-customer broadband region, rewriting the refund script so first-call resolution improved and repeat calls dropped.",
          note: "The rewrite starts with a verb, gives scale, and states an outcome. If you do not know the exact improvement, describe the direction honestly rather than inventing a percentage.",
        },
        {
          type: "p",
          text: "Not every bullet needs all three parts. Sometimes the action and scope are impressive enough on their own (“Managed a 12-person night shift across two production lines”). But if a bullet has neither scope nor result, it is probably a duty, and worth another look.",
        },
      ],
    },
    {
      heading: "How to show impact when you don’t have numbers",
      blocks: [
        {
          type: "p",
          text: "Numbers help because they are specific and checkable, but plenty of jobs don’t produce clean metrics, and invented ones are worse than none. An interviewer will ask how you measured “improved efficiency by 37%”, and you need an answer. Here are honest ways to show impact without precise figures:",
        },
        {
          type: "ul",
          items: [
            "Scale: how many people, accounts, sites, products, transactions, patients or students your work touched. “Supported 25 field engineers” is a number you know.",
            "Frequency and volume: daily, weekly, per shift. “Processed 60–80 purchase orders a week” shows workload.",
            "Before and after in words: “replaced a manual spreadsheet process with an automated report” or “cut the approval process from three sign-offs to one”.",
            "Time saved, estimated reasonably: if a task used to take a day and now takes an hour, you can say so.",
            "Who relied on it: “adopted by the regional sales team”, “used as the template for all new client onboarding”.",
            "Recognition: chosen for a project, promoted, asked to train others, given an award, entrusted with a key client.",
            "Firsts and onlys: the first person to do something, the only one on the team certified in a system.",
            "Risk or quality: zero safety incidents over a period, audit passed without findings, error rates going down.",
          ],
        },
        {
          type: "tip",
          text: "Before writing bullets, spend twenty minutes digging. Old performance reviews, emails thanking you, project reports, dashboards and your own sent folder are full of numbers and outcomes you have forgotten.",
        },
      ],
    },
    {
      heading: "Tense, voice and style",
      blocks: [
        {
          type: "ul",
          items: [
            "Use past tense for previous jobs and for completed achievements in your current job (“Launched…”, “Reduced…”).",
            "Use present tense for ongoing responsibilities in your current job (“Manage a team of six…”, “Own the monthly forecast…”). Mixing within one role is fine as long as each bullet is internally consistent.",
            "Drop the pronoun. Write “Built…” not “I built…”.",
            "Prefer active voice. “Was tasked with” and “was involved in” hide who did the work.",
            "Keep each bullet to one or two lines on the page. If it runs to three, split it or cut the least important clause.",
            "Be consistent with punctuation: either every bullet ends with a full stop or none do.",
            "Spell out abbreviations the first time unless they are standard in the target industry (SQL, GST and ICU usually are; your company’s internal project codenames are not).",
          ],
        },
      ],
    },
    {
      heading: "How many bullets per role",
      blocks: [
        {
          type: "p",
          text: "There is no fixed rule, but a sensible pattern is to give the most space to the most recent and most relevant roles.",
        },
        {
          type: "ul",
          items: [
            "Current or most recent role: four to six bullets.",
            "The role before that: three to five bullets.",
            "Older roles: one to three bullets, or just the title, company and dates if they are more than about ten years old or unrelated.",
            "Internships and short contracts: one to three bullets.",
          ],
        },
        {
          type: "p",
          text: "Order the bullets within each role by importance to the job you are applying for, not by how much time each task took. Your biggest achievement should be the first bullet, because a reader who is skimming may not get past the first two or three. If you have held several roles at one company, list the company once and each title beneath it with its own dates and bullets, which shows progression clearly.",
        },
      ],
    },
    {
      heading: "Weak vs strong: rewrites across fields",
      blocks: [
        {
          type: "p",
          text: "Each rewrite below keeps to what someone in that role could plausibly know and defend. Use them for the pattern, not the wording.",
        },
        {
          type: "compare",
          weak: "Worked on the backend of the company’s mobile app.",
          strong:
            "Rebuilt the order-history API in Go with pagination and caching, cutting response times on the app’s most-used screen from several seconds to under half a second.",
          note: "Software: name the component, the technique, and a measurable change you observed in monitoring.",
        },
        {
          type: "compare",
          weak: "Took care of patients in the ward.",
          strong:
            "Cared for five to seven post-surgical patients per shift on a 28-bed orthopaedic ward, including wound care, pain management and discharge teaching.",
          note: "Nursing: patient load, setting and specific clinical tasks give the reader scope even without an outcome metric.",
        },
        {
          type: "compare",
          weak: "Handled accounts payable.",
          strong:
            "Processed around 400 vendor invoices a month in Tally and introduced a weekly three-way match check that caught duplicate and over-billed invoices before payment.",
          note: "Accounting: volume, system, and a control you introduced show judgement as well as workload.",
        },
        {
          type: "compare",
          weak: "Responsible for sales in the Pune region.",
          strong:
            "Grew the Pune territory from 18 to 31 active dealer accounts in two years by targeting tier-2 towns the previous team had not covered; finished 112% of annual target in FY25.",
          note: "Sales: numbers are usually available, so use them. Targets, territory size and account growth all count.",
        },
        {
          type: "compare",
          weak: "Taught mathematics to high school students.",
          strong:
            "Taught Class 11 and 12 mathematics to four sections of about 40 students each, and introduced weekly diagnostic quizzes that let me group students for targeted revision before board exams.",
          note: "Teaching: class size and level give scope; a method you introduced shows initiative.",
        },
        {
          type: "compare",
          weak: "Was part of the team that organised company events.",
          strong:
            "Coordinated logistics for the annual dealer conference of 300 attendees, managing venue, travel and three vendors within the approved budget.",
          note: "Operations or admin: replace “was part of” with what you personally owned.",
        },
        {
          type: "compare",
          weak: "Helped with social media marketing.",
          strong:
            "Planned and published the brand’s Instagram calendar of four posts a week, and tested short-form video against static posts; video became the default format after consistently higher reach.",
          note: "Marketing: show the decision your work informed, not just the activity.",
        },
        {
          type: "compare",
          weak: "Did quality checks on production line.",
          strong:
            "Performed in-process inspection on a CNC machining line and traced a recurring dimensional defect to tool wear, leading to a revised tool-change interval and fewer rejected batches.",
          note: "Manufacturing: problem, root cause, fix. Quality roles are full of these stories.",
        },
      ],
    },
    {
      heading: "Strong action verbs, grouped by what you did",
      blocks: [
        {
          type: "p",
          text: "Pick the verb that accurately describes your contribution. Overstating (“spearheaded” when you contributed) is easy to catch in interviews. Vary your verbs so the section doesn’t read as a column of “managed”.",
        },
        {
          type: "ul",
          items: [
            "Building and creating: built, designed, developed, launched, created, established, set up, wrote, produced, introduced.",
            "Improving: reduced, increased, streamlined, automated, simplified, rebuilt, upgraded, redesigned, consolidated, standardised.",
            "Leading people: led, managed, mentored, trained, coached, hired, supervised, coordinated, delegated, onboarded.",
            "Analysing and deciding: analysed, assessed, identified, diagnosed, forecast, modelled, audited, evaluated, investigated, recommended.",
            "Selling and persuading: negotiated, won, secured, pitched, closed, expanded, retained, converted, partnered, presented.",
            "Delivering and operating: delivered, executed, maintained, processed, resolved, scheduled, shipped, administered, ran, fulfilled.",
            "Saving money or risk: cut, saved, recovered, prevented, renegotiated, reconciled, enforced, safeguarded, complied, mitigated.",
            "Communicating: documented, drafted, explained, briefed, reported, published, edited, translated, advised, facilitated.",
          ],
        },
        {
          type: "tip",
          text: "Watch for weak openers that slip in unnoticed: “responsible for”, “involved in”, “assisted with”, “worked on”, “handled”, “helped”. Each one usually hides a stronger, more specific verb.",
        },
      ],
    },
    {
      heading: "Tailoring bullets for each application",
      blocks: [
        {
          type: "p",
          text: "Keep a longer master list of bullets for every role, more than you would ever show at once. For each application, pick the ones that best match the job description and move the most relevant to the top. Where it is honest, use the same terms the ad uses: if it says “stakeholder management” and your bullet says “worked with business teams”, rephrase it. This helps both the human reader and the applicant tracking software that compares your resume against the ad.",
        },
        {
          type: "p",
          text: "If you are building your resume in this site’s builder, its optional “Make ATS-friendly” button can suggest reworded experience bullets. Treat any rewrite, from a tool or a friend, as a draft: check every claim is true and every number is one you can explain.",
        },
      ],
    },
  ],
  faqs: [
    {
      question: "How many bullet points should each job have?",
      answer:
        "Four to six for your most recent or most relevant role, three to five for the one before, and one to three for older or less relevant roles. Quality matters more than count: three strong bullets beat seven duty statements.",
    },
    {
      question: "Is it okay to estimate numbers on a resume?",
      answer:
        "A reasonable, defensible estimate is fine, and words like “around” or “about” keep it honest. Do not invent precise percentages you cannot explain. If an interviewer asks how you know, you should be able to describe where the figure came from.",
    },
    {
      question: "Should resume bullet points end with a full stop?",
      answer:
        "Either style is acceptable as long as you are consistent across the whole resume. Many people omit full stops because bullets are fragments, not full sentences. What looks careless is a mix of both.",
    },
    {
      question: "What if my job was routine and had no achievements?",
      answer:
        "Focus on scope, reliability and trust: the volume you handled, the accuracy you maintained, the systems you knew, the people you trained or supported, and any time you were chosen to cover or improve something. Routine jobs done well still show competence, and small improvements count.",
    },
  ],
  related: ["how-to-write-a-resume-summary", "tailor-resume-to-job-description", "resume-mistakes-to-avoid"],
};
