/** @typedef {'black' | 'white'} Player */
/** @typedef {Player | null} CellValue */
/** @typedef {ReadonlyArray<CellValue>} Board 길이 64, A1=0, H8=63. */

export const BOARD_SIZE = 8;
export const CELL_COUNT = BOARD_SIZE * BOARD_SIZE;

/**
 * 정수 행·열(0~7)을 인덱스로 변환한다. 범위 밖이면 null. 부작용 없음.
 * @param {number} row
 * @param {number} col
 * @returns {number | null}
 */
export function toIndex(row, col) {
  return Number.isInteger(row) &&
    Number.isInteger(col) &&
    row >= 0 &&
    row < BOARD_SIZE &&
    col >= 0 &&
    col < BOARD_SIZE
    ? row * BOARD_SIZE + col
    : null;
}

/**
 * 정수 인덱스(0~63)를 {row,col}로 변환한다. 무효이면 null. 부작용 없음.
 * @param {number} index
 * @returns {{row: number, col: number} | null}
 */
export function toCoordinates(index) {
  return Number.isInteger(index) && index >= 0 && index < CELL_COUNT
    ? { row: Math.floor(index / BOARD_SIZE), col: index % BOARD_SIZE }
    : null;
}

/**
 * 표시 좌표(A1~H8). 무효 인덱스는 null. 부작용 없음.
 * @param {number} index
 * @returns {string | null}
 */
export function toBoardLabel(index) {
  const coordinates = toCoordinates(index);
  return coordinates
    ? `${String.fromCharCode(65 + coordinates.col)}${coordinates.row + 1}`
    : null;
}

/** @returns {Array<CellValue>} 매 호출마다 독립된 초기 보드. 부작용 없음. */
export function createInitialBoard() {
  const board = Array(CELL_COUNT).fill(null);
  board[27] = board[36] = 'white';
  board[28] = board[35] = 'black';
  return board;
}
