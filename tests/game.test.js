import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, WORDS } from '../game.js';
test('start and correct input complete a word and advance', () => {
  const game = new Game({ random: () => 0 });
  assert.equal(game.type('s', 0), null);
  game.start(1000);
  for (const letter of 'SAKURA') assert.equal(game.type(letter, 1500), true);
  assert.equal(game.completed, 1);
  assert.equal(game.correct, 6);
  assert.equal(game.score, 60);
  assert.equal(game.word[1], 'neko');
});
test('mistakes do not advance and lower accuracy and score', () => {
  const game = new Game({ random: () => 0 });
  game.start(0);
  assert.equal(game.type('x', 1), false);
  assert.equal(game.position, 0);
  assert.equal(game.score, 0);
  assert.equal(game.type('s', 2), true);
  assert.equal(game.score, 5);
  assert.equal(game.accuracy, 50);
  assert.equal(game.type('Shift', 3), null);
  assert.equal(game.misses, 1);
});
test('deadline rejects input even before timer callback; restart resets', () => {
  const game = new Game({ random: () => 0 });
  game.start(0);
  game.type('s', 59999);
  assert.equal(game.type('a', 60000), null);
  assert.equal(game.state, 'finished');
  assert.equal(game.correct, 1);
  assert.equal(game.remaining(70000), 0);
  game.start(70000);
  assert.equal(game.correct, 0);
  assert.equal(game.misses, 0);
  assert.equal(game.completed, 0);
  assert.equal(game.remaining(70000), 60);
});
test('all vocabulary is supported and successive words differ', () => {
  for (const [, roman] of WORDS) assert.match(roman, /^[a-z]+$/);
  const game = new Game();
  game.start(0);
  for (let i = 0; i < 100; i++) {
    const previous = game.wordIndex;
    game.nextWord();
    assert.notEqual(game.wordIndex, previous);
    assert.ok(game.word);
  }
});
