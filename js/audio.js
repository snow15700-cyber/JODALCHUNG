/* =========================================================
 * 칩튠 효과음(Web Audio 합성) + 배경음악(assets/bgm 음원 파일)
 *
 *  out(음소거) ─┬─ master(효과음 0.18)
 *               └─ bgmBus(배경음악 기본 음량) ← 곡별 lvl(메인 100% / 게임 중 50%) ← 곡별 fade
 * ========================================================= */
(function () {
  let ctx = null, out = null, master = null, bgmBus = null;
  let muted = false;
  try { muted = localStorage.getItem("jodal-muted") === "1"; } catch (e) {}

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      out = ctx.createGain();
      out.gain.value = muted ? 0 : 1;
      out.connect(ctx.destination);
      master = ctx.createGain();
      master.gain.value = 0.18;
      master.connect(out);
      // 배경음악 기본 음량 (효과음보다 살짝 아래)
      bgmBus = ctx.createGain();
      bgmBus.gain.value = 0.7;
      bgmBus.connect(out);
      // 탭을 내리면 소리도 멈춤
      document.addEventListener("visibilitychange", () => {
        if (!ctx) return;
        if (document.hidden) ctx.suspend(); else ctx.resume();
      });
    }
    if (ctx.state === "suspended" && !document.hidden) ctx.resume();
    return ctx;
  }

  function tone(freq, start, dur, type = "square", vol = 1, slideTo = null) {
    const c = ensure(); if (!c || muted) return;
    const t0 = c.currentTime + start;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.linearRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.setValueAtTime(vol, t0 + dur * 0.7);
    g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }

  function seq(notes, step, type = "square", vol = 0.9) {
    notes.forEach((f, i) => { if (f) tone(f, i * step, step * 0.9, type, vol); });
  }

  const N = { C4: 262, D4: 294, E4: 330, F4: 349, G4: 392, A4: 440, B4: 494, C5: 523, D5: 587, E5: 659, F5: 698, G5: 784, A5: 880, C6: 1047 };

  const SFX = {
    unlock() { ensure(); },
    tap()     { tone(660, 0, 0.04, "square", 0.5); },
    correct() { tone(N.E5, 0, 0.06, "square", 0.8); tone(N.A5, 0.06, 0.09, "square", 0.8); },
    wrong()   { tone(180, 0, 0.18, "sawtooth", 0.9, 90); tone(120, 0.05, 0.2, "square", 0.6, 70); },
    stageStart() { seq([N.C5, N.E5, N.G5], 0.07); },
    clear()   { seq([N.C5, N.E5, N.G5, N.C6], 0.08); tone(N.C4, 0, 0.32, "triangle", 1); },
    bonus()   { tone(N.G5, 0, 0.05, "square", 0.6); tone(N.C6, 0.05, 0.08, "square", 0.6); },
    // 매칭 선이 이어질 때 한 음씩 올라가는 "띠리링" (i = 1~4)
    link(i)   { const f = [N.C5, N.E5, N.G5, N.C6][Math.min(3, Math.max(0, i - 1))]; tone(f, 0, 0.05, "triangle", 0.8); tone(f * 2, 0.02, 0.03, "square", 0.25); },
    // 유형 배지 획득
    badge()   { seq([N.G5, N.C6, 0, N.E5, N.G5, N.C6], 0.06, "square", 0.6); },
    // 조달 완료 목록: 줄마다 도장 + 한 음씩 올라감
    note(i)   { const sc = [N.C5, N.D5, N.E5, N.G5, N.A5, N.C6]; const f = sc[i % 6] * (i >= 6 ? 2 : 1); tone(90, 0, 0.05, "triangle", 0.9, 60); tone(f, 0.03, 0.07, "square", 0.5); },
    // 엔딩 손잡기: 4음
    join(i)   { tone([N.C5, N.E5, N.G5, N.C6][i] || N.C6, 0, 0.14, "square", 0.7); tone(([N.C5, N.E5, N.G5, N.C6][i] || N.C6) / 2, 0, 0.14, "triangle", 0.8); },
    // 엔딩: 걸음마다 "삐빅" (높낮이 번갈아)
    step(i)   { const f = i % 2 ? 1320 : 990; tone(f, 0, 0.035, "square", 0.35); tone(f * 1.25, 0.045, 0.035, "square", 0.3); },
    // 엔딩: 캐릭터가 깜빡이며 나타남
    appear()  { seq([N.C5, N.G5, N.C6], 0.05, "square", 0.5); },
    // 확인서에 글자가 기입될 때 "삐빅"
    type(i)   { tone(i % 4 < 2 ? 1560 : 1240, 0, 0.018, "square", 0.22); },
    // 확인서 줄마다 도장 "쿵"
    thump()   { tone(120, 0, 0.07, "triangle", 1, 70); tone(880, 0.01, 0.03, "square", 0.25); },
    lid()     { tone(140, 0, 0.08, "triangle", 1, 90); },
    whoosh()  { tone(400, 0, 0.18, "triangle", 0.5, 120); },
    tick()    { tone(1200, 0, 0.03, "square", 0.35); },
    talk()    { tone(520 + Math.random() * 120, 0, 0.03, "square", 0.25); },
    fail()    { seq([N.G4, N.F4, N.E4, N.D4, N.C4], 0.14, "square", 0.8); tone(N.C4 / 2, 0.7, 0.5, "triangle", 1); },
    ending() {
      const mel = [N.C5, N.E5, N.G5, N.E5, N.F5, N.A5, N.C6, 0, N.G5, N.A5, N.G5, N.E5, N.C6];
      seq(mel, 0.15, "square", 0.7);
      const bass = [N.C4, 0, N.G4, 0, N.F4, 0, N.A4, 0, N.G4, 0, N.G4, 0, N.C4];
      seq(bass.map(f => f && f / 2), 0.15, "triangle", 1);
    },
    setMuted(m) {
      muted = !!m;
      try { localStorage.setItem("jodal-muted", muted ? "1" : "0"); } catch (e) {}
      if (ctx) out.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.03);
    },
    isMuted() { return muted; }
  };
  window.SFX = SFX;


  /* =========================================================
   * 배경음악 — assets/bgm 의 음원 파일을 반복 재생
   *  main   = 시작음악 (메인화면, 게임 중에는 50%)
   *  ending = 종료음악 (결과 화면)
   * 파일은 페이지를 열 때 미리 받아 두고, 첫 터치로 소리가 풀리면 디코딩해서 씀.
   * ========================================================= */
  const FILES = { main: "assets/bgm/main.wav", ending: "assets/bgm/ending.wav" };
  const raw = {}, buffers = {}, decoding = {};
  Object.keys(FILES).forEach(k => {
    raw[k] = fetch(FILES[k]).then(r => r.ok ? r.arrayBuffer() : null).catch(() => null);
  });
  function load(name) {
    if (!decoding[name]) decoding[name] = raw[name].then(ab => ab && new Promise(res => {
      // 옛 Safari는 콜백 방식만 지원
      ctx.decodeAudioData(ab, b => res(b), () => res(null));
    })).then(b => (buffers[name] = b));
    return decoding[name];
  }

  let cur = null;
  const BGM = {
    /* 곡 재생 (반복). 이미 같은 곡이면 음량만 맞춤.
     *  opt.level: 0~1 (메인 1, 게임 중 0.5)  opt.delay: 시작 지연(초)  opt.fade: 들어오는 시간(초) */
    play(name, opt = {}) {
      const c = ensure(); if (!c) return;
      const level = opt.level == null ? 1 : opt.level;
      if (cur && cur.name === name && !cur.stopping) return BGM.level(level, opt.fade || 0.8);
      BGM.stop(0.7);
      const fade = opt.fade == null ? 1.2 : opt.fade;
      const lvl = c.createGain(); lvl.gain.value = level; lvl.connect(bgmBus);
      const gain = c.createGain(); gain.gain.value = 0.0001; gain.connect(lvl);
      const p = cur = { name, lvl, gain, src: null };
      const wantAt = c.currentTime + (opt.delay || 0);
      load(name).then(buf => {
        if (!buf || p.stopping) return;
        const t0 = Math.max(c.currentTime + 0.05, wantAt);
        const src = c.createBufferSource();
        src.buffer = buf; src.loop = true;
        src.connect(gain);
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.linearRampToValueAtTime(1, t0 + fade);
        src.start(t0);
        p.src = src;
      });
    },
    // 지금 곡의 음량 (메인 100% → 게임 중 50%)
    level(v, sec = 0.8) {
      if (!ctx || !cur) return;
      const g = cur.lvl.gain, now = ctx.currentTime;
      g.cancelScheduledValues(now);
      g.setValueAtTime(g.value, now);
      g.linearRampToValueAtTime(v, now + sec);
    },
    stop(sec = 0.7) {
      if (!cur || !ctx) return;
      const p = cur, now = ctx.currentTime;
      p.stopping = true;
      p.gain.gain.cancelScheduledValues(now);
      p.gain.gain.setValueAtTime(p.gain.gain.value, now);
      p.gain.gain.linearRampToValueAtTime(0.0001, now + sec);
      setTimeout(() => { if (p.src) p.src.stop(); p.lvl.disconnect(); }, (sec + 0.1) * 1000);
      cur = null;
    },
    current() { return cur && cur.name; },
    // 점검용: 콘솔에서 BGM.debug()
    debug() { return ctx && { state: ctx.state, time: +ctx.currentTime.toFixed(2), song: cur && cur.name, level: cur && +cur.lvl.gain.value.toFixed(2), playing: !!(cur && cur.src), loaded: Object.keys(buffers).filter(k => buffers[k]), muted }; }
  };
  window.BGM = BGM;
})();