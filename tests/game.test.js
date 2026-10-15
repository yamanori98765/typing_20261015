import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, LEVELS, QUESTION_BANKS } from '../game.js';
test('correct letters complete a word and mistakes do not advance', () => {
  const game = new Game({ random: () => 0 });
  assert.equal(game.type('n', 0), null);
  game.start(0, { mode: 'practice', level: 1 });
  assert.equal(game.type('x', 1), false);
  assert.equal(game.position, 0);
  assert.equal(game.score, 0);
  assert.equal(game.type('N', 1), true);
  assert.equal(game.accuracy, 50);
  assert.equal(game.type('Shift', 1), null);
  for (const char of 'EKO') assert.equal(game.type(char, 1), true);
  assert.equal(game.completed, 1);
  assert.equal(game.correct, 4);
  assert.equal(game.score, 35);
  assert.equal(game.word[1], 'inu');
});
test('deadline rejects input before the next timer callback; restart resets', () => {
  const game = new Game({ random: () => 0 });
  game.start(0, { mode: 'exam', level: 1 });
  assert.equal(game.type(game.word[1][0], 59999), true);
  assert.equal(game.type(game.word[1][1], 60000), null);
  assert.equal(game.state, 'finished');
  assert.equal(game.correct, 1);
  assert.equal(game.remaining(70000), 0);
  game.start(70000);
  assert.equal(game.correct, 0);
  assert.equal(game.misses, 0);
  assert.equal(game.completed, 0);
  assert.equal(game.remaining(70000), 60);
});
test('practice has no deadline and can be stopped manually', () => {
  const game = new Game({ random: () => 0 });
  game.start(0, { mode: 'practice' });
  assert.equal(game.tick(600000), 'running');
  assert.equal(game.remaining(600000), Infinity);
  assert.equal(game.type('n', 600000), true);
  game.stop();
  assert.equal(game.type('e', 600001), null);
});
test('ten distinct banks respect letter lengths and contain no repeated prompts', () => {
  const allJapanese = new Set();
  const allRoman = new Set();
  for (const pools of Object.values(QUESTION_BANKS)) {
    for (const [i, words] of pools.entries()) {
      assert.ok(words.length >= 40);
      for (const [japanese, roman] of words) {
        assert.match(roman, /^[a-z]+$/);
        assert.ok(roman.length >= LEVELS[i].min && roman.length <= LEVELS[i].max, `${japanese}: ${roman.length}`);
        assert.ok(!allJapanese.has(japanese), japanese);
        assert.ok(!allRoman.has(roman), roman);
        allJapanese.add(japanese);
        allRoman.add(roman);
      }
    }
  }
});
test('no question repeats within a session in any mode or level, including restarts', () => {
  for (const mode of ['practice', 'exam']) for (let level = 1; level <= 5; level++) {
    for (const random of [() => 0, () => 0.99999, Math.random]) {
      const game = new Game({ random });
      for (let run = 0; run < 2; run++) {
        game.start(0, { mode, level });
        const seen = new Set();
        while (game.state === 'running') {
          const roman = game.word[1];
          assert.ok(!seen.has(roman));
          seen.add(roman);
          for (const char of roman) assert.equal(game.type(char, 1), true);
        }
        assert.equal(seen.size, game.words.length);
        assert.equal(game.completed, game.words.length);
        assert.equal(game.type('a', 2), null);
      }
    }
  }
});
test('every exam level expires after 60 seconds; unsupported settings rejected', () => {
  for (let level = 1; level <= 5; level++) {
    const game = new Game();
    game.start(0, { mode: 'exam', level });
    assert.equal(game.tick(60000), 'finished');
  }
  assert.throws(() => new Game().start(0, { level: 6 }), RangeError);
  assert.throws(() => new Game().start(0, { mode: 'other' }), RangeError);
});

test('history survives new games and prefers unseen questions until the bank is exhausted', () => {
  for (const mode of ['practice', 'exam']) for (let level = 1; level <= 5; level++) {
    let persisted = {};
    const seen = new Set();
    const count = QUESTION_BANKS[mode][level - 1].length;
    let previous;
    for (let run = 0; run <= count; run++) {
      const game = new Game({ random: () => 0, history: JSON.parse(JSON.stringify(persisted)), onHistoryChange: value => { persisted = value; } });
      game.start(0, { mode, level });
      const roman = game.word[1];
      if (run < count) assert.ok(!seen.has(roman), `${mode}-${level}: ${roman}`);
      assert.notEqual(roman, previous);
      seen.add(roman);
      previous = roman;
    }
    assert.equal(seen.size, count);
  }
});
test('invalid saved history entries are ignored; mode and level histories stay separate', () => {
  const history = { 'practice-1': ['removed-question', 123], 'exam-1': 'corrupt' };
  const game = new Game({ random: () => 0, history });
  game.start(0, { mode: 'practice', level: 1 });
  const first = game.word[1];
  game.start(0, { mode: 'exam', level: 1 });
  assert.equal(history['practice-1'][0], first);
  assert.equal(history['exam-1'].length, 1);
  game.start(0, { mode: 'practice', level: 1 });
  assert.notEqual(game.word[1], first);
});
