import { useEffect, useRef, useState } from 'react';
import styles from './Controls.module.css';
export function Controls({ needsConfirmation, onReset }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef(null);
  const cancel = useRef(null);
  const confirm = useRef(null);
  const dialog = useRef(null);
  useEffect(() => {
    if (!open) return;
    dialog.current?.showModal();
    cancel.current?.focus();
    function handleKey(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        dialog.current?.close();
        setOpen(false);
        trigger.current?.focus();
      }
      if (event.key === 'Tab') {
        event.preventDefault();
        (document.activeElement === cancel.current
          ? confirm
          : cancel
        ).current?.focus();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);
  function close() {
    dialog.current?.close();
    setOpen(false);
    trigger.current?.focus();
  }
  function reset() {
    onReset();
    close();
  }
  return (
    <div className={styles.controls}>
      <button
        ref={trigger}
        type="button"
        className={styles.newGame}
        onClick={() => (needsConfirmation ? setOpen(true) : reset())}
      >
        새 게임
      </button>
      {open && (
        <dialog
          ref={dialog}
          className={styles.dialog}
          aria-modal="true"
          aria-labelledby="reset-title"
          aria-describedby="reset-description"
        >
          <h2 id="reset-title">새 게임을 시작할까요?</h2>
          <p id="reset-description">현재 진행 중인 게임이 초기화됩니다.</p>
          <div className={styles.actions}>
            <button ref={cancel} type="button" onClick={close}>
              계속하기
            </button>
            <button ref={confirm} type="button" onClick={reset}>
              새 게임 시작
            </button>
          </div>
        </dialog>
      )}
    </div>
  );
}
