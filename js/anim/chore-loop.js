/* S4 — "총무의 48시간" 루프: 카톡풍 투표 → 대기 → 리마인드 → 확정 → 반복 */
(function () {
  window.ANIMS = window.ANIMS || {};

  function frame(ctx, S) {
    const { PAL, DK } = S;
    ctx.fillStyle = PAL.canvas;
    ctx.strokeStyle = PAL.hairline;
    ctx.lineWidth = 1.5;
    DK.rr(ctx, 0.5, 0.5, S.W - 1, S.H - 1, 20);
    ctx.fill(); ctx.stroke();
    // 헤더
    ctx.fillStyle = PAL.parchment;
    DK.rr(ctx, 1, 1, S.W - 2, 56, 20);
    ctx.fill();
    ctx.fillStyle = PAL.canvas;
    ctx.fillRect(1, 40, S.W - 2, 18);
    ctx.fillStyle = PAL.ink;
    ctx.font = DK.font(21, 600);
    ctx.textAlign = "left";
    ctx.fillText("동아리 단체방 (12)", 24, 37);
  }

  function stamp(ctx, S, x, y, text, strong) {
    const { PAL, DK } = S;
    ctx.font = DK.font(17, 600);
    const w = ctx.measureText(text).width + 26;
    ctx.fillStyle = strong ? PAL.primary : DK.alpha(PAL.ink, 0.06);
    DK.rr(ctx, x - w, y, w, 30, 15);
    ctx.fill();
    ctx.fillStyle = strong ? "#fff" : PAL.inkMuted;
    ctx.textAlign = "right";
    ctx.fillText(text, x - 13, y + 21);
    ctx.textAlign = "left";
  }

  window.ANIMS["chore-loop"] = {
    cuts: [
      { // Cut 1 — 투표 카드 생성 (월 21:00)
        d: 750,
        draw(ctx, t, S) {
          const { PAL, DK } = S;
          frame(ctx, S);
          const st = DK.step(t, 8);
          if (st <= 0) return;
          ctx.globalAlpha = st;
          const y = 76;
          ctx.fillStyle = PAL.parchment;
          DK.rr(ctx, 22, y, 330, 128, 14);
          ctx.fill();
          ctx.fillStyle = PAL.ink;
          ctx.font = DK.font(20, 600);
          ctx.fillText("📊 일정 투표", 40, y + 32);
          ctx.font = DK.font(18, 400);
          const opts = ["목 6시", "금 7시", "토 2시"];
          opts.forEach((o, i) => {
            const oy = y + 52 + i * 26;
            ctx.fillStyle = PAL.inkMuted;
            ctx.fillText(o, 40, oy + 14);
            ctx.strokeStyle = PAL.hairline;
            ctx.lineWidth = 1;
            DK.rr(ctx, 110, oy + 2, 220, 16, 8);
            ctx.stroke();
          });
          ctx.font = DK.font(15, 400);
          ctx.fillStyle = PAL.inkMuted;
          ctx.fillText("월 21:00", 362, y + 122);
          ctx.globalAlpha = 1;
        },
      },
      { // Cut 2 — 응답 5/12 정체 (+24시간)
        d: 750,
        draw(ctx, t, S) {
          const { PAL, DK } = S;
          const st = DK.step(t, 8);
          if (st <= 0) return;
          ctx.globalAlpha = st;
          const y = 222;
          ctx.font = DK.font(19, 600);
          ctx.fillStyle = PAL.ink;
          ctx.fillText("응답 5 / 12", 24, y + 18);
          ctx.font = DK.font(17, 400);
          ctx.fillStyle = PAL.inkMuted;
          ctx.fillText("미응답 7명…", 128, y + 18);
          for (let i = 0; i < 12; i++) {
            const ax = 24 + i * 36, ay = y + 34;
            ctx.beginPath();
            ctx.arc(ax + 13, ay + 13, 13, 0, Math.PI * 2);
            ctx.fillStyle = i < 5 ? DK.alpha(PAL.primary, 0.85) : DK.alpha(PAL.ink, 0.12);
            ctx.fill();
          }
          stamp(ctx, S, S.W - 22, y + 6, "+24시간", false);
          ctx.globalAlpha = 1;
        },
      },
      { // Cut 3 — 리마인드 (+36시간)
        d: 650,
        draw(ctx, t, S) {
          const { PAL, DK } = S;
          const st = DK.step(t, 8);
          if (st <= 0) return;
          ctx.globalAlpha = st;
          const y = 306;
          ctx.fillStyle = PAL.primary;
          DK.rr(ctx, S.W - 292, y, 236, 44, 16);
          ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.font = DK.font(19, 400);
          ctx.fillText("투표 부탁드려요 🙏", 24 + S.W - 292, y + 29);
          stamp(ctx, S, S.W - 302, y + 8, "+36시간", false);
          ctx.globalAlpha = 1;
        },
      },
      { // Cut 4 — 확정 (수 21:00, 48시간 경과)
        d: 750,
        draw(ctx, t, S) {
          const { PAL, DK } = S;
          const st = DK.step(t, 8);
          if (st <= 0) return;
          ctx.globalAlpha = st;
          const y = 356;
          ctx.fillStyle = PAL.parchment;
          DK.rr(ctx, 22, y, 300, 46, 16);
          ctx.fill();
          ctx.fillStyle = PAL.ink;
          ctx.font = DK.font(19, 600);
          ctx.fillText("목 6시로 확정합니다!", 42, y + 30);
          ctx.font = DK.font(15, 400);
          ctx.fillStyle = PAL.inkMuted;
          ctx.fillText("수 21:00", 332, y + 30);
          stamp(ctx, S, S.W - 22, y + 8, "48시간 경과", true);
          ctx.globalAlpha = 1;
        },
      },
      { // Cut 5 — 루프: 다음 모임에서 다시 처음부터
        d: 900,
        draw(ctx, t, S) {
          const { PAL, DK } = S;
          const st = DK.step(t, 10);
          if (st <= 0) return;
          const cx = S.W / 2, cy = S.H - 22, r = 17;
          ctx.strokeStyle = PAL.primary;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(cx - 150, cy - 4, r, -Math.PI * 0.5, -Math.PI * 0.5 + Math.PI * 1.7 * st);
          ctx.stroke();
          if (st > 0.9) {
            ctx.fillStyle = PAL.primary;
            ctx.beginPath();
            const a = -Math.PI * 0.5 + Math.PI * 1.7;
            const hx = cx - 150 + r * Math.cos(a), hy = cy - 4 + r * Math.sin(a);
            ctx.moveTo(hx - 7, hy - 8);
            ctx.lineTo(hx + 7, hy);
            ctx.lineTo(hx - 7, hy + 8);
            ctx.closePath();
            ctx.fill();
          }
          ctx.globalAlpha = st;
          ctx.fillStyle = PAL.ink;
          ctx.font = DK.font(21, 600);
          ctx.fillText("다음 모임에서 다시 처음부터", cx - 118, cy + 4);
          ctx.globalAlpha = 1;
        },
      },
    ],
  };
})();
