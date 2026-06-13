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
  {
    title: "Token-Efficient Programming Language Design and MOSS-Driven Redundancy Reduction for Coding Agents",
    // authors: "Independent Research",
    description: "Researching methods for improving token efficiency of coding agents without modifying underlying LLMs. Focus on token-efficient programming language design and automatic reduction of redundant code via statistical methods.",
    status: "In progress"
  },
  {
    title: "KMGen: A Skill-based Approach for Synthetic Individual Patient \nData Generation",
    authors: "Jalen Jiang, Chufan Gao, **Ethan Rasmussen**, Stephen Z. Xie, Jimeng Sun\nAffiliated with SunLab",
    venue: "Machine Learning for Healthcare",
    description:
      "KMGen demonstrates that publicly available clinical trial reports can be transformed into realistic synthetic patient-level datasets [including survival outcomes and adverse events], enabling researchers to perform analyses that typically require access to private individual patient data.",
    // link: "https://doi.org/10.0000/example",
    status: "In peer review"
  },
  {
    title: "Accelerating Reproducible Research in Synthetic EHR Generation",
    authors: "Jalen Jiang, Chufan Gao, **Ethan Rasmussen**, Stephen Z. Xie, Jimeng Sun\nAffiliated with SunLab",
    venue: "Machine Learning for Healthcare",
    description: "This work shows that synthetic EHR generation models can be evaluated fairly and reproducibly within a unified benchmarking framework, enabling rigorous comparison, validation, and improvement of privacy-preserving healthcare data generators that were previously difficult to assess due to fragmented tooling and inconsistent evaluation methods.",
    // link: "https://arxiv.org/abs/0000.00000",
    status: "In peer review"
  }
];
