/* =========================================================
 * 픽셀 엔진 + 그림 (시안/픽셀_시안_v4.html 에서 옮김)
 *  - 도형을 픽셀 버퍼에 칠하고, 음영·외곽선을 규칙으로 넣는다.
 *  - 그림은 한 번 만들어 PNG 데이터 주소로 바꿔 두고(<img>로 씀) 다시 쓴다.
 * ========================================================= */
(function () {
  const LIGHT = (() => { const v = [-0.5, -0.62, 0.6]; const l = Math.hypot(...v); return v.map(a => a / l); })();

  const MAT = {
    whiteB: { hi:"#ffffff", l:"#fbfbfc", b:"#eceef1", d:"#d0d5dc", dd:"#aab1bc", line:"#596070", lineL:"#858d9b" },
    goggle: { hi:"#ffffff", l:"#d9f1f8", b:"#a8d7e8", d:"#83bcd3", dd:"#5f9bb6", line:"#3b7690", lineL:"#3b7690" },
    eye:    { hi:"#ffffff", l:"#4a4a58", b:"#1b1b24", d:"#1b1b24", dd:"#101016", line:"#101016", lineL:"#101016" },
    beak:   { hi:"#ffe2b8", l:"#ffbe73", b:"#f5a04a", d:"#d97d2a", dd:"#b45f18", line:"#6e3410", lineL:"#9a4d18" },
    scarf:  { hi:"#ff9a8a", l:"#f05a4c", b:"#d9352c", d:"#ad2224", dd:"#84161b", line:"#4f0d12", lineL:"#6d1418" },
    wingK:  { hi:"#8b909b", l:"#686d78", b:"#41454e", d:"#2e3138", dd:"#202228", line:"#121318", lineL:"#121318" },
    sqO:    { hi:"#ffe0b0", l:"#ffc27c", b:"#f5a552", d:"#e0863a", dd:"#c06c28", line:"#7a3c10", lineL:"#9a5220" },
    stripe: { hi:"#ec8a4c", l:"#e7804a", b:"#d9703a", d:"#c45e2a", dd:"#a84c20", line:"#7a3c10", lineL:"#9a5220" },
    bag:    { hi:"#b07a4c", l:"#9a6338", b:"#7c4a28", d:"#5f361c", dd:"#482814", line:"#2e180a", lineL:"#3e2210" },

    vestO:  { hi:"#ffd9a0", l:"#ffa840", b:"#f7861c", d:"#d96a10", dd:"#b4540c", line:"#5a2606", lineL:"#7a3608" },
    refl:   { hi:"#ffffff", l:"#f4f6f8", b:"#d4d9e0", d:"#a9b0bb", dd:"#868e9b", line:"#4b5160", lineL:"#5d6472" },
    dark:   { hi:"#9aa2b2", l:"#5c6475", b:"#3f4656", d:"#2d323e", dd:"#20242d", line:"#12141a", lineL:"#12141a" },
    ledG:   { hi:"#d4ffd9", l:"#8dfba0", b:"#4fe46e", d:"#2fb64e", dd:"#1f8a38", line:"#145a24", lineL:"#145a24" },
    ledR:   { hi:"#ffe0e0", l:"#ff7a7a", b:"#ff3b3b", d:"#c81e1e", dd:"#981414", line:"#5c0a0a", lineL:"#5c0a0a" },
    ledB:   { hi:"#e6f8ff", l:"#9fe0ff", b:"#4bbcf5", d:"#2a8ccc", dd:"#1d6aa0", line:"#0e3554", lineL:"#0e3554" },
    glow:   { hi:"#fffbe0", l:"#fff3b0", b:"#ffe066", d:"#ffd23f", dd:"#f0b81e", line:"#c08a10", lineL:"#c08a10", noLine:true },
    extR:   { hi:"#ffa59a", l:"#f45a4e", b:"#da2f2a", d:"#b01f22", dd:"#861619", line:"#4a0b10", lineL:"#6b1218" },
    metal:  { hi:"#ffffff", l:"#e3e7ec", b:"#b9c0ca", d:"#8d96a3", dd:"#6c7480", line:"#3a3f48", lineL:"#555b66" },
    plastic:{ hi:"#ffffff", l:"#ffffff", b:"#eef0f3", d:"#cdd2da", dd:"#aab1bc", line:"#4d5460", lineL:"#6f7682" },
    paper:  { hi:"#ffffff", l:"#ffffff", b:"#f5f1e6", d:"#ddd6c4", dd:"#c4bca8", line:"#6b6350", lineL:"#6b6350" },
    helmY:  { hi:"#fff6c2", l:"#ffe45c", b:"#f8cc2a", d:"#d9a516", dd:"#b0820e", line:"#5a3e05", lineL:"#7a5608" },
    coneO:  { hi:"#ffd0a8", l:"#ff9a4a", b:"#f2702a", d:"#d4561a", dd:"#b04212", line:"#5a1e06", lineL:"#7a2a0a" },
    coneW:  { hi:"#ffffff", l:"#ffffff", b:"#eef0f3", d:"#c9ced6", dd:"#a5acb8", line:"#5a1e06", lineL:"#7a2a0a" },
    coneBase:{ hi:"#7a808c", l:"#4f5560", b:"#383c46", d:"#282b33", dd:"#1b1e24", line:"#0e0f13", lineL:"#0e0f13" },
    wood:   { hi:"#f2c690", l:"#d9a066", b:"#b97a44", d:"#965c2e", dd:"#74431e", line:"#3e220c", lineL:"#5a3214" },
    wrapB:  { hi:"#e6f2ff", l:"#9cc7f0", b:"#5f9fe0", d:"#3f7cc0", dd:"#2c5e98", line:"#123058", lineL:"#1a3e70" },
    navy:   { hi:"#4a78a8", l:"#1f5287", b:"#08375f", d:"#062a49", dd:"#041d33", line:"#021120", lineL:"#021120" },
    heart:  { hi:"#ffffff", l:"#ff6a7a", b:"#e4032e", d:"#b00224", dd:"#86011b", line:"#5a0012", lineL:"#5a0012" },
    heartE: { hi:"#e6ebf2", l:"#d6dde7", b:"#c3ccd9", d:"#aeb8c7", dd:"#97a2b3", line:"#7d889a", lineL:"#7d889a" },
    skin:   { hi:"#fff1e4", l:"#ffe0c4", b:"#f7c9a2", d:"#e0a67c", dd:"#c08560", line:"#6e3c22", lineL:"#8a5030" },
    hair:   { hi:"#7a6658", l:"#4e3d33", b:"#3a2c25", d:"#2a1f1a", dd:"#1c1411", line:"#100b09", lineL:"#100b09" },
    suitG:  { hi:"#c9d0da", l:"#a3adbb", b:"#7f8a9a", d:"#646e7d", dd:"#4c5461", line:"#262b33", lineL:"#363c46" },
    suitN:  { hi:"#5d7fa6", l:"#2f5583", b:"#173d66", d:"#0f2d4e", dd:"#0a2038", line:"#04111f", lineL:"#06182b" },
    suitK:  { hi:"#e9dcc0", l:"#d6c39c", b:"#b9a378", d:"#97825a", dd:"#786543", line:"#3e3220", lineL:"#54452c" },
    pants:  { hi:"#6b7280", l:"#4b5160", b:"#363b47", d:"#272b34", dd:"#1b1e25", line:"#0c0e12", lineL:"#0c0e12" },
    star:   { hi:"#ffffff", l:"#fff3a0", b:"#ffd23f", d:"#e8a614", dd:"#c0840c", line:"#5a3e05", lineL:"#5a3e05" }
  };

  /* 색 이름 → 주재질 (기획서 9-0) */
  const COLOR_MAT = { white: "plastic", brown: "wood", orange: "vestO", red: "extR", blue: "wrapB", yellow: "helmY" };
  const COLOR_NAME = { white: "흰", brown: "갈색", orange: "주황", red: "빨간", blue: "파란", yellow: "노란" };

  function Spr(w, h) { return { w, h, c: new Array(w * h).fill(null), m: new Array(w * h).fill(null), swap: null }; }

  /* ---- 도형 ---- */
  function ell(cx, cy, rx, ry, rot = 0, p = 2) {
    const c = Math.cos(rot), s = Math.sin(rot);
    const uv = (x, y) => { const dx = x + 0.5 - cx, dy = y + 0.5 - cy; return [(dx * c + dy * s) / rx, (-dx * s + dy * c) / ry]; };
    return {
      in: (x, y) => { const [u, v] = uv(x, y); return Math.pow(Math.abs(u), p) + Math.pow(Math.abs(v), p) <= 1; },
      n: (x, y) => { const [u, v] = uv(x, y); return [u * c - v * s, u * s + v * c]; }
    };
  }
  function rrect(x0, y0, x1, y1, r = 0) {
    return { in: (x, y) => {
      if (x < x0 || x > x1 || y < y0 || y > y1) return false;
      if (!r) return true;
      const px = x + 0.5, py = y + 0.5;
      const dx = Math.max(x0 + r - px, 0, px - (x1 + 1 - r)), dy = Math.max(y0 + r - py, 0, py - (y1 + 1 - r));
      return dx * dx + dy * dy <= r * r;
    } };
  }
  function poly(pts) {
    return { in: (x, y) => {
      const px = x + 0.5, py = y + 0.5; let ins = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) ins = !ins;
      }
      return ins;
    } };
  }
  function seg(pts, w = 1) {
    return { in: (x, y) => {
      const px = x + 0.5, py = y + 0.5;
      for (let i = 0; i < pts.length - 1; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
        const vx = bx - ax, vy = by - ay, L2 = vx * vx + vy * vy;
        const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / L2));
        if (Math.hypot(px - ax - t * vx, py - ay - t * vy) <= w / 2) return true;
      }
      return false;
    } };
  }
  const pts = list => ({ in: (x, y) => list.some(([a, b]) => a === x && b === y) });
  const U = (...s) => ({ in: (x, y) => s.some(q => q.in(x, y)), n: s[0].n });
  const D = (a, ...b) => ({ in: (x, y) => a.in(x, y) && !b.some(q => q.in(x, y)), n: a.n });
  const I = (a, ...b) => ({ in: (x, y) => a.in(x, y) && b.every(q => q.in(x, y)), n: a.n });
  const P = fn => ({ in: fn });

  /* ---- 칠하기 (sp.swap 이 있으면 재질을 바꿔 칠함: 색 변형용) ---- */
  function draw(sp, shape, mat0, o = {}) {
    const sw = m => (sp.swap && sp.swap[m]) || m;
    const mat = sw(mat0);
    const only = o.only && o.only.map(sw);
    const M = MAT[mat], W = sp.w, H = sp.h;
    const mark = new Uint8Array(W * H), was = sp.c.slice();
    const rows = {};
    const rowExt = y => {
      if (rows[y]) return rows[y];
      let a = Infinity, b = -Infinity;
      for (let x = 0; x < W; x++) if (shape.in(x, y)) { a = Math.min(a, x); b = Math.max(b, x); }
      return (rows[y] = [a, b]);
    };
    const shade = o.shade || "bevel";
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!shape.in(x, y)) continue;
      const i = y * W + x;
      if (only && !only.includes(sp.m[i])) continue;
      let t = "b";
      if (shade === "sphere") {
        let [nx, ny] = (o.n || shape.n)(x, y);
        let r = Math.hypot(nx, ny); if (r > 1) { nx /= r; ny /= r; r = 1; }
        const nz = Math.sqrt(Math.max(0, 1 - r * r));
        const s = nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2];
        const dith = (x + y) % 2 === 0, j = 0.035;
        const th = [[0.993, "hi"], [0.78, "l"], [0.15, "b"], [-0.4, "d"]];
        t = "dd";
        for (const [v, name] of th) {
          if (s > v + (dith ? -j : j) * (name === "hi" ? 0 : 1)) { t = name; break; }
        }
      } else if (shade === "bevel") {
        const bw = o.bw || 2;
        const inn = (a, b) => a >= 0 && b >= 0 && a < W && b < H && shape.in(a, b);
        if (!inn(x - 1, y) || !inn(x, y - 1)) t = "l";
        let dk = false; for (let k = 1; k <= bw; k++) if (!inn(x + k, y) || !inn(x, y + k)) dk = true;
        if (dk) t = (!inn(x + 1, y) && !inn(x, y + 1)) || !inn(x, y + 1) ? "dd" : "d";
        if (t === "l" && dk) t = "b";
      } else if (shade === "cyl") {
        const [a, b] = rowExt(y); const tt = (x - a + 0.5) / (b - a + 1);
        t = tt < 0.1 ? "b" : tt < 0.34 ? (tt > 0.17 && tt < 0.25 ? "hi" : "l") : tt < 0.68 ? "b" : tt < 0.86 ? "d" : "dd";
        if ((b - a) < 5) t = tt < 0.4 ? "l" : tt < 0.75 ? "b" : "d";
      }
      if (o.tone) { const r = o.tone(x, y, t); if (r) t = r; }
      sp.c[i] = M[t]; sp.m[i] = mat; mark[i] = 1;
    }
    if (o.inner || o.edge) {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x; if (!mark[i]) continue;
        for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
          const a = x + dx, b = y + dy;
          if (a < 0 || b < 0 || a >= W || b >= H) continue;
          const j = b * W + a; if (mark[j]) continue;
          if (o.inner && was[j]) { sp.c[i] = M[o.inner]; break; }
          if (o.edge && !was[j]) { sp.c[i] = M[o.edge]; break; }
        }
      }
    }
    return sp;
  }
  function outline(sp) {
    const W = sp.w, H = sp.h, out = sp.c.slice(), om = sp.m.slice();
    const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? null : sp.m[y * W + x];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x; if (sp.c[i]) continue;
      const dark = [at(x, y - 1), at(x - 1, y)].find(m => m && MAT[m] && !MAT[m].noLine);
      const lite = [at(x, y + 1), at(x + 1, y)].find(m => m && MAT[m] && !MAT[m].noLine);
      if (dark) { out[i] = MAT[dark].line; om[i] = "_line"; }
      else if (lite) { out[i] = MAT[lite].lineL; om[i] = "_line"; }
    }
    sp.c = out; sp.m = om; return sp;
  }
  function toCanvas(sp) {
    const cv = document.createElement("canvas"); cv.width = sp.w; cv.height = sp.h;
    const ctx = cv.getContext("2d");
    sp.c.forEach((col, i) => { if (col) { ctx.fillStyle = col; ctx.fillRect(i % sp.w, (i / sp.w) | 0, 1, 1); } });
    return cv;
  }
  function fromMap(rows, key) {
    const sp = Spr(rows[0].length, rows.length);
    rows.forEach((r, y) => [...r].forEach((ch, x) => { if (key[ch]) { const [m, t] = key[ch]; sp.c[y * sp.w + x] = MAT[m][t]; sp.m[y * sp.w + x] = m; } }));
    return sp;
  }

  /* =========================================================
   * 큰 캐릭터 (흰 새) 96×96
   * ========================================================= */
  /* 위쪽 행들을 1px 아래로 내림 (숨쉬기 2번째 프레임) */
  function sink(sp, splitY) {
    const W = sp.w;
    for (let y = splitY; y > 0; y--) for (let x = 0; x < W; x++) {
      const i = y * W + x, j = (y - 1) * W + x;
      if (sp.c[j] || y < splitY) { sp.c[i] = sp.c[j]; sp.m[i] = sp.m[j]; }
    }
    for (let x = 0; x < W; x++) { sp.c[x] = null; sp.m[x] = null; }
    return sp;
  }
  /* 땀방울 */
  function sweat(sp, x, y) {
    draw(sp, U(ell(x, y + 4, 2.8, 3.2), poly([[x, y - 2], [x - 2.6, y + 3.5], [x + 2.6, y + 3.5]])), "ledB", { shade: "flat",
      tone: (px, py) => (px === Math.floor(x) - 1 && py === Math.floor(y) + 3) ? "hi" : py > y + 5 ? "d" : "l" });
  }

  /* o = { pose: "idle"|"happy"|"sad"|"hand", eyes: "open"|"happy"|"sad", sweat, hand: 0|1 (손 흔들기 위아래) } */
  function bird(o = {}) {
    const sp = Spr(96, 96);
    const pose = o.pose || "idle";
    // 날개 각도(왼쪽 기준, 오른쪽은 대칭)와 높이
    const W = { idle: [-0.62, 77, 22], happy: [0.5, 70, 21], sad: [-1.0, 79, 23], hand: [0.02, o.hand ? 72 : 75, 17] }[pose];
    const [wa, wy, wx] = W, wxR = 94 - wx;
    draw(sp, ell(63, 87, 8, 3.6, -0.25), "whiteB", { shade: "sphere" });
    draw(sp, ell(69, 89, 4.5, 3, -0.25), "wingK", { shade: "sphere", only: ["whiteB"] });
    [-1, 1].forEach(side => {
      const cx = side < 0 ? wx : wxR, base = side < 0 ? wa : -wa;
      [-0.26, 0, 0.26].forEach((a, k) => {
        const r = base + a * (side < 0 ? 1 : -1);
        const dx = Math.cos(r), dy = Math.sin(r);
        const len = k === 1 ? 13.5 : 12.5;
        const fx = cx - dx * len * (side < 0 ? 1 : -1), fy = wy - dy * len * (side < 0 ? 1 : -1);
        draw(sp, ell(fx, fy, 5.5, 3, r), "wingK", { shade: "sphere", inner: "dd" });
      });
    });
    draw(sp, ell(wx, wy, 12, 6.5, wa), "whiteB", { shade: "sphere", inner: "d" });
    draw(sp, ell(wxR, wy, 12, 6.5, -wa), "whiteB", { shade: "sphere", inner: "d" });
    const footL = U(rrect(36, 83, 40, 90, 1), ell(34.5, 91.5, 3, 2.4), ell(38.5, 92.6, 3, 2.4), ell(42.5, 91.5, 3, 2.4));
    const footR = U(rrect(53, 83, 57, 90, 1), ell(59.5, 91.5, 3, 2.4), ell(55.5, 92.6, 3, 2.4), ell(51.5, 91.5, 3, 2.4));
    [footL, footR].forEach(f => draw(sp, f, "beak", { shade: "bevel", bw: 1,
      tone: (x, y) => (y >= 91 && (x === 36 || x === 40 || x === 53 || x === 57)) ? "d" : null }));
    draw(sp, ell(47, 75, 19, 15.5), "whiteB", { shade: "sphere", inner: "dd" });
    draw(sp, ell(79, 28, 8.5, 4.6, 0.4), "whiteB", { shade: "sphere" });
    draw(sp, ell(74, 20, 11, 5.6, 0.28), "whiteB", { shade: "sphere", inner: "d" });
    const head = U(ell(47, 36, 36, 31), ell(63, 11, 17, 7, 0.12));
    draw(sp, head, "whiteB", { shade: "sphere", inner: "d" });
    const clip = ell(47, 36, 34, 30);
    const gog = P((x, y) => {
      if (!clip.in(x, y)) return false;
      const px = x + 0.5, py = y + 0.5, k = Math.pow((px - 47) / 40, 2);
      const notch = Math.max(0, 8.5 - Math.abs(px - 47) * 0.85);
      return py >= 31.5 + k * 3 && py <= 52 - notch - k * 4;
    });
    draw(sp, gog, "goggle", { shade: "flat", inner: "line", tone: (x, y) => {
      const px = x + 0.5, py = y + 0.5, top = 31.5 + Math.pow((px - 47) / 40, 2) * 3;
      const notch = Math.max(0, 8.5 - Math.abs(px - 47) * 0.85), bot = 52 - notch - Math.pow((px - 47) / 40, 2) * 4;
      const g = px + (py - top) * 1.3;
      if (py - top < 2.2) return "l";
      if (g > 19 && g < 22.5 && px < 34) return "hi";
      if (g > 24.5 && g < 26 && px < 36) return "l";
      if (px > 68 && px < 71 && py - top < 6) return "l";
      if (bot - py < 2.5) return "d";
      if (bot - py < 4 && (x + y) % 2) return "d";
      return null;
    } });
    const eyes = o.eyes || (pose === "happy" || pose === "hand" ? "happy" : pose === "sad" ? "sad" : "open");
    [33.5, 60.5].forEach((cx, i) => {
      if (eyes === "happy") {        // ^ ^ 웃는 눈
        draw(sp, seg([[cx - 4, 48.5], [cx, 44], [cx + 4, 48.5]], 2), "eye", { shade: "flat" });
      } else if (eyes === "sad") {   // > < 질끈 감은 눈
        const s = i === 0 ? 1 : -1;
        draw(sp, seg([[cx - 3 * s, 42.5], [cx + 2.5 * s, 46], [cx - 3 * s, 49.5]], 1.8), "eye", { shade: "flat" });
      } else {
        draw(sp, ell(cx, 46, 4.2, 4.8), "eye", { shade: "flat", tone: (x, y) => {
          const px = Math.floor(cx);
          if ((x === px + 1 || x === px + 2) && (y === 43 || y === 44)) return "hi";
          if (x === px - 2 && y === 48) return "l";
          return null;
        } });
      }
    });
    draw(sp, ell(47, 49.5, 4.6, 3.2), "beak", { shade: "sphere", inner: "dd",
      tone: (x, y) => (y === 49 && Math.abs(x + 0.5 - 47) < 3.5) ? "dd" : null });
    const band = P((x, y) => {
      const px = x + 0.5, py = y + 0.5; if (px < 30 || px > 64) return false;
      const top = 63.8 + 2.6 * (1 - Math.pow((px - 47) / 18, 2));
      return py >= top && py <= top + 3.6;
    });
    draw(sp, poly([[63, 64], [76, 60.5], [74, 66.5]]), "scarf", { shade: "bevel", bw: 1, inner: "line" });
    draw(sp, poly([[63, 67], [75, 72], [69, 74.5]]), "scarf", { shade: "bevel", bw: 1, inner: "line" });
    draw(sp, band, "scarf", { shade: "bevel", bw: 1, inner: "line" });
    draw(sp, ell(64.5, 66.5, 3.6, 3.3), "scarf", { shade: "sphere", inner: "line" });
    if (o.sweat) sweat(sp, 6.5, 24);
    if (o.breath) sink(sp, 66);
    return outline(sp);
  }

  /* =========================================================
   * 작은 캐릭터 (주황 다람쥐) 72×72
   * ========================================================= */
  function squirrel(o = {}) {
    const sp = Spr(72, 72);
    const pose = o.pose || "idle";
    const tail = ell(58, 53, 9, 13.5, 0.38);
    draw(sp, tail, "sqO", { shade: "sphere" });
    draw(sp, ell(62.5, 63.5, 7.5, 6.5, 0.3), "whiteB", { shade: "sphere", only: ["sqO"], n: tail.n });
    draw(sp, rrect(20, 47, 51, 62, 4), "bag", { shade: "bevel", bw: 1, inner: "line" });
    draw(sp, ell(31, 68.5, 4.2, 3.6), "sqO", { shade: "sphere" });
    draw(sp, ell(41, 68.5, 4.2, 3.6), "sqO", { shade: "sphere" });
    draw(sp, ell(36, 57, 12.5, 11.5), "sqO", { shade: "sphere", inner: "dd" });
    draw(sp, ell(36, 60, 7.5, 6.2), "whiteB", { shade: "sphere", only: ["sqO"] });
    draw(sp, U(rrect(27, 49, 28, 61), rrect(43, 49, 44, 61)), "bag", { shade: "flat", only: ["sqO", "whiteB"],
      tone: (x) => (x === 28 || x === 44) ? "d" : null });
    // 팔: 자세마다 위치가 다름 (가방끈 위에 그림)
    const ARMS = {
      idle: [[25, 58, 4, 6.2, 0.25], [47, 58, 4, 6.2, -0.25]],
      happy: [],   // 기쁨: 머리 뒤에 가리지 않게 아래에서 따로 그림
      sad: [[27, 59, 3.8, 6, 0.05], [45, 59, 3.8, 6, -0.05]],
      hand: [[17, o.hand ? 54 : 57, 6.8, 3.8, 0.12], [55, o.hand ? 54 : 57, 6.8, 3.8, -0.12]]
    }[pose];
    ARMS.forEach(a => draw(sp, ell(...a), "sqO", { shade: "sphere", inner: "d" }));
    draw(sp, ell(14, 13, 9, 9), "sqO", { shade: "sphere" });
    draw(sp, ell(58, 13, 9, 9), "sqO", { shade: "sphere" });
    draw(sp, ell(15.5, 14, 5, 5), "whiteB", { shade: "flat", inner: "dd", tone: (x, y) => (y < 12) ? "d" : null });
    draw(sp, ell(56.5, 14, 5, 5), "whiteB", { shade: "flat", inner: "dd", tone: (x, y) => (y < 12) ? "d" : null });
    const head = ell(36, 31, 23, 21, 0, 2.5);
    draw(sp, head, "sqO", { shade: "sphere", inner: "d" });
    draw(sp, P((x, y) => head.in(x, y) && (y + 0.5) > 33.5 - Math.pow((x + 0.5 - 36) / 23, 2) * 4),
      "whiteB", { shade: "sphere", only: ["sqO"], n: head.n });
    draw(sp, U(rrect(29, 12, 30, 18), rrect(35, 11, 36, 20), rrect(41, 12, 42, 18)), "stripe",
      { shade: "flat", only: ["sqO"], tone: (x, y) => (y >= 18 && x !== 35 && x !== 36) || y >= 20 ? "d" : (x === 29 || x === 35 || x === 41) ? "l" : null });
    if (pose === "happy") {   // 만세: 팔을 머리 양옆으로 번쩍
      draw(sp, ell(9.5, 43, 3.6, 6.5, 0.55), "sqO", { shade: "sphere", inner: "d" });
      draw(sp, ell(62.5, 43, 3.6, 6.5, -0.55), "sqO", { shade: "sphere", inner: "d" });
    }
    const eyes = o.eyes || (pose === "happy" || pose === "hand" ? "happy" : pose === "sad" ? "sad" : "open");
    [28.5, 43.5].forEach((cx, i) => {
      if (eyes === "happy") draw(sp, seg([[cx - 3, 39], [cx, 35.5], [cx + 3, 39]], 1.6), "eye", { shade: "flat" });
      else if (eyes === "sad") { const s = i === 0 ? 1 : -1; draw(sp, seg([[cx - 2.5 * s, 34.5], [cx + 2 * s, 37.5], [cx - 2.5 * s, 40.5]], 1.5), "eye", { shade: "flat" }); }
      else draw(sp, ell(cx, 37.5, 3.1, 3.3), "eye", { shade: "flat", tone: (x, y) => {
        const px = Math.floor(cx); if (x === px + 1 && y === 36) return "hi"; return null; } });
    });
    draw(sp, rrect(35, 40, 36, 41), "beak", { shade: "flat", tone: (x, y) => (y === 40) ? "l" : "d" });
    if (o.mouth === "open") {      // 말하기: 입 벌림
      draw(sp, rrect(33, 42, 38, 45, 1), "eye", { shade: "flat", tone: (x, y) => y === 42 ? "b" : null });
      draw(sp, rrect(34, 44, 37, 45, 1), "heart", { shade: "flat", tone: () => "l" });
    } else if (pose === "sad") {   // 당황: 물결 입
      draw(sp, pts([[32, 44], [33, 43], [34, 43], [35, 44], [36, 44], [37, 43], [38, 43], [39, 44]]), "eye", { shade: "flat", tone: () => "l" });
    } else {
      draw(sp, pts([[32, 42], [35, 42], [36, 42], [39, 42], [33, 43], [34, 43], [37, 43], [38, 43]]), "eye", { shade: "flat", tone: () => "l" });
    }
    if (o.sweat) sweat(sp, 64, 22);
    if (o.breath) sink(sp, 47);
    return outline(sp);
  }

  /* =========================================================
   * 엔딩 인물 64×96 (기획서 2-3, 10장): 일반 정장 차림
   *  kind: "public" (공공기관 직원: 회색 정장, 파란 넥타이, 흰 이름표)
   *        "pps"    (조달청 직원: 남색 정장, 빨간 넥타이, 둥근 배지)
   *  손을 잡을 때는 팔을 아래 옆으로 뻗어 키 작은 두 캐릭터와 손높이를 맞춘다.
   * ========================================================= */
  function person(kind, o = {}) {
    const sp = Spr(64, 96);
    // biz = 기업 직원: 베이지 재킷, 초록 넥타이, 목걸이 사원증
    const suit = { pps: "suitN", biz: "suitK" }[kind] || "suitG";
    const tie = { pps: "scarf", biz: "ledG" }[kind] || "wrapB";
    const pose = o.pose || "idle", hy = o.hand ? 66 : 69;
    // 다리 + 구두
    draw(sp, U(rrect(22, 66, 30, 88), rrect(34, 66, 42, 88)), "pants", { shade: "bevel", bw: 1 });
    draw(sp, U(rrect(18, 88, 30, 93, 2), rrect(34, 88, 46, 93, 2)), "dark", { shade: "bevel", bw: 1, inner: "line" });
    // 팔 (몸 뒤)
    const arms = pose === "hand"
      ? [seg([[21, 40], [6, hy]], 7), seg([[43, 40], [58, hy]], 7)]
      : [seg([[19, 40], [16, 64]], 7), seg([[45, 40], [48, 64]], 7)];
    arms.forEach(a => draw(sp, a, suit, { shade: "flat", tone: (x, y) => (x + y) % 9 === 0 ? "d" : "b" }));
    const hands = pose === "hand" ? [[5.5, hy + 1.5], [58.5, hy + 1.5]] : [[16, 66], [48, 66]];
    hands.forEach(([x, y]) => draw(sp, ell(x, y, 3.6, 3.6), "skin", { shade: "sphere" }));
    // 몸통 (정장)
    draw(sp, rrect(17, 35, 46, 68, 5), suit, { shade: "bevel", bw: 2, inner: "line" });
    draw(sp, poly([[25, 35], [39, 35], [32, 50]]), "plastic", { shade: "flat", tone: (x, y) => y < 37 ? "d" : "l" });
    draw(sp, U(seg([[25, 36], [30, 52]], 1.2), seg([[39, 36], [34, 52]], 1.2)), suit, { shade: "flat", tone: () => "dd" });
    draw(sp, poly([[31, 37], [33, 37], [34.5, 49], [32, 52.5], [29.5, 49]]), tie, { shade: "flat", tone: (x) => x <= 31 ? "l" : "b" });
    draw(sp, pts([[32, 56], [32, 61]]), "metal", { shade: "flat", tone: () => "l" });   // 단추
    if (kind === "pps") draw(sp, ell(40.5, 43.5, 2.6, 2.6), "navy", { shade: "flat", tone: (x, y) => y < 43 ? "b" : "d" }),
      draw(sp, pts([[40, 43], [41, 44]]), "heart", { shade: "flat", tone: () => "b" });
    else if (kind === "biz") {
      draw(sp, U(seg([[27, 36], [29, 50]], 1), seg([[37, 36], [35, 50]], 1)), "wrapB", { shade: "flat", tone: () => "b" });   // 목걸이 줄
      draw(sp, rrect(28, 50, 36, 57), "plastic", { shade: "flat", inner: "dd", tone: (x, y) => y === 51 ? "d" : (y === 54 && x > 29 && x < 35) ? "dd" : "hi" });
    }
    else draw(sp, rrect(37, 41, 44, 45), "plastic", { shade: "flat", inner: "dd", tone: (x, y) => y === 43 && x > 37 && x < 44 ? "dd" : "hi" });
    // 목 + 머리
    draw(sp, rrect(28, 30, 36, 36), "skin", { shade: "flat", tone: () => "d" });
    const head = ell(32, 20, 12.5, 13.5);
    draw(sp, head, "skin", { shade: "sphere" });
    draw(sp, U(ell(19.8, 21, 2.2, 3.2), ell(44.2, 21, 2.2, 3.2)), "skin", { shade: "flat", tone: () => "d" });   // 귀
    // 머리카락 (공공기관: 옆가르마 / 조달청: 짧은 머리)
    const hairTop = kind === "pps" || kind === "biz"
      ? P((x, y) => ell(32, 17, 13.5, 12).in(x, y) && y <= 13 + Math.abs(x + 0.5 - 32) * 0.12)
      : P((x, y) => ell(32, 17, 13.5, 12.5).in(x, y) && (y <= 12 || (x < 22 && y <= 19) || (y <= 15 && x > 27)));
    draw(sp, hairTop, "hair", { shade: "sphere", n: ell(32, 17, 13.5, 12).n });
    // 얼굴
    const smile = pose === "hand" || o.happy;
    [27, 37].forEach(cx => smile
      ? draw(sp, seg([[cx - 2, 22], [cx, 20], [cx + 2, 22]], 1.2), "eye", { shade: "flat" })
      : draw(sp, rrect(cx - 1, 19, cx, 21), "eye", { shade: "flat", tone: (x, y) => y === 19 && x === cx ? "l" : null }));
    draw(sp, U(ell(24, 25, 2, 1.2), ell(40, 25, 2, 1.2)), "heart", { shade: "flat", tone: () => "l" });   // 볼
    draw(sp, pts([[30, 27], [31, 28], [32, 28], [33, 28], [34, 27]]), "skin", { shade: "flat", tone: () => "line" });
    return outline(sp);
  }

  /* 캐릭터 프레임 (기획서 2-2). which: "big" | "small" | "public" | "pps" */
  const FRAMES = {
    big: {
      idle0: {}, idle1: { breath: 1 },
      happy: { pose: "happy" }, sad: { pose: "sad", sweat: 1 },
      hand0: { pose: "hand", hand: 0 }, hand1: { pose: "hand", hand: 1 }
    },
    small: {
      idle0: {}, idle1: { breath: 1 },
      talk0: {}, talk1: { mouth: "open" },
      happy: { pose: "happy", mouth: "open" }, sad: { pose: "sad", sweat: 1 },
      hand0: { pose: "hand", hand: 0 }, hand1: { pose: "hand", hand: 1 }
    },
    public: { idle0: {}, idle1: { breath: 1 }, hand0: { pose: "hand", hand: 0 }, hand1: { pose: "hand", hand: 1 } },
    pps:    { idle0: {}, idle1: { breath: 1 }, hand0: { pose: "hand", hand: 0 }, hand1: { pose: "hand", hand: 1 } },
    biz:    { idle0: {}, idle1: { breath: 1 }, hand0: { pose: "hand", hand: 0 }, hand1: { pose: "hand", hand: 1 } }
  };
  function charURL(which, frame) {
    const key = "char." + which + "." + frame;
    if (icons[key]) return icons[key];
    const o = FRAMES[which][frame] || {};
    const sp = which === "big" ? bird(o) : which === "small" ? squirrel(o)
      : (o.breath ? sinkOut(person(which, o), 34) : person(which, o));
    return (icons[key] = toURL(sp));
  }
  /* 외곽선까지 그린 그림을 숨쉬기 프레임으로 (윗부분 1px 내림) */
  function sinkOut(sp, splitY) { return sink(sp, splitY); }

  /* =========================================================
   * 물품 48×48 (시안 완료 8종)
   * ========================================================= */
  function chairDraw(sp) {
    const CM = "wood";
    draw(sp, U(rrect(14, 31, 16, 41), rrect(31, 31, 33, 41)), CM, { shade: "flat", tone: () => "dd" });
    draw(sp, U(rrect(13, 18, 15, 24), rrect(32, 18, 34, 24)), CM, { shade: "bevel", bw: 1 });
    draw(sp, rrect(12, 3, 35, 18, 2), CM, { shade: "bevel", bw: 2,
      tone: (x, y) => (y === 8 || y === 13) && x > 13 && x < 34 ? "d" : (y === 9 || y === 14) && x > 13 && x < 34 ? "l" : null });
    draw(sp, poly([[11, 23], [37, 23], [40, 29], [8, 29]]), CM, { shade: "flat", inner: "line",
      tone: (x, y) => y <= 24 ? "b" : (x + y) % 7 === 0 ? "b" : "l" });
    draw(sp, rrect(8, 29, 39, 32), CM, { shade: "flat", inner: "line", tone: (x, y) => y === 29 ? "b" : "d" });
    draw(sp, U(rrect(9, 33, 12, 46, 1), rrect(35, 33, 38, 46, 1)), CM, { shade: "bevel", bw: 1 });
  }
  function tissueDraw(sp) {
    draw(sp, rrect(9, 13, 38, 43, 4), "plastic", { shade: "cyl",
      tone: (x, y, t) => (y % 6 === 0 && x % 4 === 1 && t !== "hi") ? "d" : null });
    draw(sp, ell(24, 13, 15, 5), "plastic", { shade: "flat", inner: "dd", tone: (x, y) => y >= 15 ? "b" : "l" });
    draw(sp, ell(24, 13, 5.5, 2.4), "wood", { shade: "flat", tone: (x, y) => y <= 12 ? "d" : "l" });
    draw(sp, ell(24, 13, 3, 1.2), "wood", { shade: "flat", tone: () => "dd" });
    draw(sp, rrect(29, 26, 37, 47), "plastic", { shade: "bevel", bw: 1, inner: "dd",
      tone: (x, y) => (y === 37 && x % 2 === 0) ? "dd" : null });
  }
  function paperDraw(sp) {
    draw(sp, poly([[41, 21], [46, 14], [46, 37], [41, 44]]), "paper", { shade: "flat",
      tone: (x, y) => (y % 2 === 0) ? "d" : "b" });
    draw(sp, poly([[7, 14], [46, 14], [41, 21], [2, 21]]), "wrapB", { shade: "flat", tone: () => "l" });
    draw(sp, rrect(2, 21, 41, 44), "wrapB", { shade: "bevel", bw: 2, inner: "line" });
    draw(sp, rrect(2, 28, 41, 35), "paper", { shade: "flat", only: ["wrapB"],
      tone: (x, y) => y === 28 ? "hi" : y === 35 ? "d" : null });
    draw(sp, U(rrect(8, 30, 9, 33), rrect(11, 30, 12, 33), rrect(9, 30, 11, 30), rrect(9, 32, 11, 32), rrect(15, 30, 15, 33), rrect(16, 32, 17, 32), rrect(17, 30, 17, 33)), "navy", { shade: "flat" });
    draw(sp, rrect(22, 31, 37, 32), "wrapB", { shade: "flat", tone: () => "d" });
  }
  function vestDraw(sp) {
    const vest = D(U(rrect(7, 15, 40, 45, 4), rrect(10, 6, 18, 16, 2), rrect(29, 6, 37, 16, 2)),
      ell(5, 21, 6.5, 10.5), ell(43, 21, 6.5, 10.5), poly([[16, 6], [32, 6], [24, 28]]));
    const white = sp.swap && sp.swap.vestO === "plastic";
    draw(sp, vest, "vestO", { shade: "bevel", bw: 2,
      tone: (x, y) => (x === 23 || x === 24) && y >= 27 ? (x === 23 ? "dd" : "l") : ((x + y) % 2 === 0 && y > 42 ? "d" : null) });
    draw(sp, I(vest, P((x, y) => (y >= 31 && y <= 33) || (y >= 38 && y <= 40) || ((x >= 13 && x <= 15) || (x >= 32 && x <= 34)) && y <= 30)),
      white ? "metal" : "refl", { shade: "flat", only: ["vestO"], tone: (x, y) => (y === 31 || y === 38) ? "l" : (y === 33 || y === 40) ? "d" : (x === 13 || x === 32) && y < 31 ? "l" : null });
  }
  function extDraw(sp) {
    draw(sp, seg([[27, 13], [37, 15], [38.5, 30]], 2.2), "dark", { shade: "flat", tone: (x, y) => (x + y) % 3 === 0 ? "l" : null });
    draw(sp, rrect(36, 29, 40, 36, 1), "dark", { shade: "bevel", bw: 1 });
    draw(sp, rrect(14, 16, 33, 46, 7), "extR", { shade: "cyl", inner: "line" });
    draw(sp, rrect(17, 26, 30, 36, 1), "paper", { shade: "bevel", bw: 1, inner: "dd",
      tone: (x, y) => ((y === 29 || y === 33) && x >= 19 && x <= 28 && x % 2 === 0) ? "dd" : (y === 31 && x >= 19 && x <= 24) ? "d" : null });
    draw(sp, rrect(19, 10, 28, 16, 1), "metal", { shade: "cyl", inner: "line" });
    draw(sp, ell(17.5, 12.5, 3, 3), "plastic", { shade: "sphere", tone: (x, y) => (x === 17 && y === 12) ? "dd" : null });
    draw(sp, pts([[17, 13]]), "ledG", { shade: "flat" });
    draw(sp, poly([[17, 9], [35, 6.5], [35, 9], [20, 11.5]]), "dark", { shade: "bevel", bw: 1, inner: "line" });
  }
  function helmDraw(sp) {
    const dome = I(ell(24, 30, 17.5, 17), P((x, y) => y <= 30));
    draw(sp, dome, "helmY", { shade: "sphere", n: ell(24, 30, 17.5, 17).n });
    draw(sp, I(rrect(21, 13, 26, 30, 2), dome), "helmY", { shade: "bevel", bw: 1, inner: "d" });
    draw(sp, rrect(2, 29, 45, 35, 3), "helmY", { shade: "bevel", bw: 2, inner: "line" });
    draw(sp, rrect(8, 36, 39, 37), "dark", { shade: "flat", tone: x => x % 4 === 0 ? "l" : null });
  }
  function coneDraw(sp) {
    const cone = poly([[21, 7], [27, 7], [37.5, 41], [10.5, 41]]);
    draw(sp, cone, "coneO", { shade: "cyl" });
    draw(sp, I(cone, P((x, y) => (y >= 16 && y <= 20) || (y >= 28 && y <= 32))), "coneW", { shade: "cyl" });
    draw(sp, rrect(4, 40, 43, 46, 2), "coneBase", { shade: "bevel", bw: 2, inner: "line" });
  }
  function cctvDraw(sp) {
    draw(sp, rrect(5, 30, 13, 44, 2), "metal", { shade: "bevel", bw: 1 });
    draw(sp, pts([[9, 33], [9, 41]]), "dark", { shade: "flat" });
    draw(sp, seg([[10, 37], [21, 33], [21, 22]], 3), "metal", { shade: "flat", inner: "dd", tone: (x, y) => (x + y) % 2 ? "d" : null });
    draw(sp, rrect(8, 12, 37, 24, 3), "plastic", { shade: "bevel", bw: 2, inner: "line" });
    draw(sp, poly([[7, 9], [40, 9], [44, 13], [7, 13]]), "metal", { shade: "bevel", bw: 1, inner: "line" });
    draw(sp, rrect(36, 12, 42, 23, 2), "dark", { shade: "bevel", bw: 1, inner: "line" });
    draw(sp, ell(39.5, 17.5, 3, 3), "ledB", { shade: "sphere" });
    draw(sp, pts([[12, 15], [13, 15]]), "ledR", { shade: "flat" });
  }
  /* ---- 2단계 추가 물품 6종 ---- */
  function deskDraw(sp) {
    // 뒷다리 (어둡게)
    draw(sp, U(rrect(9, 29, 11, 40), rrect(37, 29, 39, 40)), "wood", { shade: "flat", tone: () => "dd" });
    // 상판 윗면 + 앞 두께
    draw(sp, poly([[7, 11], [41, 11], [46, 18], [2, 18]]), "wood", { shade: "flat",
      tone: (x, y) => y <= 12 ? "b" : (x * 3 + y * 5) % 11 === 0 ? "b" : "l" });
    draw(sp, rrect(2, 18, 46, 21), "wood", { shade: "flat", inner: "line", tone: (x, y) => y === 18 ? "b" : "d" });
    // 앞판과 서랍
    draw(sp, rrect(5, 22, 43, 29), "wood", { shade: "bevel", bw: 1, inner: "line" });
    draw(sp, rrect(25, 23, 41, 28, 1), "wood", { shade: "bevel", bw: 1, inner: "dd" });
    draw(sp, rrect(32, 25, 34, 26), "metal", { shade: "flat", tone: x => x === 32 ? "l" : "d" });
    // 앞다리
    draw(sp, U(rrect(4, 30, 7, 46, 1), rrect(41, 30, 44, 46, 1)), "wood", { shade: "bevel", bw: 1 });
  }
  function ledDraw(sp) {
    // 빛살
    [[[24, 0], [24, 3]], [[7, 5], [10, 8]], [[41, 5], [38, 8]], [[2, 19], [6, 19]], [[46, 19], [42, 19]]].forEach(s =>
      draw(sp, seg(s, 1.6), "glow", { shade: "flat", tone: () => "d" }));
    // 유리 전구 + 목
    const globe = ell(24, 19, 13, 13);
    draw(sp, U(globe, poly([[16, 27], [32, 27], [29.5, 36], [18.5, 36]])), "helmY", { shade: "sphere", n: globe.n });
    // 필라멘트
    // 필라멘트: 기둥 2개 + 가로 코일 (글자처럼 보이지 않게 단순하게)
    draw(sp, U(seg([[20, 34], [20, 20]], 1), seg([[28, 34], [28, 20]], 1)), "dark", { shade: "flat", tone: () => "l" });
    draw(sp, rrect(20, 19, 28, 20), "beak", { shade: "flat", tone: (x, y) => (x + y) % 2 ? "dd" : "l" });
    // 금속 소켓 (나사선)
    draw(sp, rrect(18, 35, 30, 43, 1), "metal", { shade: "cyl", inner: "line",
      tone: (x, y) => (y === 37 || y === 40) ? "dd" : null });
    draw(sp, rrect(21, 44, 27, 46, 1), "dark", { shade: "bevel", bw: 1 });
  }
  function binDraw(sp) {
    // 몸통 (아래로 좁아짐)
    draw(sp, poly([[8, 14], [40, 14], [37, 44], [11, 44]]), "wrapB", { shade: "bevel", bw: 2 });
    // 재활용 표시 (삼각 화살표)
    draw(sp, seg([[24, 21], [31.5, 34], [16.5, 34], [24, 21]], 2), "plastic", { shade: "flat", tone: () => "l" });
    draw(sp, pts([[29, 26], [30, 26], [30, 27], [17, 28], [18, 28], [17, 29], [23, 36], [23, 32], [24, 35], [24, 33]]), "plastic", { shade: "flat", tone: () => "l" });
    // 뚜껑 + 투입구
    draw(sp, rrect(5, 8, 43, 14, 2), "wrapB", { shade: "bevel", bw: 1, inner: "line" });
    draw(sp, rrect(16, 10, 31, 11), "dark", { shade: "flat", tone: (x, y) => y === 10 ? "dd" : "d" });
    // 바퀴
    draw(sp, U(ell(14.5, 44.5, 3, 3), ell(33.5, 44.5, 3, 3)), "dark", { shade: "sphere" });
  }
  function potteryDraw(sp) {
    const body = ell(24, 30, 15.5, 13.5);
    // 굽
    draw(sp, rrect(16, 41, 31, 46, 1), "wrapB", { shade: "bevel", bw: 1 });
    // 몸통 + 목
    draw(sp, U(body, rrect(19, 9, 28, 19)), "wrapB", { shade: "sphere", n: body.n });
    draw(sp, rrect(19, 9, 28, 18), "wrapB", { shade: "cyl" });
    // 입구
    draw(sp, rrect(15, 5, 32, 9, 2), "wrapB", { shade: "bevel", bw: 1, inner: "line" });
    draw(sp, rrect(19, 5, 28, 6), "dark", { shade: "flat", tone: () => "d" });
    // 흰 물결 무늬 + 점 꽃
    draw(sp, P((x, y) => body.in(x, y) && Math.abs(y - (31 + Math.round(Math.sin((x + 0.5) / 2.6) * 1.6))) < 1),
      "plastic", { shade: "flat", only: ["wrapB"], tone: () => "l" });
    draw(sp, pts([[16, 24], [24, 22], [32, 24], [15, 25], [17, 25], [16, 23], [23, 22], [25, 22], [24, 21], [31, 24], [33, 24], [32, 23]]),
      "plastic", { shade: "flat", only: ["wrapB"], tone: () => "b" });
  }
  function fanDraw(sp) {
    const cx = 24, cy = 44;
    const polar = (x, y) => { const dx = x + 0.5 - cx, dy = y + 0.5 - cy; return [Math.hypot(dx, dy), Math.atan2(dy, dx) * 180 / Math.PI]; };
    const leaf = P((x, y) => { const [r, a] = polar(x, y); return r >= 9 && r <= 23 && a >= -166 && a <= -14; });
    // 부채 면 (주름: 각도마다 밝기 번갈아)
    draw(sp, leaf, "wood", { shade: "flat", tone: (x, y) => {
      const [r, a] = polar(x, y);
      if (r > 21.6) return "d";
      if (r < 10.4) return "d";
      const k = Math.floor((a + 166) / 9.5);
      return k % 2 ? "b" : "l";
    } });
    // 속살 (사북 쪽 대나무 살)
    for (let a = -160; a <= -20; a += 14) {
      const t = a * Math.PI / 180;
      draw(sp, seg([[cx, cy], [cx + Math.cos(t) * 10, cy + Math.sin(t) * 10]], 1.1), "wood", { shade: "flat", tone: () => "dd" });
    }
    // 겉살 (양 끝)
    [-166, -14].forEach(a => { const t = a * Math.PI / 180;
      draw(sp, seg([[cx, cy], [cx + Math.cos(t) * 23, cy + Math.sin(t) * 23]], 2), "wood", { shade: "flat", tone: () => "dd" }); });
    // 사북 (고정 못)
    draw(sp, ell(cx, cy, 2.4, 2.4), "metal", { shade: "sphere" });
  }
  function hanjiDraw(sp) {
    // 아래: 쌓인 종이
    draw(sp, rrect(5, 33, 42, 43), "paper", { shade: "bevel", bw: 1, inner: "line",
      tone: (x, y) => (y === 36 || y === 39 || y === 42) && x > 5 ? "d" : null });
    // 위: 말아 둔 종이 (가로 원통)
    draw(sp, rrect(7, 15, 44, 32, 8), "paper", { shade: "flat", inner: "line", tone: (x, y) => {
      const t = (y - 15) / 17;
      if ((x * 7 + y * 13) % 17 === 0) return "d";   // 닥나무 섬유 결
      return t < 0.12 ? "b" : t < 0.36 ? (y === 19 ? "hi" : "l") : t < 0.7 ? "b" : t < 0.88 ? "d" : "dd";
    } });
    // 말린 끝 (나선)
    draw(sp, ell(9.5, 23.5, 4.5, 8.5), "paper", { shade: "flat", inner: "dd", tone: (x, y) => (x + y) % 3 ? "b" : "d" });
    draw(sp, U(ell(9.5, 23.5, 2, 4)), "paper", { shade: "flat", tone: () => "dd" });
    // 묶은 끈
    draw(sp, rrect(25, 14, 27, 33), "extR", { shade: "flat", tone: x => x === 25 ? "l" : x === 27 ? "d" : "b" });
    draw(sp, U(ell(22, 35.5, 3, 2), ell(30, 35.5, 3, 2)), "extR", { shade: "sphere" });
    draw(sp, U(seg([[25, 37], [22, 45]], 1.4), seg([[27, 37], [30, 45]], 1.4)), "extR", { shade: "flat", tone: () => "d" });
  }

  /* 아직 안 그린 물품: 임시 그림 (색 상자). 이름은 화면에서 글자로 덧붙인다 */
  function placeholderDraw(sp, main) {
    draw(sp, rrect(6, 8, 41, 43, 3), main, { shade: "bevel", bw: 2 });
    draw(sp, U(rrect(11, 14, 36, 15), rrect(11, 36, 36, 37)), main, { shade: "flat", tone: () => "d" });
  }

  /* id → [그리는 함수, 주재질, 원래 색]. 원래 색과 다른 색을 요청하면 주재질만 바꿔 칠한다 */
  const DRAW = {
    chair: [chairDraw, "wood", "brown"], tissue: [tissueDraw, "plastic", "white"], paper: [paperDraw, "wrapB", "blue"],
    vest: [vestDraw, "vestO", "orange"], extinguisher: [extDraw, "extR", "red"], helmet: [helmDraw, "helmY", "yellow"],
    cone: [coneDraw, "coneO", "orange"], cctv: [cctvDraw, "plastic", "white"],
    desk: [deskDraw, "wood", "brown"], led: [ledDraw, "helmY", "yellow"], bin: [binDraw, "wrapB", "blue"],
    pottery: [potteryDraw, "wrapB", "blue"], fan: [fanDraw, "wood", "brown"], hanji: [hanjiDraw, "paper", "white"]
  };

  const urlCache = {};
  function toURL(sp) { return toCanvas(sp).toDataURL("image/png"); }

  /* 물품 그림 주소. color: 색 이름 (white, brown ...) */
  function itemURL(id, color) {
    const key = id + "." + color;
    if (urlCache[key]) return urlCache[key];
    const sp = Spr(48, 48);
    const def = DRAW[id];
    if (def) {
      const [fn, main, natural] = def;
      const target = COLOR_MAT[color];
      if (color !== natural && target && target !== main) sp.swap = { [main]: target };
      fn(sp);
    } else {
      placeholderDraw(sp, COLOR_MAT[color] || "plastic");
    }
    return (urlCache[key] = toURL(outline(sp)));
  }
  const isPlaceholder = id => !DRAW[id];

  /* ---- 작은 아이콘 ---- */
  const HEART_MAP = [
    ".oo...oo.",
    "orro.orro",
    "orwrrrrro",
    "orrrrrrdo",
    ".orrrrdo.",
    "..orrdo..",
    "...odo...",
    "....o...."];
  const BLD_MAP = [
    "....oooo....",
    "..oooooooo..",
    "oooooooooooo",
    ".o..o..o..o.",
    ".o..o..o..o.",
    ".o..o..o..o.",
    ".o..o..o..o.",
    "oooooooooooo",
    "oooooooooooo"];
  const CLOCK_MAP = [
    "..oooo..",
    ".owwwwo.",
    "owwowwwo",
    "owwowwwo",
    "owwooowo",
    "owwwwwwo",
    ".owwwwo.",
    "..oooo.."];
  const CHECK_MAP = [
    "........gg",
    ".......ggg",
    "......ggg.",
    "gg...ggg..",
    "ggg.ggg...",
    ".ggggg....",
    "..ggg.....",
    "...g......"];

  /* ---- 역할 그림 아이콘 32×32 (기업·나라장터·공공기관·국민) ---- */
  function iconFactory() {   // 기업: 톱니 지붕 공장 + 굴뚝 + 상자
    const sp = Spr(32, 32);
    draw(sp, rrect(22, 3, 25, 14), "extR", { shade: "cyl" });
    draw(sp, U(ell(26, 2.5, 2, 1.6), ell(29, 1.5, 1.6, 1.2)), "plastic", { shade: "flat", tone: () => "d" });
    draw(sp, poly([[3, 13], [9, 8], [9, 13], [15, 8], [15, 13], [21, 8], [21, 13], [28, 13], [28, 14], [3, 14]]), "navy", { shade: "flat", tone: (x, y) => y < 11 ? "l" : "b" });
    draw(sp, rrect(3, 14, 28, 28), "metal", { shade: "bevel", bw: 1, inner: "line" });
    draw(sp, U(rrect(6, 17, 9, 20), rrect(12, 17, 15, 20), rrect(18, 17, 21, 20)), "ledB", { shade: "flat", tone: (x, y) => y === 17 ? "hi" : "b" });
    draw(sp, rrect(23, 21, 26, 28), "dark", { shade: "flat" });
    draw(sp, rrect(6, 23, 13, 28), "wood", { shade: "bevel", bw: 1, inner: "line", tone: (x, y) => y === 25 ? "d" : null });
    return outline(sp);
  }
  function iconMall() {      // 조달청(나라장터): 화면 속 장바구니
    const sp = Spr(32, 32);
    draw(sp, U(rrect(13, 22, 18, 26), rrect(9, 26, 22, 28, 1)), "metal", { shade: "bevel", bw: 1 });
    draw(sp, rrect(2, 4, 29, 22, 2), "navy", { shade: "bevel", bw: 1 });
    draw(sp, rrect(4, 6, 27, 20), "plastic", { shade: "flat", tone: (x, y) => y === 6 ? "d" : "hi" });
    draw(sp, rrect(4, 6, 27, 8), "heart", { shade: "flat", tone: () => "b" });          // 상단 띠 (빨강)
    draw(sp, U(seg([[8, 11], [11, 11], [13, 16], [21, 16], [23, 12], [12, 12]], 1.4)), "navy", { shade: "flat" });
    draw(sp, U(ell(14, 18.5, 1.3, 1.3), ell(20, 18.5, 1.3, 1.3)), "navy", { shade: "flat" });
    return outline(sp);
  }
  function iconGov() {       // 공공기관: 기둥 있는 건물
    const sp = Spr(32, 32);
    draw(sp, poly([[16, 2], [30, 10], [2, 10]]), "navy", { shade: "flat", tone: (x, y) => y < 6 ? "l" : "b" });
    draw(sp, rrect(3, 10, 28, 12), "navy", { shade: "flat", tone: () => "d" });
    draw(sp, U(rrect(5, 13, 7, 25), rrect(11, 13, 13, 25), rrect(18, 13, 20, 25), rrect(24, 13, 26, 25)), "plastic", { shade: "cyl" });
    draw(sp, rrect(2, 26, 29, 29), "navy", { shade: "bevel", bw: 1 });
    draw(sp, ell(16, 7, 1.6, 1.6), "glow", { shade: "flat", tone: () => "d" });
    return outline(sp);
  }
  function iconPeople() {    // 국민: 세 사람
    const sp = Spr(32, 32);
    [[7, 0, "vestO"], [25, 0, "ledG"], [16, 2, "wrapB"]].forEach(([x, dy, m]) => {
      draw(sp, I(ell(x, 26 + dy, 6, 7), P((px, py) => py <= 28)), m, { shade: "sphere", n: ell(x, 26 + dy, 6, 7).n });
      draw(sp, ell(x, 13 + dy, 3.6, 3.8), "skin", { shade: "sphere", inner: "d" });
      draw(sp, I(ell(x, 12.2 + dy, 3.8, 3.4), P((px, py) => py <= 11 + dy)), "hair", { shade: "flat", tone: () => "b" });
    });
    return outline(sp);
  }

  const icons = {};
  function iconURL(name) {
    if (icons[name]) return icons[name];
    let sp;
    if (name === "heart") sp = fromMap(HEART_MAP, { o: ["heart", "line"], r: ["heart", "b"], w: ["heart", "hi"], d: ["heart", "d"] });
    else if (name === "heartEmpty") sp = fromMap(HEART_MAP, { o: ["heartE", "line"], r: ["heartE", "b"], w: ["heartE", "hi"], d: ["heartE", "d"] });
    else if (name === "building") sp = fromMap(BLD_MAP, { o: ["navy", "b"] });
    else if (name === "clock") sp = fromMap(CLOCK_MAP, { o: ["navy", "b"], w: ["plastic", "hi"] });
    else if (name === "check") sp = fromMap(CHECK_MAP, { g: ["ledG", "dd"] });
    else if (name === "factory") sp = iconFactory();
    else if (name === "mall") sp = iconMall();
    else if (name === "gov") sp = iconGov();
    else if (name === "people") sp = iconPeople();
    else if (name === "bird") sp = bird();
    else if (name === "squirrel") sp = squirrel();
    return (icons[name] = toURL(sp));
  }

  /* =========================================================
   * 유형 배지 24×24 (기획서 7-1): 색 + 모양 + 가운데 기호
   *  실제 인증 마크를 닮지 않게 단순한 일반 기호만 쓴다.
   * ========================================================= */
  function mix(hex, to, k) {
    const a = parseInt(hex.slice(1), 16), b = to === "w" ? 0xffffff : 0;
    const ch = s => Math.round(((a >> s) & 255) * (1 - k) + ((b >> s) & 255) * k);
    return "#" + [16, 8, 0].map(s => ch(s).toString(16).padStart(2, "0")).join("");
  }
  function matFromHex(hex) {
    const key = "badge_" + hex;
    if (!MAT[key]) MAT[key] = { hi: mix(hex, "w", 0.55), l: mix(hex, "w", 0.25), b: hex, d: mix(hex, "k", 0.2), dd: mix(hex, "k", 0.38), line: mix(hex, "k", 0.62), lineL: mix(hex, "k", 0.5) };
    return key;
  }
  const SYMBOL = {
    bulb: ["..###..", ".#####.", "#######", "#######", "#######", ".#####.", "..###..", "..###..", ".......", "..###..", "...#..."],
    heart: [".##.##.", "#######", "#######", "#######", ".#####.", "..###..", "...#..."],
    star: ["....#....", "...###...", "#########", ".#######.", "..#####..", "..##.##..", ".##...##."],
    check: [".......##", "......##.", ".....##..", "##..##...", ".####....", "..##....."],
    hands: ["##.......##", "###.....###", ".###...###.", "..#######..", ".#########.", "..#######..", "...#.#.#..."],
    sprout: ["##.....##", "###...###", ".###.###.", "..##.##..", "....#....", "....#....", "..#####.."],
    gear: ["....###....", ".##.###.##.", ".#########.", "..###.###..", "####...####", "###.....###", "####...####", "..###.###..", ".#########.", ".##.###.##.", "....###...."],
    exclaim: ["##", "##", "##", "##", "##", "..", "##"],
    leaf: ["....####", "..######", ".#######", ".###.###", ".##.####", "..#.###.", ".#......", "#......."],
    flag: ["#.......", "######..", "########", "#######.", "######..", "#.......", "#.......", "#......."],
    knot: ["....#....", "...###...", "..##.##..", ".##.#.##.", "..##.##..", "...###...", "....#....", "...###...", "..#####..", "..#.#.#..", "..#.#.#.."],
    people: ["....###....", ".##.###.##.", ".##.###.##.", ".....#.....", "##.#####.##", "##.#####.##", "##.#####.##"],
    ribbon: ["..#####..", ".#######.", ".##...##.", ".##...##.", ".#######.", "..#####..", "..##.##..", ".##...##.", ".#.....#."]
  };
  const SHAPE = {
    circle: () => ell(12, 12, 10.2, 10.2),
    hexagon: () => poly([[6.5, 2], [17.5, 2], [22.6, 12], [17.5, 22], [6.5, 22], [1.4, 12]]),
    shield: () => poly([[2, 2], [22, 2], [22, 12.5], [12, 22.6], [2, 12.5]]),
    square: () => rrect(2, 2, 21, 21, 3),
    triangle: () => poly([[12, 1], [22.8, 22], [1.2, 22]])
  };
  function badgeURL(hex, shape, symbol) {
    const key = ["badge", hex, shape, symbol].join(".");
    if (icons[key]) return icons[key];
    const sp = Spr(24, 24), mat = matFromHex(hex), sh = SHAPE[shape]();
    draw(sp, sh, mat, { shade: "bevel", bw: 2 });
    // 안쪽 테두리 한 줄 (메달 느낌)
    const inner = P((x, y) => sh.in(x, y) && [[2, 0], [-2, 0], [0, 2], [0, -2]].some(([a, b]) => !sh.in(x + a, y + b)) && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([a, b]) => sh.in(x + a, y + b)));
    draw(sp, inner, mat, { shade: "flat", tone: (x, y) => (x + y) < 24 ? "l" : "d" });
    // 가운데 기호 (흰색 + 오른쪽 아래 그림자)
    const map = SYMBOL[symbol] || [];
    const h = map.length, w = h ? map[0].length : 0;
    const ox = Math.round(12 - w / 2), oy = Math.round((shape === "triangle" ? 14.5 : 12) - h / 2);
    const on = (x, y) => { const r = map[y - oy]; return !!r && r[x - ox] === "#"; };
    draw(sp, P((x, y) => !on(x, y) && on(x - 1, y - 1) && sh.in(x, y)), mat, { shade: "flat", tone: () => "dd" });
    draw(sp, P((x, y) => on(x, y)), "plastic", { shade: "flat", tone: (x, y) => on(x, y - 1) ? "l" : "hi" });
    return (icons[key] = toURL(outline(sp)));
  }

  window.Pixel = { itemURL, iconURL, badgeURL, charURL, FRAMES, isPlaceholder, COLOR_NAME, COLOR_MAT, MAT };
})();
