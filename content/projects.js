/* ============================================================
   Each entry has the optional fields: title, description, image, video, link
   ============================================================ */
window.PORTFOLIO = window.PORTFOLIO || {};

window.PORTFOLIO.projects = [
  {
    title: "Chlorophyll: Tree-based Chat App",
    description:
      "LLM chat app where conversations use tree data structures, rather than sequential conversation. Enables exploring multiple directions simultaneously, backtracking, and easier context management.",
    image: "assets/chlorophyll.png",
    video: "assets/chlorophyll.mp4",
    link: "https://github.com/ethanrasmussen/chlorophyll"
  },
  {
    title: "Custom Finetuned LLM for Indication-Aware Radiology Report Generation",
    description: "Reproduction and extension of UChicago research paper 'Pragmatic Radiology Report Generation'. Finetuned LLaMA-3.1-8B model, achieving reduced hallucinations compared to original study. Experimented with chain-of-thought & introduced 'impression-pruning' data processing step.",
    image: "assets/llm_radiology.png",
    link: "https://github.com/ethanrasmussen/llm_radiology"
  },
  {
    title: "Ocular Segmentation and Trauma Analysis",
    description: "Computer vision research for novel approach to automatic quantification of ocular burn severity. Affiliated with Carle Illinois College of Medicine.",
    image: "assets/eyetrauma.png",
    link: "https://github.com/ethanrasmussen/EyeTraumaAnalysis"
  },
  {
    title: "Blockgame-JS",
    description: "Minecraft-inspired block building game built to learn React Three Fiber.",
    image: "assets/blockgame.png",
    video: "assets/blockgame.mp4",
    link: "https://github.com/ethanrasmussen/blockgame-js"
  },
  {
    title: "PocketWatcher Finance App",
    description: "Custom personal finance application I built to replace my previous Excel-driven workflow.",
    image: "assets/pocketwatcher.jpg",
    // video: ""
    // link: "...."
  },
  {
    title: "Options Spread Trading Bot with LSTM",
    description: "Won 3rd place against humans in UIUC SP22 Trading Challenge. Options Spreads Trading Bot using LSTM to predict BTC prices, then executing optimal trades with Selenium automation on CME trade simulator.",
    // image: "assets/btc_lstm.png",
    link: "https://github.com/ethanrasmussen/btc_lstm"
  },
];
