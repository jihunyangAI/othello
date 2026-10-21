# 오델로 구현 계획

## 1. 기준과 현재 상태

- 제품 기준: [게임 기획서](game-design-document.md).
- 개발 기준: [AGENT.md](../AGENT.md).
- 동일 기기 2인 MVP만 구현한다. AI·온라인·계정·저장·무르기·타이머는 제외한다.
- 초기 계획은 앱 코드, package.json, progress.md가 없던 시점에 작성했다. 현재는 1~6단계 기능 구현과 자동 검증을 완료했으며 실제 증거와 제한은 [progress.md](progress.md)를 기준으로 한다.
- 이 문서는 실행 계획과 수행 체크리스트다. 체크는 실제 검증 증거에 따라 갱신하며 수동 미검증 항목은 별도로 남긴다.
- 2026-10-22: 단계 1~6 기능 구현·자동 검사 완료. 스크린리더 청취와 브라우저 확대 수동 검증은 미완료다.

## 2. 진행 절차와 의존 관계

코드를 작성하기 전 다음 문서를 순서대로 읽는다.

1. game-design-document.md
2. implementation-plan.md
3. progress.md

첫 구현 세션에서는 progress.md가 없으므로 먼저 문서 파일을 생성하고 읽는다.
초기 내용에는 미착수 상태, 단계별 체크리스트, 다음 작업, 검증 미실행을 기록한다.
이 계획 작성 단계에서는 progress.md나 앱 파일을 생성하지 않는다.
이후 주요 기능 또는 마일스톤 완료 시 progress.md에 다음을 갱신한다.

- 변경한 기능과 파일, 관련 AC 번호
- 실행한 명령과 실제 결과, 미실행 검증 및 이유
- 남은 문제, 결정 사항, 다음 작업

단계 의존 관계는 1 → 2 → 3 → 4 → 5 → 6이다.
각 단계의 테스트는 해당 기능 작성과 함께 실행하며 마지막 단계까지 미루지 않는다.
도중 재개 시 현재 파일과 진행 기록을 확인하고 미완료 단계에서 계속한다.

## 3. 단계 1 — 개발 기반 구축

- [x] 선행조건: 기준 문서를 읽고 progress.md를 생성·확인한다.
- [x] 선택한 Vite와 호환되는 Node.js LTS 및 의존성 버전을 공식 안내에서 확인한다.
- [x] 확인한 Node 버전을 engines와 프로젝트 실행 안내에 명시한다.
- [x] React/react-dom, Vite, @vitejs/plugin-react 기반 JavaScript ES modules 프로젝트를 구성한다.
- [x] 함수 컴포넌트와 JSX를 사용하며 TypeScript를 도입하지 않는다.
- [x] npm과 package-lock.json을 사용하고 재현 설치는 npm ci로 검증한다.
- [x] ESLint에 Hooks·JSX 접근성 규칙을 적용하고 Prettier를 설정한다.
- [x] Vitest의 domain/state 테스트는 node 환경, UI 테스트는 jsdom 환경으로 분리한다.
- [x] Testing Library, user-event와 UI 테스트 setup을 구성한다.
- [x] Vitest 대상에서 tests/e2e를 제외하고 Playwright는 해당 디렉토리만 검사한다.
- [x] Playwright에 데스크톱·모바일 터치 프로젝트와 로컬 서버를 설정한다. 최종 구현은 scripts/run-e2e.js가 Vite JS API로 서버를 직접 소유·종료한다.

작업 파일:

```text
package.json / package-lock.json / index.html
vite.config.js / vitest.config.js / playwright.config.js
eslint.config.js / .prettierrc.json / .prettierignore / .gitignore
src/main.jsx / src/app/App.jsx / src/app/App.module.css
src/styles/tokens.css / reset.css / global.css
src/tests/setup.js
```

전역 CSS에는 reset·토큰·기본값만 두고 컴포넌트 스타일은 CSS Modules로 작성한다.
React.StrictMode를 유지하고 초기화 및 reducer의 순수성을 검증한다.

| 향후 제공할 명령 | 실행 목적 |
| --- | --- |
| npm run dev | 개발 서버 |
| npm run build | 배포 빌드 |
| npm run preview | 빌드 결과 확인 |
| npm run lint | ESLint |
| npm run format:check | Prettier 검사 |
| npm test | Vitest 단일 실행 |
| npm run test:watch | Vitest 감시 실행 |
| npm run test:e2e | Playwright |

- [x] 검증: dev 화면, build, lint, format:check 및 분리된 테스트 환경을 확인한다.
- [x] 완료조건: 기본 화면이 실행되고 명령·환경 설정이 실제 파일과 일치한다.
- [x] progress.md에 설치 버전과 검증 결과를 갱신한다.

## 4. 단계 2 — 순수 게임 규칙

- [x] 선행조건: 단계 1 완료.
- [x] src/features/othello/domain/board.js와 rules.js를 작성한다.
- [x] domain에는 React·DOM·브라우저 API 의존성을 두지 않는다.
- [x] JSDoc으로 Board, Player, CellValue, 좌표와 함수 반환 계약을 정의한다.
- [x] Board는 길이 64 배열, 값은 null 또는 'black'·'white'로 고정한다.
- [x] 내부 인덱스는 row * 8 + col이고 A1=0이다. 도메인 좌표 변환과 UI coordinates.js 표시 어댑터를 분리했다.

| 함수 계약 | 동작 |
| --- | --- |
| createInitialBoard() | 매번 새 배열, 백 D4·E5 / 흑 E4·D5 |
| getFlips(board, player, index) | 8방향의 직접 포획 인덱스 반환, 무효·점유 칸은 [] |
| getLegalMoves(board, player) | 합법 인덱스 배열 반환 |
| applyMove(board, player, index) | 유효하면 새 보드, 무효면 null; 입력 불변 |
| countDiscs(board) | 실제 흑·백 돌 수 반환 |
| getTurnOutcome(board, playerJustMoved) | 다음 색·패스된 색·종료 여부 반환 |

getFlips는 정수 0~63 여부부터 검사한다. 방향마다 행·열 경계를 확인해 행 넘침을 막는다.
applyMove는 착수 전 보드에서 포획 목록을 한 번 결정하고 복사본에 적용한다.
뒤집힌 돌에서 재탐색하지 않으므로 연쇄 반전은 발생하지 않는다.
getTurnOutcome은 양쪽 합법수를 검사해 종료 → 상대 차례 → 상대 패스 순서로 판정한다.

- [x] rules.test.js에서 초기 합법수, 8방향, 다방향, 차단, 연쇄 금지를 확인한다.
- [x] 입력 배열을 동결한 테스트로 원본 변경이 없는지 확인한다.
- [x] 아래 특수 상태 fixture의 전후 돌 수와 합법수를 명시적으로 검증한다.
- [x] 완료조건: AC-01~09의 순수 규칙 부분이 node 환경에서 통과한다.
- [x] progress.md에 완료한 규칙과 검증 증거를 기록한다.

### 특수 상태 fixture

좌표 이외의 칸은 아래 기본값으로 채운다. 테스트는 초기 배치에서의 도달 가능성이 아닌 규칙 전이를 검증한다.

| 목적 | 착수 전 보드와 차례 | 기대 결과 |
| --- | --- | --- |
| 자동 패스 | 기본 흑; A1·H8 빈칸, B1·G8 백; 흑 A1 | B1 반전, 흑 62·백 1·빈칸 1. 백 합법수 없음, 흑 H8만 가능하여 백 패스 |
| 빈칸을 남긴 종료 | 기본 흑; A1·B1 빈칸, C1 백; 흑 B1 | C1 반전, 흑 63·백 0·빈칸 A1. 양쪽 합법수 없어 종료 |
| 가득 찬 동률 | 1~4행 흑, 5~8행 백으로 채운 뒤 A1 비움·B1 백으로 변경; 흑 A1 | B1만 반전, 흑 32·백 32로 보드가 차고 무승부 |

fixture 기대값을 규칙 구현의 반환값에서 자동 생성하지 않는다.
독립적으로 명시한 기대 좌표와 수를 비교하여 잘못된 테스트가 통과하지 않게 한다.

## 5. 단계 3 — reducer, selectors, hook

- [x] 선행조건: 단계 2 순수 규칙 검증 완료.
- [x] state/reducer.js, selectors.js, reducer.test.js와 hooks/useOthello.js를 작성한다.
- [x] GameState와 Action을 JSDoc으로 정의한다.
- [x] 상태는 board, currentPlayer, status, revision, lastTransition을 가진다.
- [x] 종료 상태는 currentPlayer=null이고 초기 revision은 0이다.
- [x] PLACE(index, expectedRevision) 한 번으로 착수·반전·차례·패스·종료를 처리한다.
- [x] 유효 전이와 RESET마다 revision을 증가시킨다. RESET에서도 0으로 되돌리지 않는다.
- [x] 무효·종료 후·revision 불일치 액션은 기존 게임 상태를 그대로 반환한다.
- [x] reducer와 초기화 함수는 시간·난수·DOM·부수효과를 사용하지 않는다.
- [x] selectors가 점수·현재 합법수·종료 승자를 계산하며 중복 state는 두지 않는다.
- [x] 새 게임 확인 필요 여부는 playing 상태이면서 점유 칸 수 > 4로 판정한다.

hook은 reducer와 selectors의 결과를 UI에 제공한다.
무효 입력 안내, 보드 초점, 확인 대화상자는 별도 UI 상태로 관리한다.
무효 안내는 hook에서 현재 합법수 selector를 이용해 결정하며 포획 규칙을 재구현하지 않는다.
reducer는 같은 공유 규칙으로 최종 상태 무결성을 보장한다.
lastTransition에는 패스된 색 등 실제 게임 전이 정보만 두고 안내 문자열은 UI에서 만든다.

revision은 이전 렌더에서 캡처된 액션이나 지연 작업이 새 보드에 적용되는 것을 막는다.
새 상태가 렌더된 후 발생한 별도 실제 입력까지 동일 이벤트라고 판별하지는 못한다.
고정 시간 debounce로 정상적인 다음 차례를 막지 않는다.
네이티브 버튼 click을 단일 착수 경로로 쓰고 touch/pointer/keydown에 중복 착수를 등록하지 않는다.
키보드의 길게 누름은 event.repeat을 무시하여 하나의 의도에서 연속 착수하지 않게 한다.

- [x] 같은 revision의 두 액션, reset 전 액션, 연속 정상 입력을 구분해 테스트한다.
- [x] 무효 입력·취소는 board·점수·차례·revision을 유지하는지 검사한다.
- [x] StrictMode에서 초기화나 reducer 재호출로 돌·revision이 중복 변경되지 않는지 검사한다.
- [x] 완료조건: 원자 전이와 상태 불변성, 파생값·UI 상태 분리가 검증된다.
- [x] progress.md를 갱신한다.

## 6. 단계 4 — React 게임 화면

- [x] 선행조건: 단계 3 완료.
- [x] App은 Board, Status, Controls를 조합한다.
- [x] components/Board.jsx·Cell.jsx·Status.jsx·Controls.jsx와 CSS Modules를 작성한다.
- [x] 의존 방향 UI → hook → state → domain을 유지하고 역참조·순환을 금지한다.
- [x] Board는 64개 Cell을 안정적인 인덱스 key로 렌더한다.
- [x] 현재 합법수, 좌표, 돌, 현재 차례, 실제 점수를 표시한다.
- [x] 패스된 색과 계속 둘 색, 무효 입력 안내, 최종 결과를 표시한다.
- [x] 종료 시 합법수 표시를 제거하고 입력해도 게임 상태가 바뀌지 않게 한다.
- [x] 진행 중 새 게임은 확인·취소를 제공하고 초기 상태·종료 후에는 바로 초기화한다.
- [x] 새 게임에서 이전 패스·결과·무효 안내를 제거한다.
- [x] Othello.test.jsx에서 user-event로 사용자가 보는 결과를 검증한다.
- [x] 완료조건: 동일 기기 두 사람이 시작부터 새 게임까지 조작할 수 있다.
- [x] progress.md를 갱신한다.

## 7. 단계 5 — 접근성, 키보드와 모바일

- [x] 선행조건: 단계 4 게임 흐름 완료.
- [x] CSS Grid 8열, 정사각형 칸, 반응형 너비로 작은 화면의 잘림을 방지한다.
- [x] 돌·합법수·초점을 색상 외 모양과 테두리로 구분한다.
- [x] 한 칸만 tabIndex=0인 roving tabindex와 방향키 이동을 구현한다.
- [x] 경계에서 순환하지 않고 점유 칸도 탐색 가능하게 한다.
- [x] 네이티브 버튼의 Enter·Space 활성화를 활용하고 중복 핸들러를 두지 않는다.
- [x] 칸 이름에 좌표·색·빈칸 여부를 제공하고 live region으로 상태를 안내한다.
- [x] 확인 대화상자는 이름, 초기 초점, Tab 범위, Escape 취소, 닫힘 후 초점 복원을 지원한다.
- [x] 취소 후 초점을 새 게임 버튼에 복원하고 새 게임 보드의 진입점은 일관되게 초기화한다.
- [x] 필요한 DOM 초점 처리는 ref와 제한된 동기화로 처리한다. 게임 전이에 effect를 쓰지 않는다.
- [x] 모바일 터치와 320px 화면에서 hover 없이 조작하고 가로 넘침이 없음을 확인했다.
- [ ] 브라우저 확대 상태에서 주요 내용과 확인창 조작성을 수동 확인한다.
- [x] AC-13 자동 검사와 실제 브라우저 키보드 검증을 완료하고 제한을 기록했다.
- [ ] NVDA 등 실제 보조 기술의 음성 안내를 수동 확인한다.
- [x] progress.md를 갱신한다.

## 8. 단계 6 — 전체 검증과 실행 안내

- [x] 선행조건: 단계 1~5 기능 구현·자동 검증 완료. 위 수동 접근성 확인은 별도 미완료로 유지한다.
- [x] 아래 AC 매핑의 모든 항목을 검증하고 누락을 보완한다.
- [x] lint, format:check, test, build, 개발·preview test:e2e를 실행했다. npm ci는 1단계 별도 폴더 재현 설치 증거를 사용하며 이후 신규 의존성은 없다.
- [x] preview로 빌드 결과에서 주요 흐름과 새로고침 초기화를 확인한다.
- [x] README.md에 요구 Node 버전, 설치·실행·검증 명령과 MVP 범위를 작성한다.
- [x] 미구현 분기, 임시 반환값, test.skip·test.only 및 문서·코드 불일치를 검사한다.
- [x] 별도 리뷰 단계에서 규칙 정확성·의존 방향·접근성·검증 결과를 확인한다.
- [x] 측정 근거 없는 memo/useMemo/useCallback이나 불필요한 effect를 제거한다.
- [x] 미해결 기능 차단 문제가 없고 AC별 자동 검증 근거를 progress.md에 기록했다. 보조 기술 청취·확대 수동 검증은 제외한다.
- [x] progress.md에 최종 결과, 남은 제한, 재현 명령을 기록한다.

## 9. 수용 기준과 검증 매핑

| AC | 구현 단계 | 검증 계획 |
| --- | --- | --- |
| AC-01 | 2·3·4 | 초기 보드·reducer, UI 초기값, E2E 새로고침 |
| AC-02 | 2·4 | 정확한 합법 좌표 배열과 UI 네 표시 |
| AC-03 | 2·3·4 | D3 착수 후 보드·점수·백 차례, 주요 E2E |
| AC-04 | 2·3·4 | 점유·포획 불가·범위 오류와 상태 유지, UI 안내 |
| AC-05 | 2 | 8방향·다방향·빈칸·경계·자기 돌 차단 fixture |
| AC-06 | 2 | 직접 포획과 연쇄 가능 돌을 분리한 fixture |
| AC-07 | 2·3·4 | 자동 패스 fixture, UI 안내, 임의 패스 경로 없음 |
| AC-08 | 2·3·4 | 빈칸을 남긴 종료 fixture와 실제 점수 |
| AC-09 | 2·3·4 | 가득 찬 보드와 32:32 동률, 결과 표시 |
| AC-10 | 3·4 | 종료 후 상태 불변·합법 표시 제거 |
| AC-11 | 3·4·5 | 확인·취소·안내 초기화 UI와 주요 E2E |
| AC-12 | 3·4·5 | stale 액션·reset·중복 활성화·정상 연속 입력, 터치 E2E |
| AC-13 | 5·6 | 방향키·Enter·Space·대화상자·모바일 E2E와 보조 기술 수동 검사 |

## 10. 참고

- [React reducer](https://react.dev/learn/extracting-state-logic-into-a-reducer)
- [Vite 가이드](https://vite.dev/guide/)
- [Vitest 가이드](https://vitest.dev/guide/)


