/* S14 — 6개월 마일스톤 타임라인 진행 */
(function () {
  window.ANIMS = window.ANIMS || {};

  const MS = [
    ["M1 · 7월", "기획 고도화", "요구사항 정의 (데모 기반 UX 확정)"],
    ["M2 · 8월", "기반 세팅", "디자인 시스템 · FE/BE · 학교 이메일 인증"],
    ["M3 · 9월", "AI 모듈 연동", "시간표 캡처 인식 · 자연어 모임 생성 (알파)"],
    ["M4 · 10월", "MVP 완성", "추천·리마인드·매칭 최소기능 · 클로즈드 베타 시작"],
    ["M5 · 11월", "베타 검증", "피드백 반영 · 대타 매칭 오픈 · KPI 측정 · 특허 검토"],
    ["M6 · 12월", "정리·확장", "서비스 보완 · 사업자 등록 검토 · 확장 준비"],
  ];
  const AXIS_Y = 190, PAD = 175;

  function nodeX(i, S) {
    const w = S.W - PAD * 2;
    return PAD + (w / (MS.length - 1)) * i;
  }

  function drawLabel(ctx, i, lit, S) {
    const { PAL, DK } = S;
    const x = nodeX(i, S);
    const up = i % 2 === 0; // 위/아래 지그재그
    const y = up ? AXIS_Y - 130 : AXIS_Y + 60;
    ctx.textAlign = "center";
    ctx.fillStyle = lit ? PAL.primary : PAL.inkMuted;
    ctx.font = DK.font(21, 600);
    ctx.fillText(MS[i][0], x, y);
    ctx.fillStyle = PAL.ink;
    ctx.font = DK.font(22, 600);
    ctx.globalAlpha = lit ? 1 : 0.45;
    ctx.fillText(MS[i][1], x, y + 34);
    ctx.fillStyle = PAL.inkMuted;
    ctx.font = DK.font(17, 400);
    ctx.fillText(MS[i][2], x, y + 64);
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";
  }

  window.ANIMS["timeline-run"] = {
    onCut(i, slide) {
      if (i >= 2) slide.querySelectorAll(".reveal").forEach((r) => r.classList.add("on"));
    },
    cuts: [
      { // Cut 1 — 축 + 노드 등장
        d: 900,
        draw(ctx, t, S) {
          const { PAL, DK } = S;
          const st = DK.step(t, 12);
          const x0 = PAD, x1 = nodeX(MS.length - 1, S);
          ctx.strokeStyle = PAL.hairline;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x0, AXIS_Y);
          ctx.lineTo(x0 + (x1 - x0) * st, AXIS_Y);
          ctx.stroke();
          MS.forEach((_, i) => {
            if (st * (MS.length - 1) + 0.01 < i) return;
            const x = nodeX(i, S);
            ctx.beginPath();
            ctx.arc(x, AXIS_Y, 11, 0, Math.PI * 2);
            ctx.fillStyle = S.PAL.canvas;
            ctx.strokeStyle = PAL.inkMuted;
            ctx.lineWidth = 2.5;
            ctx.fill(); ctx.stroke();
            drawLabel(ctx, i, false, S);
          });
        },
      },
      { // Cut 2 — 게이지 채움 + 노드 점등 + M4 플래그
        d: 2000,
        draw(ctx, t, S) {
          const { PAL, DK } = S;
          const st = DK.step(t, 18);
          const x0 = PAD, x1 = nodeX(MS.length - 1, S);
          const gx = x0 + (x1 - x0) * st;
          ctx.strokeStyle = PAL.primary;
          ctx.lineWidth = 5;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(x0, AXIS_Y);
          ctx.lineTo(gx, AXIS_Y);
          ctx.stroke();
          MS.forEach((_, i) => {
            const x = nodeX(i, S);
            if (gx + 2 < x) return;
            ctx.beginPath();
            ctx.arc(x, AXIS_Y, 12, 0, Math.PI * 2);
            ctx.fillStyle = PAL.primary;
            ctx.fill();
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(x - 5, AXIS_Y);
            ctx.lineTo(x - 1, AXIS_Y + 4);
            ctx.lineTo(x + 6, AXIS_Y - 5);
            ctx.stroke();
            drawLabel(ctx, i, true, S);
          });
          // M4 플래그 (아래 라벨과 겹치지 않도록 축 위쪽에 표시)
          const fx = nodeX(3, S);
          if (gx >= fx) {
            const label = "베타 100명";
            ctx.font = DK.font(17, 600);
            const w = ctx.measureText(label).width + 30;
            ctx.fillStyle = PAL.primary;
            DK.rr(ctx, fx - w / 2, AXIS_Y - 82, w, 36, 18);
            ctx.fill();
            ctx.fillStyle = "#fff";
            ctx.textAlign = "center";
            ctx.fillText(label, fx, AXIS_Y - 58);
            ctx.textAlign = "left";
            ctx.strokeStyle = DK.alpha(PAL.primary, 0.5);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(fx, AXIS_Y - 44);
            ctx.lineTo(fx, AXIS_Y - 14);
            ctx.stroke();
          }
        },
      },
      { // Cut 3 — 클로징 공개 (HTML reveal 트리거)
        d: 500,
        draw() { /* canvas 변화 없음 — onCut으로 클로징 문구 공개 */ },
      },
    ],
  };
})();
