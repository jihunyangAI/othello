import { useReducer, useState } from 'react';
import { createInitialState, gameReducer } from '../state/reducer.js';
import {
  getCurrentLegalMoves,
  getScore,
  getWinner,
  needsResetConfirmation,
} from '../state/selectors.js';

const playerName = { black: '흑', white: '백' };

/** Game/UI adapter. Invalid messages are UI state; game facts stay in reducer.
 * @param {import('../state/reducer.js').GameState} [initialState]
 */
export function useOthello(initialState) {
  const [state, dispatch] = useReducer(
    gameReducer,
    initialState,
    (provided) => provided ?? createInitialState(),
  );
  const [invalidMessage, setInvalidMessage] = useState('');
  const score = getScore(state);
  const legalMoves = getCurrentLegalMoves(state);
  const winner = getWinner(state);
  const passedPlayer = state.lastTransition?.passedPlayer;
  let announcement;
  if (state.status === 'finished') {
    announcement = `게임 종료. ${winner === 'draw' ? '무승부입니다.' : `${playerName[winner]} 승리입니다.`} 흑 ${score.black}개, 백 ${score.white}개.`;
  } else {
    const turn = `${playerName[state.currentPlayer]} 차례입니다.`;
    announcement = passedPlayer
      ? `${playerName[passedPlayer]}은 놓을 곳이 없어 자동 패스합니다. ${turn}`
      : turn;
  }

  function place(index, expectedRevision = state.revision) {
    if (state.status !== 'playing' || expectedRevision !== state.revision)
      return;
    if (!legalMoves.includes(index)) {
      setInvalidMessage(
        '이 칸에는 놓을 수 없습니다. 착수 가능한 위치를 선택하세요.',
      );
      return;
    }
    setInvalidMessage('');
    dispatch({ type: 'PLACE', index, expectedRevision });
  }

  function reset() {
    setInvalidMessage('');
    dispatch({ type: 'RESET' });
  }

  return {
    state,
    score,
    legalMoves,
    winner,
    announcement,
    invalidMessage,
    place,
    reset,
    needsResetConfirmation: needsResetConfirmation(state),
  };
}

export default useOthello;
