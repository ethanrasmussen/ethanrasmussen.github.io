/* ============================================================
   app.js — hash router + renders pages from content/*.js
   You shouldn't need to edit this to update site content.
   ============================================================ */
(function () {
  "use strict";

  const C = window.PORTFOLIO || {};
  const site = C.site || {};
  const pageEl = document.getElementById("page");
  const footerEl = document.getElementById("footer");

  /* ---------- tiny markdown-lite formatter ---------- */
  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function fmt(s) {
    if (s == null) return "";
    let t = esc(s);
    t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>');
    t = t.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
    t = t.replace(/\*([^*]+)\*/g, "<i>$1</i>");
    t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
    t = t.replace(/\n/g, "<br>");
    return t;
  }
  const has = (v) => v != null && String(v).trim() !== "";
  const list = (v) => (Array.isArray(v) ? v : []);

  /* ---------- nav setup ---------- */
  const brand = document.getElementById("brand");
  if (has(site.navTitle)) brand.textContent = site.navTitle;
  // if (has(site.name)) document.title = site.name;
  document.title = "Ethan Rasmussen's Portfolio | Software & AI"
  const li = document.getElementById("link-linkedin");
  const gh = document.getElementById("link-github");
  if (has(site.linkedin)) li.href = site.linkedin; else li.style.display = "none";
  if (has(site.github)) gh.href = site.github; else gh.style.display = "none";

  /* ---------- page: My Experience ---------- */
  function renderAbout() {
    const a = C.about || {};
    let html = "";

    html += '<section class="panel">';
    html += `<h1 class="hero-title">Hi! I'm ${esc(site.name || "…")}</h1>`;
    if (has(a.tagline)) html += `<p class="hero-tagline">${fmt(a.tagline)}</p>`;
    if (has(a.summary)) html += `<p class="hero-summary">${fmt(a.summary)}</p>`;
    html += "</section>";

    const exp = list(a.experience);
    if (exp.length) {
      html += '<section class="panel"><h2 class="section-title">Experience</h2>';
      for (const co of exp) {
        html += '<div class="company">';
        if (has(co.company)) html += `<p class="company-name">${fmt(co.company)}</p>`;
        if (has(co.location)) html += `<p class="company-loc">${fmt(co.location)}</p>`;
        for (const r of list(co.roles)) {
          html += '<div class="role">';
          if (has(r.title)) html += `<p class="role-title">${fmt(r.title)}</p>`;
          const meta = [];
          if (has(r.start) || has(r.end))
            meta.push([r.start, r.end].filter(has).map(esc).join(" – "));
          if (has(r.location)) meta.push(esc(r.location));
          if (meta.length) html += `<p class="role-meta">${meta.join(" · ")}</p>`;
          if (has(r.description)) html += `<p class="role-desc">${fmt(r.description)}</p>`;
          const det = list(r.details).filter(has);
          if (det.length)
            html += `<ul class="role-details">${det.map((d) => `<li>${fmt(d)}</li>`).join("")}</ul>`;
          html += "</div>";
        }
        html += "</div>";
      }
      html += "</section>";
    }

    const edu = list(a.education);
    if (edu.length) {
      html += '<section class="panel"><h2 class="section-title">Education</h2>';
      for (const e of edu) {
        html += '<div class="entry">';
        const deg = [e.degree, e.field].filter(has).map(esc).join(", ");
        if (has(e.school))
          html += `<p class="entry-title">${fmt(e.school)}</p>`;
        const meta = [];
        if (deg) meta.push(deg);
        if (has(e.start) || has(e.end))
          meta.push([e.start, e.end].filter(has).map(esc).join(" – "));
        if (has(e.location)) meta.push(esc(e.location));
        if (meta.length) html += `<p class="entry-meta">${meta.join(" · ")}</p>`;
        const det = list(e.details).filter(has);
        if (det.length)
          html += `<ul class="role-details">${det.map((d) => `<li>${fmt(d)}</li>`).join("")}</ul>`;
        html += "</div>";
      }
      html += "</section>";
    }

    const certs = list(a.certifications);
    if (certs.length) {
      html += '<section class="panel"><h2 class="section-title">Licenses &amp; Certifications</h2>';
      for (const c of certs) {
        html += '<div class="entry">';
        if (has(c.name)) {
          html += `<p class="entry-title">${
            has(c.link)
              ? `<a href="${esc(c.link)}" target="_blank" rel="noopener">${fmt(c.name)}</a>`
              : fmt(c.name)
          }</p>`;
        }
        const meta = [c.issuer, c.date].filter(has).map(esc).join(" · ");
        if (meta) html += `<p class="entry-meta">${meta}</p>`;
        html += "</div>";
      }
      html += "</section>";
    }

    const skills = list(a.skills).filter(has);
    if (skills.length) {
      html += '<section class="panel"><h2 class="section-title">Skills</h2><div class="chips">';
      html += skills.map((s) => `<span class="chip">${fmt(s)}</span>`).join("");
      html += "</div></section>";
    }

    return html;
  }

  /* ---------- page: Personal Projects ---------- */
  function renderProjects() {
    const projects = list(C.projects);
    let html = '<section class="panel"><h2 class="section-title">Personal Projects</h2></section>';
    if (!projects.length)
      return html + '<section class="panel"><p class="empty-note">No projects yet — add some in content/projects.js!</p></section>';

    html += '<div class="tile-grid">';
    for (const p of projects) {
      html += '<article class="tile">';
      if (has(p.video) && has(p.image)) {
        // both provided: show the image, play the video (looped) on hover
        html +=
          '<div class="tile-media hoverable"' +
          ' onmouseenter="var v=this.querySelector(\'video\');if(v){v.play();}"' +
          ' onmouseleave="var v=this.querySelector(\'video\');if(v){v.pause();v.currentTime=0;}">' +
          `<img src="${esc(p.image)}" alt="${esc(p.title || "Project image")}" loading="lazy">` +
          `<video src="${esc(p.video)}" loop muted playsinline preload="metadata"></video>` +
          '<span class="media-badge">▶ HOVER TO PREVIEW</span>' +
          "</div>";
      } else if (has(p.video)) {
        html += `<div class="tile-media"><video src="${esc(p.video)}" autoplay loop muted playsinline></video></div>`;
      } else if (has(p.image)) {
        html += `<div class="tile-media"><img src="${esc(p.image)}" alt="${esc(p.title || "Project image")}" loading="lazy"></div>`;
      }
      html += '<div class="tile-body">';
      if (has(p.title)) {
        html += `<h3 class="tile-title">${
          has(p.link)
            ? `<a href="${esc(p.link)}" target="_blank" rel="noopener">${fmt(p.title)}</a>`
            : fmt(p.title)
        }</h3>`;
      }
      if (has(p.description)) html += `<p class="tile-desc">${fmt(p.description)}</p>`;
      if (has(p.link))
        html += `<a class="tile-link" href="${esc(p.link)}" target="_blank" rel="noopener">VISIT ↗</a>`;
      html += "</div></article>";
    }
    html += "</div>";
    return html;
  }

  /* ---------- page: Research & Publications ---------- */
  const BADGES = {
    "in progress":      { cls: "badge-progress",   label: "IN PROGRESS" },
    "in peer review":   { cls: "badge-review",     label: "IN PEER REVIEW" },
    "pre-print":        { cls: "badge-preprint",   label: "PRE-PRINT" },
    "preprint":         { cls: "badge-preprint",   label: "PRE-PRINT" },
    "conference paper": { cls: "badge-conference", label: "CONFERENCE PAPER" },
    "journal paper":    { cls: "badge-journal",    label: "JOURNAL PAPER" },
  };

  function renderResearch() {
    const papers = list(C.research);
    let html = '<section class="panel"><h2 class="section-title">Research &amp; Publications</h2>';
    if (!papers.length) {
      html += '<p class="empty-note">No research entries yet — add some in content/research.js!</p>';
      return html + "</section>";
    }
    for (const p of papers) {
      html += '<div class="paper">';
      if (has(p.status)) {
        const b = BADGES[String(p.status).toLowerCase()] ||
                  { cls: "badge-progress", label: esc(p.status).toUpperCase() };
        html += `<span class="badge ${b.cls}">${b.label}</span>`;
      }
      if (has(p.title)) {
        html += `<p class="paper-title">${
          has(p.link)
            ? `<a href="${esc(p.link)}" target="_blank" rel="noopener">${fmt(p.title)}</a>`
            : fmt(p.title)
        }</p>`;
      }
      if (has(p.authors)) html += `<p class="paper-authors">${fmt(p.authors)}</p>`;
      if (has(p.venue)) html += `<p class="paper-venue">${fmt(p.venue)}</p>`;
      if (has(p.description)) html += `<p class="paper-desc">${fmt(p.description)}</p>`;
      if (has(p.link))
        html += `<p><a class="paper-link" href="${esc(p.link)}" target="_blank" rel="noopener">View publication ↗</a></p>`;
      html += "</div>";
    }
    return html + "</section>";
  }

  /* ---------- router ---------- */
  const ROUTES = {
    "/": renderAbout,
    "/projects": renderProjects,
    "/research": renderResearch,
  };

  function route() {
    const hash = location.hash.replace(/^#/, "") || "/";
    const render = ROUTES[hash] || renderAbout;
    pageEl.innerHTML = render();
    document.querySelectorAll(".tabs a").forEach((a) => {
      a.classList.toggle("active", (a.dataset.route || "/") === (ROUTES[hash] ? hash : "/"));
    });
    document.getElementById("scroller").scrollTop = 0;
  }

  // footerEl.innerHTML =
  //   (has(site.footerNote) ? fmt(site.footerNote) + "<br>" : "") +
  //   `© ${new Date().getFullYear()} ${esc(site.name || "")}`;

  window.addEventListener("hashchange", route);
  route();
})();
