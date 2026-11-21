/* =========================================================
 * 물품 (기획서 9-0, 9-1)
 *  id     : 그림 키
 *  name   : 화면에 쓰는 일반 물품 이름
 *  color  : 기본색 = 요청 카드·찾을 물품의 색
 *  colors : 이 물품이 나올 수 있는 색 (같은 색 방해물로 쓰임)
 * ========================================================= */
window.ITEMS = {
  chair:        { name: "의자",       color: "brown",  colors: ["white", "brown", "red", "blue"] },
  desk:         { name: "책상",       color: "brown",  colors: ["brown"] },
  tissue:       { name: "화장지",     color: "white",  colors: ["white"] },
  paper:        { name: "복사용지",   color: "blue",   colors: ["white", "blue"] },
  led:          { name: "LED 조명",   color: "yellow", colors: ["yellow"] },
  cctv:         { name: "CCTV",       color: "white",  colors: ["white"] },
  extinguisher: { name: "소화기",     color: "red",    colors: ["red"] },
  helmet:       { name: "안전모",     color: "yellow", colors: ["white", "orange", "yellow"] },
  cone:         { name: "라바콘",     color: "orange", colors: ["orange"] },
  vest:         { name: "조끼",       color: "orange", colors: ["white", "orange", "yellow"] },
  bin:          { name: "분리수거함", color: "blue",   colors: ["brown", "red", "blue"] },
  pottery:      { name: "도자기",     color: "blue",   colors: ["blue"] },
  fan:          { name: "부채",       color: "brown",  colors: ["brown"] },
  hanji:        { name: "한지",       color: "white",  colors: ["white"] }
};
