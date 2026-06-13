/* ============================================================
   scene.js — the living pixel-art lake.

   Everything is drawn procedurally at a low internal resolution
   and scaled up with image-rendering.

   BASE_W is the reference resolution; S scales every metric so
   the art renders at higher fidelity on larger screens.

   The palette blends with YOUR local time of day:
     night → dawn → day → golden hour → dusk → night
   (test other times with  ?hour=19.5  in the URL)
   ============================================================ */
(function () {
  "use strict";

  const canvas = document.getElementById("scene");
  const ctx = canvas.getContext("2d");
  const BASE_W = 480;

  /* ------------------------------ utils ------------------------------ */
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const lerp = (a, b, t) => a + (b - a) * t;
  const R = Math.round;
  function hexRgb(h) {
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  }
  const rgbStr = (c) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
  const rgbaStr = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  function lerpC(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
  // dim + cool a sprite color for night-time
  function lit(c, light) {
    const k = 0.3 + 0.7 * light;
    const nightBlend = (1 - light) * 0.35;
    return [
      lerp(c[0] * k, 60, nightBlend),
      lerp(c[1] * k, 75, nightBlend),
      lerp(c[2] * k, 130, nightBlend),
    ];
  }

  /* ------------------------------ palettes --------------------------- */
  function P(o) { // hex → rgb arrays once
    const out = {};
    for (const k in o) out[k] = typeof o[k] === "string" ? hexRgb(o[k]) : o[k];
    return out;
  }
  const NIGHT = P({
    skyTop: "#070b1e", skyMid: "#141f49", skyHorizon: "#2a3a6e",
    waterTop: "#1d2b58", waterBottom: "#0a1130",
    mtnFar: "#1f2950", mtnNear: "#151d3e", snow: "#8fa0cf",
    treeFar: "#16224a", treeNear: "#0d1736", treeGold: "#2c3358",
    shore: "#0a1228", reed: "#1c2a52",
    cloudLit: "#3a4a7e", cloudShade: "#25325e",
    glitter: "#cfe0ff", sunCore: "#f2f4ff", sunGlow: "#aebdf0",
    starA: 1, auroraA: 0.85, sunA: 0, moonA: 1, light: 0.42,
  });
  const DAWN = P({
    skyTop: "#6a7ec9", skyMid: "#d99bb0", skyHorizon: "#ffd9a8",
    waterTop: "#e0b4a4", waterBottom: "#7d89c0",
    mtnFar: "#8d7fae", mtnNear: "#6d5f95", snow: "#ffe9d8",
    treeFar: "#5d5680", treeNear: "#3f3f63", treeGold: "#b87f63",
    shore: "#3a3a58", reed: "#565077",
    cloudLit: "#ffe3c8", cloudShade: "#c98ba2",
    glitter: "#fff0d0", sunCore: "#ffe9b8", sunGlow: "#ffc98a",
    starA: 0.12, auroraA: 0, sunA: 1, moonA: 0, light: 0.85,
  });
  const DAY = P({
    skyTop: "#4f8fd6", skyMid: "#79b4e8", skyHorizon: "#cfe8f5",
    waterTop: "#a4d0e6", waterBottom: "#5d9fc9",
    mtnFar: "#7d97c0", mtnNear: "#5f7fa8", snow: "#eef5fb",
    treeFar: "#57825f", treeNear: "#2f5a40", treeGold: "#c9963f",
    shore: "#2e4a3a", reed: "#4a6a3f",
    cloudLit: "#ffffff", cloudShade: "#c9d8ea",
    glitter: "#ffffff", sunCore: "#fff7d8", sunGlow: "#ffeaa0",
    starA: 0, auroraA: 0, sunA: 1, moonA: 0, light: 1,
  });
  const GOLDEN = P({
    skyTop: "#7a6a9e", skyMid: "#e88a5f", skyHorizon: "#ffd27a",
    waterTop: "#f0a868", waterBottom: "#6d5580",
    mtnFar: "#9a6f7e", mtnNear: "#74536b", snow: "#ffd9b0",
    treeFar: "#5d4a5e", treeNear: "#3f3147", treeGold: "#d98a3a",
    shore: "#38283c", reed: "#5f4453",
    cloudLit: "#ffcf9a", cloudShade: "#b06a78",
    glitter: "#ffe9b0", sunCore: "#fff3c0", sunGlow: "#ff9e4d",
    starA: 0.05, auroraA: 0, sunA: 1, moonA: 0, light: 0.9,
  });
  const DUSK = P({
    skyTop: "#2e2a5e", skyMid: "#5e4a8e", skyHorizon: "#c97a8e",
    waterTop: "#8e6595", waterBottom: "#2e2a5a",
    mtnFar: "#4f4378", mtnNear: "#3a3060", snow: "#c9b8d8",
    treeFar: "#2c2950", treeNear: "#1c1c3c", treeGold: "#7a5570",
    shore: "#161430", reed: "#2e2a52",
    cloudLit: "#9a7aa8", cloudShade: "#5d4878",
    glitter: "#ffd9c0", sunCore: "#ffe0b0", sunGlow: "#e88a6f",
    starA: 0.5, auroraA: 0.15, sunA: 0.3, moonA: 0.4, light: 0.6,
  });

  const KEYS = [
    [0.0, NIGHT], [4.7, NIGHT], [5.8, DAWN], [7.5, DAY],
    [16.8, DAY], [18.2, GOLDEN], [19.3, DUSK], [20.8, NIGHT], [24.0, NIGHT],
  ];

  const params = new URLSearchParams(location.search);
  const hourOverride = params.has("hour") ? parseFloat(params.get("hour")) : null;

  function currentHour() {
    if (hourOverride != null && !isNaN(hourOverride)) return hourOverride % 24;
    const d = new Date();
    return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
  }

  function palAt(hour) {
    let a = KEYS[0], b = KEYS[KEYS.length - 1];
    for (let i = 0; i < KEYS.length - 1; i++) {
      if (hour >= KEYS[i][0] && hour <= KEYS[i + 1][0]) { a = KEYS[i]; b = KEYS[i + 1]; break; }
    }
    const span = b[0] - a[0] || 1;
    const t = (hour - a[0]) / span;
    const out = {};
    for (const k in a[1]) {
      out[k] = typeof a[1][k] === "number"
        ? lerp(a[1][k], b[1][k], t)
        : lerpC(a[1][k], b[1][k], t);
    }
    return out;
  }

  function phaseName(hour) {
    if (hour < 4.7 || hour >= 20.3) return "night";
    if (hour < 7.2) return "dawn";
    if (hour < 17.5) return "day";
    return "dusk";
  }

  /* ------------------------------ layout ------------------------------ */
  let LW = 960, LH = 540, S = 2, sceneH, waterH, horizonY;
  const ENV = {};

  /* offscreen layers */
  const mkC = () => document.createElement("canvas");
  const maskMtnFar = mkC(), maskMtnNear = mkC(), maskSnow = mkC(),
        maskTreeFar = mkC(), maskTreeGold = mkC(), maskTreeNear = mkC(),
        maskShore = mkC();
  const backdrop = mkC(), backdropRefl = mkC(), shoreTinted = mkC(), tintTmp = mkC();

  let clouds = [], stars = [], shimmer = [], reeds = [], grass = [], fireflies = [];
  let ripples = [], birds = [], fishJumps = [];
  let birdTimer = 14, jumpTimer = 7;

  function resize() {
    const cw = window.innerWidth, ch = window.innerHeight;
    LW = cw > 900 ? 960 : 640;
    S = LW / BASE_W;
    LH = Math.max(R(160 * S), R(LW * ch / cw));
    canvas.width = LW; canvas.height = LH;
    ctx.imageSmoothingEnabled = false;

    sceneH = Math.min(170 * S, Math.max(80 * S, R(LH * 0.34)));
    waterH = R(sceneH * 0.62);
    horizonY = LH - waterH;

    ENV.LW = LW; ENV.LH = LH; ENV.horizonY = horizonY; ENV.waterH = waterH; ENV.S = S;

    for (const c of [maskMtnFar, maskMtnNear, maskSnow, maskTreeFar, maskTreeGold,
                     maskTreeNear, maskShore, backdrop, backdropRefl, shoreTinted, tintTmp]) {
      c.width = LW; c.height = LH;
    }
    buildStatic();
    buildAtmos();
    rebuildTinted(palAt(currentHour()));
  }

  /* ------------------------------ static masks ----------------------- */
  function ridge(mask, rnd, peakCount, hMin, hMax, baseY) {
    const m = mask.getContext("2d");
    m.fillStyle = "#fff";
    const peaks = [];
    for (let i = 0; i < peakCount; i++) {
      peaks.push({
        x: (i + 0.2 + rnd() * 0.6) * (LW / peakCount),
        h: hMin + rnd() * (hMax - hMin),
        hw: (40 + rnd() * 70) * S,
      });
    }
    const tops = [];
    for (let x = 0; x < LW; x++) {
      let h = 4 * S;
      for (const p of peaks) {
        const d = Math.abs(x - p.x);
        if (d < p.hw) h = Math.max(h, p.h * (1 - d / p.hw));
      }
      h = R(h / 2) * 2; // chunky pixel steps
      tops[x] = baseY - h;
      m.fillRect(x, baseY - h, 1, h + 1);
    }
    return { peaks, tops };
  }

  function drawPineMask(m, x, baseY, h, rnd) {
    m.fillRect(x, baseY - 2 * S, Math.max(1, R(S * 0.7)), 2 * S); // trunk root
    const top = baseY - h;
    for (let y = R(top); y < baseY - 1; y++) {
      const f = (y - top) / h;
      let w = Math.max(1, R(f * h * 0.42 + (rnd() - 0.5) * S));
      m.fillRect(x - w, y, w * 2 + 1, 1);
    }
  }

  function buildStatic() {
    const rnd = mulberry32(1337);

    // mountains
    maskMtnFar.getContext("2d").clearRect(0, 0, LW, LH);
    maskMtnNear.getContext("2d").clearRect(0, 0, LW, LH);
    maskSnow.getContext("2d").clearRect(0, 0, LW, LH);
    const far = ridge(maskMtnFar, rnd, 5, 34 * S, Math.min(60 * S, horizonY - 8 * S), horizonY);
    ridge(maskMtnNear, rnd, 4, 14 * S, 30 * S, horizonY);

    // snow caps on the tall far peaks
    const sm = maskSnow.getContext("2d");
    sm.fillStyle = "#fff";
    const capW = R(7 * S);
    for (const p of far.peaks) {
      if (p.h < 40 * S) continue;
      const px = R(p.x);
      for (let dx = -capW; dx <= capW; dx++) {
        const x = px + dx;
        if (x < 0 || x >= LW) continue;
        const capH = Math.max(0, R((capW - Math.abs(dx)) * 0.9));
        if (capH > 0) sm.fillRect(x, far.tops[x], 1, capH);
        if (rnd() < 0.3 && capH > 0) sm.fillRect(x, far.tops[x] + capH, 1, 1); // dither
      }
    }

    // tree bands
    const tf = maskTreeFar.getContext("2d");
    tf.clearRect(0, 0, LW, LH); tf.fillStyle = "#fff";
    for (let x = -4; x < LW + 4; x += R((3 + rnd() * 4) * S)) {
      drawPineMask(tf, x, R(horizonY - 5 * S + rnd() * 3 * S), (6 + rnd() * 7) * S, rnd);
    }
    // golden autumn canopies tucked between the bands
    const tg = maskTreeGold.getContext("2d");
    tg.clearRect(0, 0, LW, LH); tg.fillStyle = "#fff";
    const goldCount = R(LW / (40 * S));
    for (let i = 0; i < goldCount; i++) {
      const cx = rnd() * LW, r = (4 + rnd() * 5) * S, cy = horizonY - (3 + rnd() * 4) * S;
      for (let dy = -r; dy <= r; dy++) {
        const w = Math.sqrt(Math.max(0, r * r - dy * dy)) * (0.7 + rnd() * 0.4);
        tg.fillRect(R(cx - w), R(cy + dy * 0.7), R(w * 2), 1);
      }
    }
    const tn = maskTreeNear.getContext("2d");
    tn.clearRect(0, 0, LW, LH); tn.fillStyle = "#fff";
    for (let x = -4; x < LW + 4; x += R((3 + rnd() * 5) * S)) {
      drawPineMask(tn, x, R(horizonY + S - rnd() * 2 * S), (11 + rnd() * 12) * S, rnd);
    }

    // foreground shore mounds + rocks
    const sh = maskShore.getContext("2d");
    sh.clearRect(0, 0, LW, LH); sh.fillStyle = "#fff";
    sh.beginPath(); sh.ellipse(-18 * S, LH + 9 * S, LW * 0.24, 27 * S, 0, 0, Math.PI * 2); sh.fill();
    sh.beginPath(); sh.ellipse(LW + 18 * S, LH + 11 * S, LW * 0.28, 31 * S, 0, 0, Math.PI * 2); sh.fill();
    for (let i = 0; i < 4; i++) {
      const rx = (6 + rnd() * 10) * S;
      sh.beginPath();
      sh.ellipse(LW * 0.25 + rnd() * LW * 0.5, LH + 2 * S, rx, (3 + rnd() * 4) * S, 0, 0, Math.PI * 2);
      sh.fill();
    }
    // pixel-step the mound edges
    const yScan = Math.max(0, LH - R(44 * S));
    const img = sh.getImageData(0, yScan, LW, LH - yScan);
    for (let i = 3; i < img.data.length; i += 4) {
      img.data[i] = img.data[i] > 100 ? 255 : 0;
    }
    sh.putImageData(img, 0, yScan);

    // reed + grass placement on the shore mounds
    reeds = []; grass = [];
    const shoreTopAt = (x) => {
      // approximate surface height of the two mounds
      let y = LH + 2 * S;
      const e1 = 1 - Math.pow((x + 18 * S) / (LW * 0.24), 2);
      if (e1 > 0) y = Math.min(y, LH + 9 * S - 27 * S * Math.sqrt(e1));
      const e2 = 1 - Math.pow((x - LW - 18 * S) / (LW * 0.28), 2);
      if (e2 > 0) y = Math.min(y, LH + 11 * S - 31 * S * Math.sqrt(e2));
      return y;
    };
    const reedSpots = [];
    for (let x = 2 * S; x < LW * 0.2; x += 3 * S) reedSpots.push(x);
    for (let x = LW * 0.82; x < LW - 2 * S; x += 3 * S) reedSpots.push(x);
    for (const x of reedSpots) {
      const base = shoreTopAt(x);
      if (base > LH) continue;
      if (rnd() < 0.5) {
        reeds.push({
          x: R(x), y: R(base) + 1,
          h: R((8 + rnd() * 9) * S),
          amp: (0.8 + rnd() * 1.1) * S, ph: rnd() * 6.28,
          cattail: rnd() < 0.45,
        });
      }
      if (rnd() < 0.7) {
        grass.push({ x: R(x + (rnd() * 3 - 1) * S), y: R(base) + 1,
                     h: R((2 + rnd() * 3) * S), ph: rnd() * 6.28 });
      }
    }

    // fireflies hover near the reed banks
    fireflies = [];
    for (let i = 0; i < 11; i++) {
      const left = rnd() < 0.5;
      fireflies.push({
        x: left ? 10 * S + rnd() * LW * 0.16 : LW - 10 * S - rnd() * LW * 0.16,
        y: LH - 14 * S - rnd() * 26 * S,
        ph: rnd() * 6.28, sp: 0.4 + rnd() * 0.7,
      });
    }
  }

  /* ------------------------------ atmosphere ------------------------- */
  function buildAtmos() {
    const rnd = mulberry32(777);

    clouds = [];
    const n = R(LW / (55 * S));
    const rowH = Math.max(2, R(2.2 * S));
    for (let i = 0; i < n; i++) {
      const w = (26 + rnd() * 52) * S, rows = 3 + Math.floor(rnd() * 3);
      const blobs = [];
      for (let r = 0; r < rows; r++) {
        const rw = w * (1 - r * 0.22) * (0.8 + rnd() * 0.3);
        blobs.push({
          dx: R((w - rw) / 2 + (rnd() - 0.5) * 8 * S),
          dy: -r * rowH, w: R(rw), h: rowH,
        });
      }
      clouds.push({
        x: rnd() * (LW + 120 * S) - 60 * S,
        y: 8 * S + rnd() * Math.max(30 * S, horizonY * 0.78),
        sp: (1.2 + rnd() * 2.6) * S, blobs,
      });
    }

    stars = [];
    const starCount = R(75 * S);
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: R(rnd() * LW), y: R(rnd() * (horizonY - 8 * S)),
        tw: 0.5 + rnd() * 2, ph: rnd() * 6.28, big: rnd() < 0.12,
      });
    }

    shimmer = [];
    const shimCount = R(48 * S);
    for (let i = 0; i < shimCount; i++) {
      shimmer.push({
        x: rnd() * LW,
        y: horizonY + 2 * S + Math.pow(rnd(), 1.5) * (waterH - 8 * S),
        len: R((2 + rnd() * 7) * S),
        ph: rnd() * 6.28, sp: 0.6 + rnd() * 1.6,
      });
    }
  }

  /* ------------------------------ tinted caches ---------------------- */
  function tintInto(dst, mask, color, alpha) {
    const t = tintTmp.getContext("2d");
    t.clearRect(0, 0, LW, LH);
    t.globalCompositeOperation = "source-over";
    t.drawImage(mask, 0, 0);
    t.globalCompositeOperation = "source-in";
    t.fillStyle = rgbStr(color);
    t.fillRect(0, 0, LW, LH);
    const d = dst.getContext("2d");
    d.globalAlpha = alpha == null ? 1 : alpha;
    d.drawImage(tintTmp, 0, 0);
    d.globalAlpha = 1;
  }

  function rebuildTinted(pal) {
    const b = backdrop.getContext("2d");
    b.clearRect(0, 0, LW, LH);
    tintInto(backdrop, maskMtnFar, pal.mtnFar);
    tintInto(backdrop, maskSnow, pal.snow, 0.85);
    tintInto(backdrop, maskMtnNear, pal.mtnNear);
    tintInto(backdrop, maskTreeFar, pal.treeFar);
    tintInto(backdrop, maskTreeGold, pal.treeGold);
    tintInto(backdrop, maskTreeNear, pal.treeNear);

    // mirrored, squashed, darkened copy for the water reflection
    const r = backdropRefl.getContext("2d");
    r.clearRect(0, 0, LW, LH);
    r.save();
    r.scale(1, -0.55);
    r.drawImage(backdrop, 0, 0, LW, horizonY, 0, -horizonY, LW, horizonY);
    r.restore();
    r.globalCompositeOperation = "source-atop";
    r.fillStyle = rgbaStr(pal.waterTop, 0.45);
    r.fillRect(0, 0, LW, Math.ceil(horizonY * 0.55) + 2);
    r.globalCompositeOperation = "source-over";

    const s = shoreTinted.getContext("2d");
    s.clearRect(0, 0, LW, LH);
    tintInto(shoreTinted, maskShore, pal.shore);
  }

  /* ------------------------------ sprites ---------------------------- */
  /* High-detail pixel art. Hull is 62px wide with an outboard motor at
     the stern; person is 13x18 with beanie/jacket/overalls; cat is 11x10
     with two tail frames. */
  const HULL = [
    "mm............................................................",
    "MMm...........................................................",
    "MMm.........................................................G.",
    "MM........................................................GGG.",
    "MMGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG..",
    ".MHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHG...",
    "..hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh....",
    "..hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh......",
    "...dddddddddddddddddddddddddddddddddddddddddddddddddddd.......",
    "....dddddddddddddddddddddddddddddddddddddddddddddddd..........",
    "......bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb..............",
  ];
  const PERSON_IDLE = [
    "....kkkkk....",
    "...kkkkkkk...",
    "...KKKKKKK...",
    "...PPPPPP....",
    "...PPPPPQ....",
    "....PPPP.....",
    "..JJJJJJ.....",
    ".JJJJJJJJ....",
    ".JJJJJJJJA...",
    ".JJJJJJJAA...",
    ".jJJJJJJA....",
    ".jJJJJJJP....",
    ".jjJJJJj.....",
    ".jjjjjjj.....",
    ".nnnnnnn.....",
    ".nnn.nnn.....",
    ".nn...nn.....",
    ".nn...nn.....",
  ];
  const PERSON_CAST = [
    "....kkkkk..A.",
    "...kkkkkkkAA.",
    "...KKKKKKKA..",
    "...PPPPPPA...",
    "...PPPPPQ....",
    "....PPPP.....",
    "..JJJJJJ.....",
    ".JJJJJJJJ....",
    ".JJJJJJJJ....",
    ".JJJJJJJ.....",
    ".jJJJJJJ.....",
    ".jJJJJJJ.....",
    ".jjJJJJj.....",
    ".jjjjjjj.....",
    ".nnnnnnn.....",
    ".nnn.nnn.....",
    ".nn...nn.....",
    ".nn...nn.....",
  ];
  const CAT_A = [
    ".c..c......",
    ".cccc......",
    ".cEcc......",
    ".ccccw.....",
    "..cccw.....",
    ".cccccc..t.",
    ".cCcCcc.tt.",
    ".ccccccct..",
    ".cc..cc....",
    ".cc..cc....",
  ];
  const CAT_B = [
    ".c..c......",
    ".cccc......",
    ".cEcc......",
    ".ccccw.....",
    "..cccw.....",
    ".cccccc....",
    ".cCcCcc....",
    ".cccccctttt",
    ".cc..cc..t.",
    ".cc..cc....",
  ];
  const SPRITE_PAL = {
    G: hexRgb("#d8b078"), H: hexRgb("#b08850"), h: hexRgb("#8a6238"),
    d: hexRgb("#5f4226"), b: hexRgb("#44301c"),
    M: hexRgb("#3a3f46"), m: hexRgb("#6a7078"),
    k: hexRgb("#c14f33"), K: hexRgb("#e0784f"),
    P: hexRgb("#eec39a"), Q: hexRgb("#d8a87f"),
    J: hexRgb("#5a7a52"), j: hexRgb("#466041"), A: hexRgb("#5a7a52"),
    n: hexRgb("#3f4a5a"),
    c: hexRgb("#e2954a"), C: hexRgb("#a8651f"), w: hexRgb("#f2e6cf"),
    t: hexRgb("#c97f33"), E: hexRgb("#2b2420"),
  };

  function drawSprite(rows, x, y, flip, light) {
    x = R(x); y = R(y);
    const w = rows[0].length;
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        const col = SPRITE_PAL[ch];
        if (!col) continue;
        ctx.fillStyle = rgbStr(lit(col, light));
        ctx.fillRect(x + (flip ? w - 1 - i : i), y + r, 1, 1);
      }
    }
  }

  /* ------------------------------ the boat ---------------------------- */
  const boat = {
    x: 0, dir: 1, state: "fishing", t: 0, target: 0,
    bobber: { x: 0, y: 0, on: false, landed: false },
    catFrame: 0, catTimer: 2, heart: 0,
    nibbleT: 0,
  };
  let boatInit = false;

  function boatY() { return horizonY + R(waterH * 0.30); }

  function newTarget() {
    const margin = LW * 0.14;
    boat.target = boat.x > LW * 0.5
      ? margin + Math.random() * LW * 0.25
      : LW - margin - Math.random() * LW * 0.25;
    boat.dir = boat.target > boat.x ? 1 : -1;
  }

  function updateBoat(dt, time) {
    if (!boatInit) {
      boat.x = LW * 0.45;
      boat.bobber.on = true;
      boat.bobber.x = boat.x + 26 * S;
      boat.bobber.y = boatY() + 8 * S;
      boat.t = -Math.random() * 6;
      boatInit = true;
    }
    boat.t += dt;
    boat.catTimer -= dt;
    if (boat.catTimer <= 0) {
      boat.catFrame = 1 - boat.catFrame;
      boat.catTimer = 1.5 + Math.random() * 3;
      if (Math.random() < 0.15) boat.heart = 1.6;
    }
    if (boat.heart > 0) boat.heart -= dt;

    const by = boatY();

    switch (boat.state) {
      case "cruise": {
        boat.x += boat.dir * 7 * S * dt;
        if (Math.random() < dt * 2.2)
          ripples.push({ x: boat.x - boat.dir * 28, y: by + 5 * S, r: S, vr: 5 * S, maxR: 7 * S, a: 0.5 });
        if ((boat.dir > 0 && boat.x >= boat.target) || (boat.dir < 0 && boat.x <= boat.target)) {
          boat.state = "cast"; boat.t = 0;
        }
        break;
      }
      case "cast": {
        const p = boat.t / 0.9;
        if (p >= 0.55 && !boat.bobber.on) {
          boat.bobber.on = true;
          boat.bobber.landed = false;
          boat.bobber.fromX = boat.x + boat.dir * 24; boat.bobber.fromY = by - 16;
          boat.bobber.toX = boat.x + boat.dir * (26 + Math.random() * 16) * S;
          boat.bobber.toY = by + 6 * S + Math.random() * Math.min(10 * S, waterH * 0.25);
          boat.bobber.t = 0;
        }
        if (boat.bobber.on) {
          boat.bobber.t = Math.min(1, (boat.bobber.t || 0) + dt / 0.4);
          const k = boat.bobber.t;
          boat.bobber.x = lerp(boat.bobber.fromX, boat.bobber.toX, k);
          boat.bobber.y = lerp(boat.bobber.fromY, boat.bobber.toY, k) - Math.sin(k * Math.PI) * 9 * S;
          if (k >= 1 && !boat.bobber.landed) {
            boat.bobber.landed = true;
            ripples.push({ x: boat.bobber.x, y: boat.bobber.y, r: S, vr: 8 * S, maxR: 6 * S, a: 0.6 });
          }
        }
        if (p >= 1.2) {
          boat.state = "fishing"; boat.t = 0;
          boat.fishingDur = 9 + Math.random() * 9;
          boat.nibbleT = 2 + Math.random() * 5;
        }
        break;
      }
      case "fishing": {
        boat.nibbleT -= dt;
        if (boat.nibbleT <= 0) {
          boat.nibbleT = 2.5 + Math.random() * 5;
          ripples.push({ x: boat.bobber.x, y: boat.bobber.y, r: S, vr: 6 * S, maxR: 5 * S, a: 0.5 });
        }
        if (boat.t >= (boat.fishingDur || 12)) { boat.state = "reel"; boat.t = 0; }
        break;
      }
      case "reel": {
        const k = Math.min(1, boat.t / 0.8);
        boat.bobber.x = lerp(boat.bobber.x, boat.x + boat.dir * 16, k * 0.3);
        boat.bobber.y = lerp(boat.bobber.y, by - 8, k * 0.3);
        if (k >= 1) { boat.bobber.on = false; newTarget(); boat.state = "cruise"; boat.t = 0; }
        break;
      }
      default:
        boat.state = "fishing";
        boat.fishingDur = 8;
    }
  }

  function drawBoat(time, pal) {
    const light = pal.light;
    const bob = Math.sin(time * 1.7) * 0.8 * S;
    const by = boatY() + bob;
    const bx = boat.x;
    const d = boat.dir;

    // soft reflection smudge under the boat
    ctx.fillStyle = rgbaStr(lit(SPRITE_PAL.h, light), 0.22);
    ctx.beginPath();
    ctx.ellipse(R(bx), R(by + 5 * S), R(13 * S), R(2 * S), 0, 0, Math.PI * 2);
    ctx.fill();

    // person (sits a bit aft of center; lower body hides behind the hull)
    const casting = boat.state === "cast" && boat.t < 0.55;
    const personRows = casting ? PERSON_CAST : PERSON_IDLE;
    const breathe = !casting && Math.sin(time * 1.1) > 0.6 ? -1 : 0;
    const px = d > 0 ? bx - 13 : bx;
    drawSprite(personRows, px, by - 17 + breathe, d < 0, light);

    // cat at the bow
    const catRows = boat.catFrame ? CAT_B : CAT_A;
    const catX = d > 0 ? bx + 14 : bx - 25;
    drawSprite(catRows, catX, by - 11, d < 0, light);
    if (boat.heart > 0) {
      const u = Math.max(1, R(S * 0.7));
      const hy = R(by - 17 - (1.6 - boat.heart) * 3 * S);
      const hx = R(d > 0 ? bx + 18 : bx - 21);
      ctx.fillStyle = rgbaStr([232, 90, 110], Math.min(1, boat.heart));
      ctx.fillRect(hx, hy, u, u); ctx.fillRect(hx + 2 * u, hy, u, u);
      ctx.fillRect(hx, hy + u, 3 * u, u); ctx.fillRect(hx + u, hy + 2 * u, u, u);
    }

    // hull (drawn last so it covers laps and legs)
    drawSprite(HULL, bx - 31, by - 5, d < 0, light);

    // rod + line + bobber
    const handX = casting ? bx - d * 1 : bx - d * 5;
    const handY = casting ? by - 15 : by - 6;
    let rodAng = -0.65; // radians above horizontal, toward dir
    if (casting) {
      const p = boat.t / 0.55;
      rodAng = p < 0.5 ? lerp(-0.65, -1.9, p * 2) : lerp(-1.9, -0.4, (p - 0.5) * 2);
    }
    const rodLen = 15 * S;
    const tipX = handX + Math.cos(rodAng) * rodLen * d;
    const tipY = handY + Math.sin(rodAng) * rodLen;
    ctx.strokeStyle = rgbaStr(lit(hexRgb("#4a3018"), light), 0.95);
    ctx.lineWidth = Math.max(1, R(S * 0.7));
    ctx.beginPath(); ctx.moveTo(R(handX), R(handY));
    ctx.lineTo(R(tipX), R(tipY)); ctx.stroke();

    if (boat.bobber.on && !casting) {
      const bbx = boat.bobber.x, bby = boat.bobber.y + Math.sin(time * 2.1) * 0.7 * S;
      ctx.strokeStyle = rgbaStr(pal.glitter, 0.22 + 0.25 * light);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(R(tipX), R(tipY));
      ctx.quadraticCurveTo((tipX + bbx) / 2, Math.max(tipY, bby) + 6 * S, R(bbx), R(bby));
      ctx.stroke();
      const u = Math.max(1, R(S * 0.8));
      ctx.fillStyle = "#e8e8e8";
      ctx.fillRect(R(bbx) - u, R(bby) - u, 2 * u, u);
      ctx.fillStyle = "#d8453a";
      ctx.fillRect(R(bbx) - u, R(bby), 2 * u, u);
    }
  }

  /* ------------------------------ wildlife --------------------------- */
  function updateWildlife(dt, time, pal) {
    // birds (daytime-ish)
    birdTimer -= dt;
    if (birdTimer <= 0) {
      birdTimer = 18 + Math.random() * 22;
      if (pal.light > 0.35) {
        const fromLeft = Math.random() < 0.5;
        const y = 14 * S + Math.random() * Math.max(20 * S, horizonY * 0.5);
        const n = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) {
          birds.push({
            x: fromLeft ? -10 * S - i * 7 * S : LW + 10 * S + i * 7 * S,
            y: y + (i % 2) * 4 * S + i * S,
            vx: (fromLeft ? 1 : -1) * (16 + Math.random() * 6) * S,
          });
        }
      }
    }
    for (const b of birds) b.x += b.vx * dt;
    birds = birds.filter((b) => b.x > -20 * S && b.x < LW + 20 * S);

    // fish jumps
    jumpTimer -= dt;
    if (jumpTimer <= 0) {
      jumpTimer = 6 + Math.random() * 10;
      fishJumps.push({
        x: LW * 0.15 + Math.random() * LW * 0.7,
        y: horizonY + 6 * S + Math.random() * (waterH * 0.5),
        t: 0,
      });
    }
    for (const f of fishJumps) {
      f.t += dt;
      if (f.t > 0.65 && !f.splashed) {
        f.splashed = true;
        ripples.push({ x: f.x + 8 * S, y: f.y, r: S, vr: 9 * S, maxR: 8 * S, a: 0.55 });
      }
    }
    fishJumps = fishJumps.filter((f) => f.t < 0.7);

    // ripples
    for (const r of ripples) { r.r += r.vr * dt; r.a -= dt * 0.55; }
    ripples = ripples.filter((r) => r.a > 0 && r.r < r.maxR + 6 * S);
  }

  function drawWildlife(time, pal) {
    const g = Math.max(1, R(S * 0.7));
    // birds: tiny wing flaps
    ctx.fillStyle = rgbaStr(lit(hexRgb("#26303c"), pal.light), 0.9);
    const up = Math.floor(time * 5) % 2 === 0;
    for (const b of birds) {
      const x = R(b.x), y = R(b.y);
      if (up) {
        ctx.fillRect(x - 2 * g, y - g, 2 * g, g); ctx.fillRect(x + g, y - g, 2 * g, g);
        ctx.fillRect(x, y, g, g);
      } else {
        ctx.fillRect(x - 2 * g, y, 2 * g, g); ctx.fillRect(x + g, y, 2 * g, g);
        ctx.fillRect(x, y, g, g);
      }
    }
    // jumping fish: little dark arc
    for (const f of fishJumps) {
      const k = f.t / 0.65;
      const x = R(f.x + k * 9 * S);
      const y = R(f.y - Math.sin(k * Math.PI) * 7 * S);
      ctx.fillStyle = rgbaStr(lit(hexRgb("#3a4a58"), pal.light), 0.95);
      ctx.fillRect(x, y, 3 * g, g);
      ctx.fillRect(x + (k < 0.5 ? -g : 3 * g), y - g, g, g);
    }
  }

  /* ------------------------------ frame ------------------------------- */
  let lastFrame = 0, lastTintAt = 0, lastPhase = "";
  const start = performance.now();

  function frame(now) {
    requestAnimationFrame(frame);
    if (now - lastFrame < 33) return;
    const dt = Math.min(0.1, (now - lastFrame) / 1000);
    lastFrame = now;
    const time = (now - start) / 1000;

    const hour = currentHour();
    const pal = palAt(hour);

    // refresh tinted caches every couple seconds (palette drifts slowly)
    if (now - lastTintAt > 2000) { lastTintAt = now; rebuildTinted(pal); }

    const phase = phaseName(hour);
    if (phase !== lastPhase) {
      lastPhase = phase;
      document.documentElement.dataset.phase = phase;
    }

    /* ---- sky ---- */
    const g = ctx.createLinearGradient(0, 0, 0, horizonY);
    g.addColorStop(0, rgbStr(pal.skyTop));
    g.addColorStop(0.6, rgbStr(pal.skyMid));
    g.addColorStop(1, rgbStr(pal.skyHorizon));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, LW, horizonY);

    /* ---- stars ---- */
    if (pal.starA > 0.02) {
      const arm = Math.max(1, R(S * 0.5));
      for (const s of stars) {
        const a = pal.starA * (0.35 + 0.65 * Math.abs(Math.sin(time * s.tw + s.ph)));
        ctx.fillStyle = `rgba(232,238,255,${a.toFixed(3)})`;
        ctx.fillRect(s.x, s.y, 1, 1);
        if (s.big && a > 0.6) {
          ctx.fillStyle = `rgba(232,238,255,${(a * 0.5).toFixed(3)})`;
          ctx.fillRect(s.x - arm, s.y, arm, 1); ctx.fillRect(s.x + 1, s.y, arm, 1);
          ctx.fillRect(s.x, s.y - arm, 1, arm); ctx.fillRect(s.x, s.y + 1, 1, arm);
        }
      }
    }

    /* ---- aurora ---- */
    if (pal.auroraA > 0.02) {
      const pulse = 0.6 + 0.4 * Math.sin(time * 0.23);
      for (let band = 0; band < 2; band++) {
        ctx.strokeStyle = band === 0
          ? `rgba(80,230,170,${(0.06 * pal.auroraA * pulse).toFixed(3)})`
          : `rgba(110,200,235,${(0.05 * pal.auroraA * pulse).toFixed(3)})`;
        ctx.lineWidth = (13 - band * 4) * S;
        for (let pass = 0; pass < 2; pass++) {
          ctx.beginPath();
          for (let x = -8 * S; x <= LW + 8 * S; x += 8 * S) {
            const y = (16 + band * 17 + pass * 5) * S +
                      Math.sin(x * 0.016 / S + time * 0.13 + band * 2.2) * 11 * S +
                      Math.sin(x * 0.041 / S - time * 0.08) * 4 * S;
            if (x === -8 * S) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }
    }

    /* ---- sun & moon ---- */
    let lightX = LW * 0.5;
    if (pal.sunA > 0.02) {
      const f = Math.min(1, Math.max(0, (hour - 5.5) / (20 - 5.5)));
      const sx = lerp(LW * 0.12, LW * 0.88, f);
      const alt = Math.sin(f * Math.PI);
      const sy = horizonY + 4 * S - alt * Math.max(36 * S, horizonY * 0.72);
      lightX = sx;
      const rad = (6 + (1 - alt) * 5) * S;       // sun swells near the horizon
      const glowR = (30 + (1 - alt) * 24) * S;
      const glow = ctx.createRadialGradient(sx, sy, 2, sx, sy, glowR);
      glow.addColorStop(0, rgbaStr(pal.sunGlow, 0.55 * pal.sunA));
      glow.addColorStop(1, rgbaStr(pal.sunGlow, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(sx - glowR, sy - glowR, glowR * 2, glowR * 2);
      ctx.fillStyle = rgbaStr(pal.sunCore, pal.sunA);
      ctx.beginPath(); ctx.arc(R(sx), R(sy), rad, 0, Math.PI * 2); ctx.fill();
    }
    if (pal.moonA > 0.02) {
      const span = (hour + 24 - 19.5) % 24;       // 19.5 → 6.5 ≈ 11h arc
      const f = Math.min(1, Math.max(0, span / 11));
      const mx = lerp(LW * 0.15, LW * 0.85, f);
      const my = horizonY - Math.sin(f * Math.PI) * Math.max(34 * S, horizonY * 0.68) - 4 * S;
      lightX = mx;
      const glowR = 22 * S;
      const glow = ctx.createRadialGradient(mx, my, 2, mx, my, glowR);
      glow.addColorStop(0, rgbaStr(pal.sunGlow, 0.35 * pal.moonA));
      glow.addColorStop(1, rgbaStr(pal.sunGlow, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(mx - glowR, my - glowR, glowR * 2, glowR * 2);
      ctx.fillStyle = rgbaStr(pal.sunCore, pal.moonA);
      ctx.beginPath(); ctx.arc(R(mx), R(my), 5 * S, 0, Math.PI * 2); ctx.fill();
      // crescent bite
      ctx.fillStyle = rgbaStr(pal.skyTop, pal.moonA * 0.92);
      ctx.beginPath(); ctx.arc(R(mx) + 2 * S, R(my) - S, 4 * S, 0, Math.PI * 2); ctx.fill();
    }

    /* ---- clouds ---- */
    for (const c of clouds) {
      c.x += c.sp * dt;
      if (c.x > LW + 80 * S) { c.x = -90 * S; c.y = 8 * S + Math.random() * Math.max(30 * S, horizonY * 0.78); }
      const cx = R(c.x), cy = R(c.y);
      for (let i = 0; i < c.blobs.length; i++) {
        const bl = c.blobs[i];
        ctx.fillStyle = i === 0 ? rgbaStr(pal.cloudShade, 0.9) : rgbaStr(pal.cloudLit, 0.92);
        ctx.fillRect(cx + bl.dx, cy + bl.dy, bl.w, bl.h);
      }
    }

    /* ---- mountains + trees (cached) ---- */
    ctx.drawImage(backdrop, 0, 0);

    /* ---- water ---- */
    const wg = ctx.createLinearGradient(0, horizonY, 0, LH);
    wg.addColorStop(0, rgbStr(pal.waterTop));
    wg.addColorStop(1, rgbStr(pal.waterBottom));
    ctx.fillStyle = wg;
    ctx.fillRect(0, horizonY, LW, waterH);

    // waterline highlight
    ctx.fillStyle = rgbaStr(pal.glitter, 0.35);
    ctx.fillRect(0, horizonY, LW, Math.max(1, R(S * 0.7)));

    /* ---- reflection (wavy slices of the cached mirror) ---- */
    const reflMax = Math.min(waterH - 2, Math.ceil(horizonY * 0.55));
    ctx.globalAlpha = 0.4;
    for (let sy = 0; sy < reflMax; sy += 2) {
      const dx = R(Math.sin(time * 1.2 + sy * 0.33 / S) * (0.6 + sy * 0.015) * S);
      ctx.drawImage(backdropRefl, 0, sy, LW, 2, dx, horizonY + sy, LW, 2);
    }
    ctx.globalAlpha = 1;

    /* ---- shimmer + sun-glitter column ---- */
    const lightOn = Math.max(pal.sunA, pal.moonA);
    for (const s of shimmer) {
      let a = 0.1 + 0.32 * Math.abs(Math.sin(s.ph + time * s.sp));
      if (lightOn > 0.05) {
        const dxs = (s.x - lightX) / (26 * S);
        a *= 1 + 2.4 * Math.exp(-dxs * dxs) * lightOn;
      }
      ctx.fillStyle = rgbaStr(pal.glitter, Math.min(0.85, a) * 0.75);
      ctx.fillRect(R(s.x), R(s.y), s.len, 1);
    }

    /* ---- ripples ---- */
    ctx.lineWidth = Math.max(1, R(S * 0.6));
    for (const r of ripples) {
      ctx.strokeStyle = rgbaStr(pal.glitter, Math.max(0, r.a));
      ctx.beginPath();
      ctx.ellipse(R(r.x), R(r.y), r.r, Math.max(0.5, r.r * 0.35), 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.lineWidth = 1;

    /* ---- boat & wildlife ---- */
    updateBoat(dt, time);
    updateWildlife(dt, time, pal);
    drawBoat(time, pal);
    drawWildlife(time, pal);

    /* ---- foreground shore ---- */
    ctx.drawImage(shoreTinted, 0, 0);

    // grass tufts
    ctx.strokeStyle = rgbStr(pal.reed);
    ctx.lineWidth = 1;
    for (const t of grass) {
      const sway = Math.sin(time * 1.4 + t.ph) * 0.8 * S;
      ctx.beginPath();
      ctx.moveTo(t.x, t.y);
      ctx.lineTo(t.x + R(sway), t.y - t.h);
      ctx.stroke();
    }
    // reeds with cattail heads
    const reedW = Math.max(1, R(S * 0.8));
    for (const r of reeds) {
      const sway = Math.sin(time * 1.1 + r.ph) * r.amp;
      ctx.fillStyle = rgbStr(pal.reed);
      for (let i = 0; i < r.h; i += 1) {
        const f = i / r.h;
        ctx.fillRect(R(r.x + sway * f * f), r.y - i, reedW, 1);
      }
      if (r.cattail) {
        ctx.fillStyle = rgbStr(lit(hexRgb("#5d3f22"), pal.light));
        ctx.fillRect(R(r.x + sway * 0.9) - 1, R(r.y - r.h - 2 * S),
                     Math.max(2, R(1.5 * S)), Math.max(3, R(2.5 * S)));
      }
    }

    /* ---- fireflies ---- */
    if (pal.light < 0.55) {
      const fa = (0.55 - pal.light) / 0.55;
      const u = Math.max(1, R(S * 0.7));
      for (const f of fireflies) {
        const x = f.x + Math.sin(time * f.sp + f.ph) * 6 * S;
        const y = f.y + Math.cos(time * f.sp * 0.7 + f.ph * 2) * 4 * S;
        const glow = Math.abs(Math.sin(time * 1.3 + f.ph * 3));
        if (glow < 0.25) continue;
        ctx.fillStyle = `rgba(255,233,138,${(0.12 * glow * fa).toFixed(3)})`;
        ctx.fillRect(R(x) - u, R(y) - u, 3 * u, 3 * u);
        ctx.fillStyle = `rgba(255,240,160,${(0.9 * glow * fa).toFixed(3)})`;
        ctx.fillRect(R(x), R(y), u, u);
      }
    }

    /* ---- foreground pines (swaying) ---- */
    drawForegroundPine(LW - 13 * S, LH - 1, R(sceneH * 0.62), time, pal, 0);
    drawForegroundPine(LW - 30 * S, LH - 1, R(sceneH * 0.42), time, pal, 1.7);
    drawForegroundPine(11 * S, LH - 1, R(sceneH * 0.45), time, pal, 3.1);

    /* ---- mini-game tackle ---- */
    if (window.LakeGame) {
      window.LakeGame.frame(ctx, dt, time, ENV, pal, {
        ripple: (x, y) => ripples.push({ x, y, r: S, vr: 8 * S, maxR: 7 * S, a: 0.6 }),
      });
    }
  }

  function drawForegroundPine(x, baseY, h, time, pal, ph) {
    const dark = lerpC(pal.treeNear, [0, 0, 0], 0.35);
    ctx.fillStyle = rgbStr(dark);
    ctx.fillRect(R(x), R(baseY - 4 * S), Math.max(2, R(1.2 * S)), R(4 * S)); // trunk root
    const top = baseY - h;
    const tiers = 8;
    for (let t = 0; t < tiers; t++) {
      const yTop = top + (t / tiers) * h * 0.92;
      const yBot = top + ((t + 1) / tiers) * h * 0.92;
      const sway = R(Math.sin(time * 0.6 + ph + t * 0.5) * (1 - t / tiers) * 1.4 * S);
      for (let y = R(yTop); y < R(yBot); y++) {
        const f = (y - top) / h;
        const w = Math.max(1, R(f * h * 0.38));
        ctx.fillRect(R(x) - w + sway + 1, y, w * 2, 1);
      }
    }
  }

  /* ------------------------------ input ------------------------------ */
  function toLogical(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) / r.width * LW,
      y: (e.clientY - r.top) / r.height * LH,
    };
  }
  canvas.addEventListener("click", (e) => {
    if (!window.LakeGame) return;
    const p = toLogical(e);
    if (window.LakeGame.handleClick(p.x, p.y)) return;
    if (p.y > horizonY - 4 * S) window.LakeGame.startAt(p.x, p.y);
  });
  canvas.addEventListener("mousemove", (e) => {
    const p = toLogical(e);
    canvas.style.cursor = p.y > horizonY - 4 * S ? "pointer" : "default";
  });

  /* ------------------------------ go ------------------------------ */
  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(frame);
})();
