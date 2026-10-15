export const WORDS = [
  ['桜', 'sakura'], ['猫', 'neko'], ['青空', 'aozora'], ['ありがとう', 'arigatou'],
  ['図書館', 'toshokan'], ['ひまわり', 'himawari'], ['電車', 'densha'],
  ['音楽', 'ongaku'], ['自転車', 'jitensha'], ['星空', 'hoshizora'],
  ['おはよう', 'ohayou'], ['山', 'yama'], ['海', 'umi'], ['友達', 'tomodachi'],
  ['たんぽぽ', 'tanpopo'], ['冒険', 'bouken'], ['未来', 'mirai'], ['笑顔', 'egao']
];

export class Game {
  constructor({ duration = 60, random = Math.random } = {}) {
    this.duration = duration;
    this.random = random;
    this.reset();
  }
  reset() {
    this.state = 'idle';
    this.correct = 0;
    this.misses = 0;
    this.completed = 0;
    this.position = 0;
    this.wordIndex = -1;
    this.deadline = 0;
  }
  start(now) {
    this.reset();
    this.state = 'running';
    this.deadline = now + this.duration * 1000;
    this.nextWord();
  }
  nextWord() {
    // Choose another word without retry loops, even with deterministic randomness.
    const count = this.wordIndex < 0 ? WORDS.length : WORDS.length - 1;
    let index = Math.floor(this.random() * count);
    if (this.wordIndex >= 0 && index >= this.wordIndex) index++;
    this.wordIndex = index;
    this.position = 0;
  }
  get word() { return WORDS[this.wordIndex]; }
  remaining(now) {
    if (this.state === 'idle') return this.duration;
    return Math.max(0, (this.deadline - now) / 1000);
  }
  tick(now) {
    if (this.state === 'running' && now >= this.deadline) this.state = 'finished';
    return this.state;
  }
  type(key, now) {
    this.tick(now);
    if (this.state !== 'running' || !/^[a-z]$/i.test(key)) return null;
    if (key.toLowerCase() !== this.word[1][this.position]) {
      this.misses++;
      return false;
    }
    this.correct++;
    this.position++;
    if (this.position === this.word[1].length) {
      this.completed++;
      this.nextWord();
    }
    return true;
  }
  get accuracy() {
    const total = this.correct + this.misses;
    return total ? Math.round(this.correct / total * 100) : 100;
  }
  get score() { return Math.max(0, this.correct * 10 - this.misses * 5); }
}
