// 렌더(실사 3D, KHPRLayer) 옵션 대응표 만들기(1102.s): node photoreal/tools/option-matrix.mjs [options.json] [출력 md]
// photoreal/tests/options.mjs 결과(out/options.json)로 Wing 화면의 조작(축)마다 렌더에서 같은 뜻으로 동작하는지 표를 만든다.
// 칸: 실사 3D 켜짐, 우리 건물 조명 재질 중 실사 재질로 바뀐 수/전체, 바뀌지 않은 수(원본 그대로), 실내 굽기, 오류
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const IN = process.argv[2] || path.join(ROOT, 'photoreal/tests/out/options.json');
const OUT = process.argv[3] || path.join(ROOT, 'docs/render-option-matrix.md');
const d = JSON.parse(fs.readFileSync(IN, 'utf8'));
const AX = {
  era: '탭(현황·신축·비교)', vmode: '보기 방식(렌더에서 스케치업·실사로 갔다 돌아옴)', tod: '시간대(외관)', 'tod-int': '시간대(실내 1층)', season: '계절', sun: '날짜·시각 직접', render: '렌더 품질 토글(야경 불빛·고품질·SSAO)',
  sch: '주차 방식(외관)', 'sch-1F': '주차 방식(실내 1층)', 'era-srv': '③ 실측(실내)', 'era-srv-out': '③ 실측(외관)', g1: '1층 안(실내)', 'g1-out': '1층 안(외관)', toggle: '건물 토글', cfin: '외장 재료', form: '입면 형태',
  dsg: '외부 디자인(사진 번호)', win: '창 크기', floors: '층수', h1: '1층 높이', ht: '기준층 높이', ms: '미성 일대 현재/미래', show: '표시 토글(라벨·경계·주변)', view: 'Wing 시점 버튼', level: '층 이동', 'x-sch-g1': '교차: 주차 × 1층 안', x: '교차: 대표 조합',
};
const rows = [], byAx = new Map();
for (const s of d.states) { if (!byAx.has(s.axis)) byAx.set(s.axis, []); byAx.get(s.axis).push(s); }
// 해당 없음: Wing 은 자주식(self)·실측안(dd)에서 지상 층수를 6층으로 고정한다(new/3d-model.html 개요표). 그 조합에서 7F·8F 시점은 없는 층
const na = s => s.viewOk === false && /^[78]F$/.test(s.view || '') && s.state && /^(self|dd)$/.test(s.state.scheme);
const okState = s => s.on && !(s.errors && s.errors.length) && !s.unN && (s.viewOk !== false || na(s));
let sum = '| 축 | 상태 수 | 합격 | 실사 재질 변환(최소～최대) | 원본 그대로 남은 재질 | 실내 굽기 켜짐 | 오류 |\n|---|---|---|---|---|---|---|\n';
for (const [ax, ss] of byAx) {
  const conv = ss.map(s => s.n ? s.ok / s.n : 1), un = Math.max(...ss.map(s => s.unN || 0)), bake = ss.filter(s => s.bake).length, er = ss.reduce((a, s) => a + (s.errors ? s.errors.length : 0), 0);
  sum += `| ${AX[ax] || ax} | ${ss.length} | ${ss.filter(okState).length} | ${(Math.min(...conv) * 100).toFixed(0)}%～${(Math.max(...conv) * 100).toFixed(0)}% | ${un} | ${bake}/${ss.length} | ${er} |\n`;
  for (const s of ss) rows.push(`| ${AX[ax] || ax} | \`${s.name}\` | ${s.view || 'out'} | ${s.on ? '켜짐' : '꺼짐'} | ${s.ok}/${s.n} | ${s.unN || 0} | ${s.bake ? '예' : '아니오'} | ${(s.errors || []).length} | ${na(s) ? '합격(해당 없음: 실측안 6층 고정)' : okState(s) ? '합격' : '불합격'} |`);
}
const total = d.states.length, pass = d.states.filter(okState).length;
const md = `# 렌더(실사 3D) 옵션 대응표 (1102.s)

Wing 화면의 오른쪽 설정에서 고를 수 있는 조작을 렌더(\`vm-real\`, 실사 3D 계층 \`KHPRLayer\`)를 켠 채 하나씩 바꿔 보고, 같은 뜻으로 동작하는지 기록한 표입니다. 자동 시험 \`photoreal/tests/options.mjs\`(전체 점검 qa 묶음)의 결과(${d.at}, ${d.base})로 \`photoreal/tools/option-matrix.mjs\` 가 만듭니다.

판정 기준은 네 가지입니다. 실사 3D 가 켜진 채로 남아 있어야 하고, 페이지·콘솔 오류가 없어야 하며, 우리 건물의 보이는 조명 재질 가운데 실사 재질로 바뀌지 않은 것(Wing 원본 그대로 남은 것)이 0 이어야 하고, 요청한 시점(외관·층·Wing 시점 버튼)으로 가야 합니다. 실사 재질 변환 비율이 100% 가 아닌 것은 무조명 재질(글자·선·표시)이라 바꿀 대상이 아닌 것입니다. 실내 굽기 칸은 우리 타워의 구운 빛(조합별 굽기 변형)이 걸렸는지입니다. 층수 축의 8층 실내(floors-8-int)는 기본 조합이 실측안이라 Wing 이 6층으로 고정하므로 8층이 없고, 해당 없음으로 합격 처리했습니다.

결과: 상태 ${total}개 중 ${pass}개 합격, 오류가 난 상태 ${d.summary.errorStates}개, 원본 그대로 남은 재질 최대 ${d.summary.maxUnconverted}개. 없는 자원(404) ${Array.isArray(d.e404) ? d.e404.length : d.e404}건은 Wing 사진 목록 첫 후보처럼 다음 후보로 넘어가는 것입니다.

## 축별 요약

${sum}
## 상태별 전체

| 축 | 상태 | 볼 곳 | 실사 3D | 실사 재질 변환 | 원본 그대로 | 실내 굽기 | 오류 | 판정 |
|---|---|---|---|---|---|---|---|---|
${rows.join('\n')}

상태별 작은 화면은 \`photoreal/tests/out/opt/<번호>-<이름>.jpg\` 에 남습니다(시험 산출물이라 저장소에는 넣지 않음). VR 쪽 같은 대응은 \`docs/vr-feature-matrix.md\` 입니다.
`;
fs.writeFileSync(OUT, md); console.log(`${OUT} 상태 ${total} 합격 ${pass}`);
