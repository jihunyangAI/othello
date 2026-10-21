# 오델로 개발 규칙

<!-- 사용자가 요청한 AGENT.md이다. 자동 인식 표준 파일명 AGENTS.md와 구별하며, 별도 파일은 생성하지 않는다. -->

## 제품 기준

- 기능과 동작의 기준은 [게임 기획서](memory-bank/game-design-document.md)이다. 기획서의 수용 기준(AC)을 구현·테스트와 연결한다.
- MVP는 동일 기기 2인 플레이다. AI·온라인 대전·계정·저장·무르기·타이머를 추가하지 않는다.
- 기획서에 없는 기능이 필요한 경우 먼저 요구사항을 명확히 한다. 기술 편의를 위해 게임 규칙을 변경하지 않는다.

## 기술 스택과 실행 규약

- HTML, JavaScript ES modules, CSS와 React/react-dom을 사용한다. React 함수 컴포넌트와 JSX로 화면을 구성하며 TypeScript는 도입하지 않는다.
- 개발 서버와 빌드는 Vite 및 @vitejs/plugin-react를 사용한다. 초기 설치 시 선택한 Vite와 호환되는 Node.js LTS의 정확한 버전을 확인하고 package.json의 engines 및 프로젝트 안내에 명시한다.
- 패키지 관리자는 npm으로 통일하고 package-lock.json을 커밋한다. 재현 가능한 환경과 CI에서는 npm ci를 사용한다.
- 스타일은 컴포넌트별 CSS Modules로 작성한다. 전역 CSS에는 reset, 디자인 토큰, 기본 글꼴과 페이지 기본값만 둔다.
- ESLint에 React Hooks와 JSX 접근성 규칙을 적용하고 Prettier로 포맷을 통일한다. 규칙 비활성화로 문제를 숨기지 않는다.
- 아래 명령은 향후 앱 구현 시 package.json에 제공할 규약이다. 이 문서 작성만으로 설치되거나 실행 가능한 것으로 간주하지 않는다.

| 명령 | 역할 |
| --- | --- |
| npm run dev | Vite 개발 서버 |
| npm run build | 배포용 빌드 |
| npm run preview | 빌드 결과 로컬 확인 |
| npm run lint | ESLint 검사 |
| npm run format:check | Prettier 변경 없는 검사 |
| npm test | Vitest 단일 실행(vitest run) |
| npm run test:watch | Vitest 감시 실행 |
| npm run test:e2e | Playwright 주요 사용자 흐름 검사 |

## 디렉토리와 책임

```text
src/
  main.jsx
  app/
    App.jsx
    App.module.css
  features/
    othello/
      domain/
        board.js
        rules.js
        rules.test.js
      state/
        reducer.js
        selectors.js
        reducer.test.js
      hooks/
        useOthello.js
      components/
        Board.jsx
        Board.module.css
        Cell.jsx
        Cell.module.css
        Status.jsx
        Controls.jsx
        Othello.test.jsx
  styles/
    tokens.css
    reset.css
    global.css
  tests/
    setup.js
tests/
  e2e/
    othello.spec.js
```

- App은 화면 조합을 담당한다. Board는 보드 배치와 키보드 이동, Cell은 칸 표시와 선택 전달, Status는 차례·점수·안내, Controls는 새 게임을 담당한다.
- domain은 보드 생성, 합법수·포획 계산, 종료 판정 등 순수 규칙만 담당한다. React, DOM, 브라우저 API, state, hook, UI를 참조하지 않는다.
- state는 domain을 이용해 게임 전이를 수행하고 selectors로 표시용 값을 계산한다. hooks/useOthello는 게임 상태와 UI 사이의 연결을 담당한다.
- 기본 의존 방향은 UI → hook → state → domain이다. 역방향 참조와 순환 의존을 금지한다. 컴포넌트에서 규칙을 재구현하거나 domain을 직접 호출해 게임 상태를 우회 변경하지 않는다.
- 파일은 책임이 분리될 때 나눈다. 단순한 함수를 위해 범용 계층이나 불필요한 라이브러리를 추가하지 않는다.

## 상태와 규칙 계약

- 보드는 길이 64의 배열로 표현한다. 각 칸은 null, 'black', 'white' 중 하나다. 행·열은 내부에서 0~7, 인덱스는 row * 8 + col이며 A1은 0이다. 화면 좌표 변환은 한 곳에서 처리한다.
- 게임 상태는 board, currentPlayer, status('playing' 또는 'finished'), revision과 패스 안내에 필요한 마지막 전이 정보를 가진다. 종료 시 currentPlayer는 null로 한다.
- 점수, 현재 합법수, 승자는 보드와 상태에서 selector로 계산한다. 같은 의미의 값을 별도 state에 중복 저장하지 않는다.
- immutable reducer를 사용한다. 유효한 PLACE 한 액션에서 착수·모든 직접 포획·다음 차례·자동 패스·종료를 원자적으로 처리한다. 상태 계산을 useEffect로 이어 붙이지 않는다.
- reducer와 domain 함수는 입력을 변경하지 않는다. 무효 입력과 종료 후 착수는 게임 상태를 변경하지 않는다. 안내·초점·확인 대화상자 등 UI 상태는 게임 상태와 분리한다.
- PLACE는 index와 expectedRevision을 포함한다. 현재 revision과 다르면 오래된 입력으로 보고 무시한다. 성공한 전이와 RESET마다 revision을 증가시키며 RESET도 0으로 되돌리지 않는다. 이벤트 생성 시점의 revision을 전달하여 이전 보드에서 발생한 지연·중복 입력을 막는다.
- JSDoc으로 CellValue, Player, Board, GameState, Action, 좌표 범위와 반환값을 정의한다. 공개 규칙 함수에는 부작용 여부와 무효 입력 계약을 명시한다.
- 예를 들어 getLegalMoves(board, player)는 합법 인덱스 배열, getFlips(board, player, index)는 직접 포획할 인덱스 배열을 반환한다. 범위를 벗어나거나 점유된 칸의 getFlips는 빈 배열을 반환한다. reducer는 포획 목록이 비면 착수를 거절한다.

## 화면, 스타일과 접근성

- 보드는 CSS Grid의 8개 열과 정사각형 칸으로 구성한다. 고정 픽셀 크기에 의존하지 않고 화면 폭에 맞추며 작은 화면에서 보드가 잘리지 않게 한다.
- 색·간격·글꼴·초점 테두리는 전역 토큰으로 관리한다. 컴포넌트 전용 선택자는 CSS Modules에 둔다.
- 보드 칸은 접근 가능한 조작 요소로 구현한다. 좌표와 칸 상태를 이름에 포함하고 합법수·돌·초점을 색상 외의 방식으로 구분한다.
- 보드는 한 칸만 Tab 진입점으로 두는 roving tabindex를 사용한다. 방향키로 경계 내 이동하고 Enter·Space로 착수한다. 점유된 칸도 상태 확인을 위해 키보드 탐색이 가능해야 한다.
- 차례·무효 입력·패스·결과는 적절한 live region으로 알린다. 새 게임 확인은 키보드로 조작하고 닫힌 뒤 초점을 복원한다. 취소 시 게임 상태를 유지한다.
- CSS 크기로 터치 조작성을 확보하고 hover만으로 필수 정보를 제공하지 않는다.

## 성능과 유지보수

- 64칸 보드에 맞는 단순하고 읽기 쉬운 구현을 우선한다. Profiler나 측정 근거 없이 React.memo, useMemo, useCallback을 추가하지 않는다.
- useEffect는 외부 시스템과의 동기화가 필요할 때만 사용한다. 파생값 계산, 사용자 액션 처리, 게임 차례 전환을 effect로 처리하지 않는다.
- 셀은 안정적인 보드 인덱스를 key로 사용한다. 직접 DOM 조작과 전역 가변 게임 상태를 사용하지 않는다.
- 최적화는 측정한 병목과 전후 결과를 함께 기록하고, 규칙과 접근성의 정확성을 유지한다.

## 검증과 완료 기준

- Vitest로 React·DOM 없는 순수 규칙과 reducer를 검사한다. 초기 합법수, 8방향·다방향 포획, 빈칸 차단, 연쇄 반전 금지, 무효 입력, 패스, 빈칸을 남긴 종료, 동률, immutable 처리와 revision 불일치를 포함한다.
- UI 검사는 Testing Library, user-event, jsdom을 사용한다. 표시된 정보와 사용자의 조작 결과를 확인하며 내부 구현이나 스냅샷에만 의존하지 않는다.
- Playwright로 초기 진입→착수→차례·점수 갱신, 진행 중 새 게임 취소·확인, 키보드 조작과 모바일 터치의 주요 흐름을 검증한다. 특수 규칙 상태는 순수 규칙·reducer 테스트로 집중 검증한다.
- 테스트 이름이나 설명에 관련 기획서 AC 번호를 표시한다. 전체 AC가 적절한 자동 검사 또는 명시적인 수동 검증으로 확인되어야 한다.
- 변경 후 관련 테스트와 lint, format:check, build를 실행한다. UI 흐름 변경 시 관련 E2E도 실행한다. 실행하지 못한 검사는 이유와 함께 보고하며 통과했다고 주장하지 않는다.
- TODO 형태의 미구현 분기, 임시 반환값, test.skip·test.only로 완료를 대신하지 않는다. 작성과 별도의 검토 단계에서 변경 내용과 검증 결과를 확인한다.

## 공식 참고 자료

- [React: 상태 로직을 reducer로 추출하기](https://react.dev/learn/extracting-state-logic-into-a-reducer)
- [Vite 시작 가이드](https://vite.dev/guide/)
- [Vitest 시작 가이드](https://vitest.dev/guide/)



# 중요:
코드를 작성하기 전 반드시 아래의 memory-bank안의 파일들을 순서대로 읽어 주세요
1. game-design-document.md (게임기획서) 
2. implementation-plan.md(구현기획서) 
3. progress.md(현재진행상황) 

주요기능개발이나 마일스톤을 완료할때에는 아래 파일들을 업데이트해야 합니다. 
progress.md 

