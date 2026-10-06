import type { Guide } from "../types";

export const guide: Guide = {
  slug: "resume-skills-section",
  title: "How to Write a Resume Skills Section That Gets Read",
  description:
    "Which skills to list, how to group them, why skill bars and star ratings backfire, and sample skills sections for tech, finance, marketing, and nursing roles.",
  category: "Sections",
  published: "2026-10-06",
  updated: "2026-10-06",
  intro:
    "The skills section is the part of a resume most people fill in last and think about least — usually a long, comma-separated pile of everything they have ever touched. Done well, it is a quick index that tells a recruiter, in a few seconds, whether you have the tools the job needs. This guide covers what belongs there, what doesn’t, how to organise it, and how to make it agree with the rest of your resume.",
  sections: [
    {
      heading: "What the skills section is actually for",
      blocks: [
        {
          type: "p",
          text: "A recruiter reading your resume is trying to answer one question early: can this person do the work? Your experience section answers it with evidence, but evidence takes time to read. The skills section is the shortcut — a compact list of the tools, methods, and specialist knowledge you bring, placed where it can be scanned at a glance.",
        },
        {
          type: "p",
          text: "It also does a quieter job. When a recruiter searches a candidate database or an applicant tracking system for “Power BI” or “GST returns”, your resume needs to contain those exact terms somewhere. A clear skills section is the most natural place for a term like that to live, alongside the bullet points that show you using it.",
        },
        {
          type: "p",
          text: "What it is not for is persuasion. Nobody gets hired because they listed “hardworking” or “team player”. Those claims only become believable when your experience demonstrates them, which is why the best skills sections are mostly made of concrete, checkable things.",
        },
      ],
    },
    {
      heading: "Hard skills vs soft skills",
      blocks: [
        {
          type: "p",
          text: "Hard skills are specific, teachable, and usually testable: a programming language, a piece of accounting software, a lab technique, a spoken language, a certification, AutoCAD, Tally, phlebotomy, financial modelling. You either can or can’t use them, and an interviewer can check.",
        },
        {
          type: "p",
          text: "Soft skills are the ways you work with people and problems: communication, leadership, negotiation, prioritisation, adaptability. They matter enormously — many hiring decisions come down to them — but they are almost impossible to prove with a single word on a page. Everyone claims them, so listing them adds nothing that distinguishes you.",
        },
        {
          type: "p",
          text: "The practical rule: your skills section should be almost entirely hard skills. Soft skills belong in your experience bullets and summary, shown through what you did. There is a narrow exception for soft skills that are really specialised professional capabilities — “stakeholder management” for a programme manager, “client counselling” for a lawyer, or “conflict de-escalation” for a support lead can sit in a skills list because they describe a recognisable professional competence rather than a personality trait.",
        },
        {
          type: "compare",
          weak: "Skills: Communication, Teamwork, Leadership, Hardworking, Quick learner, Python, Excel",
          strong: "Skills: Python (pandas, NumPy), SQL, Excel (Power Query, pivot tables), Tableau, A/B test design",
          note: "The rewrite drops the unprovable traits and makes the hard skills more specific. The leadership and teamwork can be shown in experience bullets instead.",
        },
      ],
    },
    {
      heading: "How to choose which skills to list",
      blocks: [
        {
          type: "p",
          text: "Start from the job, not from yourself. Open the posting and pull out every tool, method, and domain term it mentions. Then mark the ones you genuinely have. That marked list is the core of your skills section for this application. Add other strong skills that are clearly relevant to the role, and stop there.",
        },
        {
          type: "p",
          text: "Use these filters when deciding whether a skill earns a place:",
        },
        {
          type: "ul",
          items: [
            "Could you talk about it for five minutes in an interview, with a real example? If not, leave it off. Listing something you used once in a college assignment invites a question you can’t answer.",
            "Is it relevant to this job or this field? Photoshop on a backend engineer’s resume is noise; on a marketing executive’s resume it may be useful.",
            "Is it assumed? Basic computer use, email, MS Word, and “internet research” are expected of nearly everyone in office jobs. Listing them can make the rest of the list look thin.",
            "Is it current? A tool that has been retired or replaced in your industry signals that your knowledge may be dated unless the role specifically asks for it.",
            "Is it specific enough to mean something? “Microsoft Office” says little; “Excel — VLOOKUP/XLOOKUP, pivot tables, macros” says a lot.",
          ],
        },
        {
          type: "p",
          text: "How many is right? There is no fixed number, but a focused list of roughly eight to fifteen items is usually enough for most roles. Technical roles with many tools may run longer if it is well grouped. If your list is so long that the important skills get lost, it is too long.",
        },
        {
          type: "tip",
          text: "Keep a master list of every skill you have, with notes on where you used each one. For each application, copy only the relevant subset into your resume. This takes a few minutes and makes tailoring much faster.",
        },
      ],
    },
    {
      heading: "Group skills by category",
      blocks: [
        {
          type: "p",
          text: "A flat list of twenty items is hard to scan. Grouping them under short labels lets a reader jump straight to what they care about. A hiring manager for a data role might look for “Languages” and “Tools”; one for a finance role might look for “Software” and “Regulatory knowledge”.",
        },
        {
          type: "p",
          text: "Useful category labels depend on the field. Common ones include Languages, Frameworks, Tools, Platforms, Software, Methods, Certifications, Domain knowledge, and Spoken languages. Pick three to five categories at most; one category with a single item usually means it should merge with another.",
        },
        {
          type: "p",
          text: "Order matters within and between groups. Put the category most relevant to the target job first, and within each group put the strongest and most relevant skills first. Readers skim left to right and top to bottom, and many stop before the end of a line.",
        },
        {
          type: "compare",
          weak: "Skills: Java, Git, Agile, Spring Boot, Docker, MySQL, Jira, REST APIs, AWS, JUnit, Kubernetes, PostgreSQL",
          strong: "Languages: Java, SQL | Frameworks: Spring Boot, JUnit | Data: PostgreSQL, MySQL | Infrastructure: Docker, Kubernetes, AWS (EC2, S3, RDS) | Practices: REST API design, Git, Agile/Scrum",
          note: "Same skills, but grouped so a reader can find what they need, and with AWS made more specific.",
        },
      ],
    },
    {
      heading: "Proficiency levels — and why bars and stars backfire",
      blocks: [
        {
          type: "p",
          text: "Many resume templates show skills as progress bars, five-star ratings, or filled circles. They look tidy, but they cause more problems than they solve.",
        },
        {
          type: "ul",
          items: [
            "They mean nothing objective. Is four stars in Excel “I can build a financial model” or “I am better at Excel than at Python”? The reader can’t tell, and different people rate themselves very differently.",
            "They invite awkward questions. Rating yourself 80% in SQL prompts “What’s the 20% you don’t know?” in an interview. Rating yourself 100% in anything invites scepticism.",
            "They undersell you. Anything less than full marks reads as a weakness, so a candidate who honestly gives themselves three of five stars looks worse than one who exaggerates.",
            "They are often invisible to software. Bars and stars are usually graphics, so an applicant tracking system reading the text may see only the skill name — or, in some layouts, garbled characters.",
            "They waste space that could hold more useful detail.",
          ],
        },
        {
          type: "p",
          text: "If proficiency genuinely matters, use words that have a shared meaning. For spoken languages, recognised scales help: “Native”, “Fluent”, “Professional working proficiency”, or a CEFR level such as B2 if you have one. For technical skills, a simple split works — list your strong skills first, then add a short group labelled “Familiar with” for tools you have used but would not claim expertise in. Years of experience (“Python — 4 years”) can also work for a few headline skills, but don’t apply it to every line.",
        },
        {
          type: "p",
          text: "The strongest signal of proficiency is still context: a bullet that says you built a reporting pipeline in Python that replaced a weekly manual export tells a recruiter more about your Python than any star rating could.",
        },
      ],
    },
    {
      heading: "Match the job posting without copying it",
      blocks: [
        {
          type: "p",
          text: "Use the employer’s wording where it is accurate for you. If the posting says “financial modelling” and your resume says “building forecasting spreadsheets”, a human might connect the two, but a keyword search will not. Changing your phrasing to match is not dishonest; it is translation.",
        },
        {
          type: "p",
          text: "Include both the full form and the abbreviation for terms that are commonly written either way, at least once: “Search Engine Optimisation (SEO)”, “Customer Relationship Management (CRM)”. Recruiters search in both styles.",
        },
        {
          type: "p",
          text: "Don’t paste the whole requirements list into your skills section. Experienced recruiters notice when a skills list mirrors the posting line for line, and if you can’t back up a skill in interview, the mismatch does more damage than leaving it off. Only add skills you actually have, and make sure the important ones also appear in your experience or projects, where they are shown in use.",
        },
        {
          type: "tip",
          text: "Read your skills list and your experience section side by side. Every major skill in the list should appear at least once in a bullet, project, or certification. A skill that appears only in the list looks like a claim with no evidence.",
        },
      ],
    },
    {
      heading: "Show soft skills through your experience instead",
      blocks: [
        {
          type: "p",
          text: "Taking soft skills out of the list doesn’t mean they disappear. It means you prove them. Leadership becomes a bullet about running a team or a project; communication becomes a bullet about training colleagues, presenting to clients, or writing documentation people used.",
        },
        {
          type: "compare",
          weak: "Skills: Leadership, Communication",
          strong: "Led a four-person team through the migration of the billing system, running weekly demos for the finance team and writing the handover guide used by support staff.",
          note: "The bullet shows leadership and communication in a real context, which the one-word claim never could.",
        },
        {
          type: "compare",
          weak: "Skills: Problem-solving, Customer focus",
          strong: "Traced repeat delivery complaints to a pin-code mapping error in the dispatch system and worked with operations to fix it, after which complaints from the affected area stopped.",
          note: "Specific problem, specific action, specific result — no adjectives needed.",
        },
        {
          type: "p",
          text: "Freshers can do the same with college work: organising a fest shows coordination and budgeting, leading a final-year project shows planning, and tutoring juniors shows communication. The point is to give the reader something concrete to believe.",
        },
      ],
    },
    {
      heading: "Sample skills sections for different fields",
      blocks: [
        {
          type: "p",
          text: "These samples show grouping and specificity. Use them as patterns, not lists to copy — your own section should contain only skills you can back up.",
        },
        {
          type: "sample",
          title: "Software developer (backend, 3 years)",
          lines: [
            "Languages: Java, Python, SQL",
            "Frameworks: Spring Boot, FastAPI, Hibernate",
            "Data: PostgreSQL, Redis, Kafka",
            "Cloud and DevOps: AWS (EC2, S3, Lambda), Docker, GitHub Actions",
            "Practices: REST API design, unit and integration testing, code review",
          ],
        },
        {
          type: "sample",
          title: "Accountant / finance executive",
          lines: [
            "Accounting: Accounts payable and receivable, bank reconciliation, month-end close",
            "Tax and compliance: GST returns (GSTR-1, GSTR-3B), TDS filing, statutory audit support",
            "Software: Tally Prime, SAP FICO, Zoho Books",
            "Excel: Pivot tables, XLOOKUP, Power Query, basic macros",
            "Qualifications: CA Inter (both groups cleared)",
          ],
        },
        {
          type: "sample",
          title: "Digital marketing executive",
          lines: [
            "Paid media: Google Ads (Search, Performance Max), Meta Ads Manager",
            "SEO and content: Keyword research, on-page SEO, Google Search Console",
            "Analytics: Google Analytics 4, Looker Studio, UTM tracking",
            "Tools: HubSpot, Mailchimp, Canva, WordPress",
            "Languages: English (fluent), Hindi (native), Telugu (native)",
          ],
        },
        {
          type: "sample",
          title: "Staff nurse",
          lines: [
            "Clinical: IV cannulation, wound care, medication administration, patient monitoring",
            "Specialist: ICU care, ventilator management, post-operative care",
            "Certifications: BLS, ACLS",
            "Systems: Hospital information system for charting and medication records",
            "Languages: English, Malayalam, Tamil",
          ],
        },
        {
          type: "sample",
          title: "Fresher — data analyst role",
          lines: [
            "Languages: Python (pandas, Matplotlib), SQL",
            "Tools: Excel, Power BI, Jupyter, Git",
            "Methods: Data cleaning, exploratory analysis, basic regression",
            "Familiar with: Tableau, Google BigQuery",
          ],
        },
      ],
    },
    {
      heading: "Where to put the skills section",
      blocks: [
        {
          type: "p",
          text: "Placement depends on what your resume is leaning on. For technical roles, where tools are a primary filter, a skills section near the top — just after the summary — helps the reader confirm the match before reading further. For experienced candidates whose track record is the main selling point, it often works better after experience. For freshers with limited work history, placing skills after education and before projects is common and sensible.",
        },
        {
          type: "p",
          text: "Whatever you choose, use a plain text heading such as “Skills” or “Technical Skills”. Creative headings like “My Toolbox” or “What I Bring” can confuse software that looks for standard section names, and they don’t help human readers either. If you build your resume in our free builder, every section is optional and the templates use real text headings, so you can move the skills section or drop it without leaving an empty gap.",
        },
      ],
    },
  ],
  faqs: [
    {
      question: "Should I include soft skills on my resume at all?",
      answer:
        "Yes, but show them rather than list them. Put evidence of leadership, communication, and problem-solving in your experience bullets and summary. A skills list of soft traits adds little because every applicant claims the same ones.",
    },
    {
      question: "How many skills should I list on my resume?",
      answer:
        "Enough to cover what the job asks for and what you genuinely have — often around eight to fifteen, grouped into a few categories. Technical roles can run longer if the list is well organised. If the most relevant skills are getting lost, cut the rest.",
    },
    {
      question: "Is it okay to list a skill I am still learning?",
      answer:
        "Yes, if you label it honestly. A short “Familiar with” or “Currently learning” line makes clear it isn’t a core strength. Don’t list it alongside your main skills as if you were fluent, because interviewers will test it.",
    },
    {
      question: "Should I use skill bars or star ratings?",
      answer:
        "Generally no. They have no shared meaning, often read as weaknesses, and are usually graphics that software can’t read. Use plain text, and if proficiency matters, use words like “Fluent” or a recognised language level instead.",
    },
  ],
  related: [
    "tailor-resume-to-job-description",
    "how-to-write-work-experience-bullet-points",
    "how-applicant-tracking-systems-read-resumes",
  ],
};
