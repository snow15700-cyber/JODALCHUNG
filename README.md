# 조달 연결 작전 (v4) — 개발 중

기획서: `../기획서_v4.md` (v4.3) · 그림 시안: `../시안/픽셀_시안_v4.html`

## 실행

```powershell
python -m http.server 8768 --directory game_v4
```
→ http://localhost:8768

- `?debug=1` — 정답 칸 왼쪽 위에 분홍 점
- `?debug=1&stage=9` — 9단계부터 시작

배포는 정적 파일 그대로 (Vercel 등). 빌드 단계 없음. `tools/` 폴더는 개발용이라 배포에서 빼도 됩니다.

### 배포 주소가 정해지면
1. `index.html`의 `og:image`를 `https://주소/assets/og.png`로, `og:url`을 `https://주소/`로 (카카오톡 미리보기는 절대 주소 필요)
2. `js/config.js`의 `shareUrl`에 같은 주소 (결과 카드 아래와 공유 문구에 들어감)

## 폴더

| 경로 | 내용 |
|---|---|
| `js/config.js` | 수치 설정 (시간 75초, 보너스, 목숨, 격자 구간, 같은 색 방해물 비율, 덤 수) |
| `data/stages.js` | 13단계 (유형, 쉬운 설명, 덧붙임, 배지, 요청기관, 요청 물품) |
| `data/items.js` | 물품 14종 (이름, 기본색, 나올 수 있는 색) |
| `data/texts.js` | 화면 문구 |
| `js/pixel.js` | 픽셀 엔진 + 캐릭터·물품 그림 (시안에서 옮김) |
| `js/game.js` | 게임 흐름 |
| `js/audio.js` | 칩튠 효과음 (v2 그대로) |
| `assets/fonts` | Galmuri11, Pretendard 서브셋 (둘 다 OFL) |
| `assets/logo` | 조달청 로고 (좌우형 `logo_h.png`, 상하형 `logo_v.png`) |

## 진행 단계

- [x] 1. 뼈대: 메인, 플레이 화면, 요청 카드, 시간 바, 격자(5→6→7), 정답·오답·클리어·실패, 유형 팝업(기본), 임시 결과 화면
- [x] 2. 물품 6종 그리기 (책상, LED 조명, 분리수거함, 도자기, 부채, 한지) + 유형 배지 13종 — 확인 페이지: `tools/gallery.html`
- [x] 3. 매칭 성공 연출 (픽셀 선 → 물품이 카드로 모임 → 도장·하트), 효과음, 팝업 다듬기 (배지 등장·반짝임)
- [x] 4. 캐릭터 동작 프레임 (숨쉬기·말하기·기쁨·당황·손잡기, `js/pixel.js`의 `FRAMES`)
- [x] 5. 조달 완료 목록 + 손잡기 엔딩 (공공기관·조달청 직원 64×96) — 바로 보기: `?debug=1&end=1`
- [x] 6. 결과 카드(PNG, `js/share.js`), 공유(이미지 → 문구+링크 → 복사), OG 이미지(`assets/og.png`, 다시 만들기: `tools/make_og.html`)
- [ ] 7. 난이도 조정, 공정성 점검
