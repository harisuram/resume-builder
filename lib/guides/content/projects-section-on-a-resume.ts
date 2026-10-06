import type { Guide } from "../types";

export const guide: Guide = {
  slug: "projects-section-on-a-resume",
  title: "How to Write a Projects Section That Gets Interviews",
  description:
    "Who needs a projects section, how to choose projects, and how to describe each one so it reads as real work — with samples for tech and non-tech fields.",
  category: "Sections",
  published: "2026-10-06",
  updated: "2026-10-06",
  intro:
    "A projects section is the closest thing a resume has to a portfolio. Done well, it shows a recruiter what you can build, design, analyse, or deliver when nobody hands you a job description. Done badly, it is a list of course assignment titles that tells them nothing. This guide covers who should have one, how to pick what goes in it, and how to write each entry so it earns an interview question rather than a skim.",
  sections: [
    {
      heading: "Who needs a projects section",
      blocks: [
        {
          type: "p",
          text: "Not everyone. A projects section exists to fill a gap between what your job history shows and what the role needs. If your work experience already proves you can do the job, extra projects mostly add length. If it doesn’t, projects are often the strongest evidence you have.",
        },
        {
          type: "ul",
          items: [
            "Students and freshers: almost always. Academic, personal, and internship projects are your work history for now.",
            "Career changers: yes. A project in the new field is proof you have started doing the work, not just reading about it.",
            "People returning after a break: useful if you kept your skills current through freelance or self-directed work.",
            "Experienced professionals: usually only for significant side projects, open-source contributions, or freelance work that shows a skill your day job doesn’t.",
            "Fields where output is the qualification — design, architecture, software, content, research — benefit at almost every level, often alongside a portfolio link.",
          ],
        },
        {
          type: "p",
          text: "For experienced candidates, a large project you led at work belongs inside that job’s bullets, not in a separate projects section. Moving it out separates the achievement from the employer and the dates, which makes it weaker.",
        },
      ],
    },
    {
      heading: "Choosing which projects to include",
      blocks: [
        {
          type: "p",
          text: "Two to four projects is the right range for most resumes. More than that and the good ones get buried. Choose them the way a recruiter will read them: by relevance to this specific job first, then by substance.",
        },
        {
          type: "ol",
          items: [
            "Relevance: does it use the tools, skills, or domain the job posting mentions? A logistics company will read a route-optimisation project more closely than a movie recommendation app, even if the second was harder.",
            "Substance: did it go beyond a tutorial? Something you designed, made decisions about, and finished beats something you followed step by step.",
            "Evidence: can the reader see it — a live link, a repository, a published report, photos, a portfolio page? Visible work is far more convincing than a description.",
            "Your share: in a team project, was your part meaningful and can you name it?",
            "Recency: a project from your final year usually says more about your current ability than one from your first.",
          ],
        },
        {
          type: "tip",
          text: "Keep a longer master list of all your projects and choose from it for each application. Swapping one project for a more relevant one is the fastest way to tailor a fresher resume.",
        },
      ],
    },
    {
      heading: "How to structure each project",
      blocks: [
        {
          type: "p",
          text: "Each project needs a header line and two to four bullet points. The header tells the reader what it is at a glance; the bullets tell them what you did and what came of it.",
        },
        {
          type: "ul",
          items: [
            "Name: a short descriptive name. If the project has a brand name like “Tiffinly”, add a few words saying what it is: “Tiffinly — meal subscription web app”.",
            "Context: academic, personal, freelance, hackathon, or open source, plus the date or year.",
            "Tools or stack: the main technologies, software, or methods, kept to the ones that mattered. Five is plenty.",
            "Link: a repository, live site, portfolio page, or published document, if one exists. Make sure it works and that the project there looks finished.",
            "What you built: one bullet on the problem and what the project does.",
            "Your role: in a team, the part that was yours, stated plainly.",
            "Outcome: what happened as a result — users, performance, a grade or award, a client decision, a measurable improvement. If there’s no number, describe the result in words.",
          ],
        },
        {
          type: "sample",
          title: "A personal software project",
          lines: [
            "Tiffinly — meal subscription web app | Personal project, 2025",
            "React, Node.js, PostgreSQL, Razorpay test mode | github.com/priyasharma/tiffinly",
            "Built a web app that lets home cooks publish weekly menus and take subscription orders, replacing the WhatsApp lists two cooks in my building were using.",
            "Designed the database schema and order flow; added daily order summaries the cooks print each morning.",
            "Used by both cooks and around 40 regular customers for three months; fixed the most-reported issue (missed cancellations) by adding a cut-off time.",
          ],
        },
        {
          type: "p",
          text: "Notice what the sample does: a real problem, a real user, specific decisions, and an honest scale. Forty users is small, and that is fine. A small real outcome is more believable than a vague claim of “improved efficiency”.",
        },
      ],
    },
    {
      heading: "Describing your role in team projects",
      blocks: [
        {
          type: "p",
          text: "Most academic projects are group work, and recruiters know it. The fastest way to lose credibility is to describe a five-person project as if you did all of it. The interviewer will ask what you personally did, so write the answer on the resume.",
        },
        {
          type: "compare",
          weak: "Developed a smart attendance system using face recognition.",
          strong: "In a team of four, built the face-recognition module (Python, OpenCV) for a classroom attendance system; tuned it to work under the classroom’s uneven lighting, which was the main cause of missed matches in early tests.",
          note: "The rewrite names the team size, the part that was yours, and a specific problem you solved — all things you can talk about confidently in an interview.",
        },
        {
          type: "p",
          text: "Useful verbs for team work are specific ones: built, designed, wrote, tested, led, coordinated, analysed. Avoid “worked on” and “was involved in”; they signal that you aren’t sure what your contribution was.",
        },
      ],
    },
    {
      heading: "Academic, personal, freelance, and open-source projects",
      blocks: [
        {
          type: "p",
          text: "Each type of project carries a slightly different signal, and it helps to label them so the reader knows what they are looking at.",
        },
        {
          type: "ul",
          items: [
            "Academic: shows you can apply what you studied. Strongest when it goes beyond the brief — a real dataset, a real client, a working prototype. Mention a guide or sponsor company if there was one.",
            "Personal: shows initiative and genuine interest, because nobody made you do it. Explain why you built it; the motivation is often what interviewers ask about.",
            "Freelance: the closest thing to work experience, because someone paid you and had expectations. Name the type of client (you can anonymise them) and what they used the work for. If it was regular, consider listing it under experience instead.",
            "Open source: shows you can work in someone else’s codebase and get changes accepted. Name the project and what your merged contributions did, not just that you contributed.",
            "Hackathons and competitions: list the event, what you built in the time, and the result if you placed.",
          ],
        },
        {
          type: "compare",
          weak: "Contributed to open-source projects on GitHub.",
          strong: "Open-source contributor, Fernleaf (static-site generator): three merged pull requests, including a fix for broken image paths on Windows builds and a new option for custom date formats.",
          note: "A named project and specific merged changes can be checked. A general claim can’t, so it carries little weight.",
        },
      ],
    },
    {
      heading: "Projects outside software",
      blocks: [
        {
          type: "p",
          text: "Projects sections are often treated as a developer thing, but they work for any field where the output can be described. The structure stays the same: what it was, what you did, what tools or methods you used, and what came of it.",
        },
        {
          type: "sample",
          title: "Graphic design",
          lines: [
            "Rebrand for Lakeside Bakery | Freelance, 2025 | Figma, Illustrator | portfolio: anikadesigns.example/lakeside",
            "Designed a new logo, menu boards, and packaging labels for a neighbourhood bakery moving from market stalls to a shop front.",
            "Ran two rounds of feedback with the owners and adjusted the palette for legibility on printed kraft-paper bags.",
            "Labels and menus have been in use since the shop opened in March 2025.",
          ],
        },
        {
          type: "sample",
          title: "Civil engineering or architecture",
          lines: [
            "Low-cost housing cluster design | Final-year thesis, 2025 | AutoCAD, Revit, STAAD.Pro",
            "Designed a 24-unit G+2 housing cluster for a peri-urban site, including structural analysis and a material cost estimate.",
            "Reduced the estimated concrete quantity in the design review by switching two blocks to a load-bearing masonry scheme.",
            "Selected for the department’s annual design exhibition.",
          ],
        },
        {
          type: "sample",
          title: "Marketing",
          lines: [
            "Instagram growth campaign for a college fest | Student project, 2024 | Canva, Meta Business Suite",
            "Planned and ran a six-week content calendar with a team of three; I wrote the copy and managed the posting schedule.",
            "Tested reels against static posts in the first two weeks and shifted the rest of the plan towards reels, which drew noticeably more profile visits.",
            "Fest page followers grew from about 1,200 to 3,800 over the campaign.",
          ],
        },
        {
          type: "sample",
          title: "Research",
          lines: [
            "Groundwater quality survey, Kolar district | Research assistant, summer 2025 | Field sampling, R",
            "Collected and logged water samples from 30 village borewells under a faculty-led study.",
            "Cleaned the lab results and produced the summary charts used in the project’s report to the district office.",
          ],
        },
      ],
    },
    {
      heading: "Links, placement, and common mistakes",
      blocks: [
        {
          type: "p",
          text: "For freshers, the projects section usually goes right after education, or even before it if your projects are stronger than your academic record. For career changers, place it above unrelated work experience. For experienced candidates, it goes near the end.",
        },
        {
          type: "ul",
          items: [
            "Broken or private links: click every link before sending. A 404 or a private repository is worse than no link.",
            "Unfinished repositories: if the README is empty and the last commit says “test”, tidy it up or leave the link off. Recruiters who click will judge what they see.",
            "Tool lists without a story: “Python, TensorFlow, Flask, Docker, AWS” on its own says nothing about what you did with them.",
            "Tutorial clones presented as original work: a to-do app or a weather app copied from a course is easy to recognise. If you followed a tutorial, extend it meaningfully and describe your extension.",
            "Inflated outcomes: claiming a college project “increased revenue by 30%” invites a question you can’t answer. Use real, smaller outcomes instead.",
            "Too many projects: four strong entries beat eight thin ones.",
          ],
        },
        {
          type: "tip",
          text: "Write each project so you could talk about it for five minutes. If a line would make you nervous in an interview, change it until it wouldn’t.",
        },
      ],
    },
  ],
  faqs: [
    {
      question: "How many projects should I put on my resume?",
      answer:
        "Two to four is right for most people. Choose the ones most relevant to the job and with the most substance. If you have more, keep a master list and swap projects in and out depending on the role.",
    },
    {
      question: "Can I include college projects if I have work experience?",
      answer:
        "In your first year or two of work, a strong and relevant final-year project can stay. After that, your work experience should carry the resume, and older academic projects can usually be removed.",
    },
    {
      question: "Should I list projects under experience or in a separate section?",
      answer:
        "Projects done as part of a job belong under that job. Personal, academic, and open-source projects go in a separate Projects section. Regular paid freelance work can go under experience, listed as a freelance role with dates.",
    },
    {
      question: "What if my project has no measurable result?",
      answer:
        "Describe the outcome in words: it was deployed, a client used it, it was graded or selected for an exhibition, or it solved a specific problem. An honest qualitative result is better than an invented number.",
    },
  ],
  related: [
    "resume-for-freshers",
    "how-to-write-work-experience-bullet-points",
    "software-engineer-resume-example",
  ],
};
