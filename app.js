import { Game } from './game.js';
const game = new Game();
const $ = id => document.getElementById(id);
let timer;
let best = 0;
try {
  const saved = Number(localStorage.getItem('typing-best'));
  best = Number.isFinite(saved) ? Math.max(0, saved) : 0;
} catch { /* Storage may be disabled. */ }
$('best').textContent = best;
function render() {
  const remaining = game.remaining(performance.now());
  $('time').textContent = Math.ceil(remaining);
  $('progress').style.width = `${remaining / game.duration * 100}%`;
  $('score').textContent = game.score;
  $('accuracy').textContent = game.accuracy;
  if (game.word) {
    $('word').textContent = game.word[0];
    $('roman').replaceChildren(...[...game.word[1]].map((letter, index) => {
      const span = document.createElement('span');
      span.textContent = letter;
      span.className = index < game.position ? 'done' : index === game.position ? 'current' : 'pending';
      return span;
    }));
  }
}
function finish() {
  clearInterval(timer);
  $('typing').disabled = true;
  $('typing').value = '';
  $('start').hidden = false;
  $('start').textContent = 'もう一度練習する →';
  $('reset').hidden = true;
  $('status').textContent = 'おつかれさまでした！';
  $('result').hidden = false;
  $('result').textContent = `${game.score} 点 · ${game.completed} 語クリア · 正確率 ${game.accuracy}% · ミス ${game.misses} 回`;
  best = Math.max(best, game.score);
  $('best').textContent = best;
  try { localStorage.setItem('typing-best', String(best)); } catch { /* Practice works without storage. */ }
  render();
}
function start() {
  clearInterval(timer);
  game.start(performance.now());
  $('start').hidden = true;
  $('reset').hidden = false;
  $('result').hidden = true;
  $('status').textContent = '表示されたローマ字を入力してください';
  $('hint').textContent = '日本語入力（IME）をオフにしてください';
  $('typing').classList.remove('miss');
  $('typing').disabled = false;
  $('typing').value = '';
  render();
  $('typing').focus();
  timer = setInterval(() => {
    game.tick(performance.now());
    if (game.state === 'finished') finish();
    else render();
  }, 100);
}
$('start').addEventListener('click', start);
$('reset').addEventListener('click', start);
function accept(text) {
  let missed = false;
  for (const character of text) {
    if (game.type(character, performance.now()) === false) missed = true;
  }
  $('typing').classList.toggle('miss', missed);
  $('hint').textContent = missed ? 'もう一度、下線の文字を打ってみましょう' : 'その調子！ 一文字ずつ続けましょう';
  if (game.state === 'finished') finish();
  else render();
}
$('typing').addEventListener('input', event => {
  if (event.isComposing) return;
  const value = $('typing').value;
  $('typing').value = '';
  accept(value);
  if (/[^a-z]/i.test(value)) $('hint').textContent = '半角英字で入力してください（IMEをオフ）';
});
$('typing').addEventListener('compositionend', () => {
  $('typing').value = '';
  $('hint').textContent = '日本語入力（IME）をオフにして、半角英字で入力してください';
});
$('typing').addEventListener('paste', event => event.preventDefault());
