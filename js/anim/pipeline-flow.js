/* S6 — AI 파이프라인 5노드 순차 점등 + 데이터 토큰 흐름 */
(function () {
  window.ANIMS = window.ANIMS || {};

  const NODES = [
    { no: "①", name: "이미지 인식", sub: "시간표 캡처 → 구조화", tech: "멀티모달 LLM Vision", ex: ["📷 시간표.png", "→ 과목·요일·시간 JSON"] },
    { no: "②", name: "자연어 이해", sub: "모임 요청 → 필드 추출", tech: "LLM · structured output", ex: ['"목 6시 혜화 뒤풀이…"', "→ {제목·날짜·장소·정원}"] },
    { no: "③", name: "구조화 데이터", sub: "시간표·모임·참석 DB", tech: "단일 데이터 기반", ex: ["🗄 가능 시간 30분 단위", "저장·집계"] },
    { no: "④", name: "판단 · 추천", sub: "스코어링 → ML 고도화", tech: "자체 설계 알고리즘", ex: ["Score(t) 계산", "→ Top 3 + 추천 이유"] },
    { no: "⑤", name: "자연어 생성", sub: "공지·리마인드 작성", tech: "LLM", ex: ["→ \"목 6시 확정!", "도복 지참하세요\""] },
  ];

  const NW = 300, NH = 140, GAP = 52, NY = 240;

  function nodeX(i, S) {
    const total = NODES.length * NW + (NODES.length - 1) * GAP;
    return (S.W - total) / 2 + i * (NW + GAP);
  }

  function drawNode(ctx, i, lit, S) {
    const { PAL, DK } = S;
    const x = nodeX(i, S);
    ctx.fillStyle = PAL.canvas;
    ctx.strokeStyle = lit ? PAL.primary : PAL.hairline;
    ctx.lineWidth = lit ? 2.5 : 1.5;
    DK.rr(ctx, x, NY, NW, NH, 18);
    ctx.fill(); ctx.stroke();
    ctx.textAlign = "left";
    ctx.fillStyle = lit ? PAL.primary : PAL.inkMuted;
    ctx.font = DK.font(26, 600);
    ctx.fillText(NODES[i].no, x + 22, NY + 42);
    ctx.fillStyle = PAL.ink;
    ctx.font = DK.font(24, 600);
    ctx.fillText(NODES[i].name, x + 62, NY + 42);
    ctx.fillStyle = PAL.inkMuted;
    ctx.font = DK.font(18, 400);
    ctx.fillText(NODES[i].sub, x + 22, NY + 78);
    ctx.fillStyle = lit ? PAL.primary : PAL.inkMuted;
    ctx.font = DK.font(17, 600);
    ctx.fillText(NODES[i].tech, x + 22, NY + 112);
  }

  function drawCard(ctx, i, a, S) {
    const { PAL, DK } = S;
    const x = nodeX(i, S);
    ctx.globalAlpha = a;
    ctx.fillStyle = PAL.parchment;
    ctx.strokeStyle = PAL.hairline;
    ctx.lineWidth = 1;
    DK.rr(ctx, x + 10, NY - 118, NW - 20, 92, 14);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = PAL.ink;
    ctx.font = DK.font(17, 400);
    ctx.fillText(NODES[i].ex[0], x + 26, NY - 82);
    ctx.fillStyle = PAL.primary;
    ctx.font = DK.font(17, 600);
    ctx.fillText(NODES[i].ex[1], x + 26, NY - 52);
    ctx.globalAlpha = 1;
  }

  function connector(ctx, S) {
    const { PAL } = S;
    ctx.strokeStyle = PAL.hairline;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(nodeX(0, S) + NW, NY + NH / 2);
    ctx.lineTo(nodeX(4, S), NY + NH / 2);
    ctx.stroke();
  }

  const nodeCut = (i) => ({
    d: 520, auto: i > 0,
    draw(ctx, t, S) {
      if (i === 0) connector(ctx, S);
      const st = S.DK.step(t, 6);
      for (let j = 0; j < i; j++) { drawNode(ctx, j, true, S); drawCard(ctx, j, 1, S); }
      drawNode(ctx, i, st > 0.3, S);
      if (st > 0.3) drawCard(ctx, i, (st - 0.3) / 0.7, S);
    },
  });

  window.ANIMS["pipeline-flow"] = {
    cuts: [
      nodeCut(0), nodeCut(1), nodeCut(2), nodeCut(3), nodeCut(4),
      { // Cut 6 — 토큰 흐름
        d: 1400,
        draw(ctx, t, S) {
          const { PAL } = S;
          const x0 = nodeX(0, S) + 30, x1 = nodeX(4, S) + NW - 30;
          const y = NY + NH / 2;
          for (let k = 0; k < 3; k++) {
            const p = Math.max(0, Math.min(1, t * 1.25 - k * 0.12));
            if (p <= 0 || p >= 1) continue;
            ctx.beginPath();
            ctx.arc(x0 + (x1 - x0) * p, y, 7, 0, Math.PI * 2);
            ctx.fillStyle = S.DK.alpha(PAL.primary, 1 - k * 0.28);
            ctx.fill();
          }
          if (t >= 1) {
            ctx.strokeStyle = PAL.primary;
            ctx.lineWidth = 2.5;
            for (let i = 0; i < NODES.length - 1; i++) {
              ctx.beginPath();
              ctx.moveTo(nodeX(i, S) + NW, y);
              ctx.lineTo(nodeX(i + 1, S), y);
              ctx.stroke();
            }
          }
        },
      },
    ],
  };
})();
