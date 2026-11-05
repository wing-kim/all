# Wing 과 HTML 파일로 주고받기 (1102.v)

Wing 님은 GitHub 대신 단일 HTML 파일로 작업을 주고받습니다. 우리 쪽은 받은 파일에서 바뀐 코드만 뽑아 저장소 원본(`new/3d-model.html`, `photoreal/`, `xr/`, `new/models/`)에 3방향으로 합치고, 점검한 뒤 새 단일 HTML 을 만들어 돌려보냅니다. 도구는 `photoreal/tools/wing-html.mjs`, 자체 시험은 `photoreal/tools/wing-html-selftest.mjs` 입니다.

## 파일 종류

| 종류 | 알아보는 법 | 기준(바탕) 파일 |
|---|---|---|
| 우리 단일 HTML | 본문에 묶음 스크립트(`window.KHVFS`)와 파일마다 `KHVFS["경로"]=…` 줄이 있음. `KH_ENV_VER` 가 판 | 같은 판의 `deliverables/kapehorn-tower-3d_<판>.html` |
| Wing·지니 원본 계열 | 묶음이 없고 큰 데이터 줄(지니 KHDATA 등)이 본문에 들어 있음 | `~/Downloads` 의 v107 계열·env_detail 원본 중 바뀐 줄이 가장 적은 것(또는 `KH_ORIG`) |

Wing 님이 우리 단일 HTML 을 고쳐 보내면 우리 판 기준으로, Wing 님 자체 v107 계열 파일을 고쳐 보내면 그 원본 기준으로 차이를 뽑습니다. 어느 쪽인지는 도구가 SHA-1·`KH_ENV_VER`·본문 비교로 자동 판별하고, 틀리면 `--base` 로 직접 알려 줍니다.

## 받는 법

1. 받은 파일을 아무 곳에 둡니다(예: `~/Downloads/wing-1107.html`). 파일 이름은 상관없습니다.
2. 어떤 파일인지 봅니다.

```bash
node photoreal/tools/wing-html.mjs ident ~/Downloads/wing-1107.html
```

`kind`(우리 단일 HTML / Wing·지니 원본 계열), `ver`(판), `base`(기준으로 고른 파일)와 그 이유(`why`)가 나옵니다. 기준이 '보낸 파일과 똑같음'이면 바뀐 것이 없습니다.

3. 무엇이 바뀌었는지 봅니다.

```bash
node photoreal/tools/wing-html.mjs diff ~/Downloads/wing-1107.html
```

파일마다 같음·바뀜·추가·삭제와 바뀐 줄 수를 보여 주고, 줄 차이는 `photoreal/tools/out/wing-html/<이름>/diff/` 에 파일별로 남깁니다. 큰 데이터 줄(2만 자 넘는 한 줄)은 내용 대신 해시로 비교합니다. Wing 님 설명(아래 양식)과 맞는지 여기서 확인합니다.

## 합치는 법

먼저 결과만 따로 만들어 봅니다(저장소는 그대로).

```bash
node photoreal/tools/wing-html.mjs merge ~/Downloads/wing-1107.html --out /tmp/wing-merge
```

바뀐 글 파일마다 `git merge-file` 로 3방향 합치기를 합니다. 우리 = 저장소 현재, 기준 = 보낸 판, 그쪽 = 받은 판입니다. 우리가 그 뒤 고친 것과 Wing 님이 고친 것이 같은 줄이 아니면 둘 다 들어갑니다. 같은 줄을 둘 다 고쳤으면 `<<<<<<< 우리(저장소)` … `>>>>>>> 그쪽(받은 판)` 표시가 남고 충돌로 알립니다. 이진 파일(모델·텍스처)은 우리가 안 바꿨으면 그쪽 것으로, 둘 다 바꿨으면 충돌로 알립니다. 그쪽에서 지운 파일은 저장소에서 지우지 않고 알리기만 합니다.

괜찮으면 저장소에 씁니다.

```bash
node photoreal/tools/wing-html.mjs merge ~/Downloads/wing-1107.html --apply
```

합치기, 전체 점검, 단일 HTML 다시 묶기를 한 번에 하려면 다음을 씁니다(충돌이 있으면 합친 뒤 멈춤).

```bash
node photoreal/tools/wing-html.mjs all ~/Downloads/wing-1107.html
```

그다음은 평소처럼 `git diff` 로 확인하고 커밋합니다. Wing 님 변경은 커밋 메시지에 'Wing <날짜> HTML 반영'처럼 적습니다. 판 표시(`KH_ENV_VER`, 두 `VER`)를 올린 뒤 다시 묶습니다.

주의할 점:
- Wing 님이 우리 접점 줄(`[PR]`·`[XR]` 표시)을 고쳤으면 충돌이 나거나 우리 기능이 꺼질 수 있습니다. diff 에서 그 줄이 보이면 Wing 님께 의도를 묻습니다.
- Wing 님 자체 v107 계열 파일을 기준으로 고친 경우, 그 원본에만 있는 큰 데이터(KHDATA)는 우리 쪽에 들어오지 않습니다(우리는 `new/models/` 에서 받음). 데이터를 바꿨다면 diff 의 '큰 데이터 줄이 기준과 다름'으로 알 수 있고, 그때는 모델 파일을 따로 받아야 합니다.
- 맥 파일 이름의 한글은 NFD 로 저장될 수 있어, 비교는 정규화해서 합니다.

## 돌려보내는 법

1. 합치고 점검한 뒤 `node photoreal/tools/bundle-single.mjs` 로 묶습니다. 결과는 `deliverables/kapehorn-tower-3d_<판>.html` 입니다.
2. 이 파일과 SHA-1, 바뀐 점 요약을 Wing 님께 보냅니다. 다음에 Wing 님이 이 파일을 고쳐 보내면 같은 판이 기준이 됩니다. 보낸 파일은 `deliverables/` 에 그대로 두어야 기준으로 쓸 수 있습니다(덮어쓰지 않기).

## 시험

```bash
node photoreal/tools/wing-html-selftest.mjs
```

가장 최근 우리 단일 HTML 로 'Wing 이 고친 척한 파일'(페이지 제목 한 곳, `xr/kh-xr.js` 주석 한 줄, 새 파일 하나)을 만들어 판별·차이·합치기를 확인하고, Wing·지니 원본으로도 같은 시험을 합니다. 1102.v 에서 1102.u 단일 HTML 과 env_detail 원본으로 13/13 통과했습니다. 시험 중에는 저장소 파일을 바꾸지 않습니다(`--out` 사용).

## Wing 님께 보낼 안내 문구

> Wing 님, 앞으로는 HTML 파일 하나로 주고받겠습니다.
>
> 1. 저희가 보내 드린 파일(예: kapehorn-tower-3d_1102.v.html)을 그대로 고치셔도 되고, Wing 님이 쓰시던 v107 계열 파일을 고치셔도 됩니다. 어느 쪽인지 알려 주시면 더 빠르지만, 몰라도 저희 쪽에서 찾을 수 있습니다.
> 2. 고치신 파일은 이름을 바꾸셔도 괜찮습니다. 메일이나 Slack 으로 파일을 보내 주세요(용량이 크면 드라이브 링크).
> 3. 아래 양식으로 고친 곳을 짧게 적어 주세요. 저희가 바뀐 코드를 자동으로 찾아 합친 뒤, 적어 주신 내용과 맞는지 확인하고 새 파일을 돌려드립니다.
>
> 고친 곳 설명 양식
> - 바탕으로 쓴 파일: (예: kapehorn-tower-3d_1102.v.html / Wing v107 원본)
> - 고친 것: 화면에서 무엇이 어떻게 달라지는지 (예: 오른쪽 설정의 '오후' 버튼 이름을 '낮'으로)
> - 고친 위치(아시면): 함수 이름이나 검색어 (예: applyTime, '오후')
> - 확인 방법: 어디를 누르면 바뀐 것이 보이는지
> - 저희 쪽에 바라는 것: (예: 렌더에서도 같은 이름으로)
