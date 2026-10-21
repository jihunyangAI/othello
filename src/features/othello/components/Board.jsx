import { useRef, useState } from 'react';
import { Cell } from './Cell.jsx';
import styles from './Board.module.css';

export function Board({ board, legalMoves, onPlace }) {
  const [activeIndex, setActiveIndex] = useState(19);
  const cells = useRef([]);
  function move(event, index) {
    if ((event.key === 'Enter' || event.key === ' ') && event.repeat) {
      event.preventDefault();
      return;
    }
    const row = Math.floor(index / 8);
    const col = index % 8;
    const destinations = {
      ArrowUp: row > 0 ? index - 8 : index,
      ArrowDown: row < 7 ? index + 8 : index,
      ArrowLeft: col > 0 ? index - 1 : index,
      ArrowRight: col < 7 ? index + 1 : index,
    };
    if (Object.hasOwn(destinations, event.key)) {
      event.preventDefault();
      cells.current[destinations[event.key]]?.focus();
    }
  }
  return (
    <section aria-label="오델로 보드" className={styles.frame}>
      <div aria-hidden="true" className={styles.columns}>
        {'ABCDEFGH'.split('').map((letter) => (
          <span key={letter}>{letter}</span>
        ))}
      </div>
      <div aria-hidden="true" className={styles.rows}>
        {Array.from({ length: 8 }, (_, index) => (
          <span key={index}>{index + 1}</span>
        ))}
      </div>
      <div className={styles.board}>
        {board.map((value, index) => (
          <Cell
            key={index}
            index={index}
            value={value}
            legal={legalMoves.includes(index)}
            active={index === activeIndex}
            cellRef={(element) => {
              cells.current[index] = element;
            }}
            onFocus={() => setActiveIndex(index)}
            onKeyDown={(event) => move(event, index)}
            onPlace={onPlace}
          />
        ))}
      </div>
    </section>
  );
}
