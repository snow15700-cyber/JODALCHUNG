/* =========================================================
 * 단일 HTML 파일 빌드 — CSS·JS·폰트·로고를 index.html 하나에 합칩니다.
 *   node tools/build_single.js
 * 결과: dist/조달연결작전.html  (더블클릭으로 실행, 인터넷 필요 없음)
 * ========================================================= */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const read = p => fs.readFileSync(path.join(ROOT, p), "utf8");
const b64 = (p, type) => `data:${type};base64,${fs.readFileSync(path.join(ROOT, p)).toString("base64")}`;

const LOGO_H = b64("assets/logo/logo_h.png", "image/png");
const LOGO_V = b64("assets/logo/logo_v.png", "image/png");
// 배경음악도 파일 안에 넣음 (더블클릭 실행에서는 따로 있는 파일을 못 읽음)
const BGM_MAIN = b64("assets/bgm/main.wav", "audio/wav");
const BGM_END = b64("assets/bgm/ending.wav", "audio/wav");
const swapAssets = s => s
  .split("assets/logo/logo_h.png").join(LOGO_H)
  .split("assets/logo/logo_v.png").join(LOGO_V)
  .split("assets/bgm/main.wav").join(BGM_MAIN)
  .split("assets/bgm/ending.wav").join(BGM_END);

let html = read("index.html");

// CSS (폰트 파일은 data URI로)
html = html.replace(/<link rel="stylesheet" href="(css\/[^"?]+)(\?[^"]*)?">/g, (_, p) => {
  let css = read(p).replace(/url\("\.\.\/(assets\/fonts\/[^"]+)"\)/g, (_, f) => `url("${b64(f, "font/woff2")}")`);
  return `<style>\n${css}\n</style>`;
});

// JS
html = html.replace(/<script src="((?:js|data)\/[^"?]+)(\?[^"]*)?"><\/script>/g, (_, p) => {
  const code = swapAssets(read(p));
  if (code.includes("</script")) throw new Error(`${p} 안에 </script 문자열이 있습니다.`);
  return `<script>\n${code}\n</script>`;
});

// 로고 <img>
html = swapAssets(html);

fs.mkdirSync(path.join(ROOT, "dist"), { recursive: true });
const out = path.join(ROOT, "dist", "조달연결작전.html");
fs.writeFileSync(out, html);
console.log("✔", path.relative(ROOT, out), Math.round(fs.statSync(out).size / 1024) + "KB");
