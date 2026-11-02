# 자체 점검(qa) 사용법

케이프혼타워 실사 3D·WebXR 의 기능·성능·화질을 명령 하나로 점검한다. 결과는 `docs/qa/report.md`(사람용)와 `docs/qa/history/<시각>.json`(기록)에 남고, 실행할 때마다 직전 기록과 비교해 나빠진 항목에 **악화**를 붙인다.

## 실행

작업 폴더(`feature/xr-photoreal` 작업 트리)에서:

```bash
node photoreal/tests/qa.mjs
```

```bash
node photoreal/tests/qa.mjs --quick
```

```bash
node photoreal/tests/qa.mjs --only=reg,ui
```

```bash
node photoreal/tests/qa.mjs --only=shots --accept="하늘 사진 방향 수정으로 유리 반사가 바뀜"
```

- 로컬 서버(`photoreal/tests/serve.mjs`, node 정적 서버)를 빈 포트로 스스로 띄우고 끝나면 닫는다. 이미 떠 있는 서버를 쓰려면 `--base=http://127.0.0.1:8793`.
- `--only=perf` 는 `budget` 과 같다.
- 전체 점검은 약 60분(옵션 164개 상태 약 18분, 멀티플레이 약 5분, 화질 측정 약 10분), `--quick` 은 멀티플레이·옵션 전수·10Mbps·재방문·휴대폰 성능을 빼고 약 15분.
- 필요한 것: Google Chrome(맥·윈도우 기본 설치 경로를 찾고, 다른 곳이면 `CHROME` 환경 변수), node 18 이상, `photoreal/tests`·`xr/tests` 의 `npm install`(puppeteer-core), 멀티플레이는 인터넷(공개 Nostr 중계망). python 은 필요 없다.

## 묶음

| 묶음 | 내용 | 기준 |
|---|---|---|
| reg | smoke, compat, ux, ux `pr=1`, mp, mobile, perfui, opt, ctxloss, quality, vrmode, vrfeel(VR 알파·이동·레이), env(지니 주변 모델: 매스 대체·받기 순서·사우나·24 조합), options(164개 상태) | 전부 통과, options 오류 0·미변환 ≤ 5 |
| budget(perf) | 화면·휴대폰 흉내·IWER VR 그리기 호출과 삼각형, 화면 fps, VR 가상 방 피규어, 텍스처 메모리 추정, 미리받기 크기, 10Mbps 첫 방문·재방문, 윈도우 PC 흉내(첫 실사 전환 멈춤·정상 상태), 맥 정상 조건 자동 품질 | `docs/goal-gap-plan.md` 의 기준값(아래 표) |
| quality | 바닥 깜빡임(바닥 화소만, 거리 구간별, 화면·휴대폰 배율 3·퀘스트 한 눈 916×960×2 시야 97°·낮은 시점), 화면 전체 깜빡임, 초표본 대비 앨리어싱(정보), 포화 화소, 천장 검은 구멍, 야간 우리 건물/이웃 휘도, 석양 대 오후, 이웃 명도 편차, 잎 휘도 변동 | 아래 표 |
| shots | 기준 화면(외관·길·1F·5F·B1·B3·야간·미성 현재/미래·지니 주변 스케치업) 대비 평균 화소 차와 큰 차 화소 비율 | 평균 ≤ 4, 큰 차 ≤ 3% |
| ui | 화면·휴대폰의 겹침(실사 패널·나침반·XR 버튼·메뉴), 숨김 규칙(멀티플레이 버튼, fps, 시간 줄, VR 프레임 판), 콘솔 오류·4xx | 겹침 0, 모두 숨김, 오류 0 |

| 예산·화질 기준 | 값 |
|---|---|
| 화면 외관 그리기 호출 | < 1000 |
| 화면 외관 fps(이동) | ≥ 60(맥 GPU, 불안정) |
| 휴대폰 흉내 '낮음' 외관 호출 | < 400 |
| VR 외관 호출 / VR 실내 호출 / VR 외관 삼각형 | ≤ 170 / ≤ 200 / ≤ 100만 |
| VR 가상 방 피규어 호출 | < 200 |
| 텍스처 GPU 메모리 추정 | ≤ 150MB |
| 미리받기 목록 | ≤ 18MB |
| 10Mbps 첫 방문 / 재방문 전체 준비 | ≤ 12초 / ≤ 3초 |
| 윈도우 흉내 첫 실사 전환 가장 긴 프레임 / 정상 상태 간격 중앙값 | ≤ 2000ms(불안정) / ≤ 50ms |
| 맥 정상 조건(감속 없음, 배율 2) 자동 품질 | 높음 유지 |
| 바닥 깜빡임(강하게 바뀐 화소) / 화면 전체 | ≤ 1% / ≤ 2% |
| 포화 화소 / 천장 검은 구멍 | ≤ 1% / ≤ 5% |
| 야간 우리 건물 ÷ 이웃 | ≥ 1.0 |
| 석양 대 오후 화면 휘도 | ≤ −20% |
| 이웃 명도 편차(조감 p90/p10) | ≥ 2.0 |
| 잎 휘도 변동계수 | ≤ 0.40(잎 앞뒤 색이 다르던 1102.a 이전 0.45) |

## 측정 방법 요약

- 묶음 판정: 장면을 한 번 '판정 색'으로 그린다(빨강 = 우리 건물·주변 건물·땅·나무, 초록 = 위를 보는 면/아래를 보는 면, 파랑 = 거리). 재질마다 자르기 평면을 유지해 실내 보기(위층 잘라 보기)에서도 맞는다. 화면 합치기 묶음은 판정 동안 끈다.
- 깜빡임: 카메라와 보는 곳을 함께 2mm 씩 6번 옮겨 찍은 연속 화면의 화소 밝기 변화. 바닥은 가장자리 2화소를 깎아 형상 윤곽을 뺀다. 실제 화면 경로(후처리 포함).
- 앨리어싱(정보): 같은 화면을 후처리 없이 1배와 4배로 그려 바닥 화소 밝기 차의 고주파 성분을 잰다.
- 불안정 항목: mp(공개 중계망) 두 번까지, ux `pr=1`(계단 걷기 프레임 멈춤) 한 번 재시도. 10Mbps 첫 방문은 두 번 재서 작은 값. fps 와 네트워크 시간은 맥의 다른 앱 부하에 흔들린다(보고서에 '불안정').
- 로컬 서버는 gzip 이 없어 첫 방문 전송량이 공개 주소보다 크다(Wing HTML 1.1MB, 주변 건물 JSON 1.5MB). 공개 주소 값은 `BASE=https://evyfjae.github.io/kapehorn-preview/xr-photoreal node photoreal/tests/net.mjs 4g`.

## 윈도우에서 실행

Wing 의 윈도우 PC 에서도 같은 명령으로 돌린다(PowerShell 기준).

```powershell
cd <작업 폴더>\photoreal\tests; npm install; cd ..\..\xr\tests; npm install; cd ..\..
node photoreal/tests/qa.mjs --quick
```

- 크롬이 기본 경로(`C:\Program Files\Google\Chrome\Application\chrome.exe` 등)에 없으면 `$env:CHROME="<chrome.exe 경로>"` 를 먼저 둔다.
- 끊김만 볼 때는 `node photoreal/tests/qa.mjs --only=perf`. 실제 윈도우 GPU 에서는 감속 흉내 없이 재는 것이 맞으므로 `photoreal/tests` 에서 `$env:CPU="1"; $env:SHADER_MS="0"; $env:DPR="1"; node winsim.mjs` 로 실제 값만 재도 된다(창 배율은 윈도우 설정을 따른다).
- 맥에서 윈도우 조건 흉내: `node photoreal/tests/winsim.mjs`(CPU 4배 감속, 화소 배율 1.5, 셰이더 링크 80ms. `CPU`·`DPR`·`SHADER_MS`·`PAR=0`(병렬 컴파일 확장 없음) 으로 바꾼다). 결과 `photoreal/tests/out/winsim.json`, 200ms 넘는 프레임마다 그때의 작업과 셰이더 대기 수가 `long` 에 남는다.

## 기준 화면 갱신

의도한 화면 변경 뒤에는 `--only=shots --accept="사유"` 로 기준을 바꾼다. 사유는 `docs/qa/baseline/CHANGES.md` 에 쌓인다.
