/* =========================================================
 * 게임 설정 — 수치는 모두 여기서 조정합니다. (기획서 3장, 9장)
 * ========================================================= */
window.GAME_CONFIG = {
  // 단계별 제한시간(초): 1단계 stageTimeFirst → 13단계 stageTimeLast 로 고르게 줄어듦.
  //  시간이 다 되면 목숨 1개를 잃고 그 단계를 처음부터 다시 함 (판도 새로 섞임).
  //  화면에는 숫자 없이 시간 바로만 보임.
  stageTimeFirst: 10,
  stageTimeLast: 6,
  maxSame: 4,          // 같은 그림(물품+색) 방해물이 한 판에 최대 몇 개까지 나올지
  lives: 3,            // 목숨 (회복 없음). 오답과 시간 초과 모두 1개씩 잃음
  timeBarSegments: 20, // 시간 바 칸 수
  warnRatio: 1 / 3,    // 이 비율 이하이면 노랑
  dangerRatio: 1 / 6,  // 이 비율 이하이면 빨강 깜빡임

  // 단계 구간별 격자 (기획서 9장). from: 시작 단계(1부터)
  // sameColor: 같은 색 방해물 비율 (칸 수 대비)
  // extra: 요청 물품을 수량보다 몇 개 더 깔지 [최소, 최대] (수량을 넘겨 탭하면 오답)
  tiers: [
    { from: 1, grid: 5, sameColor: 1 / 4, extra: [0, 0] },
    { from: 5, grid: 6, sameColor: 1 / 3, extra: [1, 2] },
    { from: 9, grid: 7, sameColor: 1 / 2, extra: [1, 2] }
  ],

  // 연출 시간(ms)
  timing: {
    cardDrop: 550,
    fly: 260,       // 맞힌 물품이 요청 카드 칸으로 날아가는 시간
    stamp: 350,     // "연결 성공!" 뒤 유형 팝업까지
    timeout: 1300,  // "시간 초과!" 안내 뒤 단계 다시 시작까지
    failMessage: 1400
  },

  shareUrl: "",
  // 테스트: ?debug=1 → 정답 칸 표시, ?debug=1&stage=9 → 9단계부터
  debug: /[?&]debug=1/.test(location.search)
};
