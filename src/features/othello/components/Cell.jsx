import { coordinate } from './coordinates.js';
import styles from './Cell.module.css';
export function Cell({
  index,
  value,
  legal,
  active,
  onFocus,
  onKeyDown,
  onPlace,
  cellRef,
}) {
  const description =
    value === 'black' ? '흑돌' : value === 'white' ? '백돌' : '빈칸';
  return (
    <button
      ref={cellRef}
      type="button"
      className={styles.cell}
      aria-label={`${coordinate(index)}, ${description}${legal ? ', 착수 가능' : ''}`}
      data-legal={legal ? 'true' : 'false'}
      data-value={value ?? 'empty'}
      tabIndex={active ? 0 : -1}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      onClick={() => onPlace(index)}
    >
      {value ? (
        <span
          aria-hidden="true"
          className={`${styles.disc} ${styles[value]}`}
        />
      ) : legal ? (
        <span aria-hidden="true" className={styles.hint} />
      ) : null}
    </button>
  );
}
