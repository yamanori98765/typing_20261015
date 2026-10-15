import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, WORDS, LEVELS } from '../game.js';
test('start and correct input complete a word and advance', () => {
  const game = new Game({ random: () => 0 });
  assert.equal(game.type('s', 0), null);
  game.start(1000, { mode: 'practice' });
  for (const letter of 'SAKURA') assert.equal(game.type(letter, 1500), true);
  assert.equal(game.completed, 1);
  assert.equal(game.correct, 6);
  assert.equal(game.score, 60);
  assert.equal(game.word[1], 'neko');
});
test('mistakes do not advance and lower accuracy and score', () => {
  const game = new Game({ random: () => 0 });
  game.start(0, { level: 2 });
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
  game.start(0, { level: 2 });
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
  game.start(0, { level: 2 });
  for (let i = 0; i < 100; i++) {
    const previous = game.wordIndex;
    game.nextWord();
    assert.notEqual(game.wordIndex, previous);
    assert.ok(game.word);
  }
});

test('practice has no deadline and can be ended manually', () => {
  const game = new Game({ random: () => 0 });
  game.start(0, { mode: 'practice' });
  assert.equal(game.tick(600000), 'running');
  assert.equal(game.remaining(600000), Infinity);
  assert.equal(game.type('s', 600000), true);
  game.stop();
  assert.equal(game.type('a', 600001), null);
});
test('all five exam levels use their own pool and expire after 60 seconds', () => {
  for (let level = 1; level <= 5; level++) {
    const game = new Game({ random: () => 0 });
    game.start(0, { mode: 'exam', level });
    assert.ok(LEVELS[level - 1].words.includes(game.word));
    for (const char of game.word[1]) assert.equal(game.type(char, 1), true);
    assert.equal(game.completed, 1);
    assert.equal(game.tick(60000), 'finished');
  }
  const average = pool => pool.reduce((sum, [, text]) => sum + text.length, 0) / pool.length;
  for (let i = 1; i < LEVELS.length; i++) assert.ok(average(LEVELS[i].words) > average(LEVELS[i - 1].words));
  for (const level of LEVELS) for (const [, text] of level.words) assert.match(text, /^[a-z]+$/);
  assert.throws(() => new Game().start(0, { level: 6 }), RangeError);
});
