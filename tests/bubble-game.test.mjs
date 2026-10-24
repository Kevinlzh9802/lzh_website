import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, neighbors, playMove, countBubbles } from '../src/lib/bubble-game.mjs';

const fixture = (columns = 3, rows = 3) => {
  const game = createGame(columns, rows);
  game.board = game.board.map(() => ({ owner: null, count: 0 }));
  return game;
};
const put = (game, index, owner, count) => {
  game.board[index] = { owner, count };
};

test('starts on an 8-column, 4-row board with opposite corners and red to move', () => {
  const game = createGame();
  assert.equal(game.columns, 8);
  assert.equal(game.rows, 4);
  assert.equal(game.board.length, 32);
  assert.deepEqual(game.board[0], { owner: 'red', count: 1 });
  assert.deepEqual(game.board[31], { owner: 'blue', count: 1 });
  assert.deepEqual(countBubbles(game.board), { red: 1, blue: 1 });
  assert.equal(game.turn, 'red');
  assert.equal(game.winner, null);
  assert.throws(() => createGame(1, 5));
});

test('rejects empty cells, enemy cells and out-of-board moves without mutation', () => {
  const game = createGame();
  const before = structuredClone(game);
  for (const index of [1, 31, -1, 32, 1.5, NaN]) assert.throws(() => playMove(game, index));
  assert.deepEqual(game, before);
});

test('increments an owned cell, switches turns once and leaves its input unchanged', () => {
  const game = createGame();
  const before = structuredClone(game);
  const result = playMove(game, 0);
  assert.deepEqual(game, before);
  assert.equal(result.game.board[0].count, 2);
  assert.equal(result.game.turn, 'blue');
  assert.equal(result.game.moves, 1);
  assert.equal(result.explosions, 0);
  assert.equal(playMove(result.game, 31).game.turn, 'red');
});

test('corners, edges and interior cells all explode at four, with only orthogonal neighbors', () => {
  for (const [source, expected] of [
    [0, [1, 3]],
    [1, [2, 4, 0]],
    [4, [1, 5, 7, 3]],
  ]) {
    const game = fixture();
    put(game, source, 'red', 3);
    put(game, 8, 'blue', 1);
    assert.deepEqual(neighbors(source, 3, 3), expected);
    const result = playMove(game, source);
    assert.equal(result.explosions, 1);
    assert.deepEqual(result.game.board[source], { owner: null, count: 0 });
    for (const target of expected)
      assert.deepEqual(result.game.board[target], { owner: 'red', count: 1 });
    assert.deepEqual(result.game.board[8], { owner: 'blue', count: 1 });
  }
  const two = createGame(2, 2);
  assert.equal(playMove(two, 0).explosions, 0, 'a corner with two bubbles must not explode');
});

test('captures ALL enemy bubbles before adding one and does not affect diagonals', () => {
  const game = fixture();
  put(game, 0, 'red', 3);
  put(game, 1, 'blue', 2);
  put(game, 4, 'blue', 2);
  const result = playMove(game, 0);
  assert.deepEqual(result.game.board[1], { owner: 'red', count: 3 });
  assert.deepEqual(result.game.board[4], { owner: 'blue', count: 2 });
  assert.equal(result.game.winner, null);
});

test('newly captured cells trigger more explosions in the same move', () => {
  const game = fixture();
  put(game, 0, 'red', 3);
  put(game, 1, 'blue', 3);
  put(game, 8, 'blue', 1);
  const result = playMove(game, 0);
  assert.equal(result.explosions, 2);
  assert.equal(result.game.moves, 1);
  assert.equal(result.game.turn, 'blue');
  for (const index of [0, 2, 3, 4])
    assert.deepEqual(result.game.board[index], { owner: 'red', count: 1 });
  assert.deepEqual(result.game.board[1], { owner: null, count: 0 });
});

test('a queued cell that receives extra bubbles removes ALL bubbles when it bursts', () => {
  const game = fixture(4, 4);
  // Center-left starts two neighboring branches; both feed cell 6 before it bursts.
  for (const index of [5, 1, 6, 2]) put(game, index, 'red', 3);
  put(game, 15, 'blue', 1);
  const result = playMove(game, 5);
  assert.ok(result.frames.some((frame) => frame.board[2].count >= 5));
  const explosion = result.frames.find((frame) => frame.burst.includes(2));
  assert.ok(explosion);
  assert.deepEqual(explosion.board[2], { owner: null, count: 0 });
});

test('victory is awarded after the chain settles and finished games reject moves', () => {
  const game = fixture();
  put(game, 0, 'red', 3);
  put(game, 1, 'blue', 3);
  const result = playMove(game, 0);
  assert.equal(
    result.explosions,
    2,
    'finish resolving the captured cell even after the last opponent disappears',
  );
  assert.equal(result.game.winner, 'red');
  assert.equal(result.game.turn, 'red');
  assert.ok(result.game.board.every((cell) => cell.count <= 3));
  assert.throws(() => playMove(result.game, 0), /本局已结束/);
});

test('blue propagates and wins under exactly the same rules', () => {
  const game = fixture();
  game.turn = 'blue';
  put(game, 8, 'blue', 3);
  put(game, 7, 'red', 2);
  const result = playMove(game, 8);
  assert.deepEqual(result.game.board[7], { owner: 'blue', count: 3 });
  assert.equal(result.game.winner, 'blue');
});

test('a deterministic full game remains stable, alternates turns, and eventually has a winner', () => {
  let game = createGame();
  let seed = 12345;
  for (let step = 0; step < 3000 && !game.winner; step++) {
    const legal = game.board.flatMap((cell, index) => (cell.owner === game.turn ? [index] : []));
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const result = playMove(game, legal[seed % legal.length]);
    assert.equal(result.game.moves, game.moves + 1);
    if (!result.game.winner) assert.notEqual(result.game.turn, game.turn);
    for (const cell of result.game.board) {
      assert.ok(Number.isInteger(cell.count) && cell.count >= 0 && cell.count <= 3);
      assert.equal(cell.owner === null, cell.count === 0);
    }
    game = result.game;
  }
  assert.ok(game.winner, 'the full game must reach a winning position');
  assert.equal(countBubbles(game.board)[game.winner === 'red' ? 'blue' : 'red'], 0);
});
