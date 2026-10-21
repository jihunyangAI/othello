# 오델로 아키텍처 기록

## 현재 구조와 책임

동일 기기 2인 플레이의 순수 규칙, 상태 관리와 React 게임 화면을 연결했다. 실제 검사 결과와 남은 제한은 [progress.md](progress.md)를 기준으로 한다. 이전 단계의 설치·검증 이력도 진행 기록에 보관한다.

```text
index.html → main.jsx (StrictMode)
  → App → Board / Cell / Status / Controls
    → useOthello → reducer / selectors → board / rules
```

UI는 hook의 상태와 콜백으로 조작한다. state는 domain을 사용하며 domain은 React·DOM·상위 계층에 의존하지 않는다. 표시 좌표는 UI의 얇은 `coordinates.js` 어댑터에서 문자열로 변환한다.

| 파일 | 실제 역할과 변경 시 주의점 |
| --- | --- |
| `index.html` | 한국어 문서·제목과 React 마운트 지점 |
| `src/main.jsx` | StrictMode에서 App을 마운트하고 reset → tokens → global 순서로 CSS 로드 |
| `src/app/App.jsx` | hook과 Board·Status·Controls 조합. 별도 boardSession으로 새 게임의 보드 초점 세션 초기화 |
| `src/app/App.module.css` | 화면 배치, 좁은 화면에서 보드·사이드바 재배치 |
| `domain/board.js` | 길이 64 배열의 보드 타입·상수, 초기 배치와 좌표 변환 |
| `domain/rules.js` | 직접 포획·합법수·불변 착수·실제 돌 수·다음 차례·패스·종료 계산 |
| `state/reducer.js` | PLACE 한 번에 착수부터 차례·종료까지 원자적으로 반영. RESET 포함 단조 증가 revision 관리 |
| `state/selectors.js` | 점수·현재 합법수·종료 승자·초기화 확인 필요 여부 계산 |
| `hooks/useOthello.js` | reducer와 selectors를 UI에 제공. 무효 입력 안내는 게임 상태와 분리하고 한국어 차례·패스·결과 안내 생성 |
| `components/Board.jsx` | 64칸 배치, roving tabindex, 경계 내 방향키 이동과 길게 누른 활성화 방어 |
| `components/Cell.jsx` | 네이티브 button, 돌·합법수 표시, 좌표·상태 이름과 단일 click 착수 경로 |
| `components/coordinates.js` | 화면에서 쓰는 A1~H8 좌표 문자열 생성 |
| `components/Status.jsx` | 차례·점수·결과와 polite live region의 안내 표시 |
| `components/Controls.jsx` | 새 게임 확인 UI, native dialog, 초기 초점·Tab 이동·Escape 취소·닫힘 후 초점 복원 |
| `components/*.module.css` | 보드·돌·상태·확인창 전용 스타일. 공유 색과 초점 값은 토큰 참조 |
| `src/styles/reset.css` | 박스 크기·기본 여백·폼 글꼴 초기화 |
| `src/styles/tokens.css` | 공유 색·간격·글꼴 변수 |
| `src/styles/global.css` | 페이지 기본값·공통 focus-visible·움직임 감소 설정 |

표의 domain·state·hooks·components 상대 경로는 `src/features/othello/` 기준이다.

## 상태의 단일 기준과 입력 무결성

게임 상태에는 board, currentPlayer, status, revision, lastTransition만 둔다. 점수·합법수·승자는 selectors로 계산하여 보드와 표시값의 불일치를 막는다. 종료 상태는 currentPlayer=null이고 합법수는 빈 배열이다. 새 게임 확인은 playing이면서 점유 칸이 4개를 넘을 때만 필요하다.

PLACE는 이벤트 생성 시점의 expectedRevision을 전달한다. 성공한 착수와 RESET마다 revision이 증가하므로 같은 렌더에서 만들어진 중복 액션이나 초기화 전 액션은 새 보드에 적용되지 않는다. 무효·오래된 입력과 종료 후 착수는 원래 상태 참조를 반환한다. 정상적으로 다음 화면이 렌더된 후의 입력은 다음 차례로 처리한다. 시간 기반 debounce는 사용하지 않는다.

포획 목록은 착수 전 보드에서 확정하고 복사한 보드에만 적용한다. 각 방향에서 행·열 경계를 검사하여 행 넘침을 방지한다. 연쇄 포획은 발생하지 않는다. reducer는 착수·반전·교대·자동 패스·종료를 한 번에 처리하며 게임 진행을 effect로 이어 붙이지 않는다.

무효 안내는 hook의 UI 상태다. 보드 활성 칸과 확인창 열림은 각 UI 컴포넌트의 상태다. 패스된 색과 전이 종류는 lastTransition에 게임 사실로만 보관하고 안내 문자열은 hook에서 만든다. RESET은 이전 안내를 제거한다.

App의 boardSession은 게임 revision과 별개다. 새 게임에서만 Board의 key를 바꾸므로 D3을 Tab 진입점으로 복원하면서 일반 착수 시 사용자의 활성 칸을 유지한다. 확인창이 닫히면 초점은 새 게임 버튼으로 돌아간다. DOM 초점 동기화는 제한된 ref/effect로 수행하고 규칙 계산과 섞지 않는다.

64칸에 맞는 단순한 계산을 유지한다. 측정 없이 memo·useMemo·useCallback을 추가하지 않으며 StrictMode를 제거하여 순수성 문제를 숨기지 않는다.

## 검사와 실행 도구의 경계

| 파일 | 역할 |
| --- | --- |
| `package.json`, `package-lock.json`, `.node-version` | npm 명령, 직접·잠금 의존성, Node 기준 버전 |
| `vite.config.js` | React 플러그인과 개발·빌드 통합 |
| `vitest.config.js` | node의 domain/state 테스트와 jsdom의 JSX UI 테스트 분리 |
| `src/tests/setup.js` | jest-dom matcher와 테스트 후 DOM cleanup |
| `domain/rules.test.js` | 8방향·차단·연쇄 금지·불변성·특수 상태 fixture |
| `state/reducer.test.js` | 원자 전이·stale 입력·reset revision·패스·종료·selectors |
| `hooks/useOthello.test.jsx` | StrictMode 상태 연결·무효 안내·동일 revision 중복·종료 안내 |
| `components/Othello.test.jsx`, `src/app/App.test.jsx` | 화면 조작·표시·확인창·키보드와 초기 렌더 |
| `src/tests/environment.node.test.js` | 순수 로직 검사에 DOM이 없는지 확인 |
| `tests/e2e/othello.spec.js` | 실제 Chromium의 데스크톱·모바일 플레이 흐름 |
| `scripts/run-e2e.js` | Vite JS API 서버를 직접 소유하고 Playwright 종료 후 finally에서 닫음 |
| `playwright.config.js` | E2E 디렉토리·두 Chromium 프로젝트·worker 수·trace·CI 재시도 |
| `eslint.config.js`, `.prettierrc.json` | Hooks·접근성 정적 검사와 형식 규약 |
| `.gitignore`, `.prettierignore` | 의존성·캐시·빌드·검사 산출물을 소스 검사와 구분 |
| `README.md` | 설치·실행·조작·검사 재현 안내 |

E2E 실행기는 5174 포트를 사용하며 일반 개발 서버 5173과 분리한다. Playwright 설정의 webServer 자식 프로세스 정리에 의존하지 않고 같은 Node 프로세스에서 소유한 서버를 닫아 이전 Windows 종료 지연 경로를 교체했다. `E2E_PREVIEW=1`이면 동일 포트에 배포 빌드 preview를 띄우며 빌드가 선행되어야 한다.

브라우저 바이너리는 npm 의존성과 별개다. 명시한 PLAYWRIGHT_BROWSERS_PATH가 우선이며, 없으면 프로젝트 내부 `.playwright-browsers` 캐시가 있을 때 자동 선택한다. Chromium 설치 경로와 실행 경로를 일치시켜야 한다. `.playwright-browsers`, `.npm-cache`, `.verification-install`, node_modules, dist와 검사 산출물은 제품 소스가 아니다.

자동 검사는 화면의 이름·live region 속성·키보드 초점과 브라우저 흐름을 확인한다. 실제 스크린리더의 음성 출력 여부와 사용성은 별도 수동 검증으로 구분한다. 테스트 개수나 완료 상태는 중복 기록하지 않고 진행 기록의 최종 결과를 참조한다.
