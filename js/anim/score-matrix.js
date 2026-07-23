/* S9 — 스코어링 매트릭스: 가용 시간 히트맵 → 열 스캔 점수 계산 → Top 3 */
(function () {
  window.ANIMS = window.ANIMS || {};

  // 10명 × 8개 후보 시작 시간(16:00~19:30) 가용 여부 — 열 4(18:00)가 1위가 되도록 설계
  const AV = [
    [1,1,1,1,1,1,0,0], // P1 필수
    [0,1,1,1,1,1,1,0], // P2 필수
    [1,1,0,1,1,0,1,1], // P3 운영진
    [1,0,1,1,1,1,0,1], // P4 운영진
    [0,1,1,0,1,1,1,0],
    [1,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,1],
    [0,1,1,1,1,1,1,0],
    [1,1,1,0,1,1,0,1],
    [1,1,0,1,0,1,1,1],
  ];
  const REQUIRED = [0, 1], OPS = [2, 3];
  const TIMES = ["16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30"];

  // 점수 계산 (데모 점수식 축약)
  const SCORES = TIMES.map((_, c) => {
    const avail = AV.filter((row) => row[c]).length;
    const reqOk = REQUIRED.every((r) => AV[r][c]);
    const ops = OPS.filter((r) => AV[r][c]).length;
    const late = c >= 6 ? (c - 5) * 5 : 0;
    return avail * 8 + (reqOk ? 18 : -18) + ops * 2 - late;
  });
  const RANKED = SCORES.map((s, i) => [s, i]).sort((a, b) => b[0] - a[0]);
  const TOP3 = RANKED.slice(0, 3).map((x) => x[1]);
  const MAX = RANKED[0][0];

  const LX = 118, TY = 44, CW = 84, CH = 30, BAR_Y0 = 430, BAR_H = 96;

  function cellColor(S, on) {
    return on ? S.DK.alpha(S.PAL.primary, 0.2) : S.DK.alpha(S.PAL.ink, 0.05);
  }

  function drawGrid(ctx, S, upto) {
    const { PAL, DK } = S;
    ctx.font = DK.font(16, 400);
    ctx.textAlign = "center";
    TIMES.forEach((tm, c) => {
      ctx.fillStyle = PAL.inkMuted;
      ctx.fillText(tm, LX + c * CW + CW / 2, TY - 12);
    });
    ctx.textAlign = "left";
    AV.forEach((row, r) => {
      const y = TY + r * CH;
      ctx.fillStyle = PAL.ink;
      ctx.font = DK.font(15, 600);
      ctx.fillText("참여자 " + (r + 1), 8, y + 20);
      if (REQUIRED.includes(r) || OPS.includes(r)) {
        const tag = REQUIRED.includes(r) ? "필수" : "운영";
        ctx.fillStyle = PAL.primary;
        ctx.font = DK.font(12, 600);
        ctx.fillText(tag, 88, y + 20);
      }
      row.forEach((on, c) => {
        if (r * 8 + c > upto) return;
        ctx.fillStyle = cellColor(S, on);
        DK.rr(ctx, LX + c * CW + 2, y + 2, CW - 4, CH - 4, 5);
        ctx.fill();
      });
    });
  }

  function drawBar(ctx, S, c, hRatio, color, label) {
    const { PAL, DK } = S;
    const w = 46, x = LX + c * CW + (CW - w) / 2;
    const h = Math.max(4, BAR_H * hRatio);
    ctx.fillStyle = color;
    DK.rr(ctx, x, BAR_Y0 + BAR_H - h, w, h, 5);
    ctx.fill();
    if (label != null) {
      ctx.fillStyle = PAL.ink;
      ctx.font = DK.font(15, 600);
      ctx.textAlign = "center";
      ctx.fillText(label, x + w / 2, BAR_Y0 + BAR_H + 22);
      ctx.textAlign = "left";
    }
  }

  window.ANIMS["score-matrix"] = {
    cuts: [
      { // Cut 1 — 히트맵 등장
        d: 1000,
        draw(ctx, t, S) {
          const upto = Math.floor(S.DK.step(t, 20) * 80);
          drawGrid(ctx, S, upto);
          const { PAL, DK } = S;
          ctx.fillStyle = PAL.inkMuted;
          ctx.font = DK.font(15, 400);
          ctx.fillText("■ 가능", LX, TY + 10 * CH + 26);
          ctx.fillStyle = DK.alpha(PAL.primary, 0.2);
          DK.rr(ctx, LX - 4, TY + 10 * CH + 14, 14, 14, 3); ctx.fill();
          ctx.fillStyle = PAL.inkMuted;
          ctx.fillText("30분 단위 가용 시간 (10명)", LX + 70, TY + 10 * CH + 26);
        },
      },
      { // Cut 2 — 좌→우 스캔하며 점수 바 성장
        d: 1800,
        draw(ctx, t, S) {
          const { PAL, DK } = S;
          const prog = DK.step(t, 8) * 8; // 0..8
          const scanCol = Math.min(7, Math.floor(prog));
          // 스캔 하이라이트
          if (t < 1) {
            ctx.fillStyle = DK.alpha(PAL.primary, 0.07);
            DK.rr(ctx, LX + scanCol * CW, TY - 4, CW, 10 * CH + 8, 8);
            ctx.fill();
          }
          for (let c = 0; c < 8; c++) {
            if (c > prog - 0.5 && t < 1) continue;
            const ratio = Math.max(0.06, SCORES[c] / MAX);
            drawBar(ctx, S, c, ratio, DK.alpha(PAL.ink, 0.22), SCORES[c]);
          }
          ctx.fillStyle = PAL.inkMuted;
          ctx.font = DK.font(15, 400);
          ctx.fillText("후보 시간별 Score(t)", 8, BAR_Y0 + BAR_H / 2);
        },
      },
      { // Cut 3 — Top 3 승격
        d: 900,
        draw(ctx, t, S) {
          const { PAL, DK } = S;
          const st = DK.step(t, 6);
          TOP3.forEach((c, rank) => {
            if (st < (rank + 1) / 3 - 0.05) return;
            const ratio = Math.max(0.06, SCORES[c] / MAX);
            drawBar(ctx, S, c, ratio, PAL.primary, SCORES[c]);
            const w = 46, x = LX + c * CW + (CW - w) / 2;
            ctx.fillStyle = PAL.primary;
            ctx.font = DK.font(17, 600);
            ctx.textAlign = "center";
            ctx.fillText(String(rank + 1) + "위", x + w / 2, BAR_Y0 - BAR_H * ratio + BAR_H - 12 + (ratio >= 1 ? -2 : 0));
            ctx.textAlign = "left";
          });
          if (st >= 1) {
            const c = TOP3[0], w = 150;
            const x = LX + c * CW + CW / 2 - w / 2;
            ctx.fillStyle = PAL.primary;
            DK.rr(ctx, x, BAR_Y0 - 82, w, 32, 16);
            ctx.fill();
            ctx.fillStyle = "#fff";
            ctx.font = DK.font(15, 600);
            ctx.textAlign = "center";
            ctx.fillText("필수 참석 전원 ✓", x + w / 2, BAR_Y0 - 60);
            ctx.textAlign = "left";
          }
        },
      },
    ],
  };
})();
