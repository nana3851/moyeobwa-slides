/* S7 — 폰 프레임 데모 재현: 자연어 입력 → 폼 자동 완성 → Top3 추천 → 참여자 관리 → 대타 매칭 */
(function () {
  window.ANIMS = window.ANIMS || {};

  const SENT = "이번 주 목요일 오후 6시에 혜화에서 뒤풀이 열어줘. 운영진은 필수 참석이고 최대 10명이야.";
  const FIELDS = [
    ["모임 이름", "동아리 뒤풀이"],
    ["날짜", "7월 30일 (목)"],
    ["시작 시간", "18:00"],
    ["소요 시간", "2시간"],
    ["장소", "혜화"],
    ["최대 인원", "10명"],
    ["필수 참석자", "운영진"],
    ["응답 마감", "수요일 자정"],
  ];
  const RECS = [
    ["목 18:00 – 20:00", 96, ["10명 중 9명 참석 가능", "필수 참석자 전원 가능"]],
    ["목 18:30 – 20:30", 78, []],
    ["목 17:00 – 19:00", 61, []],
  ];

  // 화면 영역 (폰 내부)
  function screen(ctx, S, title) {
    const { PAL, DK } = S;
    // 폰 프레임
    ctx.fillStyle = PAL.canvas;
    ctx.strokeStyle = PAL.hairline;
    ctx.lineWidth = 2;
    DK.rr(ctx, 1, 1, S.W - 2, S.H - 2, 46);
    ctx.fill(); ctx.stroke();
    // 노치
    ctx.fillStyle = DK.alpha(PAL.ink, 0.85);
    DK.rr(ctx, S.W / 2 - 55, 16, 110, 24, 12);
    ctx.fill();
    // 헤더
    ctx.fillStyle = PAL.ink;
    ctx.font = DK.font(24, 600);
    ctx.textAlign = "center";
    ctx.fillText(title, S.W / 2, 82);
    ctx.textAlign = "left";
    return { x: 28, y: 108, w: S.W - 56 };
  }

  function toast(ctx, S, text) {
    const { PAL, DK } = S;
    ctx.font = DK.font(18, 600);
    const w = ctx.measureText(text).width + 44;
    ctx.fillStyle = DK.alpha(PAL.ink, 0.88);
    DK.rr(ctx, (S.W - w) / 2, S.H - 74, w, 44, 22);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText(text, S.W / 2, S.H - 45);
    ctx.textAlign = "left";
  }

  function wrap(ctx, text, x, y, maxW, lh) {
    let line = "", yy = y;
    for (const ch of text) {
      if (ctx.measureText(line + ch).width > maxW) {
        ctx.fillText(line, x, yy);
        line = ch; yy += lh;
      } else line += ch;
    }
    if (line) ctx.fillText(line, x, yy);
    return yy;
  }

  window.ANIMS["demo-replay"] = {
    cuts: [
      { // Cut 1 — 자연어 타이핑
        d: 2000,
        draw(ctx, t, S) {
          const { PAL, DK } = S;
          const sc = screen(ctx, S, "새 모임");
          ctx.fillStyle = PAL.inkMuted;
          ctx.font = DK.font(18, 400);
          ctx.fillText("어떤 모임인가요?", sc.x, sc.y + 24);
          // 입력 박스
          ctx.strokeStyle = PAL.hairline;
          ctx.fillStyle = PAL.parchment;
          ctx.lineWidth = 1.5;
          DK.rr(ctx, sc.x, sc.y + 40, sc.w, 170, 14);
          ctx.fill(); ctx.stroke();
          // 타이핑 (frame-by-frame: 글자 단위)
          const n = Math.floor(DK.step(t, 40) * SENT.length);
          ctx.fillStyle = PAL.ink;
          ctx.font = DK.font(19, 400);
          const endY = wrap(ctx, SENT.slice(0, n) + (t < 1 ? "▍" : ""), sc.x + 18, sc.y + 72, sc.w - 36, 30);
          // AI 버튼
          ctx.fillStyle = t >= 1 ? PAL.primary : DK.alpha(PAL.primary, 0.45);
          DK.rr(ctx, sc.x, sc.y + 228, sc.w, 54, 27);
          ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.font = DK.font(20, 600);
          ctx.textAlign = "center";
          ctx.fillText("✦ AI로 입력하기", S.W / 2, sc.y + 263);
          ctx.textAlign = "left";
        },
      },
      { // Cut 2 — 폼 자동 완성
        d: 1600,
        draw(ctx, t, S) {
          const { PAL, DK } = S;
          const sc = screen(ctx, S, "새 모임");
          ctx.fillStyle = PAL.inkMuted;
          ctx.font = DK.font(17, 400);
          ctx.fillText("✦ 입력한 문장에서 정리했어요 — 직접 수정 가능", sc.x, sc.y + 20);
          const n = Math.ceil(DK.step(t, FIELDS.length) * FIELDS.length);
          FIELDS.forEach(([label, val], i) => {
            const fy = sc.y + 38 + i * 74;
            ctx.strokeStyle = i < n ? DK.alpha(PAL.primary, 0.55) : PAL.hairline;
            ctx.fillStyle = PAL.canvas;
            ctx.lineWidth = 1.5;
            DK.rr(ctx, sc.x, fy, sc.w, 62, 12);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = PAL.inkMuted;
            ctx.font = DK.font(15, 400);
            ctx.fillText(label, sc.x + 16, fy + 24);
            if (i < n) {
              ctx.fillStyle = PAL.ink;
              ctx.font = DK.font(19, 600);
              ctx.fillText(val, sc.x + 16, fy + 50);
            }
          });
          if (t >= 1) toast(ctx, S, "8개 항목을 자동으로 채웠어요");
        },
      },
      { // Cut 3 — Top 3 추천
        d: 1300,
        draw(ctx, t, S) {
          const { PAL, DK } = S;
          const sc = screen(ctx, S, "최적 시간 추천");
          ctx.fillStyle = PAL.inkMuted;
          ctx.font = DK.font(17, 400);
          ctx.fillText("10명의 가능 시간을 계산했어요", sc.x, sc.y + 20);
          const n = Math.ceil(DK.step(t, 3) * 3);
          let yy = sc.y + 40;
          RECS.forEach(([time, score, reasons], i) => {
            const h = i === 0 ? 190 : 120;
            if (i < n) {
              const rise = i === n - 1 ? (1 - (t * 3 - i)) * 18 : 0;
              const fy = yy + Math.max(0, rise);
              ctx.strokeStyle = i === 0 ? PAL.primary : PAL.hairline;
              ctx.fillStyle = PAL.canvas;
              ctx.lineWidth = i === 0 ? 2.5 : 1.5;
              DK.rr(ctx, sc.x, fy, sc.w, h, 14);
              ctx.fill(); ctx.stroke();
              ctx.fillStyle = PAL.ink;
              ctx.font = DK.font(21, 600);
              ctx.fillText(time, sc.x + 18, fy + 36);
              if (i === 0) {
                ctx.fillStyle = PAL.primary;
                DK.rr(ctx, sc.x + sc.w - 84, fy + 14, 66, 30, 15);
                ctx.fill();
                ctx.fillStyle = "#fff";
                ctx.font = DK.font(16, 600);
                ctx.fillText("추천", sc.x + sc.w - 68, fy + 35);
              }
              // 점수 바
              ctx.strokeStyle = PAL.hairline;
              ctx.lineWidth = 1;
              DK.rr(ctx, sc.x + 18, fy + 54, sc.w - 116, 14, 7);
              ctx.stroke();
              ctx.fillStyle = PAL.primary;
              DK.rr(ctx, sc.x + 18, fy + 54, (sc.w - 116) * score / 100, 14, 7);
              ctx.fill();
              ctx.fillStyle = PAL.ink;
              ctx.font = DK.font(17, 600);
              ctx.fillText(score + "점", sc.x + sc.w - 76, fy + 67);
              reasons.forEach((r, j) => {
                ctx.fillStyle = PAL.inkMuted;
                ctx.font = DK.font(17, 400);
                ctx.fillText("· " + r, sc.x + 18, fy + 102 + j * 30);
              });
            }
            yy += h + 16;
          });
        },
      },
      { // Cut 4 — 확정 → 참여자 관리 → 리마인드
        d: 1500,
        draw(ctx, t, S) {
          const { PAL, DK } = S;
          const sc = screen(ctx, S, "참여자 관리 (10)");
          const st = DK.step(t, 10);
          // 상태 칩
          const chips = [["참석 6", true], ["미정 1", false], ["미응답 3", false]];
          let cx = sc.x;
          chips.forEach(([label, fill]) => {
            ctx.font = DK.font(17, 600);
            const w = ctx.measureText(label).width + 30;
            ctx.fillStyle = fill ? PAL.primary : PAL.canvas;
            ctx.strokeStyle = fill ? PAL.primary : PAL.hairline;
            ctx.lineWidth = 1.5;
            DK.rr(ctx, cx, sc.y + 6, w, 36, 18);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = fill ? "#fff" : PAL.ink;
            ctx.fillText(label, cx + 15, sc.y + 30);
            cx += w + 12;
          });
          // 명단 (미응답 3명 하이라이트)
          const rows = [["김지현", "참석"], ["박서준", "참석"], ["이하늘", "미정"], ["최민영", "미응답"], ["정우진", "미응답"], ["한소미", "미응답"]];
          rows.forEach(([name, status], i) => {
            const fy = sc.y + 58 + i * 62;
            const isNo = status === "미응답";
            const selected = isNo && st > 0.4;
            ctx.fillStyle = selected ? DK.alpha(PAL.primary, 0.08) : PAL.canvas;
            ctx.strokeStyle = selected ? DK.alpha(PAL.primary, 0.6) : PAL.hairline;
            ctx.lineWidth = 1.5;
            DK.rr(ctx, sc.x, fy, sc.w, 52, 12);
            ctx.fill(); ctx.stroke();
            ctx.beginPath();
            ctx.arc(sc.x + 30, fy + 26, 14, 0, Math.PI * 2);
            ctx.fillStyle = DK.alpha(isNo ? PAL.ink : PAL.primary, isNo ? 0.15 : 0.75);
            ctx.fill();
            ctx.fillStyle = PAL.ink;
            ctx.font = DK.font(19, 600);
            ctx.fillText(name, sc.x + 56, fy + 33);
            ctx.fillStyle = isNo ? PAL.primary : PAL.inkMuted;
            ctx.font = DK.font(16, isNo ? 600 : 400);
            ctx.fillText(status, sc.x + sc.w - 78, fy + 33);
            if (selected) {
              ctx.strokeStyle = PAL.primary;
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(sc.x + sc.w - 118, fy + 26, 9, 0, Math.PI * 2);
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(sc.x + sc.w - 122, fy + 26);
              ctx.lineTo(sc.x + sc.w - 118, fy + 30);
              ctx.lineTo(sc.x + sc.w - 112, fy + 21);
              ctx.stroke();
            }
          });
          // 리마인드 버튼 + toast
          ctx.fillStyle = st > 0.7 ? PAL.primary : DK.alpha(PAL.primary, 0.4);
          DK.rr(ctx, sc.x, sc.y + 438, sc.w, 52, 26);
          ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.font = DK.font(19, 600);
          ctx.textAlign = "center";
          ctx.fillText("선택한 3명에게 리마인드", S.W / 2, sc.y + 472);
          ctx.textAlign = "left";
          if (t >= 1) toast(ctx, S, "미응답 3명에게 리마인드를 보냈어요");
        },
      },
      { // Cut 5 — 대타 매칭 → 정원 복구 → 요약
        d: 1600,
        draw(ctx, t, S) {
          const { PAL, DK } = S;
          const sc = screen(ctx, S, "대타 매칭");
          const st = DK.step(t, 10);
          // 결원 알림
          ctx.fillStyle = PAL.parchment;
          ctx.strokeStyle = PAL.hairline;
          ctx.lineWidth = 1.5;
          DK.rr(ctx, sc.x, sc.y + 8, sc.w, 74, 14);
          ctx.fill(); ctx.stroke();
          ctx.fillStyle = PAL.ink;
          ctx.font = DK.font(19, 600);
          ctx.fillText("⚠ 풋살 모임 결원 1명 발생", sc.x + 16, sc.y + 38);
          ctx.fillStyle = PAL.inkMuted;
          ctx.font = DK.font(16, 400);
          ctx.fillText("정원 9 / 10 — 대타 후보를 찾았어요", sc.x + 16, sc.y + 64);
          // 후보 카드
          if (st > 0.2) {
            ctx.strokeStyle = PAL.primary;
            ctx.fillStyle = PAL.canvas;
            ctx.lineWidth = 2;
            DK.rr(ctx, sc.x, sc.y + 98, sc.w, 128, 14);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = PAL.ink;
            ctx.font = DK.font(20, 600);
            ctx.fillText("김대타 · 통계 24", sc.x + 18, sc.y + 132);
            ctx.fillStyle = PAL.inkMuted;
            ctx.font = DK.font(16, 400);
            ctx.fillText("· 오늘 19시 공강  · 관심사: 풋살", sc.x + 18, sc.y + 160);
            ctx.fillText("· 학교에서 도보 15분", sc.x + 18, sc.y + 184);
            ctx.fillStyle = st > 0.55 ? PAL.primary : DK.alpha(PAL.primary, 0.45);
            DK.rr(ctx, sc.x + sc.w - 100, sc.y + 176, 84, 38, 19);
            ctx.fill();
            ctx.fillStyle = "#fff";
            ctx.font = DK.font(17, 600);
            ctx.fillText(st > 0.55 ? "수락됨 ✓" : "제안", sc.x + sc.w - 92, sc.y + 201);
          }
          // 정원 복구
          if (st > 0.6) {
            ctx.fillStyle = PAL.primary;
            DK.rr(ctx, sc.x, sc.y + 244, sc.w, 50, 14);
            ctx.fill();
            ctx.fillStyle = "#fff";
            ctx.font = DK.font(19, 600);
            ctx.textAlign = "center";
            ctx.fillText("정원 10 / 10 복구 완료", S.W / 2, sc.y + 277);
            ctx.textAlign = "left";
          }
          // 요약 — Step 1~4 체크
          if (st > 0.8) {
            const items = ["자연어 모임 생성", "최적 시간 추천", "확정·리마인드", "대타 매칭"];
            ctx.fillStyle = PAL.inkMuted;
            ctx.font = DK.font(15, 600);
            ctx.fillText("오늘의 흐름", sc.x, sc.y + 330);
            items.forEach((it, i) => {
              const fy = sc.y + 344 + i * 40;
              ctx.fillStyle = PAL.primary;
              ctx.beginPath();
              ctx.arc(sc.x + 14, fy + 14, 12, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = "#fff";
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.moveTo(sc.x + 8, fy + 14);
              ctx.lineTo(sc.x + 12, fy + 19);
              ctx.lineTo(sc.x + 20, fy + 9);
              ctx.stroke();
              ctx.fillStyle = PAL.ink;
              ctx.font = DK.font(18, 600);
              ctx.fillText(it, sc.x + 38, fy + 21);
            });
          }
        },
      },
    ],
  };
})();
