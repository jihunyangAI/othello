import { StrictMode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useOthello } from './useOthello.js';
import { createInitialState } from '../state/reducer.js';

describe('useOthello adapter', () => {
  it('AC-03/04/11/12: StrictMode valid, invalid, captured duplicate and reset paths', () => {
    const { result } = renderHook(() => useOthello(), {
      wrapper: StrictMode,
    });
    const initial = result.current.state;
    act(() => result.current.place(0));
    expect(result.current.invalidMessage).toContain('놓을 수 없습니다');
    expect(result.current.state).toBe(initial);
    const capturedPlace = result.current.place;
    act(() => {
      capturedPlace(19);
      capturedPlace(26);
    });
    expect(result.current.score).toEqual({ black: 4, white: 1 });
    expect(result.current.state.revision).toBe(1);
    expect(result.current.invalidMessage).toBe('');
    expect(result.current.announcement).toBe('백 차례입니다.');
    expect(result.current.needsResetConfirmation).toBe(true);
    act(() => result.current.reset());
    expect(result.current.score).toEqual({ black: 2, white: 2 });
    expect(result.current.state.revision).toBe(2);
    act(() => capturedPlace(19));
    expect(result.current.state.revision).toBe(2);
    expect(result.current.announcement).toBe('흑 차례입니다.');
  });

  it('AC-07/08/10/11: pass/result announcements and terminal input preservation', () => {
    const board = Array(64).fill('black');
    board[0] = board[63] = null;
    board[1] = board[62] = 'white';
    const { result } = renderHook(() =>
      useOthello({ ...createInitialState(), board }),
    );
    act(() => result.current.place(0));
    expect(result.current.announcement).toContain(
      '백은 놓을 곳이 없어 자동 패스',
    );
    expect(result.current.legalMoves).toEqual([63]);
    act(() => result.current.place(63));
    const ended = result.current.state;
    const announcement = result.current.announcement;
    expect(result.current.winner).toBe('black');
    expect(announcement).toContain('게임 종료');
    expect(result.current.legalMoves).toEqual([]);
    act(() => result.current.place(0));
    expect(result.current.state).toBe(ended);
    expect(result.current.announcement).toBe(announcement);
    expect(result.current.invalidMessage).toBe('');
    act(() => result.current.reset());
    expect(result.current.winner).toBeNull();
    expect(result.current.announcement).toBe('흑 차례입니다.');
  });
});
