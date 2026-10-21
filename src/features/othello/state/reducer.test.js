import { describe, expect, it } from 'vitest';
import { createInitialState, gameReducer } from './reducer.js';
import {
  getCurrentLegalMoves,
  getScore,
  getWinner,
  needsResetConfirmation,
} from './selectors.js';

const place = (state, index, expectedRevision = state.revision) =>
  gameReducer(state, { type: 'PLACE', index, expectedRevision });

function withBoard(entries, fill = 'black') {
  const board = Array(64).fill(fill);
  for (const [index, value] of entries) board[index] = value;
  return Object.freeze({
    ...createInitialState(),
    board: Object.freeze(board),
  });
}

describe('atomic game transitions and selectors', () => {
  it('AC-01/02: independent pure initialization and initial derived values', () => {
    const state = createInitialState();
    expect(createInitialState()).toEqual(state);
    expect(createInitialState().board).not.toBe(state.board);
    expect(getScore(state)).toEqual({ black: 2, white: 2 });
    expect(getCurrentLegalMoves(state)).toEqual([19, 26, 37, 44]);
    expect(getWinner(state)).toBeNull();
    expect(needsResetConfirmation(state)).toBe(false);
  });

  it('AC-03: immutable D3 transition and deterministic reducer replay', () => {
    const state = Object.freeze({
      ...createInitialState(),
      board: Object.freeze(createInitialState().board),
    });
    const next = place(state, 19);
    expect(getScore(next)).toEqual({ black: 4, white: 1 });
    expect(next.board[19]).toBe('black');
    expect(next.board[27]).toBe('black');
    expect(next.currentPlayer).toBe('white');
    expect(next.revision).toBe(1);
    expect(next.status).toBe('playing');
    expect(place(state, 19)).toEqual(next);
    expect(state.board[19]).toBeNull();
    expect(state.board[27]).toBe('white');
    expect(needsResetConfirmation(next)).toBe(true);
  });

  it.each([-1, 64, 19.5, '19', NaN, 0, 27])(
    'AC-04: invalid index %s preserves original state reference',
    (index) => {
      const state = createInitialState();
      expect(place(state, index)).toBe(state);
    },
  );

  it('AC-12: same revision actions are accepted once, fresh next move is accepted', () => {
    const initial = createInitialState();
    const next = place(initial, 19, 0);
    expect(place(next, 18, 0)).toBe(next);
    const current = place(next, 18, 1);
    expect(current.revision).toBe(2);
    expect(current.currentPlayer).toBe('black');
    expect(getScore(current)).toEqual({ black: 3, white: 3 });
  });

  it('AC-11/12: reset restores state but never rewinds revision or accepts old actions', () => {
    const next = place(createInitialState(), 19);
    const reset = gameReducer(next, { type: 'RESET' });
    expect(reset).toEqual({
      ...createInitialState(2),
      lastTransition: { type: 'reset', passedPlayer: null },
    });
    expect(place(reset, 26, 0)).toBe(reset);
    expect(place(reset, 26, 1)).toBe(reset);
    expect(place(reset, 26, 2).revision).toBe(3);
    expect(gameReducer(reset, { type: 'RESET' }).revision).toBe(3);
    expect(gameReducer(reset, { type: 'UNKNOWN' })).toBe(reset);
  });

  it('AC-07: pass is atomic and clears on next transition', () => {
    const state = withBoard([
      [0, null],
      [63, null],
      [1, 'white'],
      [62, 'white'],
    ]);
    const next = place(state, 0);
    expect(next.currentPlayer).toBe('black');
    expect(next.status).toBe('playing');
    expect(next.lastTransition).toEqual({
      type: 'place',
      passedPlayer: 'white',
    });
    expect(getCurrentLegalMoves(next)).toEqual([63]);
    expect(getScore(next)).toEqual({ black: 62, white: 1 });
    const ended = place(next, 63);
    expect(ended.status).toBe('finished');
    expect(ended.lastTransition).toEqual({ type: 'place', passedPlayer: null });
  });

  it('AC-08/10: empty squares stay unscored on terminal transition; further input ignored', () => {
    const state = withBoard([
      [0, null],
      [1, null],
      [2, 'white'],
    ]);
    const ended = place(state, 1);
    expect(ended.status).toBe('finished');
    expect(ended.currentPlayer).toBeNull();
    expect(ended.board[0]).toBeNull();
    expect(getScore(ended)).toEqual({ black: 63, white: 0 });
    expect(getWinner(ended)).toBe('black');
    expect(getCurrentLegalMoves(ended)).toEqual([]);
    expect(place(ended, 0)).toBe(ended);
    expect(needsResetConfirmation(ended)).toBe(false);
  });

  it('AC-09: full board draw and white winner are derived only after finish', () => {
    const board = Array.from({ length: 64 }, (_, index) =>
      index === 0 ? null : index === 1 || index >= 32 ? 'white' : 'black',
    );
    const ended = place({ ...createInitialState(), board }, 0);
    expect(ended.status).toBe('finished');
    expect(getScore(ended)).toEqual({ black: 32, white: 32 });
    expect(getWinner(ended)).toBe('draw');
    expect(getWinner({ ...ended, board: Array(64).fill('white') })).toBe(
      'white',
    );
    expect(getWinner({ ...ended, status: 'playing' })).toBeNull();
  });
});
