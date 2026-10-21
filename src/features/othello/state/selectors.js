import { countDiscs, getLegalMoves } from '../domain/rules.js';

/** @param {import('./reducer.js').GameState} state */
export function getScore(state) {
  return countDiscs(state.board);
}

/** @param {import('./reducer.js').GameState} state @returns {number[]} */
export function getCurrentLegalMoves(state) {
  return state.status === 'playing' && state.currentPlayer
    ? getLegalMoves(state.board, state.currentPlayer)
    : [];
}

/** @param {import('./reducer.js').GameState} state @returns {'black'|'white'|'draw'|null} */
export function getWinner(state) {
  if (state.status !== 'finished') return null;
  const { black, white } = getScore(state);
  return black === white ? 'draw' : black > white ? 'black' : 'white';
}

/** @param {import('./reducer.js').GameState} state @returns {boolean} */
export function needsResetConfirmation(state) {
  const { black, white } = getScore(state);
  return state.status === 'playing' && black + white > 4;
}
