window.PORTFOLIO = window.PORTFOLIO || {};

window.PORTFOLIO.about = {
  tagline: "Software Engineer and Researcher, with a Focus on Agentic AI",
  summary:
    "I'm a software engineer and AI researcher focused on building intelligent systems that solve real-world problems in healthcare, life sciences, and enterprise technology. My work spans agentic AI, large language models, real-world evidence platforms, and synthetic healthcare data generation, with a passion for translating cutting-edge tech and research into practical solutions at scale.",

  /* ----------------------------------------------------------
     WORK EXPERIENCE
     Optional per role: start, end, location, description, details[]
     ---------------------------------------------------------- */
  experience: [
    {
      company: "AbbVie",
      // location: "Chicago, IL",
      roles: [
        {
          title: "Software Engineer, Agentic AI",
          start: "Oct 2025",
          end: "Present",
          location: "Chicago, IL",
          description: "Building agentic AI solutions to drive cost savings and enhance enterprise agility.",
          details: [
            "Developed and deployed AbbVie's first agentic solution to save cost by replacing outsourced work.",
            "Managing end-to-end creation of multiple agentic projects, including requirements gathering, full-stack development, cloud deployment, and compliance.",
            "Technical lead for small engineering team [3 devs] tackling enterprise-scale problems, such as automatic IT event monitoring and remediation, security oversight, competitive intelligence, automated ticket processing, and SDLC documentation.",
          ]
        },
        {
          title: "Software Engineer, Real World Data",
          start: "May 2024",
          end: "Oct 2025",
          location: "Chicago, IL",
          description: "Development for an internal patient cohort creation tool that enables non-technical users to rapidly create cohorts and dashboards from billions of records by dynamically generating and executing SQL queries.",
          details: [
            "This tool significantly accelerates cohort building from a process taking multiple days, to one taking less than an hour.",
            "Created an agentic chatbot for cohort creation, allowing users to build research-quality patient cohorts from natural language descriptions, rapidly accelerating real-world evidence studies."
          ]
        },
        {
          title: "Business Technology Rotation, Student Contractor",
          start: "Jan 2022",
          end: "May 2024",
          location: "Champaign, IL",
          description: "Student contractor program, with full-time hours during summer and part-time hours during school.",
          details: [
            "[01/2024 - 05/2024] Software Engineer, Real World Data",
            "[03/2023 - 01/2024] Data Analyst, Evidence Solutions",
            "[01/2022 - 03/2023] Disruptive Technology Analyst, BTS Innovation"
          ]
        }
      ]
    },
    {
      company: "SunLab at University of Illinois",
      roles: [
        {
          title: "Deep Learning Researcher",
          start: "May 2025",
          end: "Present",
          location: "Remote",
          description: "Generative AI and LLM research under PhD mentor:",
          details: [
            "Exploring synthetic data generation for time-series data and EHRs via hierarchical autoregressive models.",
            "Worked with other researchers toward developing a minimally-dependent benchmark for synthetic healthcare data evaluation.",
            "Built agentic framework for synthetic patient-level data reconstruction from published Kaplan-Meier curves, enabling downstream analyses without private data access."
          ]
        }
      ]
    },
    {
      company: "Carle Illinois College of Medicine",
      roles: [
        {
          title: "Undergraduate Researcher",
          start: "Sept 2022",
          end: "May 2023",
          location: "Urbana, IL",
          description: "Worked closely with two medical students to research and develop computer vision solutions for a novel approach to automatic quantification of ocular burn severity."
        }
      ]
    }
  ],

  /* ----------------------------------------------------------
     EDUCATION
     Optional per entry: degree, field, start, end, location, details[]
     ---------------------------------------------------------- */
  education: [
    {
      school: "University of Illinois at Urbana-Champaign",
      degree: "M.S.",
      field: "Computer Science, with Data Science Concentration",
      start: "2024",
      end: "2025",
      details: ["Graduated with Straight A's", "Degree completed while working full-time"]
    },
    {
      school: "University of Illinois at Urbana-Champaign",
      degree: "B.S.",
      field: "Information Systems, with Computer Science Minor",
      start: "2020",
      end: "2024",
      details: ["Graduated with High Honors and James Scholar Designation"]
    }
  ],

  /* ----------------------------------------------------------
     LICENSES & CERTIFICATIONS
     Optional per entry: issuer, date, link
     ---------------------------------------------------------- */
  // certifications: [
  //   {
  //     name: "Example Certification",
  //     issuer: "Issuing Organization",
  //     date: "2023",
  //     link: "https://example.com/verify"
  //   }
  // ],

  /* ----------------------------------------------------------
     SKILLS
     ---------------------------------------------------------- */
  skills: [
    "Python", "Agentic AI", "Machine Learning", "SQL", "JavaScript/TypeScript", "Docker", "Kubernetes", "Cloud Infrastructure",
    "Data Visualization", "Git", "SDLC/Agile", 
  ]
};
