import { Game, LEVELS, QUESTION_BANKS } from './game.js';
const game = new Game();
const $ = id => document.getElementById(id);
let timer;
let best = 0;
function bestKey() { return `typing-best-v2-${$('mode').value}-${$('level').value}`; }
function loadBest() {
  best = 0;
  try {
    const saved = Number(localStorage.getItem(bestKey()));
    best = Number.isFinite(saved) ? Math.max(0, saved) : 0;
  } catch { /* Storage may be disabled. */ }
  $('best').textContent = best;
}
function settingsChanged() {
  const practice = $('mode').value === 'practice';
  game.reset();
  $('level-field').hidden = false;
  const level = LEVELS[Number($('level').value) - 1];
  const words = QUESTION_BANKS[$('mode').value][Number($('level').value) - 1];
  const lengths = words.map(([, text]) => text.length);
  $('mode-description').textContent = `${level.description} · ${Math.min(...lengths)}〜${Math.max(...lengths)}文字（英字） · 全${words.length}問。${practice ? '時間無制限' : '制限時間60秒'}。同じ問題は出ず、全問クリアで終了します。`;
  $('time').textContent = practice ? '∞' : '60';
  $('time-unit').textContent = practice ? '' : ' 秒';
  $('progress').style.width = '100%';
  $('score').textContent = '0';
  $('accuracy').textContent = '100';
  $('word').textContent = 'こつこつ、いこう。';
  $('roman').textContent = 'READY?';
  $('result').hidden = true;
  $('start').textContent = practice ? '練習をはじめる →' : '本番をはじめる →';
  $('status').textContent = '準備ができたら、はじめましょう';
  $('best-label').textContent = `${practice ? '練習' : '本番'} レベル${$('level').value}のベスト`;
  loadBest();
}
$('mode').addEventListener('change', settingsChanged);
$('level').addEventListener('change', settingsChanged);
settingsChanged();
function render() {
  const remaining = game.remaining(performance.now());
  $('time').textContent = game.mode === 'practice' ? '∞' : Math.ceil(remaining);
  $('progress').style.width = game.mode === 'practice' ? '100%' : `${remaining / game.duration * 100}%`;
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
  $('start').textContent = game.mode === 'practice' ? 'もう一度練習する →' : 'もう一度本番に挑戦 →';
  $('mode').disabled = false;
  $('level').disabled = false;
  $('stop').hidden = true;
  $('reset').hidden = true;
  $('status').textContent = game.completed === game.words.length ? '全問クリア！ おつかれさまでした！' : 'おつかれさまでした！';
  $('result').hidden = false;
  $('result').textContent = `${`${game.mode === 'practice' ? '練習' : '本番'} レベル${game.level}`} · ${game.score} 点 · ${game.completed} 語クリア · 正確率 ${game.accuracy}% · ミス ${game.misses} 回`;
  best = Math.max(best, game.score);
  $('best').textContent = best;
  try { localStorage.setItem(bestKey(), String(best)); } catch { /* Practice works without storage. */ }
  render();
}
function start() {
  clearInterval(timer);
  game.start(performance.now(), { mode: $('mode').value, level: Number($('level').value) });
  $('mode').disabled = true;
  $('level').disabled = true;
  $('stop').hidden = game.mode !== 'practice';
  $('start').hidden = true;
  $('reset').hidden = false;
  $('result').hidden = true;
  $('status').textContent = `${game.mode === 'practice' ? '練習' : '本番'} レベル${game.level} · 全${game.words.length}問`;
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
$('stop').addEventListener('click', () => { game.stop(); finish(); });
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
