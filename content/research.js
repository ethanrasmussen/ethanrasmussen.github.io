/* ============================================================
   "RESEARCH & PUBLICATIONS" PAGE

   Each entry has following optional fields:
     title
     authors
     venue
     description
     link
     status -- "In progress" | "In peer review" | "Pre-print" | "Conference paper" | "Journal paper"
   ============================================================ */
window.PORTFOLIO = window.PORTFOLIO || {};

window.PORTFOLIO.research = [
  // {
  //   title: "Token-Efficient Programming Language Design and MOSS-Driven Redundancy Reduction for Coding Agents",
  //   // authors: "Independent Research",
  //   description: "Researching methods for improving token efficiency of coding agents without modifying underlying LLMs. Focus on token-efficient programming language design and automatic reduction of redundant code via statistical methods.",
  //   status: "In progress"
  // },
  {
    title: "Similarity-Guided Coding Agents: Reducing Redundant Code Generation with Lightweight Clone Detection",
    authors: "Ethan Rasmussen",
    venue: "Targeting Journal Publication",
    description: "This work introduces a MOSS-inspired similarity gate for LLM coding agents that detects when newly generated code duplicates existing repository abstractions and prompts agents to revise toward reuse. On a 33-task Python benchmark, the approach reduced newly introduced redundant LOC by up to 78%, improved intended abstraction reuse from 60% to 100%, increased task success from 85% to 96% in the retrieval-assisted setting, and produced a repository that was 16% smaller in tokens after 26 sequential tasks.",
    status: "In peer review"
  },
  {
    title: "KMGen: A Skill-based Approach for Synthetic Individual Patient \nData Generation",
    authors: "Jalen Jiang, Chufan Gao, **Ethan Rasmussen**, Stephen Z. Xie, Jimeng Sun\nAffiliated with SunLab",
    // venue: "Machine Learning for Healthcare",
    venue: "Targeting Conference Publication",
    description:
      "KMGen demonstrates that publicly available clinical trial reports can be transformed into realistic synthetic patient-level datasets [including survival outcomes and adverse events], enabling researchers to perform analyses that typically require access to private individual patient data.",
    // link: "https://doi.org/10.0000/example",
    status: "In peer review"
  },
  {
    title: "Accelerating Reproducible Research in Synthetic EHR Generation",
    authors: "Jalen Jiang, Chufan Gao, **Ethan Rasmussen**, Stephen Z. Xie, Jimeng Sun\nAffiliated with SunLab",
    // venue: "Machine Learning for Healthcare",
    venue: "Targeting Conference Publication",
    description: "This work shows that synthetic EHR generation models can be evaluated fairly and reproducibly within a unified benchmarking framework, enabling rigorous comparison, validation, and improvement of privacy-preserving healthcare data generators that were previously difficult to assess due to fragmented tooling and inconsistent evaluation methods.",
    // link: "https://arxiv.org/abs/0000.00000",
    status: "In peer review"
  }
];
