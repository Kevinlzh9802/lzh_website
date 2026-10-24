/** @typedef {'red' | 'blue'} Player */
/** @typedef {{ board: (Player | null)[], turn: Player, moves: number, winner: Player | null, reason: 'eliminated' | 'blocked' | null }} CaptureGame */

/** @returns {CaptureGame} */
export function createCaptureGame() {
  return {
    board: [
      'red',
      'red',
      'red',
      'red',
      'red',
      null,
      null,
      'red',
      'blue',
      null,
      null,
      'blue',
      'blue',
      'blue',
      'blue',
      'blue',
    ],
    turn: 'red',
    moves: 0,
    winner: null,
    reason: null,
  };
}

/** @param {number} index */
function adjacent(index) {
  const row = Math.floor(index / 4);
  const column = index % 4;
  const cells = [];
  if (row > 0) cells.push(index - 4);
  if (column < 3) cells.push(index + 1);
  if (row < 3) cells.push(index + 4);
  if (column > 0) cells.push(index - 1);
  return cells;
}

/** @param {CaptureGame} game @param {number} source */
export function legalDestinations(game, source) {
  if (
    game.winner ||
    !Number.isInteger(source) ||
    source < 0 ||
    source >= 16 ||
    game.board[source] !== game.turn
  )
    return [];
  return adjacent(source).filter((index) => game.board[index] === null);
}

/** @param {(Player | null)[]} board @param {Player} player */
export function hasLegalMove(board, player) {
  return board.some(
    (owner, index) => owner === player && adjacent(index).some((target) => board[target] === null),
  );
}

/** @param {(Player | null)[]} board */
export function countPieces(board) {
  const totals = { red: 0, blue: 0 };
  for (const owner of board) if (owner) totals[owner] += 1;
  return totals;
}

/** Exactly three occupied cells in the WHOLE row/column, adjacent, with the enemy at an end.
 * @param {(Player | null)[]} board @param {number[]} line @param {Player} player
 * @returns {number | null}
 */
function capturedInLine(board, line, player) {
  const occupied = line.filter((index) => board[index] !== null);
  if (occupied.length !== 3) return null;
  const positions = occupied.map((index) => line.indexOf(index));
  if (positions[2] - positions[0] !== 2) return null;
  if (occupied.filter((index) => board[index] === player).length !== 2) return null;
  const enemy = player === 'red' ? 'blue' : 'red';
  if (board[occupied[0]] === enemy) return occupied[0];
  if (board[occupied[2]] === enemy) return occupied[2];
  return null;
}

/** @param {CaptureGame} game @param {number} source @param {number} destination
 * @returns {{ game: CaptureGame, captured: number[] }}
 */
export function movePiece(game, source, destination) {
  if (game.winner) throw new Error('本局已结束，重新开始再来一局吧。');
  if (!legalDestinations(game, source).includes(destination))
    throw new Error('只能将己方棋子移动到上下左右相邻的空格。');
  const board = [...game.board];
  board[source] = null;
  board[destination] = game.turn;
  const row = Math.floor(destination / 4);
  const column = destination % 4;
  const lines = [
    Array.from({ length: 4 }, (_, x) => row * 4 + x),
    Array.from({ length: 4 }, (_, y) => y * 4 + column),
  ];
  // Inspect both axes BEFORE removing either capture.
  const captured = lines
    .map((line) => capturedInLine(board, line, game.turn))
    .filter((index) => index !== null);
  for (const index of captured) board[index] = null;
  const opponent = game.turn === 'red' ? 'blue' : 'red';
  /** @type {CaptureGame['reason']} */
  const reason = !board.includes(opponent)
    ? 'eliminated'
    : !hasLegalMove(board, opponent)
      ? 'blocked'
      : null;
  const winner = reason ? game.turn : null;
  return {
    game: { board, turn: winner ?? opponent, moves: game.moves + 1, winner, reason },
    captured,
  };
}
