/* ============================================================
   The scene (js/scene.js) calls LakeGame.frame() every tick and
   forwards clicks on the lake. All gameplay drawing happens on
   the shared pixel canvas; menus/meters are HTML in #game-ui.
   ============================================================ */
(function () {
  "use strict";

  const STORE_KEY = "pixel-lake-catches";

  /* ------------------------------ species table ------------- */
  // phases: subset of ["dawn","day","dusk","night"] or "any"
  const SPECIES = [
    { name: "Bluegill",         rarity: "common",    w: 30, phases: ["dawn", "day"],  size: [12, 22],  colors: ["#6f9f5d", "#3f6f4d", "#e8d9a0"] },
    { name: "Yellow Perch",     rarity: "common",    w: 30, phases: ["day", "dusk"],  size: [15, 30],  colors: ["#d8b34a", "#8a6a2a", "#f0e2b0"] },
    { name: "Rainbow Trout",    rarity: "uncommon",  w: 16, phases: ["dawn", "day"],  size: [25, 55],  colors: ["#9fb8c9", "#d87a8e", "#eeeee2"] },
    { name: "Largemouth Bass",  rarity: "uncommon",  w: 16, phases: ["day", "dusk"],  size: [28, 60],  colors: ["#5d7a4a", "#2f4a2c", "#cfd8a8"] },
    { name: "Walleye",          rarity: "uncommon",  w: 14, phases: ["dusk", "night"],size: [35, 70],  colors: ["#b8a05f", "#6f5a30", "#e8dcb0"] },
    { name: "Channel Catfish",  rarity: "uncommon",  w: 12, phases: ["night"],        size: [40, 90],  colors: ["#7a8a99", "#46525e", "#c9d2d8"] },
    { name: "Sunset Char",      rarity: "rare",      w: 7,  phases: ["dusk"],         size: [30, 60],  colors: ["#e88a5f", "#a84e3a", "#ffd9a8"] },
    { name: "Moonfin Koi",      rarity: "rare",      w: 6,  phases: ["night"],        size: [30, 65],  colors: ["#cfd8ee", "#8fa0cf", "#ffffff"] },
    { name: "Lake Sturgeon",    rarity: "rare",      w: 5,  phases: "any",            size: [90, 180], colors: ["#6f7a86", "#3c4650", "#b0bcc4"] },
    { name: "Golden Koi",       rarity: "legendary", w: 2,  phases: ["dawn", "day"],  size: [35, 70],  colors: ["#ffd66b", "#e8973f", "#fff3c0"] },
    { name: "Aurora Pike",      rarity: "legendary", w: 2,  phases: ["night"],        size: [60, 110], colors: ["#4be3a0", "#2a8fa8", "#bfffe0"] },
    { name: "Old Boot",         rarity: "junk",      w: 8,  phases: "any",            size: [28, 31],  colors: ["#8a6a4a", "#5d4630", "#b89a6f"] },
  ];

  const RARITY_LABEL = {
    common: "Common", uncommon: "Uncommon", rare: "Rare",
    legendary: "LEGENDARY!", junk: "...junk",
  };

  /* ------------------------------ state ------------------------------ */
  const G = {
    state: "off",   // off | cast | flying | wait | bite | reel | result
    t: 0,           // time in current state
    power: 0,
    powerDir: 1,
    bobber: { x: 0, y: 0 },
    castFrom: { x: 0, y: 0 },
    castTo: { x: 0, y: 0 },
    waitDur: 0,
    nibbleAt: 0,
    nibble: 0,
    biteWindow: 0.95,
    tension: 0,
    progress: 0,
    holding: false,
    burst: 0,
    burstTimer: 0,
    fish: null,
    fishSize: 0,
    env: null,
    rodBob: 0,
    missMsg: "",
  };

  let ui, hintEl, panelEl, logBtnEl, logEl;
  let logOpen = false;

  /* ------------------------------ persistence ------------------------ */
  function loadLog() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveCatch(sp, size) {
    const log = loadLog();
    const cur = log[sp.name] || { count: 0, best: 0, rarity: sp.rarity };
    cur.count += 1;
    cur.best = Math.max(cur.best, size);
    cur.rarity = sp.rarity;
    log[sp.name] = cur;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(log)); } catch (e) {}
    updateLogBtn();
  }
  function totalCatches() {
    const log = loadLog();
    return Object.values(log).reduce((n, e) => n + e.count, 0);
  }

  /* ------------------------------ UI ------------------------------ */
  function buildUI() {
    ui = document.getElementById("game-ui");

    hintEl = document.createElement("div");
    hintEl.className = "game-hint";
    hintEl.innerHTML = "&#127907; CLICK THE LAKE<br>TO GO FISHING";
    hintEl.addEventListener("click", () => {
      if (G.state === "off" && G.env) startGame(G.env.LW * 0.45, G.env.horizonY + G.env.waterH * 0.45);
    });
    ui.appendChild(hintEl);

    logBtnEl = document.createElement("div");
    logBtnEl.className = "catch-log-btn";
    logBtnEl.addEventListener("click", toggleLog);
    ui.appendChild(logBtnEl);
    updateLogBtn();

    panelEl = document.createElement("div");
    panelEl.className = "game-panel";
    panelEl.style.display = "none";
    ui.appendChild(panelEl);

    logEl = document.createElement("div");
    logEl.className = "catch-log";
    logEl.style.display = "none";
    ui.appendChild(logEl);

    /* global inputs for reel/bite */
    window.addEventListener("mousedown", (e) => {
      if (G.state === "reel" && !e.target.closest(".catch-log")) G.holding = true;
      else if (G.state === "bite") hookFish();
      else if (G.state === "cast" && e.target.closest(".game-panel")) lockPower();
    });
    window.addEventListener("mouseup", () => { G.holding = false; });
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        if (G.state === "reel") { G.holding = true; e.preventDefault(); }
        else if (G.state === "bite") { hookFish(); e.preventDefault(); }
        else if (G.state === "cast") { lockPower(); e.preventDefault(); }
      }
      if (e.key === "Escape" && G.state !== "off") endGame();
    });
    window.addEventListener("keyup", (e) => {
      if (e.code === "Space") G.holding = false;
    });
  }

  function updateLogBtn() {
    if (logBtnEl) logBtnEl.innerHTML = "&#128031; LOG (" + totalCatches() + ")";
  }

  function toggleLog() {
    logOpen = !logOpen;
    logEl.style.display = logOpen ? "block" : "none";
    if (!logOpen) return;
    const log = loadLog();
    const names = Object.keys(log);
    let html = "<h4>CATCH LOG</h4>";
    if (!names.length) html += "<p>Nothing caught yet.<br>Click the lake to fish!</p>";
    for (const n of names) {
      const e = log[n];
      html += `<div class="row"><span class="fish-rarity-${e.rarity || "common"}">${n} ×${e.count}</span>` +
              `<span>best ${e.best} cm</span></div>`;
    }
    logEl.innerHTML = html;
  }

  function panel(html, show) {
    panelEl.innerHTML = html;
    panelEl.style.display = show === false ? "none" : "block";
  }

  /* ------------------------------ flow ------------------------------ */
  function startGame(lx, ly) {
    G.state = "cast";
    G.t = 0;
    G.power = 0;
    G.powerDir = 1;
    G.missMsg = "";
    hintEl.style.display = "none";
    panel(
      '<h3>CAST YOUR LINE</h3>' +
      '<div class="meter"><div class="fill fill-power" id="g-power"></div></div>' +
      '<p class="small">Click (or SPACE) to set power!</p>'
    );
  }

  function lockPower() {
    if (G.state !== "cast") return;
    const env = G.env;
    const S = env.S || 1;
    G.state = "flying";
    G.t = 0;
    G.castFrom = { x: env.LW - 24 * S, y: env.LH - 34 * S };
    const far = { x: env.LW * 0.15, y: env.horizonY + 5 * S };
    const k = 0.18 + 0.82 * G.power;
    G.castTo = {
      x: G.castFrom.x + (far.x - G.castFrom.x) * k,
      y: Math.max(env.horizonY + 4 * S,
          Math.min(env.LH - 8 * S, G.castFrom.y + (far.y - G.castFrom.y) * k)),
    };
    panel("<h3>CASTING...</h3>", true);
  }

  function startWait() {
    G.state = "wait";
    G.t = 0;
    G.waitDur = 2 + Math.random() * 4.5;
    G.nibbleAt = 0.8 + Math.random() * (G.waitDur - 1.2);
    G.nibble = 0;
    panel(
      "<h3>WAITING...</h3>" +
      '<p class="small">Watch the bobber. When it plunges — click!</p>'
    );
  }

  function startBite() {
    G.state = "bite";
    G.t = 0;
    panel('<h3 style="color:#ff7a6b">!!! BITE !!!</h3><p>CLICK NOW!</p>');
  }

  function hookFish() {
    if (G.state !== "bite") return;
    G.state = "reel";
    G.t = 0;
    G.tension = 20;
    G.progress = 8;
    G.holding = false;
    G.burst = 0;
    G.burstTimer = 0.8 + Math.random();
    G.fish = pickSpecies();
    const [lo, hi] = G.fish.size;
    G.fishSize = Math.round(lo + Math.random() * (hi - lo));
    panel(
      "<h3>REEL IT IN!</h3>" +
      '<div class="meter-label">LINE TENSION — don\'t max out!</div>' +
      '<div class="meter"><div class="fill fill-tension" id="g-tension"></div></div>' +
      '<div class="meter-label">PROGRESS</div>' +
      '<div class="meter"><div class="fill fill-progress" id="g-progress"></div></div>' +
      '<p class="small" id="g-fight">HOLD mouse or SPACE to reel.<br>Ease off when it fights!</p>'
    );
  }

  function escaped(msg) {
    G.state = "result";
    G.t = 0;
    G.fish = null;
    panel(
      "<h3>IT GOT AWAY...</h3>" +
      `<p class="small">${msg}</p>` +
      '<button class="game-btn" id="g-again">CAST AGAIN</button>' +
      '<button class="game-btn secondary" id="g-done">DONE</button>'
    );
    wireResultButtons();
  }

  function caught() {
    G.state = "result";
    G.t = 0;
    const sp = G.fish;
    saveCatch(sp, G.fishSize);
    const icon = fishIconCanvas(sp);
    panel(
      "<h3>" + (sp.rarity === "junk" ? "YOU CAUGHT... JUNK" : "CAUGHT!") + "</h3>" +
      '<div id="g-icon-slot"></div>' +
      `<p><b>${sp.name}</b> · ${G.fishSize} cm</p>` +
      `<p class="small fish-rarity-${sp.rarity}">${RARITY_LABEL[sp.rarity]}</p>` +
      '<button class="game-btn" id="g-again">CAST AGAIN</button>' +
      '<button class="game-btn secondary" id="g-done">DONE</button>'
    );
    icon.className = "fish-card-icon";
    panelEl.querySelector("#g-icon-slot").appendChild(icon);
    wireResultButtons();
  }

  function wireResultButtons() {
    const again = panelEl.querySelector("#g-again");
    const done = panelEl.querySelector("#g-done");
    if (again) again.addEventListener("click", (e) => {
      e.stopPropagation();
      startGame(G.bobber.x, G.bobber.y);
    });
    if (done) done.addEventListener("click", (e) => {
      e.stopPropagation();
      endGame();
    });
  }

  function endGame() {
    G.state = "off";
    G.fish = null;
    panel("", false);
    hintEl.style.display = "";
  }

  function pickSpecies() {
    const phase = document.documentElement.dataset.phase || "day";
    const pool = SPECIES.filter(
      (s) => s.phases === "any" || s.phases.indexOf(phase) >= 0
    );
    const total = pool.reduce((n, s) => n + s.w, 0);
    let r = Math.random() * total;
    for (const s of pool) { r -= s.w; if (r <= 0) return s; }
    return pool[0];
  }

  /* ------------------------------ fish icon ------------------------- */
  const FISH_ROWS = [
    "........BBBBBBB.........",
    "..T...BBBBBBBBBBB.......",
    ".TT..BBBBBBBBBBBBB......",
    ".TTTBBBBBBBBBBBBBBBE....",
    ".TTTBBBBBBBBBBBBBBBBB...",
    ".TTTBBBLLLLLLLLLBBBB....",
    ".TT..BLLLLLLLLLLLBB.....",
    "..T...LLLLLLLLLL........",
    "........FF..............",
  ];
  const BOOT_ROWS = [
    "....BBBB................",
    "....BBBB................",
    "....BBBB................",
    "....BBBB................",
    "....BBBBB...............",
    "....BBBBBBBBBBB.........",
    "...LBBBBBBBBBBBB........",
    "..LLBBBBBBBBBBBB........",
    "..TTTTTTTTTTTTTT........",
  ];

  function fishIconCanvas(sp) {
    const rows = sp.name === "Old Boot" ? BOOT_ROWS : FISH_ROWS;
    const px = 5;
    const c = document.createElement("canvas");
    c.width = rows[0].length * px;
    c.height = rows.length * px;
    const x = c.getContext("2d");
    const map = { B: sp.colors[0], T: sp.colors[1], F: sp.colors[1], L: sp.colors[2], E: "#10141f" };
    for (let r = 0; r < rows.length; r++) {
      for (let i = 0; i < rows[r].length; i++) {
        const ch = rows[r][i];
        if (map[ch]) { x.fillStyle = map[ch]; x.fillRect(i * px, r * px, px, px); }
      }
    }
    return c;
  }

  /* ------------------------------ per-frame update + draw ----------- */
  // Called by scene.js every frame with the shared pixel context.
  function frame(ctx, dt, time, env, pal, fx) {
    G.env = env;
    if (G.state === "off") return;

    G.t += dt;

    if (G.state === "cast") {
      G.power += G.powerDir * dt * 1.1;
      if (G.power >= 1) { G.power = 1; G.powerDir = -1; }
      if (G.power <= 0) { G.power = 0; G.powerDir = 1; }
      const bar = panelEl.querySelector("#g-power");
      if (bar) bar.style.width = (G.power * 100).toFixed(1) + "%";
    }

    else if (G.state === "flying") {
      const k = Math.min(1, G.t / 0.55);
      G.bobber.x = G.castFrom.x + (G.castTo.x - G.castFrom.x) * k;
      G.bobber.y = G.castFrom.y + (G.castTo.y - G.castFrom.y) * k
                   - Math.sin(k * Math.PI) * 26 * (env.S || 1);
      if (k >= 1) { fx.ripple(G.bobber.x, G.bobber.y); startWait(); }
    }

    else if (G.state === "wait") {
      // idle bob + occasional fake nibble
      if (G.nibbleAt > 0 && G.t > G.nibbleAt && G.t < G.nibbleAt + 0.4) {
        G.nibble = Math.sin((G.t - G.nibbleAt) / 0.4 * Math.PI) * 2;
        if (G.nibble > 1.6 && Math.random() < 0.1) fx.ripple(G.bobber.x, G.bobber.y);
      } else G.nibble = 0;
      if (G.t >= G.waitDur) { fx.ripple(G.bobber.x, G.bobber.y); startBite(); }
    }

    else if (G.state === "bite") {
      if (G.t > G.biteWindow) escaped("Too slow! The fish spat the hook.");
    }

    else if (G.state === "reel") {
      // fish bursts
      G.burstTimer -= dt;
      if (G.burstTimer <= 0) {
        G.burst = 0.45 + Math.random() * 0.5;
        const hard = G.fish.rarity === "legendary" ? 0.5 :
                     G.fish.rarity === "rare" ? 0.75 : 1;
        G.burstTimer = (0.7 + Math.random() * 1.3) * hard;
      }
      if (G.burst > 0) G.burst -= dt;

      const fighting = G.burst > 0;
      if (G.holding) {
        G.progress += dt * (G.fish.rarity === "junk" ? 30 : 16);
        G.tension += dt * (fighting ? 52 : 18);
      } else {
        G.tension -= dt * 48;
        G.progress -= dt * 5;
      }
      if (fighting && !G.holding) G.tension += dt * 6;
      G.tension = Math.max(0, G.tension);
      G.progress = Math.max(0, G.progress);

      const tb = panelEl.querySelector("#g-tension");
      const pb = panelEl.querySelector("#g-progress");
      const ft = panelEl.querySelector("#g-fight");
      if (tb) tb.style.width = Math.min(100, G.tension) + "%";
      if (pb) pb.style.width = Math.min(100, G.progress) + "%";
      if (ft) ft.innerHTML = fighting
        ? '<b style="color:#ff7a6b">IT\'S FIGHTING — EASE OFF!</b>'
        : "HOLD mouse or SPACE to reel.";

      if (G.tension >= 100) { escaped("SNAP! The line broke."); return; }
      if (G.progress >= 100) { fx.ripple(G.bobber.x, G.bobber.y); caught(); return; }

      // bobber thrash
      const S = env.S || 1;
      G.bobber.x += Math.sin(time * 17) * (fighting ? 0.8 : 0.2) * S;
      G.bobber.y += Math.cos(time * 13) * (fighting ? 0.5 : 0.15) * S;
    }

    drawTackle(ctx, time, env, pal);
  }

  function drawTackle(ctx, time, env, pal) {
    if (G.state === "cast") return; // just the menu, no line yet

    const S = env.S || 1;
    const baseX = env.LW - 2 * S, baseY = env.LH + 4 * S;
    const tipX = env.LW - 24 * S, tipY = env.LH - 34 * S;

    // rod (player's, poking in from the bottom-right corner)
    ctx.strokeStyle = "rgba(70,50,30,0.95)";
    ctx.lineWidth = Math.max(2, Math.round(1.5 * S));
    ctx.beginPath();
    ctx.moveTo(baseX, baseY);
    ctx.quadraticCurveTo(env.LW - 8 * S, env.LH - 18 * S, tipX, tipY);
    ctx.stroke();

    if (G.state === "result") return;

    let bx = G.bobber.x, by = G.bobber.y;
    if (G.state === "wait") by += (Math.sin(time * 2.2) * 0.8 + G.nibble) * S;
    if (G.state === "bite") by += (3 + Math.sin(time * 25) * 1.5) * S;

    // line
    ctx.strokeStyle = "rgba(235,240,255," + (0.25 + 0.3 * (pal.light || 1)) + ")";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    const sag = (G.state === "reel" ? 2 : 9) * S;
    ctx.quadraticCurveTo((tipX + bx) / 2, Math.max(tipY, by) + sag, bx, by);
    ctx.stroke();

    // bobber (red/white)
    const u = Math.max(1, Math.round(S));
    ctx.fillStyle = "#e8e8e8";
    ctx.fillRect(Math.round(bx) - u, Math.round(by) - u, 3 * u, u);
    ctx.fillStyle = "#d8453a";
    ctx.fillRect(Math.round(bx) - u, Math.round(by), 3 * u, u);

    // "!" alert above the bobber during a bite
    if (G.state === "bite") {
      const ex = Math.round(bx), ey = Math.round(by) - 16 * u + Math.round(Math.sin(time * 10) * u);
      ctx.fillStyle = "#10141f";
      ctx.fillRect(ex - 2 * u, ey - u, 6 * u, 11 * u);
      ctx.fillStyle = "#ffd66b";
      ctx.fillRect(ex, ey, 2 * u, 6 * u);
      ctx.fillRect(ex, ey + 7 * u, 2 * u, 2 * u);
    }
  }

  /* ------------------------------ clicks from the scene -------------- */
  // returns true if the click was consumed by the game
  function handleClick(lx, ly) {
    if (G.state === "cast") { lockPower(); return true; }
    if (G.state === "bite") { hookFish(); return true; }
    if (G.state === "wait" || G.state === "flying" || G.state === "reel") return true;
    if (G.state === "result") return true;
    return false;
  }

  function startAt(lx, ly) {
    if (G.state === "off") startGame(lx, ly);
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", buildUI);
  else buildUI();

  window.LakeGame = { frame, handleClick, startAt, isActive: () => G.state !== "off" };
})();
