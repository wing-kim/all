// 시험용 크롬 경로: CHROME 환경 변수 → 운영체제 기본 설치 경로 순서로 찾는다(맥·윈도우·리눅스)
import fs from 'node:fs';
const CAND = {
  darwin: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'],
  win32: [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA].filter(Boolean).map(d => d + '\\Google\\Chrome\\Application\\chrome.exe'),
  linux: ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'],
}[process.platform] || [];
export const CHROME = process.env.CHROME || CAND.find(p => { try { return fs.existsSync(p); } catch (e) { return false; } }) || CAND[0];
export default CHROME;
