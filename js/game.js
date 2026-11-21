/* =========================================================
 * 조달 연결 작전 — 게임 흐름 (기획서 3~5장)
 *  title → intro(정지) → play(타이머) → clear(정지, 시간 +N) → 유형 팝업 → 다음 단계 …
 *                          └ 목숨 0 / 시간 0 → over → result
 * ========================================================= */
(function () {
  const CFG = window.GAME_CONFIG, T = window.TEXTS, PX = window.Pixel, ITEMS = window.ITEMS, STAGES = window.STAGES;
  const N = STAGES.length;
  const $ = s => document.querySelector(s);
  const rand = n => Math.floor(Math.random() * n);
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const two = n => String(n).padStart(2, "0");
  const tierOf = no => CFG.tiers.filter(t => no >= t.from).pop();

  /* ---------- 판 만들기 (기획서 9장, 9-0) ---------- */
  function buildBoard(idx) {
    const st = STAGES[idx], tier = tierOf(idx + 1), n = tier.grid * tier.grid;
    const reqs = st.wants.map(([id, need]) => ({ id, color: ITEMS[id].color, need, got: 0 }));
    const reqIds = new Set(reqs.map(r => r.id));
    const reqColors = new Set(reqs.map(r => r.color));
    const cells = [];
    // 찾을 물품: 수요 수량 + 덤 (덤까지 탭하면 오답)
    reqs.forEach(r => {
      const [a, b] = tier.extra, extra = a + rand(b - a + 1);
      for (let k = 0; k < r.need + extra; k++) cells.push({ id: r.id, color: r.color, req: r });
    });
    // 수요에 없는 물품의 (종류, 색) 목록
    const others = [];
    Object.keys(ITEMS).forEach(id => { if (!reqIds.has(id)) ITEMS[id].colors.forEach(color => others.push({ id, color })); });
    const same = others.filter(o => reqColors.has(o.color));
    const diff = others.filter(o => !reqColors.has(o.color));
    // 같은 그림(물품+색)은 한 판에 maxSame 개까지만 (반복돼 보이지 않게)
    const used = {};
    const fill = (pool, count) => {
      let bag = [];
      for (let k = 0; k < count && cells.length < n; k++) {
        const ok = pool.filter(o => (used[o.id + o.color] || 0) < CFG.maxSame);
        if (!ok.length) return;
        if (!bag.length) bag = shuffle(ok);
        const o = bag.pop();
        if ((used[o.id + o.color] || 0) >= CFG.maxSame) { k--; continue; }
        used[o.id + o.color] = (used[o.id + o.color] || 0) + 1;
        cells.push({ id: o.id, color: o.color, req: null });
      }
    };
    fill(same, Math.round(n * tier.sameColor));   // 같은 색 방해물
    fill(diff.length ? diff : others, n);         // 나머지 칸
    fill(others, n);                              // 상한 때문에 칸이 남으면 아무 방해물로
    if (cells.length > n) console.warn(`[stages] ${idx + 1}단계 물품이 칸 수보다 많습니다.`);
    return { idx, st, grid: tier.grid, reqs, cells: shuffle(cells).slice(0, n) };
  }

  /* ---------- 상태 ---------- */
  let run = null, state = "title", paused = false;
  const el = {};
  const img = (src, cls = "px") => `<img class="${cls}" src="${src}" alt="" draggable="false">`;
  const itemImg = (id, color) => img(PX.itemURL(id, color)) + (PX.isPlaceholder(id) ? `<span class="ph">${esc(ITEMS[id].name)}</span>` : "");
  const badgeHTML = st => img(PX.badgeURL(...st.badge), "px badge");

  function showScreen(id) { document.querySelectorAll(".screen").forEach(s => s.classList.toggle("active", s.id === id)); }

  /* ---------- 캐릭터 동작 (기획서 2-2) ----------
   *  mood: idle(숨쉬기 2프레임) | talk(입 2프레임, 작은 캐릭터) | happy(점프) | sad(땀방울·흔들림) | hand(손 흔들기 2프레임) */
  const actors = {};
  function makeActor(key, container, which) {
    const im = document.createElement("img");
    im.className = "px"; im.alt = ""; im.draggable = false;
    container.prepend(im);
    const a = { key, which, box: container, img: im, mood: "idle", since: 0, frame: "" };
    container.classList.add("idle");
    actors[key] = a; paintActor(a, performance.now());
    return a;
  }
  function frameOf(a, t) {
    const dt = t - a.since, alt = ms => Math.floor(dt / ms) % 2;
    switch (a.mood) {
      case "talk": return a.which === "small" ? (alt(150) ? "talk1" : "talk0") : (alt(500) ? "idle1" : "idle0");
      case "hand": return alt(260) ? "hand1" : "hand0";
      case "walk": return alt(160) ? "idle1" : "idle0";
      case "happy": case "sad": return a.mood;
      default: return alt(520) ? "idle1" : "idle0";
    }
  }
  function paintActor(a, t) {
    const f = frameOf(a, t);
    if (f !== a.frame) { a.frame = f; a.img.src = PX.charURL(a.which, f); }
  }
  function setMood(key, mood, ms) {
    const a = actors[key]; if (!a) return;
    a.mood = mood; a.since = performance.now();
    a.box.classList.remove("idle", "happy", "sad", "talk", "hand", "walk"); void a.box.offsetWidth; a.box.classList.add(mood);
    paintActor(a, a.since);
    clearTimeout(a._t);
    if (ms) a._t = setTimeout(() => setMood(key, "idle"), ms);
  }
  setInterval(() => { const t = performance.now(); Object.values(actors).forEach(a => paintActor(a, t)); }, 60);

  function say(text, ms = 1600) {
    el.bubble.textContent = text; el.bubble.classList.add("show");
    setMood("small", "talk", Math.min(ms, 1100));
    clearTimeout(el.bubble._t); el.bubble._t = setTimeout(() => el.bubble.classList.remove("show"), ms);
  }

  /* ---------- 그리기 ---------- */
  // 목숨: 잃은 자리에는 빈 하트가 남고, 방금 잃은 하트는 크게 커졌다가 사라짐
  function renderLives(lost) {
    el.lives.innerHTML = Array.from({ length: CFG.lives }, (_, i) =>
      `<span class="hslot">${img(PX.iconURL(i < run.lives ? "heart" : "heartEmpty"))}` +
      (lost && i === run.lives ? img(PX.iconURL("heart"), "px hburst") : "") + `</span>`).join("");
  }
  const stageTime = idx => CFG.stageTimeFirst + (CFG.stageTimeLast - CFG.stageTimeFirst) * idx / Math.max(1, N - 1);
  function renderTime() {
    const segs = el.segs;
    const ratio = Math.max(0, Math.min(1, run.time / run.limit));
    const on = Math.ceil(ratio * segs.length);
    segs.forEach((s, i) => s.classList.toggle("on", i < on));
    el.timebar.classList.toggle("warn", ratio <= CFG.warnRatio && ratio > CFG.dangerRatio);
    el.timebar.classList.toggle("danger", ratio <= CFG.dangerRatio);
  }
  function buzz(ms) {
    const act = navigator.userActivation;
    if (navigator.vibrate && (!act || act.hasBeenActive)) try { navigator.vibrate(ms); } catch (e) {}
  }
  function renderWants() {
    const b = run.board;
    el.wants.style.gridTemplateColumns = `repeat(${b.reqs.length}, 1fr)`;
    el.wants.innerHTML = b.reqs.map((r, j) => {
      const left = r.need - r.got, done = left <= 0;
      return `<div class="want ${done ? "done" : ""}" data-j="${j}">
        <div class="pic">${itemImg(r.id, r.color)}</div>
        <div class="txt"><span class="nm">${esc(ITEMS[r.id].name)}</span>
        <span class="qty">${done ? img(PX.iconURL("check")) : `× ${left}`}</span></div></div>`;
    }).join("");
  }
  function renderCard() {
    const b = run.board, st = b.st, no = b.idx + 1;
    el.reqStage.textContent = `${no}단계`;
    el.reqType.textContent = st.type;
    el.reqAgency.textContent = `수요기관: ${st.agency}`;
    el.reqNeed.textContent = st.need ? `“${st.need}”` : "";
    el.progress.textContent = `${two(no)}/${N}`;
    renderWants();
  }
  function fitGrid() {
    if (!run || !run.board) return;
    const W = el.app.clientWidth, g = run.board.grid;
    let w = g === 7 ? W - 8 : W - 24;   // 7×7은 화면 폭에 가깝게 (기획서 6-0)
    // 세로가 모자라면 격자를 줄임. 단 칸이 48px보다 작아지지 않게
    const room = el.app.clientHeight - el.grid.offsetTop - 2;
    const minW = g * 48 + (g === 7 ? 6 + 2 : g === 6 ? 10 + 4 + 12 : 16 + 8 + 20) + 4;
    w = Math.max(Math.min(w, room), Math.min(w, minW));
    el.grid.style.width = w + "px";
    // 아래 캐릭터 자리가 너무 좁으면(키 작은 폰) 발만 잘려 보이지 않게 숨김. 말풍선은 아래에 따로 보임
    // 자리가 넉넉하면 캐릭터를 2배로 (정수 배율만)
    requestAnimationFrame(() => {
      const fl = el.big.parentElement.getBoundingClientRect().height;
      el.game.classList.toggle("no-floor", fl < 60);
      // 1.5배는 화면 밀도 2배 폰에서 실제 픽셀 3칸이 되어 깨지지 않음
      el.game.style.setProperty("--cs", fl >= 196 ? 2 : fl >= 146 ? 1.5 : 1);
    });
    el.grid.style.margin = g === 7 ? "0 -6px" : "0 auto";
  }
  function renderGrid() {
    const b = run.board;
    el.grid.className = `grid g${b.grid} swap`;
    el.grid.style.gridTemplateColumns = `repeat(${b.grid}, 1fr)`;
    el.grid.innerHTML = "";
    b.cells.forEach((c, i) => {
      const btn = document.createElement("button");
      const alt = b.grid === 7 && ((i % 7) + Math.floor(i / 7)) % 2 === 1;
      btn.type = "button";
      btn.className = "cell" + (alt ? " alt" : "") + (CFG.debug && c.req ? " dbg" : "");
      btn.innerHTML = itemImg(c.id, c.color);
      btn.setAttribute("aria-label", `${PX.COLOR_NAME[c.color]} ${ITEMS[c.id].name}`);
      btn.addEventListener("pointerdown", e => { e.preventDefault(); onCell(c, btn); });
      c.el = btn;
      el.grid.appendChild(btn);
    });
    fitGrid();
  }

  /* ---------- 팝업·안내 ---------- */
  function popup(no, mode) {
    // mode: "clear" (배지 획득, 다음 단계) | "peek" (수요 카드에서 미리 보기, 닫기)
    return new Promise(resolve => {
      const st = STAGES[no - 1];
      el.popHead.textContent = mode === "clear" ? "✦ 유형 배지 획득! ✦" : `${T.buyCond} 안내`;
      el.popBadge.innerHTML = badgeHTML(st);
      el.popStage.textContent = `${no}단계`;
      el.popType.textContent = st.type;
      el.popEasy.textContent = st.easy;
      el.popMore.textContent = st.more;
      el.popBtn.textContent = mode === "peek" ? "닫기" : no === N ? "조달 완료 확인 ▶" : "다음 단계 ▶";
      el.popup.classList.remove("clear", "peek");
      el.popup.classList.add("show", mode);
      if (mode === "clear") SFX.badge(); else SFX.tap();
      const shown = performance.now();
      el.popBtn.onclick = () => {
        if (performance.now() - shown < 300) return;
        el.popup.classList.remove("show"); el.popBtn.onclick = null;
        SFX.tap(); resolve();
      };
    });
  }
  function tip(text) {
    return new Promise(resolve => {
      el.tipText.textContent = text;
      el.tip.classList.add("show");
      setMood("small", "talk", 1200);
      const shown = performance.now();
      el.tip.onclick = () => {
        if (performance.now() - shown < 300) return;
        el.tip.classList.remove("show"); el.tip.onclick = null;
        SFX.tap(); resolve();
      };
    });
  }
  function banner(text, bad) {
    el.banner.textContent = text;
    el.banner.className = "banner show" + (bad ? " bad" : "");
    clearTimeout(el.banner._t); el.banner._t = setTimeout(() => (el.banner.className = "banner"), 1300);
  }

  /* ---------- 흐름 ---------- */
  async function startRun() {
    SFX.unlock();
    BGM.play("main", { level: 0.5 });   // 게임 중에는 메인곡을 50%로
    run = { idx: 0, lives: CFG.lives, time: 1, limit: 1, board: null, done: [] };
    const m = CFG.debug && location.search.match(/[?&]stage=(\d+)/);
    if (m) run.idx = Math.max(0, Math.min(N - 1, +m[1] - 1));
    // 테스트용: ?debug=1&end=1 → 13건 모두 연결한 상태로 조달 완료 목록부터
    if (CFG.debug && /[?&]end=1/.test(location.search)) {
      run.done = STAGES.map((_, i) => buildBoard(i)); run.idx = N - 1;
      return showDone();
    }
    paused = false;
    showScreen("screen-game");
    setMood("big", "idle"); setMood("small", "idle");
    renderLives(); renderTime();
    await enterStage();
  }

  async function enterStage(retry) {
    state = "intro";
    run.board = buildBoard(run.idx);
    run.limit = run.time = stageTime(run.idx);
    renderCard(); renderGrid(); renderTime();
    el.req.classList.remove("drop"); void el.req.offsetWidth; el.req.classList.add("drop");
    el.stamp.classList.remove("show", "s1", "s2", "s3");
    SFX.stageStart();
    setMood("small", "happy", 500);
    const me = run;
    await wait(CFG.timing.cardDrop);
    if (me !== run) return;
    const no = run.idx + 1, prev = run.idx > 0 ? tierOf(no - 1) : null;
    if (retry) say("다시 해 볼까요? 서둘러요!", 1300);
    else if (run.idx === 0) await tip(T.firstTip);
    else if (prev && prev.grid !== tierOf(no).grid) await tip(T.growTip);
    else say(T.arrived(run.board.st.agency), 1300);
    if (me !== run) return;
    state = "play";
  }

  function onCell(c, btn) {
    if (state !== "play" || paused || c.found) return;
    const r = c.req;
    if (r && r.got < r.need) {
      c.found = true; r.got++;
      btn.classList.add("found");
      const j = run.board.reqs.indexOf(r);
      flyToCard(c, btn, j);           // 맞힌 물품이 바로 수요 카드 칸으로 쏙
      setMood("big", "happy", 500);
      if (r.got >= r.need) SFX.bonus(); else SFX.correct();
      if (run.board.reqs.every(x => x.got >= x.need)) clearStage();
    } else {
      run.lives--;
      SFX.wrong();
      // 오답 피드백: ① 하트가 커졌다 사라짐(빈 하트 남음) ② 짧은 진동 ③ 그 칸 테두리 빨갛게 깜빡임
      btn.classList.remove("wrong"); void btn.offsetWidth; btn.classList.add("wrong");
      renderLives(true);
      buzz(50);
      setMood("big", "sad", 800);
      if (run.lives <= 0) fail("lives");
    }
  }

  /* 맞힌 물품: 칸에서 수요 카드의 해당 칸으로 날아가고, 도착하면 수량이 줄어듦 */
  function flyToCard(c, btn, j) {
    const pic = el.wants.querySelector(`[data-j="${j}"] .pic`);
    const from = center(btn), to = pic ? center(pic) : from;
    const f = document.createElement("img");
    f.className = "px fly"; f.src = PX.itemURL(c.id, c.color); f.alt = "";
    f.style.left = Math.round(from.x - 24) + "px"; f.style.top = Math.round(from.y - 24) + "px";
    f.style.transition = `transform ${CFG.timing.fly}ms steps(5)`;
    el.app.appendChild(f);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      f.style.transform = `translate(${Math.round(to.x - from.x)}px, ${Math.round(to.y - from.y)}px) scale(.7)`;
    }));
    setTimeout(() => {
      f.remove();
      if (!run || !run.board || !run.board.reqs.includes(c.req)) return;
      renderWants();
      const w = el.wants.querySelector(`[data-j="${j}"]`);
      if (w) w.classList.add("bump");
    }, CFG.timing.fly + 20);
  }

  /* 시간 초과: 목숨 1개를 잃고 그 단계를 처음부터 다시 */
  async function timeOut() {
    if (state !== "play") return;
    state = "timeout";
    run.lives--;
    SFX.wrong();
    renderLives(true);
    buzz(120);
    setMood("big", "sad"); setMood("small", "sad");
    if (run.lives <= 0) return fail("time");
    banner("시간 초과!", true);
    el.grid.classList.add("dim");
    const me = run;
    await wait(CFG.timing.timeout);
    if (me !== run) return;
    el.grid.classList.remove("dim");
    setMood("big", "idle"); setMood("small", "idle");
    await enterStage(true);
  }

  /* ---------- 연결 성공 연출 ----------
   *  맞힌 물품은 탭할 때마다 수요 카드로 날아가고(flyToCard), 다 모이면 카드 반짝 + "연결 성공!" 도장 + 하트 */
  const rel = r => { const a = el.app.getBoundingClientRect(); return { x: r.left - a.left, y: r.top - a.top, w: r.width, h: r.height }; };
  const center = node => { const r = rel(node.getBoundingClientRect()); return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; };

  function heartsPop() {
    const c = center(el.stamp);
    [[-70, -30], [-40, -52], [0, -60], [42, -50], [72, -28], [-58, 18], [60, 20]].forEach(([dx, dy], i) => {
      const h = document.createElement("img");
      h.className = "px hpop"; h.src = PX.iconURL("heart"); h.alt = "";
      h.style.left = Math.round(c.x - 9) + "px"; h.style.top = Math.round(c.y - 8) + "px";
      h.style.setProperty("--dx", dx + "px"); h.style.setProperty("--dy", dy + "px");
      h.style.animationDelay = i * 30 + "ms";
      el.app.appendChild(h);
      setTimeout(() => h.remove(), 1000);
    });
  }

  /* 연결 성공: 기업 → 조달청 → 공공기관 이 차례로 이어지고 체크가 켜진 뒤 "연결 성공!" */
  async function linkAnim(me) {
    const fx = el.stamp;
    fx.classList.remove("show", "s1", "s2", "s3"); void fx.offsetWidth;
    fx.classList.add("show"); SFX.link(1);
    await wait(130); if (me !== run) return;
    fx.classList.add("s1"); SFX.link(2);
    await wait(150); if (me !== run) return;
    fx.classList.add("s2"); SFX.link(3);
    await wait(130); if (me !== run) return;
    fx.classList.add("s3"); SFX.clear();
  }

  async function clearStage() {
    state = "clear";
    const b = run.board, st = b.st, me = run, tm = CFG.timing;
    run.done.push(b);
    setMood("big", "happy", 900);
    // 마지막 물품이 카드에 도착할 때까지 기다린 뒤: 카드 반짝 + 연결 그림 + 하트
    await wait(tm.fly + 80);
    if (me !== run) return;
    el.grid.classList.add("matching");
    el.req.classList.remove("flash"); void el.req.offsetWidth; el.req.classList.add("flash");
    say(st.line || T.matched(st.agency), 2200);
    await linkAnim(me);
    if (me !== run) return;
    heartsPop();
    setMood("big", "happy", 1200); setMood("small", "happy", 1200);
    await wait(tm.stamp);
    await popup(b.idx + 1, "clear");
    if (me !== run) return;   // 그사이 새 판이 시작됨
    if (run.idx >= N - 1) return showDone();
    run.idx++;
    await enterStage();
  }

  /* ---------- 조달 연결 확인서: 종이에 빠르게 기입(삐빅삐빅) → 줄마다 "조달 완료" 도장 → 마지막에 큰 도장 ---------- */
  function wantsSummary(st) {
    const [id, n] = st.wants[0], k = st.wants.length;
    return `${ITEMS[id].name} ${n}` + (k > 1 ? ` 외 ${k - 1}종` : "");
  }
  function docRowHTML(b) {
    const no = b.idx + 1, st = b.st;
    return `<li class="hide">${badgeHTML(st)}
      <div class="dl-main"><div class="dl-top"><span class="no">${two(no)}</span><span class="nm" data-t="${esc(st.type)}"></span></div>
      <small data-t="${esc(st.agency)} · ${esc(wantsSummary(st))}"></small></div>
      <span class="ok">${esc(T.docStamp)}</span></li>`;
  }
  async function typeInto(node, text, skip) {
    for (let i = 1; i <= text.length; i++) {
      if (skip()) { node.textContent = text; return; }
      node.textContent = text.slice(0, i);
      if (i % 2) SFX.type(i);
      await wait(14);
    }
  }
  async function showDone() {
    state = "done";
    const me = run;
    const d = new Date();
    $("#doc-title").textContent = T.docTitle;
    $("#doc-no").textContent = `발급 ${d.getFullYear()}.${two(d.getMonth() + 1)}.${two(d.getDate())}`;
    el.doneSub.textContent = `${STAGES[0].agency} 외 ${N - 1}개 기관의 수요에 연결했어요`;
    el.doneList.innerHTML = run.done.map(docRowHTML).join("");
    const today = `${d.getFullYear()}.${two(d.getMonth() + 1)}.${two(d.getDate())}`;
    $("#doc-stamp-t").innerHTML = `${run.done.length}건<br>${esc(T.docStamp)}<small>${today}</small>`;
    $("#doc-stamp").classList.remove("show");
    el.btnEnding.classList.add("hide"); el.doneSkip.classList.remove("hide");
    el.doneWrap.scrollTop = 0;
    showScreen("screen-done");
    const rows = [...el.doneList.children];
    let skip = false;
    const isSkip = () => skip || me !== run;
    const onSkip = () => { skip = true; };
    el.doneWrap.addEventListener("pointerdown", onSkip, { once: true });
    await wait(350);
    for (const r of rows) {
      if (me !== run) return;
      r.classList.remove("hide");
      if (!skip) r.scrollIntoView({ block: "nearest" });
      for (const n of r.querySelectorAll("[data-t]")) await typeInto(n, n.dataset.t, isSkip);
      r.classList.add("stamped");
      if (!skip) { SFX.thump(); await wait(70); }
    }
    if (me !== run) return;
    el.doneWrap.removeEventListener("pointerdown", onSkip);
    await wait(skip ? 50 : 250);
    $("#doc-stamp").classList.add("show"); SFX.clear();
    el.doneSkip.classList.add("hide");
    el.btnEnding.classList.remove("hide");
    await wait(300);
    el.btnEnding.scrollIntoView({ block: "nearest" });
  }

  /* ---------- 마지막 화면의 장면: 가운데 두 캐릭터가 깜빡이며 나타나고,
   *  양쪽에서 공공기관 직원과 기업 직원이 삐빅삐빅 걸어 들어와 손을 잡음 ---------- */
  async function finalScene(cleared) {
    const me = run;
    const [pub, big, small, biz] = ["public", "big", "small", "biz"].map(k => actors["e-" + k]);
    [pub, big, small, biz].forEach(a => { setMood(a.key, "idle"); a.box.classList.remove("in", "on"); });
    pub.box.classList.toggle("hide", !cleared); biz.box.classList.toggle("hide", !cleared);
    // 유형 배지 13개: 인물들 위로 무지개처럼 (손을 다 잡은 뒤 하나씩 떠오름)
    const eb = $("#end-badges");
    eb.innerHTML = cleared ? run.done.map((b, i) => {
      const a = Math.PI * (1 - i / Math.max(1, run.done.length - 1));   // 180° → 0°
      const x = 50 + Math.cos(a) * 45, y = 100 - Math.sin(a) * 88;
      return `<img class="px badge eb" src="${PX.badgeURL(...b.st.badge)}" alt="" style="left:${x}%;top:${y}%">`;
    }).join("") : "";
    await wait(500);
    for (const a of [big, small]) {
      if (me !== run || state !== "result") return;
      a.box.classList.add("on"); SFX.appear();
      await wait(380);
    }
    if (!cleared) { setMood(big.key, "happy"); setMood(small.key, "happy"); return; }
    setMood(big.key, "hand"); setMood(small.key, "hand");
    sparkle(141); SFX.join(0);
    await wait(450);
    if (me !== run || state !== "result") return;
    setMood(pub.key, "walk"); setMood(biz.key, "walk");
    pub.box.classList.add("in"); biz.box.classList.add("in");
    const WALK = 1600, STEP = 160;
    for (let t = 0, i = 0; t < WALK; t += STEP, i++) { if (state !== "result") return; SFX.step(i); await wait(STEP); }
    if (me !== run || state !== "result") return;
    setMood(pub.key, "hand"); setMood(biz.key, "hand");
    sparkle(60); sparkle(194); SFX.join(1);
    await wait(240); SFX.join(2);
    await wait(240); SFX.join(3);
    await wait(200);
    for (const b of eb.children) { if (state !== "result") return; b.classList.add("on"); SFX.type(1); await wait(80); }
  }
  function sparkle(x) {
    const s = document.createElement("span");
    s.className = "spark"; s.textContent = "✦"; s.style.left = x + "px";
    el.endRow.appendChild(s);
    setTimeout(() => s.remove(), 900);
  }

  async function fail(reason) {
    if (state === "over") return;
    state = "over";
    SFX.fail();
    setMood("big", "sad"); setMood("small", "sad");
    banner(reason === "time" ? "시간 초과! 목숨을 모두 잃었어요" : "목숨을 모두 잃었어요!", true);
    el.grid.classList.add("dim");
    const me = run;
    await wait(CFG.timing.failMessage);
    if (me === run) finish(false);
  }

  /* ---------- 메인 화면 역할 그림: 기업 → 조달청(나라장터) → 공공기관 ---------- */
  function renderFlow() {
    const box = $("#t-flow");
    box.innerHTML = T.flow.map((f, i) =>
      (i ? `<span class="flow-arrow" aria-hidden="true">▶</span>` : "") +
      `<div class="flow-step ${f.icon === "mall" ? "hub" : ""}">${img(PX.iconURL(f.icon), "px flow-ic")}<b>${esc(f.name)}</b><small>${esc(f.desc)}</small></div>`
    ).join("");
  }

  /* ---------- 마지막 화면 (C안): 메시지 + 본문 + 걸어오는 장면, 공유 이미지 ---------- */
  let lastShare = null;
  function renderFinal(cleared) {
    $("#res-kicker").textContent = cleared ? T.finalKicker : T.failKicker(run.done.length);
    $("#res-msg").innerHTML = T.finalMsg;
    $("#res-body").textContent = T.finalBody;
    const vals = $("#res-values");
    vals.classList.toggle("hide", !T.showValues);
    vals.innerHTML = T.finalValues.map(v =>
      `<li>${img(PX.iconURL(v.icon), "px val-ic")}<b>${esc(v.who)}</b><span>${esc(v.what)}</span></li>`).join("");
  }
  function fitFinal() {}
  async function finish(cleared) {
    state = "result";
    const me = run, done = run.done;
    el.btnSave.removeAttribute("href");
    lastShare = null;
    showScreen("screen-result");
    renderFinal(cleared);
    SFX.ending();
    BGM.play("ending", { delay: 2.3, fade: 1.5 });   // 메인곡은 줄어들고, 엔딩 효과음이 끝날 즈음 엔딩곡
    finalScene(cleared);
    const url = CFG.shareUrl || location.href.split(/[?#]/)[0];
    const card = await window.Share.makeCard({
      cleared, title: T.title, kicker: cleared ? T.finalKicker : T.failKicker(done.length),
      msg: T.finalMsg, body: T.finalBody, values: T.showValues ? T.finalValues : [], url
    });
    if (me !== run) return;
    el.btnSave.href = card.toDataURL("image/png");
    // 공유는 버튼을 누른 순간 바로 실행돼야 해서 이미지(blob)를 미리 만들어 둔다
    const blob = await new Promise(r => card.toBlob(r, "image/png"));
    const n = done.length;
    lastShare = { blob, url, title: T.title, text: T.share(n, n && done[0].st.type, n && done[n - 1].st.type, N) };
  }
  function toast(msg) {
    el.toast.textContent = msg; el.toast.classList.add("show");
    clearTimeout(el.toast._t); el.toast._t = setTimeout(() => el.toast.classList.remove("show"), 2200);
  }

  /* ---------- 루프 ---------- */
  let lastTs = 0;
  function loop(ts) {
    const dt = lastTs ? Math.min(0.1, (ts - lastTs) / 1000) : 0;
    lastTs = ts;
    if (run && state === "play" && !paused) {
      run.time -= dt;
      if (run.time <= 0) { run.time = 0; renderTime(); timeOut(); }
      else renderTime();
    }
    requestAnimationFrame(loop);
  }

  /* ---------- 시작 ---------- */
  function boot() {
    Object.assign(el, {
      app: $("#app"), game: $("#screen-game"), lives: $("#lives"), progress: $("#progress"),
      req: $("#req"), reqStage: $("#req-stage"), reqType: $("#req-type"), reqAgency: $("#req-agency"), reqNeed: $("#req-need"), wants: $("#req-wants"), stamp: $("#stamp"),
      timebar: $("#timebar"), grid: $("#grid"), big: $("#big-char"), small: $("#small-char"), bubble: $("#bubble"), banner: $("#banner"),
      popup: $("#popup"), popHead: $("#pop-head"), popBadge: $("#pop-badge"), popStage: $("#pop-stage"), popType: $("#pop-type"),
      popEasy: $("#pop-easy"), popMore: $("#pop-more"), popBtn: $("#pop-btn"),
      tip: $("#tip"), tipText: $("#tip-text"),
      btnSave: $("#btn-save"), toast: $("#toast")
    });
    // 문구
    $("#t-title").textContent = T.title;
    $("#t-sub").textContent = T.subtitle;
    $("#t-how").innerHTML = T.howTo;
    $("#t-policy").textContent = T.policy;
    $("#t-fair").innerHTML = `${esc(T.metaphor)}<br>${esc(T.fair)}`;
    $("#req-title").textContent = T.cardHead;
    $("#req-cond-k").textContent = T.buyCond;
    $("#lf-text").textContent = T.stamp;
    renderFlow();
    $("#mall").textContent = T.mall;
    // 픽셀 그림
    const sq = PX.charURL("small", "idle0");
    $("#t-chars").innerHTML = `<div id="t-big" class="char big"></div><div id="t-small" class="char small"></div>`;
    makeActor("tBig", $("#t-big"), "big");
    makeActor("tSmall", $("#t-small"), "small");
    makeActor("big", el.big, "big");
    makeActor("small", el.small, "small");
    ["public", "big", "small", "biz"].forEach(k => makeActor("e-" + k, $("#e-" + k), k));
    Object.assign(el, {
      doneWrap: $("#done-wrap"), doneSub: $("#done-sub"), doneList: $("#done-list"), doneSkip: $("#done-skip"), btnEnding: $("#btn-ending"),
      endRow: $("#end-row")
    });
    el.btnEnding.addEventListener("click", () => { SFX.tap(); finish(true); });
    ["lf-ic0", "lf-ic1", "lf-ic2"].forEach((id, i) => { $("#" + id).src = PX.iconURL(["factory", "mall", "gov"][i]); $("#lf-n" + i).textContent = T.linkSteps[i]; });
    document.querySelectorAll(".lf-check").forEach(c => c.src = PX.iconURL("check"));
    $("#bld").src = PX.iconURL("building");
    $("#clock").src = PX.iconURL("clock");
    $("#pop-face").src = sq;
    $("#tip-face").src = sq;
    document.documentElement.style.setProperty("--check", `url(${PX.iconURL("check")})`);
    // 시간 바 칸
    el.segs = [];
    const segWrap = $("#time-segs");
    for (let i = 0; i < CFG.timeBarSegments; i++) { const s = document.createElement("i"); segWrap.appendChild(s); el.segs.push(s); }
    // 버튼
    $("#btn-start").addEventListener("click", startRun);
    $("#btn-retry").addEventListener("click", startRun);
    $("#btn-home").addEventListener("click", () => { state = "title"; showScreen("screen-title"); BGM.play("main", { level: 1 }); });
    // 배경음악: 브라우저는 첫 터치 전엔 소리를 못 냄 → 첫 터치에 메인곡 시작
    const kick = () => {
      ["pointerup", "touchend", "keydown"].forEach(t => document.removeEventListener(t, kick, true));
      SFX.unlock();
      if (!BGM.current()) BGM.play("main", { level: state === "title" ? 1 : 0.5, fade: 2 });
    };
    ["pointerup", "touchend", "keydown"].forEach(t => document.addEventListener(t, kick, true));
    // 소리 켜기/끄기
    const snd = $("#btn-sound");
    const drawSnd = () => { const m = SFX.isMuted(); snd.classList.toggle("off", m); snd.setAttribute("aria-label", m ? "소리 켜기" : "소리 끄기"); };
    snd.addEventListener("click", () => { SFX.setMuted(!SFX.isMuted()); drawSnd(); });
    drawSnd();
    $("#btn-share").addEventListener("click", async () => {
      if (!lastShare) return toast("카드를 만드는 중이에요. 잠시 후 다시 눌러 주세요.");
      const r = await window.Share.share(lastShare);
      if (r === "copied") toast("결과 문구와 링크를 복사했어요!");
      else if (r === "failed") toast("공유할 수 없는 환경이에요. 카드 이미지를 저장해 주세요.");
    });
    el.btnSave.addEventListener("click", e => { if (!el.btnSave.getAttribute("href")) e.preventDefault(); });
    $("#req-cat").addEventListener("click", async () => {
      if (state !== "play" || paused) return;
      paused = true;
      await popup(run.idx + 1, "peek");
      paused = false;
    });
    window.addEventListener("resize", () => { fitGrid(); fitFinal(); });
    document.addEventListener("visibilitychange", () => { lastTs = 0; });
    requestAnimationFrame(loop);
  }

  window.Game = { state: () => ({ state, paused, run }), buildBoard, startRun };
  document.addEventListener("DOMContentLoaded", boot);
})();
