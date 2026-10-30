# XR 자동 시험

헤드리스 Chrome(맥에 설치된 Google Chrome)과 IWER(Quest 3 에뮬레이터)로 XR 기능을 점검합니다. 실기기 확인을 대신하지는 않습니다.

```bash
# 작업 폴더(wing-kim/all 체크아웃) 루트에서 정적 서버
python3 -m http.server 8790 --bind 127.0.0.1
# 다른 터미널
cd xr/tests && npm install
node smoke.mjs --shots   # 기능 24항목 + 그리기 호출 기준(< 200), 화면은 out/
node compat.mjs          # 원본과 화면 동일(Q2), 대체 경로(Q14), 반복 진입 메모리(Q13)
```

- `fallback.html?mode=nobridge|noxr`: Wing 이 연결 통로 줄 없이 올린 경우를 흉내 냅니다.
- `diag.mjs`, `shot.mjs`: 개발용 진단과 화면 캡처.
- Wing 의 새 업로드를 합친 뒤에는 두 시험을 모두 돌리고 결과를 계획서 14장에 남깁니다.
