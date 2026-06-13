/* ============================================================
   scrollbar.js — a themed wood & paper scrollbar that sits just
   to the right of the content column and nudges visitors to
   scroll. Drives (and mirrors) the #scroller scroll position.
   Purely cosmetic helper — no site content lives here.
   ============================================================ */
(function () {
  "use strict";

  const scroller = document.getElementById("scroller");
  const bar = document.getElementById("scrollbar");
  if (!scroller || !bar) return;

  const track = bar.querySelector(".sb-track");
  const thumb = bar.querySelector(".sb-thumb");
  const hint = bar.querySelector(".sb-hint");

  let trackH = 0, thumbH = 0, hasOverflow = false, userScrolled = false;

  function metrics() {
    const scrollH = scroller.scrollHeight;
    const clientH = scroller.clientHeight;
    return { scrollH, clientH, max: Math.max(0, scrollH - clientH) };
  }

  function update() {
    const { scrollH, clientH, max } = metrics();
    hasOverflow = max > 2;
    bar.classList.toggle("visible", hasOverflow);
    if (!hasOverflow) return;

    trackH = track.clientHeight;
    thumbH = Math.max(28, Math.round(trackH * (clientH / scrollH)));
    thumb.style.height = thumbH + "px";

    const t = scroller.scrollTop / max;            // 0..1
    thumb.style.transform =
      "translateY(" + Math.round((trackH - thumbH) * t) + "px)";

    // fade the "scroll down" nudge once the visitor is on their way,
    // and once they're near the bottom there's nothing left to nudge
    if (scroller.scrollTop > 24) userScrolled = true;
    bar.classList.toggle("nudge", !userScrolled && t < 0.85);
  }

  /* ---- drag the thumb ---- */
  let dragging = false, startY = 0, startTop = 0;

  thumb.addEventListener("pointerdown", (e) => {
    dragging = true;
    startY = e.clientY;
    startTop = scroller.scrollTop;
    thumb.setPointerCapture(e.pointerId);
    bar.classList.add("dragging");
    userScrolled = true;
    e.preventDefault();
  });
  thumb.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const { max } = metrics();
    const range = trackH - thumbH || 1;
    scroller.scrollTop = startTop + ((e.clientY - startY) / range) * max;
  });
  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    bar.classList.remove("dragging");
    try { thumb.releasePointerCapture(e.pointerId); } catch (_) {}
  }
  thumb.addEventListener("pointerup", endDrag);
  thumb.addEventListener("pointercancel", endDrag);

  /* ---- click the track to page toward the click ---- */
  track.addEventListener("pointerdown", (e) => {
    if (e.target === thumb) return;
    const dir = e.clientY < thumb.getBoundingClientRect().top ? -1 : 1;
    scroller.scrollBy({ top: dir * scroller.clientHeight * 0.9, behavior: "smooth" });
    userScrolled = true;
  });

  /* ---- keep in sync ---- */
  scroller.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  window.addEventListener("hashchange", () => { userScrolled = false; setTimeout(update, 0); });
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(update);
    ro.observe(document.getElementById("page"));
  }
  // content is injected by app.js after load; catch a few early reflows
  let ticks = 0;
  const warmup = setInterval(() => { update(); if (++ticks > 12) clearInterval(warmup); }, 120);

  update();
})();
