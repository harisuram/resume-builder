import type { Guide } from "../types";

export const guide: Guide = {
  slug: "software-engineer-resume-example",
  title: "Software Engineer Resume Example and Section-by-Section Guide",
  description:
    "A full sample resume for a mid-level software engineer, with each section explained and tips for freshers, senior engineers and career switchers.",
  category: "Examples",
  published: "2026-10-06",
  updated: "2026-10-06",
  intro:
    "Software engineering resumes are read by two very different audiences: a recruiter who may not know what Kafka is, and an engineer who will spot vague claims instantly. A good one satisfies both — clear enough to pass a quick screen, specific enough to survive a technical reader. Below is a full example for an engineer with about four years of experience, followed by what each section is doing and how to adjust it for your own level.",
  sections: [
    {
      heading: "The full sample resume",
      blocks: [
        {
          type: "p",
          text: "This is a one-page resume for a backend-leaning engineer applying to product companies. The person and companies are fictional; the structure and level of detail are what to copy.",
        },
        {
          type: "sample",
          title: "Header",
          lines: [
            "Arjun Mehta",
            "Software Engineer — Backend and Distributed Systems",
            "Hyderabad, India · +91 90000 12345 · arjun.mehta@example.com",
            "github.com/arjun-example · linkedin.com/in/arjun-mehta-example",
          ],
        },
        {
          type: "sample",
          title: "Summary",
          lines: [
            "Backend engineer with 4 years building payment and ledger services in Go and Java. Designed an idempotent payouts API handling around 2 million requests a day, led a Postgres-to-sharded-cluster migration with no customer-facing downtime, and mentor two junior engineers. Looking for backend or platform roles in fintech or infrastructure.",
          ],
        },
        {
          type: "sample",
          title: "Skills",
          lines: [
            "Languages: Go, Java, Python, SQL, TypeScript (working knowledge)",
            "Backend and data: PostgreSQL, Redis, Kafka, gRPC, REST, Elasticsearch",
            "Cloud and infrastructure: AWS (ECS, RDS, SQS, Lambda), Docker, Kubernetes, Terraform",
            "Practices: system design, observability (Prometheus, Grafana, OpenTelemetry), CI/CD, code review",
          ],
        },
        {
          type: "sample",
          title: "Experience",
          lines: [
            "Software Engineer II — Contoso Payments, Hyderabad · Jul 2023 – Present",
            "Designed and built an idempotent payouts API in Go serving around 2M requests/day, replacing a batch job and cutting merchant settlement time from next day to under 1 hour.",
            "Led migration of the ledger database from a single Postgres instance to a sharded cluster; planned dual-writes and backfill, completed with zero customer-facing downtime.",
            "Added distributed tracing with OpenTelemetry across 9 services, reducing time to locate the failing service in incidents from hours to minutes.",
            "Mentor 2 junior engineers; introduced a design-review template now used by 3 teams.",
            "Software Engineer — Fabrikam Retail Tech, Bengaluru · Aug 2021 – Jun 2023",
            "Built inventory sync service in Java (Spring Boot) and Kafka processing updates from 400+ stores, replacing nightly CSV uploads with near-real-time sync.",
            "Reduced p95 latency of the product search API from 900 ms to 250 ms by adding Redis caching and rewriting two N+1 query paths.",
            "Wrote the team’s first integration test suite in Testcontainers, catching regressions that previously reached staging.",
          ],
        },
        {
          type: "sample",
          title: "Projects",
          lines: [
            "ratelimitd — open-source rate limiter in Go (github.com/arjun-example/ratelimitd)",
            "Token-bucket and sliding-window limiter backed by Redis, with a gRPC sidecar mode; around 300 GitHub stars and used by a few small teams in production.",
          ],
        },
        {
          type: "sample",
          title: "Education",
          lines: [
            "B.Tech, Computer Science and Engineering — Example Institute of Technology, 2021 · CGPA 8.4/10",
          ],
        },
      ],
    },
    {
      heading: "Header and summary",
      blocks: [
        {
          type: "p",
          text: "The line under the name is a headline: a role title plus a specialisation. “Software Engineer — Backend and Distributed Systems” tells a recruiter in two seconds which pile you belong in. Avoid stacking titles like “Full Stack Developer | DevOps | ML Enthusiast”; it reads as unfocused.",
        },
        {
          type: "p",
          text: "The summary does three jobs in three sentences: years and core stack, two or three proof points with scale, and what you want next. That last part is optional but useful — it lets a recruiter route you quickly. Notice what isn’t there: “passionate”, “team player”, “quick learner”. Those words take space and prove nothing.",
        },
        {
          type: "compare",
          weak: "Passionate software developer with strong problem-solving skills and experience in various technologies, looking for a challenging role in a reputed organisation.",
          strong: "Backend engineer with 4 years building payment services in Go and Java. Built a payouts API handling around 2M requests/day and led a zero-downtime database migration.",
          note: "The strong version names a stack, a domain and two outcomes a technical reader can probe in interview.",
        },
      ],
    },
    {
      heading: "Skills: group them, and keep them honest",
      blocks: [
        {
          type: "p",
          text: "A flat list of twenty-five technologies is hard to scan and invites suspicion. Grouping by category — languages, backend and data, cloud and infrastructure, practices — lets a reader find what they’re looking for and shows you understand how the pieces fit together.",
        },
        {
          type: "ul",
          items: [
            "Put the technologies the job description asks for first within each group.",
            "Only list what you could discuss in an interview. A good test: could you answer “tell me about a problem you solved with this”? If not, leave it off or mark it as “working knowledge”.",
            "Skip skill bars, star ratings and percentages. “Java 80%” means nothing and invites the question “what’s the missing 20%?”",
            "Leave out things every engineer is assumed to know, like Git, VS Code, Windows or MS Office, unless the posting specifically mentions them.",
            "Make sure the important skills also appear in your experience bullets. A skill that only appears in the list is a claim; a skill used in a bullet is evidence.",
          ],
        },
      ],
    },
    {
      heading: "Experience bullets: impact, scale and how",
      blocks: [
        {
          type: "p",
          text: "This is where most engineering resumes fall short. The common failure is describing duties (“worked on microservices”) rather than outcomes. A strong bullet answers: what did you build or change, how, and what was different afterwards? Scale — requests, users, data volume, number of services, latency — gives a technical reader a sense of the problems you’ve handled.",
        },
        {
          type: "compare",
          weak: "Worked on backend microservices using Java and Spring Boot.",
          strong: "Built an inventory sync service in Spring Boot and Kafka processing updates from 400+ stores, replacing nightly CSV uploads with near-real-time sync.",
          note: "Same technology, but now the reader knows what was built, at what scale, and what it replaced.",
        },
        {
          type: "compare",
          weak: "Responsible for improving application performance.",
          strong: "Reduced p95 latency of the product search API from 900 ms to 250 ms by adding Redis caching and fixing two N+1 query paths.",
          note: "Specific metric, specific technique. An interviewer can now ask a good follow-up question, which is exactly what you want.",
        },
        {
          type: "compare",
          weak: "Fixed bugs and handled production issues.",
          strong: "Added OpenTelemetry tracing across 9 services, cutting the time to find the failing service during incidents from hours to minutes.",
          note: "Turns routine on-call work into an improvement you drove.",
        },
        {
          type: "p",
          text: "If you don’t have exact numbers, use honest approximations (“around”, “roughly”, “400+”) or describe the change qualitatively — “replaced a manual weekly process”, “removed the need for a nightly batch job”. Never invent a percentage. Engineers who interview you will ask how you measured it.",
        },
        {
          type: "tip",
          text: "Aim for three to five bullets for your current role and two to four for earlier ones. Lead each role with the bullet most relevant to the job you’re applying for.",
        },
      ],
    },
    {
      heading: "Projects, GitHub and portfolio links",
      blocks: [
        {
          type: "p",
          text: "For experienced engineers, a projects section is optional and should only include work that adds something your job history doesn’t — open-source contributions, a tool other people use, or work in a technology you’re moving into. For freshers it’s often the most important section on the page.",
        },
        {
          type: "ul",
          items: [
            "Describe a project like a job: what it does, what you built it with, and any evidence it’s real — users, stars, a deployment, a write-up.",
            "Link directly to the repository or live demo, not just your profile, so a reviewer lands on the right thing.",
            "Before you link your GitHub, check what someone sees in the first ten seconds: pinned repositories with clear READMEs, not a wall of forked tutorials and empty repos.",
            "A README with a short description, a screenshot or architecture sketch, and setup instructions does more for you than a long resume bullet.",
            "Only link a portfolio site if it loads quickly and is current. A broken link is worse than none.",
          ],
        },
        {
          type: "compare",
          weak: "Chat App — made a chat application using MERN stack.",
          strong: "Chat app with typing indicators and read receipts — React, Node.js, Socket.IO, MongoDB; deployed on Render with JWT auth and message history pagination (github.com/arjun-example/chat).",
          note: "The strong version shows which parts were non-trivial. Tutorial projects can still be worth listing if you went beyond the tutorial and say how.",
        },
      ],
    },
    {
      heading: "Education",
      blocks: [
        {
          type: "p",
          text: "Once you have a couple of years’ experience, education shrinks to one line: degree, institution, year, and grade if it’s strong. In India, CGPA is commonly listed and some employers filter on it, so include it if it’s at or above the cut-offs that typically appear in postings you’re targeting; otherwise, leaving it off is acceptable for experienced roles. Class 10 and 12 marks are relevant mainly for freshers and campus placements, and can go once you have a full-time role behind you.",
        },
        {
          type: "p",
          text: "Certifications such as cloud provider associate or professional certifications can sit under education or in their own short section. They help most when they match the stack in the posting and you’re early in your career or switching specialisation.",
        },
      ],
    },
    {
      heading: "Adjusting the example for your level",
      blocks: [
        {
          type: "p",
          text: "The same structure works across levels, but the weight shifts.",
        },
        {
          type: "ul",
          items: [
            "Freshers and new graduates: put Education right after the summary, with CGPA, relevant coursework and any campus placement or internship. Projects come next and should be the strongest part of the page — two or three solid ones beat six small ones. Include internships with the same bullet style as full-time jobs. Competitive programming ratings or hackathon results are worth a line if they’re notable.",
            "Senior and staff engineers: lead with scope and influence, not just output. Bullets should show technical direction (“defined the event schema standard adopted across 5 teams”), cross-team work, reliability and cost outcomes, and people you developed. Drop or shorten roles older than about ten years. Two pages is reasonable at this level if the content earns it.",
            "Career switchers: open with a summary that names the target role and bridges from your previous field — for example, a QA engineer moving into development, or an analyst moving into data engineering. Put projects above experience if they’re more relevant, and rewrite past-role bullets to emphasise the technical parts: automation you wrote, scripts, SQL, tooling. Don’t hide the previous career; domain knowledge from finance, healthcare or logistics is a genuine advantage in those industries.",
          ],
        },
      ],
    },
    {
      heading: "Formatting choices that matter for engineering roles",
      blocks: [
        {
          type: "ul",
          items: [
            "One page for up to roughly five to seven years’ experience; two pages after that if needed.",
            "Single-column layouts parse most reliably in applicant tracking systems. Avoid putting key information in images, icons or text boxes.",
            "Write technology names the standard way: PostgreSQL, JavaScript, Node.js, Kubernetes. Misspelt tool names look careless to an engineering reader.",
            "Use consistent date formats and right-align them or keep them on the title line.",
            "Send a PDF unless the employer asks otherwise, and name it sensibly, such as Arjun-Mehta-Software-Engineer.pdf.",
          ],
        },
        {
          type: "p",
          text: "In Indian hiring, add your notice period somewhere visible — the summary or a line in the header — if it’s 30 days or less, because recruiters often screen on it before reading anything else. Current and expected CTC usually belong in the portal fields or the recruiter conversation rather than on the resume.",
        },
      ],
    },
  ],
  faqs: [
    {
      question: "Should a software engineer resume be one page?",
      answer:
        "For most engineers with under five to seven years of experience, yes — one page forces you to keep only your strongest work. Senior and staff engineers can use two pages if the second page contains substantial, relevant work rather than old or repeated details. A third page is almost never needed.",
    },
    {
      question: "Do I need a GitHub link on my resume?",
      answer:
        "It isn’t required, and many strong engineers have little public code because their work is proprietary. Include it if it shows something useful, such as maintained projects or open-source contributions. For freshers and career switchers, a tidy GitHub with two or three good projects is one of the best ways to show ability.",
    },
    {
      question: "How many technologies should I list in my skills section?",
      answer:
        "Enough to cover what you’d confidently discuss in an interview and what the target role needs — often somewhere around twelve to twenty, grouped by category. More than that starts to look like keyword padding. Make sure your most important skills also appear in your experience bullets.",
    },
    {
      question: "Should I include my competitive programming ratings?",
      answer:
        "If you’re a fresher or early-career engineer and your rating or contest results are strong, a single line under achievements or education is worthwhile, particularly for companies known for algorithm-heavy interviews. For experienced engineers, real-world project and production work matters more, and the line can usually go.",
    },
  ],
  related: [
    "projects-section-on-a-resume",
    "how-to-write-work-experience-bullet-points",
    "resume-skills-section",
  ],
};
