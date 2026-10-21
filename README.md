# 오델로

HTML, CSS, JavaScript와 React 함수 컴포넌트로 만든 동일 기기 2인 오델로 게임입니다. 합법수 표시, 8방향 뒤집기, 자동 패스, 승패·무승부 판정, 새 게임을 지원합니다. AI·온라인 대전·계정·저장·무르기·타이머는 범위에 포함하지 않습니다.

## 설치와 실행

프로젝트 기준 환경은 Node.js **24.12.0**, npm **11.6.2**입니다. 지원 범위는 `package.json`, 기준 Node 버전은 `.node-version`에 기록합니다. Windows에서는 PowerShell 실행 정책의 영향을 피하려고 아래처럼 `npm.cmd`를 사용합니다. 다른 환경에서는 `npm`으로 실행합니다.

```powershell
npm.cmd ci --cache .npm-cache --no-audit --no-fund
npm.cmd run dev
```

서버 터미널을 열어 둔 상태로 http://127.0.0.1:5173 에 접속합니다. 종료는 Ctrl+C입니다. 잠금 파일을 사용하는 재현 설치에는 `npm ci`를 쓰고, 의존성을 변경할 때만 `npm install`과 잠금 파일 갱신을 함께 수행합니다.

## 플레이 방법

- 흑이 먼저 시작합니다. 작은 원이 표시된 칸을 클릭하거나 터치하면 착수합니다.
- 보드에 Tab으로 진입하고 방향키로 이동합니다. Enter 또는 Space로 착수합니다. 경계에서는 순환하지 않습니다.
- 상대에게 합법수가 없으면 자동으로 패스합니다. 양쪽 모두 둘 곳이 없으면 실제 돌 수로 결과를 정합니다.
- 진행 중 새 게임은 확인창을 표시합니다. ‘계속하기’ 또는 Escape는 취소하고, ‘새 게임 시작’은 초기화합니다. 초기 상태와 종료 후에는 확인 없이 시작합니다.
- 페이지를 새로고침하면 진행 상황을 복원하지 않고 새 게임을 시작합니다.

## 검사와 빌드

```powershell
npm.cmd run lint
npm.cmd run format:check
npm.cmd test
npm.cmd run build
npm.cmd run test:e2e
```

`npm test`는 DOM 없는 node 프로젝트에서 규칙·상태 전이를 검사하고, jsdom UI 프로젝트에서 hook·화면 조작을 검사합니다. `npm run test:watch`는 감시 실행입니다. 포맷 수정은 `npm run format`으로 수행합니다.

E2E에는 별도 Chromium 설치가 필요합니다. 프로젝트 내부 캐시에 설치하려면 사용하는 터미널에 맞는 명령을 실행합니다.

PowerShell:

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = 'C:\CODEX_TEST\OTHELLO\.playwright-browsers'
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

명령 프롬프트(CMD):

```cmd
set "PLAYWRIGHT_BROWSERS_PATH=C:\CODEX_TEST\OTHELLO\.playwright-browsers"
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

다른 위치에 복제했다면 경로를 해당 프로젝트 경로로 변경합니다. 실행기는 `PLAYWRIGHT_BROWSERS_PATH`가 없고 프로젝트의 `.playwright-browsers`가 있으면 해당 캐시를 자동 선택합니다.

`npm run test:e2e`는 실행기가 전용 Vite 서버를 **5174** 포트에서 시작하고 데스크톱·모바일 Chromium 검사를 마친 뒤 닫습니다. **5174는 비워 두어야 합니다.** 5173의 일반 개발 서버와 함께 사용할 수 있습니다.

배포 빌드에 대해 같은 검사를 실행하려면 먼저 빌드한 뒤 다음 환경변수를 지정합니다.

```powershell
npm.cmd run build
$env:E2E_PREVIEW = '1'
npm.cmd run test:e2e
Remove-Item Env:E2E_PREVIEW
```

CMD에서는 `set "E2E_PREVIEW=1"`을 지정하고 검사 후 `set "E2E_PREVIEW="`로 해제합니다. 직접 빌드 화면을 확인하려면 `npm.cmd run preview` 실행 후 http://127.0.0.1:4173 에 접속합니다.

실제 검사 결과와 수동 확인이 필요한 제한은 [progress.md](memory-bank/progress.md)에 기록합니다. 자동 접근성 속성 검사가 실제 스크린리더 청취 검증을 대신하지는 않습니다.

## 구조와 유지보수

의존 방향은 **UI → hook → state → domain**입니다. 규칙은 React·DOM 없이 검사하고, 화면은 규칙을 재구현하지 않습니다.

| 경로                               | 책임                                                |
| ---------------------------------- | --------------------------------------------------- |
| `src/main.jsx`, `src/app/`         | StrictMode 진입점, 게임 화면 조합과 보드 UI 세션    |
| `src/features/othello/domain/`     | 보드·좌표 타입과 순수 게임 규칙                     |
| `src/features/othello/state/`      | 원자적 reducer 전이와 파생값 selectors              |
| `src/features/othello/hooks/`      | 게임 상태와 화면 사이 연결, 별도 무효 입력 안내     |
| `src/features/othello/components/` | 보드·칸·현황·새 게임 확인과 컴포넌트 CSS Modules    |
| `src/styles/`                      | reset, 공유 디자인 토큰, 전역 기본값                |
| `src/tests/`, `tests/e2e/`         | UI 공통 검사 설정과 실제 브라우저 사용자 흐름       |
| `scripts/run-e2e.js`               | E2E 전용 서버·브라우저 캐시 선택·프로세스 종료 관리 |
| `memory-bank/`                     | 제품 기준, 구현 계획, 진행 기록과 아키텍처          |

파일별 역할과 설계 이유는 [architecture.md](memory-bank/architecture.md), 개발 규칙은 [AGENT.md](AGENT.md)를 참고합니다.
