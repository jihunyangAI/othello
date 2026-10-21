import { useState } from 'react';
import { useOthello } from '../features/othello/hooks/useOthello.js';
import { Board } from '../features/othello/components/Board.jsx';
import { Status } from '../features/othello/components/Status.jsx';
import { Controls } from '../features/othello/components/Controls.jsx';
import styles from './App.module.css';
export function App({ initialState }) {
  const game = useOthello(initialState);
  const [boardSession, setBoardSession] = useState(0);
  function reset() {
    game.reset();
    setBoardSession((session) => session + 1);
  }
  return (
    <main className={styles.app}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>한 수씩, 함께</p>
          <h1>
            오델로<span>OTHELLO</span>
          </h1>
        </div>
        <p className={styles.players}>같은 기기 · 2인 플레이</p>
      </header>
      <div className={styles.layout}>
        <div>
          <Board
            key={boardSession}
            board={game.state.board}
            legalMoves={game.legalMoves}
            onPlace={(index) => game.place(index, game.state.revision)}
          />
          <p className={styles.caption}>작은 원이 표시된 곳에 돌을 놓으세요.</p>
        </div>
        <aside className={styles.sidebar}>
          <Status {...game} />
          <Controls
            needsConfirmation={game.needsResetConfirmation}
            onReset={reset}
          />
          <section className={styles.guide} aria-label="플레이 안내">
            <h2>플레이 안내</h2>
            <p>
              상대 돌을 내 돌 사이에 가두면 뒤집을 수 있어요. 마지막에 돌이 많은
              쪽이 승리합니다.
            </p>
            <p>둘 곳이 없으면 자동으로 패스합니다.</p>
            <p className={styles.keyboard}>
              키보드: 방향키로 이동 · Enter / Space로 착수
            </p>
          </section>
        </aside>
      </div>
      <footer className={styles.footer}>
        흑이 먼저 시작합니다. 한 칸이 흐름을 바꿉니다.
      </footer>
    </main>
  );
}
export default App;
