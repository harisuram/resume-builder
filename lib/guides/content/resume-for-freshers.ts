import type { Guide } from "../types";

export const guide: Guide = {
  slug: "resume-for-freshers",
  title: "How to Write a Fresher Resume With No Work Experience",
  description:
    "Which sections to lead with when you have no job history, how to present projects, internships and CGPA, and a full sample fresher resume you can adapt.",
  category: "Examples",
  published: "2026-10-06",
  updated: "2026-10-06",
  intro:
    "Writing your first resume feels unfair: employers want evidence of what you can do, and you have not had a job yet. But nobody screening fresher resumes expects a work history. They are looking for signs that you can learn, finish things, and work with other people, and you have more of that evidence than you think. This guide shows how to organise a fresher resume, what to put in each section, and the mistakes that make most campus resumes look identical.",
  sections: [
    {
      heading: "What recruiters look for in a fresher",
      blocks: [
        {
          type: "p",
          text: "When a company hires graduates, whether through campus placements in India, a graduate scheme in the UK, or new-grad roles anywhere else, the people screening resumes know every candidate is inexperienced. What separates applicants is not experience but evidence of potential. In practice that means:",
        },
        {
          type: "ul",
          items: [
            "Relevant skills, shown through something you built or did, not just listed.",
            "Academic foundation: the right degree, and grades that clear any eligibility cut-off.",
            "Initiative: projects you started yourself, internships you went after, things you organised.",
            "Follow-through: work you finished and can explain, rather than ten courses you started.",
            "Communication: a clean, error-free, well-organised resume is itself evidence of this.",
          ],
        },
        {
          type: "p",
          text: "Everything on the page should feed one of those signals. If a line does not, it can probably go.",
        },
      ],
    },
    {
      heading: "The right order of sections",
      blocks: [
        {
          type: "p",
          text: "Experienced candidates lead with work history. Freshers should lead with whatever is strongest, which usually means education and projects. A reliable order for most freshers is:",
        },
        {
          type: "ol",
          items: [
            "Name and contact details: phone, professional email, city, LinkedIn, and GitHub or portfolio link if relevant.",
            "Summary or objective: two or three lines saying what you studied, your strongest relevant experience, and the role you want.",
            "Education: degree, college, years, CGPA or percentage, and Class 12 and 10 results if the employer asks for them (common in Indian campus placements).",
            "Internships, if you have any. If you have done a substantial internship, it can go above education.",
            "Projects: academic, personal, or hackathon projects with real detail.",
            "Skills: technical skills grouped by type, plus languages.",
            "Certifications: only ones that are relevant and that you completed.",
            "Achievements and extracurricular activities: competitions, leadership roles, volunteering, sports at a serious level.",
          ],
        },
        {
          type: "tip",
          text: "If your projects are much stronger than your grades, put projects above education. Recruiters read top to bottom, and the first impression should be your best material.",
        },
      ],
    },
    {
      heading: "Education: CGPA, percentages and coursework",
      blocks: [
        {
          type: "p",
          text: "For a fresher, education is close to the top and should be precise. List your most recent qualification first. For each one, include the degree and branch, institution, city, start and end years (or expected end year), and your result.",
        },
        {
          type: "ul",
          items: [
            "Write the grade the way your institution reports it: “CGPA 8.1/10” or “72%”. Do not convert between scales unless the employer asks; if they do, use your university’s official conversion formula.",
            "Many Indian companies set eligibility cut-offs on Class 10, Class 12 and graduation scores, so campus resumes usually show all three. For off-campus or international applications, school results are usually unnecessary unless asked for.",
            "If your CGPA is low, you can leave it off for off-campus applications, but expect the question in interviews and have an honest answer. Don’t leave it off when the form explicitly asks.",
            "Add a line of relevant coursework only if it is relevant to the role and not obvious from the degree. “Relevant coursework: Data Structures, DBMS, Operating Systems, Computer Networks” helps a CS student applying to a non-tech company’s IT team; it adds nothing to a software role.",
            "Mention a final-year thesis or major project by title if it relates to the job, and describe it fully in the projects section.",
          ],
        },
      ],
    },
    {
      heading: "Projects: your substitute for work experience",
      blocks: [
        {
          type: "p",
          text: "Projects are where most fresher resumes win or lose. A project section that says “Library Management System — Java, MySQL” tells the recruiter you completed a standard assignment like everyone else in your batch. A project section that explains what you built, the decisions you made, and what happened when people used it tells them you can do the job.",
        },
        {
          type: "p",
          text: "For each project, give a title, the tools used, a link if one exists, and two to four bullets covering: what problem it solved, what you personally did (especially in a team project), any technical decision worth noting, and the outcome, such as users, accuracy, speed, a grade, or a prize.",
        },
        {
          type: "compare",
          weak: "E-commerce website — HTML, CSS, JavaScript, PHP. Made an online shopping website with cart and login.",
          strong:
            "Campus Bookswap — React, Node.js, MongoDB. Built a second-hand textbook marketplace for students at my college; wrote the listing, search and chat features and deployed it on a free cloud tier. Around 150 students listed books in the first semester.",
          note: "The rewrite has a real user group, a named personal contribution, and an outcome. Only include user numbers you can actually check.",
        },
        {
          type: "ul",
          items: [
            "Two or three well-described projects beat six one-liners.",
            "For team projects, say what you did: “Built the payment flow” rather than “We built an app”.",
            "Non-technical students have projects too: a market research study, a case competition, a business plan, a field survey, a design portfolio, a published article.",
            "Make sure every GitHub or portfolio link works and that the repository has a readable README. Interviewers do click them.",
          ],
        },
      ],
    },
    {
      heading: "Internships, training and part-time work",
      blocks: [
        {
          type: "p",
          text: "Treat an internship exactly like a job: company, your title, location, dates, and bullet points that start with action verbs and describe what you did and what it led to. A two-month internship where you shipped one feature or produced one useful report is worth more on paper than a vague six-month one.",
        },
        {
          type: "compare",
          weak: "Summer Intern, XYZ Pvt Ltd. Worked on various tasks assigned by the manager and learnt a lot about the industry.",
          strong:
            "Summer Intern, Finance — Analysed six months of vendor invoices in Excel to flag duplicate payments, and documented the reconciliation steps so the accounts team could repeat the check monthly.",
          note: "“Learnt a lot” is about you; the rewrite is about what the company got.",
        },
        {
          type: "p",
          text: "Part-time and unrelated jobs also count. Tutoring, retail, delivery work or helping in a family business shows reliability, customer handling, and time management. Keep these to one or two bullets that draw out a transferable skill. Industrial training and in-plant training that are part of your degree can be listed here too, as long as you describe what you actually did rather than just the company’s name.",
        },
      ],
    },
    {
      heading: "Skills, certifications and extracurriculars",
      blocks: [
        {
          type: "p",
          text: "Skills should be specific and honest. Group them (Languages, Frameworks, Tools, Domain) instead of one long list, and only include skills you could be questioned on. Writing “Python, Java, C++, JavaScript, Go, Rust” when you have used two of them seriously invites an interviewer to pick the one you are weakest in.",
        },
        {
          type: "p",
          text: "Avoid self-rating bars and percentages such as “Java — 80%”. They are meaningless to the reader, and they often trip up resume parsers. Soft skills like “teamwork” and “leadership” are better demonstrated in your project and activity bullets than listed.",
        },
        {
          type: "p",
          text: "Certifications help when they are relevant, recognised, and finished. An AWS Cloud Practitioner or a Google Data Analytics certificate tells a recruiter something; a list of fifteen short online course completions does not. Pick the two or three most relevant.",
        },
        {
          type: "p",
          text: "Extracurriculars are evidence of the soft skills you were tempted to list. Being the treasurer of a college club, organising a technical fest, captaining a sports team, or volunteering with an NGO all show responsibility. Give them a line each with a concrete detail: the budget you managed, the number of participants, the result.",
        },
      ],
    },
    {
      heading: "A full sample fresher resume",
      blocks: [
        {
          type: "p",
          text: "Here is a complete one-page resume for a computer science graduate applying for software developer roles. The details are invented for illustration; replace every line with your own facts.",
        },
        {
          type: "sample",
          title: "Sample fresher resume — software developer",
          lines: [
            "ANANYA RAO",
            "Hyderabad, India · +91 98xxx xxxxx · ananya.rao@email.com · linkedin.com/in/ananyarao · github.com/ananyarao",
            "",
            "SUMMARY",
            "B.Tech Computer Science graduate with a three-month backend internship and two deployed full-stack projects. Comfortable with Java, Spring Boot, React and SQL. Looking for a graduate software developer role.",
            "",
            "EDUCATION",
            "B.Tech, Computer Science and Engineering — ABC Institute of Technology, Hyderabad · 2022–2026 · CGPA 8.3/10",
            "Class XII (TS Board) — 2022 · 93.2%   |   Class X (CBSE) — 2020 · 91%",
            "",
            "INTERNSHIP",
            "Backend Developer Intern — Finlogic Solutions, Hyderabad · May–Jul 2025",
            "• Built three REST endpoints in Spring Boot for the loan-application status page, with unit tests in JUnit.",
            "• Replaced a slow report query with an indexed version after profiling it, which made the internal status report load noticeably faster.",
            "• Wrote API documentation in Swagger that the mobile team used to integrate the endpoints.",
            "",
            "PROJECTS",
            "Campus Bookswap — React, Node.js, MongoDB · github.com/ananyarao/bookswap",
            "• Built a second-hand textbook marketplace for students at my college, with listings, search and in-app chat.",
            "• Deployed on a free cloud tier; around 150 students listed books in the first semester.",
            "Attendance Analyser — Python, pandas, Streamlit",
            "• Built a dashboard that flags students below the 75% attendance requirement from exported class registers; adopted by two faculty advisers in my department.",
            "",
            "SKILLS",
            "Languages: Java, Python, JavaScript, SQL",
            "Frameworks and tools: Spring Boot, React, Node.js, Git, Postman, MySQL, MongoDB",
            "",
            "CERTIFICATIONS",
            "AWS Certified Cloud Practitioner — 2025",
            "",
            "ACHIEVEMENTS AND ACTIVITIES",
            "• Finalist, inter-college hackathon (2024) — built a bus-tracking prototype in 24 hours with a team of three.",
            "• Technical lead, college coding club — ran weekly problem-solving sessions for first-year students.",
            "",
            "LANGUAGES",
            "English, Telugu, Hindi",
          ],
        },
        {
          type: "p",
          text: "Notice what is missing: no photo, no date of birth, no father’s name, no declaration at the bottom, no “hobbies: listening to music”. Some employers and countries still expect personal details, so check the norms where you are applying, but for most private-sector applications the version above is what you want.",
        },
      ],
    },
    {
      heading: "Common fresher mistakes",
      blocks: [
        {
          type: "ul",
          items: [
            "Copying a senior’s or a friend’s resume. Recruiters at campus drives see the same template and the same phrases from a whole batch, and identical resumes blur together.",
            "A generic objective: “To work in a reputed organisation…” wastes the most valuable lines on the page.",
            "Going over one page. A fresher rarely has two pages of relevant material; a second page usually means padding.",
            "Listing every skill you have heard of. You will be asked about them.",
            "Vague project descriptions with no personal contribution or outcome.",
            "A declaration (“I hereby declare that the above information is true…”) and signature line. It is a holdover from older formats and takes space; leave it out unless a specific employer asks for it.",
            "Unprofessional email addresses. Create a simple firstname.lastname style address for job hunting.",
            "Typos and inconsistent formatting: different date styles, mixed fonts, bullet points that end with and without full stops. For a fresher, polish is part of the evidence.",
            "Sending a designed, graphics-heavy resume with columns, icons and skill bars to a portal that parses text. Keep the layout clean and readable by software.",
          ],
        },
        {
          type: "tip",
          text: "Keep one master resume with everything you have done, then make a trimmed copy for each type of role. A version for a data analyst opening should lead with your analysis projects; the version for a web developer opening should lead with the web ones.",
        },
      ],
    },
  ],
  faqs: [
    {
      question: "Should a fresher resume be one page?",
      answer:
        "Yes, in almost every case. One page is enough for education, an internship or two, a few projects, skills and activities. If you are going over, cut weaker projects, school-level achievements and generic skills before shrinking the font.",
    },
    {
      question: "Should I include my Class 10 and 12 marks?",
      answer:
        "For Indian campus placements and many Indian employers, yes, because eligibility criteria often include them. For international applications or roles where they are not asked for, your degree result is usually enough. When an application form asks for them, always provide them.",
    },
    {
      question: "What if I have no internships and no projects?",
      answer:
        "Start one now. A small but finished project, built over a few weekends and described honestly, is better than an empty section. In the meantime, lead with education, relevant coursework, academic assignments with real substance, extracurricular responsibilities, and any part-time work, each written to show a skill the job needs.",
    },
    {
      question: "Should I add a photo to my fresher resume?",
      answer:
        "Not for most private-sector jobs in India, the US, the UK, Canada or Australia, where a photo adds nothing and can introduce bias. Some employers in parts of Europe, the Middle East and Asia still expect one. Follow the norms of the country and company you are applying to.",
    },
  ],
  related: ["projects-section-on-a-resume", "how-to-list-education-on-a-resume", "how-to-write-a-resume-summary"],
};
