/* =========================================================
 * 결과 카드(canvas → PNG), OG 대표 이미지, 공유 (기획서 12장)
 *  공유 순서: 이미지+문구 공유 → 문구+링크 공유 → 문구+링크 복사
 * ========================================================= */
(function () {
  const PIXEL = "Galmuri11, monospace";
  const SANS = "Pretendard, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
  const C = { bg: "#eef4fb", panel: "#ffffff", line: "#2b3d5e", ink: "#1d2638", muted: "#6b7383", navy: "#08375f", red: "#e4032e",
    sky: "#bfe3fb", sky2: "#e6f4fd", grass: "#a8d38b", grass2: "#7fb862" };

  const imgCache = {};
  function loadImg(src) {
    if (imgCache[src]) return imgCache[src];
    return (imgCache[src] = new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; }));
  }
  async function fontsReady() {
    try {
      await Promise.all([`24px Galmuri11`, `700 24px Pretendard`, `400 24px Pretendard`].map(f => document.fonts.load(f)));
    } catch (e) {}
  }
  function wrap(ctx, text, maxW) {
    const out = []; let line = "";
    for (const word of String(text).split(" ")) {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > maxW && line) { out.push(line); line = word; } else line = test;
    }
    if (line) out.push(line);
    return out;
  }
  // 모서리가 깎인 픽셀 테두리 패널
  function panel(ctx, x, y, w, h, u, fill, border, shadow) {
    if (shadow) { ctx.fillStyle = shadow; ctx.fillRect(x + u, y + u * 2, w - u * 2, h); }
    ctx.fillStyle = border;
    ctx.fillRect(x + u, y, w - 2 * u, h); ctx.fillRect(x, y + u, w, h - 2 * u);
    ctx.fillStyle = fill;
    ctx.fillRect(x + u, y + u, w - 2 * u, h - 2 * u);
  }
  function px(ctx, im, x, y, s) { if (im) ctx.drawImage(im, Math.round(x), Math.round(y), im.width * s, im.height * s); }

  /* 손잡기 장면 (엔딩과 같은 배치). s: 정수 배율, (cx, ground): 가운데 x, 땅 y */
  async function drawHandScene(ctx, cx, ground, s) {
    const P = window.Pixel;
    const cast = [["public", 0], ["big", 52], ["small", 131], ["biz", 192]];
    const ims = await Promise.all(cast.map(([w]) => loadImg(P.charURL(w, "hand0"))));
    const x0 = cx - 128 * s;
    cast.forEach(([, x], i) => { const im = ims[i]; if (im) px(ctx, im, x0 + x * s, ground - im.height * s, s); });
  }
  async function drawPair(ctx, cx, ground, s) {
    const P = window.Pixel;
    const [b, q] = await Promise.all([loadImg(P.charURL("big", "happy")), loadImg(P.charURL("small", "happy"))]);
    const w = (96 + 6 + 72) * s, x0 = cx - w / 2;
    px(ctx, b, x0, ground - 96 * s, s);
    px(ctx, q, x0 + (96 + 6) * s, ground - 72 * s, s);
  }

  /* ---------- 공유 이미지 (마지막 화면 C안과 같은 구성) ----------
   * d = { cleared, title, kicker, msg(HTML: <br>, <em>), values: [{icon, who, what}], url } */
  // "<em>조달청</em>" 처럼 강조가 섞인 한 줄을 가운데 정렬로 그림
  function richLine(ctx, line, cx, y, base, accent) {
    const parts = line.split(/(<em>.*?<\/em>)/).filter(Boolean).map(p => {
      const em = /^<em>/.test(p);
      return { t: p.replace(/<\/?em>/g, ""), em };
    });
    const w = parts.reduce((a, p) => a + ctx.measureText(p.t).width, 0);
    let x = cx - w / 2;
    ctx.textAlign = "left";
    parts.forEach(p => { ctx.fillStyle = p.em ? accent : base; ctx.fillText(p.t, x, y); x += ctx.measureText(p.t).width; });
    ctx.textAlign = "center";
  }
  async function makeCard(d) {
    await fontsReady();
    const W = 720, H = 1080;
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d"); ctx.imageSmoothingEnabled = false;
    ctx.textBaseline = "top"; ctx.textAlign = "center";

    // 하늘 + 구름
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, C.sky); g.addColorStop(0.7, C.sky2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff"; [[50, 40, 110], [540, 70, 130]].forEach(([x, y, w]) => { ctx.fillRect(x, y, w, 18); ctx.fillRect(x + 18, y - 12, w - 46, 12); });

    // 문구 패널
    const px0 = 40, py0 = 110, pw = W - 80, ph = 620;
    panel(ctx, px0, py0, pw, ph, 6, C.panel, C.line, C.line);
    let y = py0 + 40;
    ctx.fillStyle = C.muted; ctx.font = `24px ${PIXEL}`; ctx.fillText(d.kicker, W / 2, y);
    y += 58;
    ctx.font = `700 46px ${SANS}`;
    d.msg.split(/<br\s*\/?>/).forEach(line => { richLine(ctx, line, W / 2, y, C.navy, C.red); y += 62; });
    y += 14;
    ctx.fillStyle = "#e1e5eb"; for (let x = px0 + 40; x < px0 + pw - 40; x += 12) ctx.fillRect(x, y, 6, 3);
    y += 26;
    if (d.body) {
      ctx.fillStyle = C.ink; ctx.font = `400 26px ${SANS}`; ctx.textAlign = "left";
      wrap(ctx, d.body, pw - 100).forEach(l => { ctx.fillText(l, px0 + 50, y); y += 42; });
      ctx.textAlign = "center"; y += 10;
    }
    const icons = await Promise.all(d.values.map(v => loadImg(window.Pixel.iconURL(v.icon))));
    if (d.values.length) {
      ctx.fillStyle = "#fff3c4"; ctx.fillRect(px0 + 40, y - 6, pw - 80, 60);   // 기업(판로) 줄 강조
      ctx.fillStyle = "#f5b800"; ctx.fillRect(px0 + 40, y - 6, 5, 60);
    }
    ctx.textAlign = "left";
    d.values.forEach((v, i) => {
      const ry = y + i * 64, rx = px0 + 56;
      px(ctx, icons[i], rx, ry, 2);
      ctx.fillStyle = C.navy; ctx.font = `700 25px ${SANS}`; ctx.fillText(v.who, rx + 80, ry + 6);
      ctx.fillStyle = C.ink; ctx.font = `400 25px ${SANS}`; ctx.fillText(v.what, rx + 80 + 104, ry + 6);
    });
    ctx.textAlign = "center";
    const logo = await loadImg("assets/logo/logo_h.png");
    if (logo) {
      const lh = 52, lw = logo.width * lh / logo.height;
      ctx.imageSmoothingEnabled = true; ctx.drawImage(logo, W / 2 - lw / 2, py0 + ph - lh - 30, lw, lh); ctx.imageSmoothingEnabled = false;
    }

    // 땅 + 장면 (2배)
    const ground = H - 90;
    ctx.fillStyle = C.grass2; ctx.fillRect(0, ground - 6, W, 6);
    ctx.fillStyle = C.grass; ctx.fillRect(0, ground, W, H - ground);
    if (d.cleared) await drawHandScene(ctx, W / 2, ground + 2, 2);
    else await drawPair(ctx, W / 2, ground + 2, 2);
    const short = (d.url || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (short && !/^(file:|localhost|127\.)/.test(short)) { ctx.fillStyle = C.ink; ctx.font = `18px ${PIXEL}`; ctx.fillText(short, W / 2, H - 46); }
    return cv;
  }

  /* ---------- OG 대표 이미지 1200×630: 손잡기 장면, 밝은 배경 ---------- */
  async function makeOG(d) {
    await fontsReady();
    const W = 1200, H = 630;
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d"); ctx.imageSmoothingEnabled = false;
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, C.sky); g.addColorStop(0.75, C.sky2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff"; [[350, 270, 110], [1040, 52, 110], [560, 40, 90]].forEach(([x, y, w]) => { ctx.fillRect(x, y, w, 20); ctx.fillRect(x + 20, y - 14, w - 50, 14); });
    const ground = H - 70, sceneX = 840, L = 64;
    ctx.fillStyle = C.grass2; ctx.fillRect(0, ground - 8, W, 8);
    ctx.fillStyle = C.grass; ctx.fillRect(0, ground, W, H - ground);
    // 오른쪽: 배지 7개 아치 + 손잡기 장면
    const picks = d.badges.filter((_, i) => i % 2 === 0).slice(0, 7);
    const badges = await Promise.all(picks.map(b => loadImg(window.Pixel.badgeURL(...b))));
    badges.forEach((im, i) => {
      const a = (155 - 130 * i / Math.max(1, badges.length - 1)) * Math.PI / 180;
      px(ctx, im, sceneX + Math.cos(a) * 310 - 36, 330 - Math.sin(a) * 250 - 36, 3);
    });
    await drawHandScene(ctx, sceneX, ground, 2.5);
    // 왼쪽: 로고 + 제목 + 문구 + 단계 표시
    const logo = await loadImg(d.logo || "assets/logo/logo_h.png");
    if (logo) {
      const lh = 64, lw = logo.width * lh / logo.height;
      ctx.fillStyle = "#fff"; ctx.fillRect(L, 36, lw + 20, lh + 12);
      ctx.imageSmoothingEnabled = true; ctx.drawImage(logo, L + 10, 42, lw, lh); ctx.imageSmoothingEnabled = false;
    }
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    const words = d.title.split(" "), last = words.pop();
    ctx.font = `88px ${PIXEL}`; ctx.fillStyle = C.navy;
    [words.join(" "), last].forEach((t, i) => { ctx.fillText(t, L, 132 + i * 100); ctx.fillText(t, L + 2, 132 + i * 100); });
    ctx.font = `700 36px ${SANS}`; ctx.fillStyle = C.ink;
    (d.tagline || [d.subtitle]).forEach((t, i) => ctx.fillText(t, L, 348 + i * 48));
    if (d.chip) {
      ctx.font = `28px ${PIXEL}`;
      const cw = ctx.measureText(d.chip).width + 44;
      panel(ctx, L, 462, cw, 60, 4, C.navy, "#04203a", "#04203a");
      ctx.fillStyle = "#fff"; ctx.textBaseline = "middle"; ctx.fillText(d.chip, L + 22, 492);
    }
    return cv;
  }

  /* ---------- 공유 ---------- */
  async function legacyCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (e) {}
    ta.remove();
    return ok;
  }
  async function share({ blob, text, url, title }) {
    const full = `${text} ${url}`;
    if (!navigator.share) {
      try { await navigator.clipboard.writeText(full); return "copied"; } catch (e) {}
      return (await legacyCopy(full)) ? "copied" : "failed";
    }
    try {
      const file = blob ? new File([blob], "조달연결작전.png", { type: "image/png" }) : null;
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title, text: full });
        return "shared";
      }
      await navigator.share({ title, text, url });
      return "shared";
    } catch (e) {
      if (e && e.name === "AbortError") return "cancel";
    }
    try { await navigator.clipboard.writeText(full); return "copied"; } catch (e) {}
    return (await legacyCopy(full)) ? "copied" : "failed";
  }

  window.Share = { makeCard, makeOG, share };
})();
