import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createCaptureGame,
  legalDestinations,
  hasLegalMove,
  countPieces,
  movePiece,
} from '../src/lib/three-capture.mjs';

const fixture = () => ({ ...createCaptureGame(), board: Array(16).fill(null) });
const rotate = (index) => (index % 4) * 4 + 3 - Math.floor(index / 4);

test('starts with six pieces per side around four empty center squares', () => {
  const game = createCaptureGame();
  assert.deepEqual(countPieces(game.board), { red: 6, blue: 6 });
  for (const index of [5, 6, 9, 10]) assert.equal(game.board[index], null);
  for (const index of [0, 1, 2, 3, 4, 7]) assert.equal(game.board[index], 'red');
  for (const index of [8, 11, 12, 13, 14, 15]) assert.equal(game.board[index], 'blue');
  assert.equal(game.turn, 'red');
  assert.equal(game.winner, null);
});

test('moves only one own piece one orthogonal step into an empty cell, without mutation', () => {
  const game = createCaptureGame();
  const before = structuredClone(game);
  assert.deepEqual(legalDestinations(game, 4), [5]);
  assert.deepEqual(legalDestinations(game, 0), []);
  const result = movePiece(game, 4, 5);
  assert.deepEqual(game, before);
  assert.equal(result.game.board[4], null);
  assert.equal(result.game.board[5], 'red');
  assert.equal(result.game.turn, 'blue');
  assert.equal(result.game.moves, 1);
  assert.deepEqual(result.captured, []);
  assert.deepEqual(countPieces(result.game.board), { red: 6, blue: 6 });
});

test('rejects enemy, diagonal, occupied, distant, row-wrapping and out-of-board moves', () => {
  const game = createCaptureGame();
  const before = structuredClone(game);
  for (const [from, to] of [
    [8, 9],
    [0, 5],
    [1, 2],
    [4, 10],
    [3, 4],
    [4, 16],
    [-1, 5],
    [1.5, 5],
    [4, NaN],
  ])
    assert.throws(() => movePiece(game, from, to));
  assert.deepEqual(game, before);
});

test('captures an endpoint in all four directions, including a triplet offset from the edge', () => {
  let source = 9;
  let target = 5;
  let positions = [4, 6, 15];
  for (let orientation = 0; orientation < 4; orientation++) {
    const game = fixture();
    game.board[source] = 'red';
    game.board[positions[0]] = 'red';
    game.board[positions[1]] = 'blue';
    game.board[positions[2]] = 'blue';
    const result = movePiece(game, source, target);
    assert.deepEqual(result.captured, [positions[1]]);
    assert.equal(result.game.board[positions[1]], null);
    assert.equal(result.game.board[positions[2]], 'blue');
    source = rotate(source);
    target = rotate(target);
    positions = positions.map(rotate);
  }
  const offset = fixture();
  offset.board[1] = offset.board[6] = 'red';
  offset.board[7] = offset.board[15] = 'blue';
  assert.deepEqual(movePiece(offset, 1, 5).captured, [7]);
});

test('does not capture an enemy in the middle, a gapped triplet, or a full four-piece line', () => {
  const patterns = [
    ['red', 'blue', null, null], // after entering 6: A B A .
    ['red', null, null, 'blue'], // after entering 6: A . A B
    ['red', 'red', null, 'blue'], // after entering 6: A A A B
    ['blue', 'blue', null, null], // after entering 6: B B A .
    ['red', 'red', null, null], // after entering 6: A A A .
  ];
  for (const pattern of patterns) {
    const game = fixture();
    game.board.splice(4, 4, ...pattern);
    game.board[10] = 'red';
    game.board[15] = 'blue';
    assert.deepEqual(movePiece(game, 10, 6).captured, []);
  }
});

test('can simultaneously capture one endpoint on the destination row and one on its column', () => {
  const game = fixture();
  for (const index of [4, 6, 1]) game.board[index] = 'red';
  for (const index of [7, 9, 15]) game.board[index] = 'blue';
  const result = movePiece(game, 4, 5);
  assert.deepEqual(result.captured, [7, 9]);
  assert.deepEqual(countPieces(result.game.board), { red: 3, blue: 1 });
  assert.equal(result.game.moves, 1);
  assert.equal(result.game.turn, 'blue');
});

test('checks only the destination axes and does not cascade captures elsewhere', () => {
  const game = fixture();
  for (const index of [5, 2, 7, 11]) game.board[index] = 'red';
  for (const index of [3, 15]) game.board[index] = 'blue';
  const result = movePiece(game, 5, 1);
  assert.deepEqual(result.captured, [3]);
  assert.equal(
    result.game.board[15],
    'blue',
    'the new triplet on column 4 is not on the destination column',
  );
});

test('blue captures under the same rules as red', () => {
  const game = fixture();
  game.turn = 'blue';
  game.board[4] = game.board[9] = 'blue';
  game.board[6] = game.board[15] = 'red';
  const result = movePiece(game, 9, 5);
  assert.deepEqual(result.captured, [6]);
  assert.equal(result.game.turn, 'red');
});

test('capturing the last enemy piece wins and locks the finished game', () => {
  const game = fixture();
  game.board[4] = game.board[9] = 'red';
  game.board[6] = 'blue';
  const result = movePiece(game, 9, 5);
  assert.equal(result.game.winner, 'red');
  assert.equal(result.game.reason, 'eliminated');
  assert.throws(() => movePiece(result.game, 5, 9), /本局已结束/);
  assert.deepEqual(legalDestinations(result.game, 5), []);
});

test('a player with pieces but no legal move loses, as requested', () => {
  const game = fixture();
  game.board[0] = 'blue';
  for (const index of [1, 4, 8]) game.board[index] = 'red';
  assert.equal(hasLegalMove(game.board, 'blue'), false);
  const result = movePiece(game, 8, 9);
  assert.equal(result.game.winner, 'red');
  assert.equal(result.game.reason, 'blocked');
  assert.equal(result.game.board[0], 'blue');

  game.board[4] = null;
  assert.equal(hasLegalMove(game.board, 'blue'), true);
  assert.equal(movePiece(game, 8, 9).game.winner, null);
});
