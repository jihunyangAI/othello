import { BOARD_SIZE, CELL_COUNT, toCoordinates, toIndex } from './board.js';

/** @typedef {import('./board.js').Board} Board */
/** @typedef {import('./board.js').Player} Player */

const DIRECTIONS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

// 공개 API는 유효한 Board/Player를 전제로 하며 잘못된 인덱스는 무효 착수로 처리한다.
/**
 * 입력 board는 길이 64, 값은 null/black/white, player는 black/white이어야 한다.
 * @param {Board} board
 * @param {Player} player
 * @param {number} index 정수 0~63
 * @returns {number[]} 직접 포획 목록. 무효·점유·포획 불가 칸은 []. 입력 불변.
 */
export function getFlips(board, player, index) {
  const start = toCoordinates(index);
  if (!start || board[index] !== null) return [];
  const opponent = player === 'black' ? 'white' : 'black';
  const flips = [];
  for (const [dr, dc] of DIRECTIONS) {
    let row = start.row + dr;
    let col = start.col + dc;
    const captured = [];
    while (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
      const cursor = toIndex(row, col);
      if (board[cursor] === opponent) {
        captured.push(cursor);
      } else {
        if (board[cursor] === player && captured.length > 0)
          flips.push(...captured);
        break;
      }
      row += dr;
      col += dc;
    }
  }
  return flips;
}

/**
 * 오름차순 합법수. 입력 불변. 유효한 Board/Player를 전제로 한다.
 * @param {Board} board
 * @param {Player} player
 * @returns {number[]}
 */
export function getLegalMoves(board, player) {
  const moves = [];
  for (let index = 0; index < CELL_COUNT; index += 1) {
    if (getFlips(board, player, index).length > 0) moves.push(index);
  }
  return moves;
}

/**
 * @param {Board} board 유효한 보드
 * @param {Player} player 유효한 색
 * @param {number} index
 * @returns {Array<import('./board.js').CellValue> | null} 새 보드 또는 무효 착수 시 null.
 * 입력을 변경하지 않으며 착수 전 포획 목록만 적용하여 연쇄 반전을 방지한다.
 */
export function applyMove(board, player, index) {
  const flips = getFlips(board, player, index);
  if (flips.length === 0) return null;
  const nextBoard = [...board];
  nextBoard[index] = player;
  for (const captured of flips) nextBoard[captured] = player;
  return nextBoard;
}

/**
 * 빈칸을 제외한 실제 돌 수. 입력 불변. 유효한 Board를 전제로 한다.
 * @param {Board} board
 * @returns {{black: number, white: number}}
 */
export function countDiscs(board) {
  const counts = { black: 0, white: 0 };
  for (const cell of board) {
    if (cell === 'black' || cell === 'white') counts[cell] += 1;
  }
  return counts;
}

/**
 * 모든 규칙 함수는 유효한 Board/Player를 전제로 한다. 부작용 없음.
 * @param {Board} board 착수 후 보드
 * @param {Player} playerJustMoved 방금 착수한 색
 * @returns {{nextPlayer: Player | null, passedPlayer: Player | null, isFinished: boolean}}
 * 종료 시 두 색은 null. 정상 교대 시 passedPlayer=null. 상대만 불가하면 상대 패스.
 */
export function getTurnOutcome(board, playerJustMoved) {
  const opponent = playerJustMoved === 'black' ? 'white' : 'black';
  if (getLegalMoves(board, opponent).length > 0) {
    return { nextPlayer: opponent, passedPlayer: null, isFinished: false };
  }
  if (getLegalMoves(board, playerJustMoved).length > 0) {
    return {
      nextPlayer: playerJustMoved,
      passedPlayer: opponent,
      isFinished: false,
    };
  }
  return { nextPlayer: null, passedPlayer: null, isFinished: true };
}
