/** @typedef {'red' | 'blue'} Player */
/** @typedef {{ owner: Player | null, count: number }} Cell */
/** @typedef {{ columns: number, rows: number, board: Cell[], turn: Player, moves: number, winner: Player | null }} Game */
/** @typedef {{ board: Cell[], burst: number[], affected: number[] }} Frame */

/** @param {Cell[]} board */
const copyBoard = (board) => board.map((cell) => ({ ...cell }));

/** @param {number} [columns] @param {number} [rows] @returns {Game} */
export function createGame(columns = 8, rows = 4) {
  if (!Number.isInteger(columns) || !Number.isInteger(rows) || columns < 2 || rows < 2)
    throw new Error('棋盘至少需要 2 列、2 行。');
  /** @type {Cell[]} */
  const board = Array.from({ length: columns * rows }, () => ({ owner: null, count: 0 }));
  board[0] = { owner: 'red', count: 1 };
  board[board.length - 1] = { owner: 'blue', count: 1 };
  return { columns, rows, board, turn: 'red', moves: 0, winner: null };
}

/** Orthogonal neighbors, in a fixed order. Diagonals and off-board cells are excluded.
 * @param {number} index @param {number} columns @param {number} rows
 */
export function neighbors(index, columns, rows) {
  const x = index % columns;
  const y = Math.floor(index / columns);
  const result = [];
  if (y > 0) result.push(index - columns);
  if (x < columns - 1) result.push(index + 1);
  if (y < rows - 1) result.push(index + columns);
  if (x > 0) result.push(index - 1);
  return result;
}

/** Apply one complete move without mutating its input. Resolve explosions FIFO.
 * A queued cell can receive more bubbles before it explodes: ALL are removed,
 * as required by the rules, rather than subtracting four and retaining extras.
 * @param {Game} game @param {number} index
 * @returns {{ game: Game, frames: Frame[], explosions: number }}
 */
export function playMove(game, index) {
  if (game.winner) throw new Error('本局已结束，点击“重新开始”再来一局。');
  if (!Number.isInteger(index) || index < 0 || index >= game.board.length)
    throw new Error('请选择棋盘内的格子。');
  if (game.board[index].owner !== game.turn || game.board[index].count === 0)
    throw new Error('只能选择有己方泡泡的格子。');

  const board = copyBoard(game.board);
  board[index].count += 1;
  /** @type {Frame[]} */
  const frames = [{ board: copyBoard(board), burst: [], affected: [index] }];
  const queue = board[index].count >= 4 ? [index] : [];
  const pending = new Set(queue);
  let explosions = 0;
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const source = queue[cursor];
    pending.delete(source);
    board[source] = { owner: null, count: 0 };
    const adjacent = neighbors(source, game.columns, game.rows);
    for (const target of adjacent) {
      board[target].owner = game.turn;
      board[target].count += 1;
      if (board[target].count >= 4 && !pending.has(target)) {
        queue.push(target);
        pending.add(target);
      }
    }
    explosions += 1;
    frames.push({ board: copyBoard(board), burst: [source], affected: adjacent });
  }
  const opponent = game.turn === 'red' ? 'blue' : 'red';
  const winner = board.some((cell) => cell.owner === opponent) ? null : game.turn;
  return {
    game: { ...game, board, turn: winner ?? opponent, moves: game.moves + 1, winner },
    frames,
    explosions,
  };
}

/** @param {Cell[]} board */
export function countBubbles(board) {
  const totals = { red: 0, blue: 0 };
  for (const cell of board) if (cell.owner) totals[cell.owner] += cell.count;
  return totals;
}
