/* S1 — 시간표 교집합 인트로: 세 시간표가 겹치며 공통 공강이 점등 */
(function () {
  window.ANIMS = window.ANIMS || {};

  const COLS = 5, ROWS = 7;
  // 3인의 수업 블록 (col,row) — 목(col 3) row 3~4는 전원 비움
  const PEOPLE = [
    [[0,0],[0,1],[1,2],[2,0],[2,1],[3,0],[4,2],[4,3],[1,5],[2,5]],
    [[0,2],[0,3],[1,0],[1,1],[2,3],[3,5],[3,6],[4,0],[4,1],[2,6]],
    [[0,5],[0,6],[1,3],[1,4],[2,2],[3,1],[3,2],[4,5],[4,6],[0,4]],
  ];
  const FREE = [[3,3],[3,4]]; // 공통 공강: 목 16:00~18:00

  function card(ctx, x, y, w, h, blocks, alpha, S) {
    const { PAL, DK } = S;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = PAL.canvas;
    ctx.strokeStyle = PAL.hairline;
    ctx.lineWidth = 1.5;
    DK.rr(ctx, x, y, w, h, 16);
    ctx.fill(); ctx.stroke();
    const pad = 14, cw = (w - pad * 2) / COLS, ch = (h - pad * 2) / ROWS;
    // 격자
    ctx.strokeStyle = S.DK.alpha(PAL.hairline, 0.8);
    ctx.lineWidth = 1;
    for (let c = 1; c < COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(x + pad + c * cw, y + pad);
      ctx.lineTo(x + pad + c * cw, y + h - pad);
      ctx.stroke();
    }
    // 수업 블록
    ctx.fillStyle = DK.alpha(PAL.ink, 0.16);
    blocks.forEach(([c, r]) => {
      DK.rr(ctx, x + pad + c * cw + 2, y + pad + r * ch + 2, cw - 4, ch - 4, 4);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    return { x: x + pad, y: y + pad, cw, ch };
  }

  const CW = 250, CH = 330;

  window.ANIMS["intro-overlap"] = {
    onCut(i, slide) {
      if (i >= 2) slide.querySelectorAll(".reveal").forEach((r) => r.classList.add("on"));
    },
    cuts: [
      { // Cut 1 — 세 카드 슬라이드-인 (나란히)
        d: 800,
        draw(ctx, t, S) {
          const y = (S.H - CH) / 2;
          const targets = [S.W / 2 - CW * 1.5 - 40, S.W / 2 - CW / 2, S.W / 2 + CW / 2 + 40];
          const starts = [-CW - 60, S.W / 2 - CW / 2, S.W + 60];
          const st = S.DK.step(t, 10);
          for (let i = 0; i < 3; i++) {
            const x = starts[i] + (targets[i] - starts[i]) * st;
            card(ctx, x, y, CW, CH, PEOPLE[i], 1, S);
          }
        },
      },
      { // Cut 2 — 중앙으로 겹침
        d: 800, auto: true,
        draw(ctx, t, S) {
          ctx.clearRect(0, 0, S.W, S.H);
          const y = (S.H - CH) / 2;
          const targets = [S.W / 2 - CW * 1.5 - 40, S.W / 2 - CW / 2, S.W / 2 + CW / 2 + 40];
          const cx = S.W / 2 - CW / 2;
          const st = S.DK.step(t, 10);
          for (let i = 0; i < 3; i++) {
            const x = targets[i] + (cx - targets[i]) * st;
            card(ctx, x, y, CW, CH, PEOPLE[i], i === 1 ? 1 : 0.45 + 0.1 * st, S);
          }
        },
      },
      { // Cut 3 — 공통 공강 슬롯 Action Blue 점등 + 펄스
        d: 900, auto: true,
        draw(ctx, t, S) {
          const { PAL, DK } = S;
          const y = (S.H - CH) / 2, x = S.W / 2 - CW / 2;
          const pad = 14, cw = (CW - pad * 2) / COLS, ch = (CH - pad * 2) / ROWS;
          const pulse = t < 0.5 ? DK.seg(t, 0, 0.5) : 1;
          const glow = t < 1 ? 0.25 + 0.15 * Math.sin(t * Math.PI * 3) : 0.3;
          FREE.forEach(([c, r]) => {
            const bx = x + pad + c * cw, by = y + pad + r * ch;
            ctx.fillStyle = DK.alpha(PAL.primary, glow * pulse);
            DK.rr(ctx, bx - 3, by - 3, cw + 6, ch + 6, 6);
            ctx.fill();
            ctx.fillStyle = PAL.primary;
            ctx.globalAlpha = pulse;
            DK.rr(ctx, bx + 2, by + 2, cw - 4, ch - 4, 4);
            ctx.fill();
            ctx.globalAlpha = 1;
          });
          if (t > 0.4) {
            ctx.fillStyle = PAL.primary;
            ctx.font = DK.font(21, 600);
            ctx.textAlign = "left";
            const lx = x + CW + 26, ly = y + pad + 3.8 * ch;
            ctx.fillText("모두 비는 시간", lx, ly);
            ctx.font = DK.font(18, 400);
            ctx.fillStyle = PAL.inkMuted;
            ctx.fillText("목요일 16:00 – 18:00", lx, ly + 30);
          }
        },
      },
    ],
  };
})();
