import styles from './Status.module.css';
export function Status({ state, score, winner, announcement, invalidMessage }) {
  const result =
    winner === 'draw'
      ? '무승부'
      : winner === 'black'
        ? '흑 승리'
        : winner === 'white'
          ? '백 승리'
          : null;
  return (
    <section aria-label="게임 현황">
      <p className={styles.eyebrow}>
        {state.status === 'finished' ? '게임 종료' : '지금 둘 차례'}
      </p>
      <h2 className={styles.turn}>
        {result ?? `${state.currentPlayer === 'black' ? '흑' : '백'} 차례`}
      </h2>
      <div className={styles.scores}>
        <div className={state.currentPlayer === 'black' ? styles.current : ''}>
          <span>
            <i className={styles.black} aria-hidden="true" />흑
          </span>
          <output aria-label="흑 돌 개수">{score.black}</output>
        </div>
        <div className={state.currentPlayer === 'white' ? styles.current : ''}>
          <span>
            <i className={styles.white} aria-hidden="true" />백
          </span>
          <output aria-label="백 돌 개수">{score.white}</output>
        </div>
      </div>
      <div
        className={styles.message}
        role="status"
        aria-label="게임 안내"
        aria-live="polite"
        aria-atomic="true"
      >
        {invalidMessage || announcement}
      </div>
    </section>
  );
}
