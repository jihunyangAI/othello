import { createInitialBoard } from '../domain/board.js';
import { applyMove, getTurnOutcome } from '../domain/rules.js';

/**
 * @typedef {object} GameState
 * @property {import('../domain/board.js').Board} board
 * @property {import('../domain/board.js').Player | null} currentPlayer
 * @property {'playing' | 'finished'} status
 * @property {number} revision Monotonically increasing successful transition ID.
 * @property {{type: 'place' | 'reset', passedPlayer: import('../domain/board.js').Player | null} | null} lastTransition
 */
/** @typedef {{type: 'PLACE', index: number, expectedRevision: number} | {type: 'RESET'}} Action */

/** Pure initializer; each call owns an independent board. @returns {GameState} */
export function createInitialState(initialRevision = 0) {
  return {
    board: createInitialBoard(),
    currentPlayer: 'black',
    status: 'playing',
    revision: initialRevision,
    lastTransition: null,
  };
}

/**
 * Applies a complete move atomically without mutating input. Invalid/stale moves
 * return the original reference. Reset never rewinds the revision.
 * @param {GameState} state
 * @param {Action} action
 * @returns {GameState}
 */
export function gameReducer(state, action) {
  if (action.type === 'RESET')
    return {
      ...createInitialState(state.revision + 1),
      lastTransition: { type: 'reset', passedPlayer: null },
    };
  if (
    action.type !== 'PLACE' ||
    state.status !== 'playing' ||
    action.expectedRevision !== state.revision
  )
    return state;
  const board = applyMove(state.board, state.currentPlayer, action.index);
  if (!board) return state;
  const outcome = getTurnOutcome(board, state.currentPlayer);
  return {
    board,
    currentPlayer: outcome.nextPlayer,
    status: outcome.isFinished ? 'finished' : 'playing',
    revision: state.revision + 1,
    lastTransition: { type: 'place', passedPlayer: outcome.passedPlayer },
  };
}
