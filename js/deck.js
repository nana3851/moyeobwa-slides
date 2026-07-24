/* ============================================================
   deck.js — 내비게이션, 스케일링, 컷(cut) 러너, 프린트 모드
   ============================================================ */
(function () {
  "use strict";

  // ---------- 팔레트 · 공용 헬퍼 (canvas 모듈에서 사용) ----------
  window.PAL = {
    primary: "#0066cc",
    primaryOnDark: "#2997ff",
    ink: "#1d1d1f",
    inkMuted: "#7a7a7a",
    hairline: "#e0e0e0",
    canvas: "#ffffff",
    parchment: "#f5f5f7",
    dark: "#272729",
    mutedDark: "#cccccc",
  };

  window.DK = {
    font(size, weight) {
      return (
        (weight || 400) +
        " " +
        size +
        'px "Pretendard Variable", Pretendard, -apple-system, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif'
      );
    },
    rr(ctx, x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    },
    ease(t) { return 1 - Math.pow(1 - t, 3); },
    // frame-by-frame: t(0~1)를 n단계 스텝으로 양자화 (스토리보드 컷 느낌)
    step(t, n) { return t >= 1 ? 1 : Math.floor(t * n) / n; },
    clamp01(t) { return Math.max(0, Math.min(1, t)); },
    // 구간 진행률: t가 [a,b] 사이에서 0→1
    seg(t, a, b) { return Math.max(0, Math.min(1, (t - a) / (b - a))); },
    alpha(hex, a) {
      const n = parseInt(hex.slice(1), 16);
      return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
    },
  };

  // 애니메이션 모듈 등록소 — 각 anim/*.js가 ANIMS[name] = {cuts, onCut?} 등록
  window.ANIMS = window.ANIMS || {};

  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PRINT = /[?&]print/.test(location.search);
  const FIN = /[?&]fin/.test(location.search); // QA용: 진입 즉시 최종 프레임

  // ---------- CutRunner ----------
  // cuts: [{ d: ms, auto: bool, draw(ctx, t, S) }]
  // 누적 렌더: 매 프레임 clear 후 지나간 컷은 t=1, 현재 컷은 진행 t로 draw
  function CutRunner(canvas, def, slideEl) {
    this.canvas = canvas;
    this.def = def;
    this.slideEl = slideEl;
    this.ctx = canvas.getContext("2d");
    this.cut = -1;
    this.t = 0;
    this.playing = false;
    this._raf = null;
    this.resize();
  }
  CutRunner.prototype.resize = function () {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cssW = parseFloat(getComputedStyle(this.canvas).width);
    const cssH = parseFloat(getComputedStyle(this.canvas).height);
    this.W = cssW; this.H = cssH;
    this.canvas.width = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssH * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.S = { W: cssW, H: cssH, PAL: window.PAL, DK: window.DK };
    this.render();
  };
  CutRunner.prototype.render = function () {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.W, this.H);
    for (let i = 0; i <= this.cut && i < this.def.cuts.length; i++) {
      const t = i < this.cut ? 1 : this.t;
      ctx.save();
      this.def.cuts[i].draw(ctx, t, this.S);
      ctx.restore();
    }
  };
  CutRunner.prototype._completeCut = function (i, chain) {
    cancelAnimationFrame(this._raf);
    clearTimeout(this._guard);
    this.t = 1; this.playing = false;
    this.render();
    if (chain) {
      const next = this.def.cuts[i + 1];
      if (next && next.auto) this.playCut(i + 1);
    }
  };
  CutRunner.prototype.playCut = function (i) {
    if (i >= this.def.cuts.length) return;
    this.cut = i;
    this.t = 0;
    this.playing = true;
    if (this.def.onCut) this.def.onCut(i, this.slideEl);
    if (REDUCED || PRINT) { this.finish(); return; }
    const dur = this.def.cuts[i].d || 600;
    const t0 = performance.now();
    cancelAnimationFrame(this._raf);
    clearTimeout(this._guard);
    const loop = () => {
      const raw = Math.min(1, (performance.now() - t0) / dur);
      this.t = DK.ease(raw);
      this.render();
      if (raw < 1) this._raf = requestAnimationFrame(loop);
      else this._completeCut(i, true);
    };
    this._raf = requestAnimationFrame(loop);
    // rAF가 스로틀되어도 컷 완료·자동 체인은 보장
    this._guard = setTimeout(() => {
      if (this.playing && this.cut === i) this._completeCut(i, true);
    }, dur + 150);
  };
  CutRunner.prototype.next = function () {
    if (this.playing) { // 진행 중이면 현재 컷 즉시 완료
      this._completeCut(this.cut, true);
      return true;
    }
    if (this.cut < this.def.cuts.length - 1) { this.playCut(this.cut + 1); return true; }
    return false;
  };
  CutRunner.prototype.start = function () { this.playCut(0); };
  CutRunner.prototype.reset = function () {
    cancelAnimationFrame(this._raf);
    clearTimeout(this._guard);
    this.cut = -1; this.t = 0; this.playing = false;
    this.render();
  };
  CutRunner.prototype.finish = function () {
    cancelAnimationFrame(this._raf);
    clearTimeout(this._guard);
    this.cut = this.def.cuts.length - 1;
    this.t = 1; this.playing = false;
    if (this.def.onCut) for (let i = 0; i <= this.cut; i++) this.def.onCut(i, this.slideEl);
    this.render();
  };

  // ---------- 덱 초기화 ----------
  const deck = document.getElementById("deck");
  const slides = Array.from(document.querySelectorAll(".slide"));
  const pageNum = document.getElementById("pageNum");
  const MAIN_COUNT = slides.filter((s) => !s.classList.contains("appendix")).length;
  let cur = 0;
  const runners = new Map(); // slideEl -> CutRunner

  slides.forEach((el) => {
    const name = el.dataset.anim;
    if (name && window.ANIMS[name]) {
      const cv = el.querySelector("canvas");
      if (cv) runners.set(el, new CutRunner(cv, window.ANIMS[name], el));
    }
  });

  function scale() {
    const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    if (!s || s <= 0) { requestAnimationFrame(scale); return; }
    deck.style.transform = "scale(" + s + ")";
  }

  function updatePage() {
    const el = slides[cur];
    if (el.classList.contains("appendix")) {
      pageNum.textContent = "Appendix · " + el.id.toUpperCase();
    } else {
      pageNum.textContent = (cur + 1) + " / " + MAIN_COUNT;
    }
  }

  function goto(i, viaHash) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    if (i === cur && slides[cur].classList.contains("active")) return;
    slides[cur].classList.remove("active");
    cur = i;
    const el = slides[cur];
    el.classList.add("active");
    el.querySelectorAll(".reveal").forEach((r) => r.classList.remove("on"));
    const runner = runners.get(el);
    if (runner) {
      runner.reset();
      if (FIN || el.dataset.animStatic !== undefined) runner.finish();
      else setTimeout(() => runner.start(), 380);
    }
    if (!viaHash) history.replaceState(null, "", "#" + el.id);
    updatePage();
  }

  function nextStep() {
    const runner = runners.get(slides[cur]);
    if (runner && runner.next()) return;
    goto(cur + 1);
  }

  // ---------- 키보드 ----------
  document.addEventListener("keydown", (e) => {
    if (PRINT) return;
    switch (e.key) {
      case "ArrowRight":
      case " ":
      case "PageDown":
        e.preventDefault(); nextStep(); break;
      case "ArrowLeft":
      case "PageUp":
        e.preventDefault(); goto(cur - 1); break;
      case "Home": goto(0); break;
      case "End": goto(slides.length - 1); break;
      case "r": case "R": {
        const runner = runners.get(slides[cur]);
        if (runner) {
          if (slides[cur].dataset.animStatic !== undefined) runner.finish();
          else { runner.reset(); runner.start(); }
        }
        break;
      }
      case "f": case "F":
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen();
        break;
      case "p": case "P":
        location.search = "?print";
        break;
    }
  });
  document.addEventListener("click", (e) => {
    if (PRINT) return;
    if (e.target.closest("a")) return;
    nextStep();
  });

  window.addEventListener("resize", () => {
    scale();
    runners.forEach((r) => r.resize());
  });

  // ---------- 시작 ----------
  function boot() {
    if (PRINT) {
      document.body.classList.add("print");
      slides.forEach((el) => el.classList.add("active"));
      runners.forEach((r) => { r.resize(); r.finish(); });
      pageNum.style.display = "none";
      return;
    }
    scale();
    const hash = location.hash.replace("#", "");
    const idx = Math.max(0, slides.findIndex((s) => s.id === hash));
    slides[idx].classList.add("active");
    cur = idx;
    const runner = runners.get(slides[cur]);
    if (runner) {
      if (FIN || slides[cur].dataset.animStatic !== undefined) runner.finish();
      else setTimeout(() => runner.start(), 450);
    }
    updatePage();
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { runners.forEach((r) => r.render()); });
  }
  window.addEventListener("load", () => {
    scale();
    runners.forEach((r) => r.resize());
  });
  boot();
})();
