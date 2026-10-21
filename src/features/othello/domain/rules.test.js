import { describe, expect, it } from 'vitest';
import {
  createInitialBoard,
  toBoardLabel,
  toCoordinates,
  toIndex,
} from './board.js';
import {
  applyMove,
  countDiscs,
  getFlips,
  getLegalMoves,
  getTurnOutcome,
} from './rules.js';

function fixture(entries, fill = null) {
  const board = Array(64).fill(fill);
  for (const [index, cell] of entries) board[index] = cell;
  return Object.freeze(board);
}

describe('보드 좌표와 초기 상태', () => {
  it('AC-01: 초기 배치와 돌 수가 정확하고 매번 독립된 배열이다', () => {
    const board = Object.freeze(createInitialBoard());
    const expected = Array(64).fill(null);
    expected[27] = expected[36] = 'white';
    expected[28] = expected[35] = 'black';
    expect(board).toEqual(expected);
    expect(countDiscs(board)).toEqual({ black: 2, white: 2 });
    const other = createInitialBoard();
    expect(other).not.toBe(board);
    other[0] = 'black';
    expect(board[0]).toBeNull();
  });

  it('행·열과 표시 좌표를 단일 계약으로 변환한다', () => {
    expect(toIndex(0, 0)).toBe(0);
    expect(toIndex(7, 7)).toBe(63);
    expect(toCoordinates(19)).toEqual({ row: 2, col: 3 });
    expect(toBoardLabel(19)).toBe('D3');
    expect(toBoardLabel(0)).toBe('A1');
    expect(toBoardLabel(63)).toBe('H8');
    for (const invalid of [-1, 8, 0.5, NaN, '1']) {
      expect(toIndex(invalid, 0)).toBeNull();
      expect(toIndex(0, invalid)).toBeNull();
    }
    for (const invalid of [-1, 64, 0.5, NaN, '1']) {
      expect(toCoordinates(invalid)).toBeNull();
      expect(toBoardLabel(invalid)).toBeNull();
    }
  });
});

describe('순수 착수 규칙', () => {
  it('AC-02: 초기 흑·백 합법수를 오름차순으로 반환한다', () => {
    const board = Object.freeze(createInitialBoard());
    expect(getLegalMoves(board, 'black')).toEqual([19, 26, 37, 44]);
    expect(getLegalMoves(board, 'white')).toEqual([20, 29, 34, 43]);
  });

  it('AC-03: 흑 D3은 D4만 뒤집고 백 차례가 된다', () => {
    const board = Object.freeze(createInitialBoard());
    expect(getFlips(board, 'black', 19)).toEqual([27]);
    const next = applyMove(board, 'black', 19);
    const expected = [...board];
    expected[19] = expected[27] = 'black';
    expect(next).toEqual(expected);
    expect(next).not.toBe(board);
    expect(countDiscs(next)).toEqual({ black: 4, white: 1 });
    expect(getTurnOutcome(next, 'black')).toEqual({
      nextPlayer: 'white',
      passedPlayer: null,
      isFinished: false,
    });
    expect(board).toEqual(createInitialBoard());
  });

  it('백도 같은 규칙으로 착수한다', () => {
    const board = Object.freeze(createInitialBoard());
    const next = applyMove(board, 'white', 20);
    expect(next[20]).toBe('white');
    expect(next[28]).toBe('white');
    expect(countDiscs(next)).toEqual({ black: 1, white: 4 });
    expect(getTurnOutcome(Object.freeze(next), 'white')).toEqual({
      nextPlayer: 'black',
      passedPlayer: null,
      isFinished: false,
    });
  });

  it.each([-1, 64, 1.5, NaN, '19', 27, 0])(
    'AC-04: 무효 인덱스 또는 칸 %s는 변경하지 않는다',
    (index) => {
      const board = Object.freeze(createInitialBoard());
      expect(getFlips(board, 'black', index)).toEqual([]);
      expect(applyMove(board, 'black', index)).toBeNull();
      expect(board).toEqual(createInitialBoard());
    },
  );

  it.each([
    [18, 9],
    [19, 11],
    [20, 13],
    [26, 25],
    [28, 29],
    [34, 41],
    [35, 43],
    [36, 45],
  ])('AC-05: D4에서 상대 %i를 자기 %i로 닫는 방향 포획', (opponent, own) => {
    const board = fixture([
      [opponent, 'white'],
      [own, 'black'],
    ]);
    expect(getFlips(board, 'black', 27)).toEqual([opponent]);
    const next = applyMove(board, 'black', 27);
    expect(next[opponent]).toBe('black');
    expect(countDiscs(next)).toEqual({ black: 3, white: 0 });
    expect(board[27]).toBeNull();
  });

  it('AC-05: 여러 방향의 연속 상대 돌을 모두 뒤집는다', () => {
    const board = fixture([
      [19, 'white'],
      [11, 'white'],
      [3, 'black'],
      [28, 'white'],
      [29, 'white'],
      [30, 'black'],
      [36, 'white'],
      [45, 'black'],
    ]);
    expect(getFlips(board, 'black', 27).sort((a, b) => a - b)).toEqual([
      11, 19, 28, 29, 36,
    ]);
    const next = applyMove(board, 'black', 27);
    expect(countDiscs(next)).toEqual({ black: 9, white: 0 });
  });

  it.each([
    [
      [
        [28, 'white'],
        [30, 'black'],
      ],
      27,
    ],
    [
      [
        [28, 'black'],
        [29, 'white'],
        [30, 'black'],
      ],
      27,
    ],
    [
      [
        [7, 'white'],
        [6, 'black'],
      ],
      8,
    ],
    [
      [
        [8, 'white'],
        [9, 'black'],
      ],
      7,
    ],
    [[[1, 'white']], 0],
  ])(
    'AC-05: 빈칸·자기 돌·행 넘침·경계로 차단된 방향은 포획하지 않는다',
    (entries, index) => {
      const board = fixture(entries);
      expect(getFlips(board, 'black', index)).toEqual([]);
      expect(applyMove(board, 'black', index)).toBeNull();
    },
  );

  it('AC-05: 가장자리에서도 닫힌 연속 돌만 포획한다', () => {
    const board = fixture([
      [1, 'white'],
      [2, 'white'],
      [3, 'black'],
    ]);
    expect(getFlips(board, 'black', 0)).toEqual([1, 2]);
    expect(countDiscs(applyMove(board, 'black', 0))).toEqual({
      black: 4,
      white: 0,
    });
  });

  it('AC-06: 뒤집힌 D4를 출발점으로 추가 반전하지 않는다', () => {
    const board = fixture([
      [27, 'white'],
      [35, 'black'],
      [28, 'white'],
      [29, 'black'],
    ]);
    expect(getFlips(board, 'black', 19)).toEqual([27]);
    const next = applyMove(board, 'black', 19);
    expect(next[27]).toBe('black');
    expect(next[28]).toBe('white');
    expect(countDiscs(next)).toEqual({ black: 4, white: 1 });
  });
});

describe('차례·패스·종료 fixture', () => {
  it('AC-07: 백만 합법수가 없으면 백 패스 후 흑 H8만 가능하다', () => {
    const board = fixture(
      [
        [0, null],
        [63, null],
        [1, 'white'],
        [62, 'white'],
      ],
      'black',
    );
    expect(countDiscs(board)).toEqual({ black: 60, white: 2 });
    expect(getLegalMoves(board, 'black')).toEqual([0, 63]);
    const next = Object.freeze(applyMove(board, 'black', 0));
    expect(countDiscs(next)).toEqual({ black: 62, white: 1 });
    expect(getLegalMoves(next, 'white')).toEqual([]);
    expect(getLegalMoves(next, 'black')).toEqual([63]);
    expect(getTurnOutcome(next, 'black')).toEqual({
      nextPlayer: 'black',
      passedPlayer: 'white',
      isFinished: false,
    });
  });

  it('AC-08: A1 빈칸을 점수에 더하지 않고 양쪽 합법수 없으면 종료한다', () => {
    const board = fixture(
      [
        [0, null],
        [1, null],
        [2, 'white'],
      ],
      'black',
    );
    expect(countDiscs(board)).toEqual({ black: 61, white: 1 });
    expect(getLegalMoves(board, 'black')).toEqual([1]);
    const next = Object.freeze(applyMove(board, 'black', 1));
    expect(next[0]).toBeNull();
    expect(countDiscs(next)).toEqual({ black: 63, white: 0 });
    expect(getLegalMoves(next, 'black')).toEqual([]);
    expect(getLegalMoves(next, 'white')).toEqual([]);
    expect(getTurnOutcome(next, 'black')).toEqual({
      nextPlayer: null,
      passedPlayer: null,
      isFinished: true,
    });
  });

  it('AC-09: 마지막 A1 착수에서 B1만 뒤집어 가득 찬 32:32 동률이다', () => {
    const board = Object.freeze(
      Array.from({ length: 64 }, (_, index) =>
        index === 0 ? null : index === 1 || index >= 32 ? 'white' : 'black',
      ),
    );
    expect(countDiscs(board)).toEqual({ black: 30, white: 33 });
    expect(getLegalMoves(board, 'black')).toEqual([0]);
    expect(getFlips(board, 'black', 0)).toEqual([1]);
    const next = Object.freeze(applyMove(board, 'black', 0));
    expect(countDiscs(next)).toEqual({ black: 32, white: 32 });
    expect(next).not.toContain(null);
    expect(getLegalMoves(next, 'black')).toEqual([]);
    expect(getLegalMoves(next, 'white')).toEqual([]);
    expect(getTurnOutcome(next, 'black')).toEqual({
      nextPlayer: null,
      passedPlayer: null,
      isFinished: true,
    });
  });
});
