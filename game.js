export const WORDS = [
  ['桜', 'sakura'], ['猫', 'neko'], ['青空', 'aozora'], ['ありがとう', 'arigatou'],
  ['図書館', 'toshokan'], ['ひまわり', 'himawari'], ['電車', 'densha'],
  ['音楽', 'ongaku'], ['自転車', 'jitensha'], ['星空', 'hoshizora'],
  ['おはよう', 'ohayou'], ['山', 'yama'], ['海', 'umi'], ['友達', 'tomodachi'],
  ['たんぽぽ', 'tanpopo'], ['冒険', 'bouken'], ['未来', 'mirai'], ['笑顔', 'egao']
];

export const LEVELS = [
  { name: '1 やさしい', description: '短いことばで基礎を確認', words: WORDS.filter(([, text]) => text.length <= 4) },
  { name: '2 ふつう', description: '身近なことばに挑戦', words: WORDS.filter(([, text]) => text.length >= 5 && text.length <= 6) },
  { name: '3 むずかしい', description: '長めのことばを正確に', words: WORDS.filter(([, text]) => text.length >= 7) },
  { name: '4 上級', description: '短いフレーズを続けて入力', words: [
    ['朝の散歩', 'asanosanpo'], ['音楽を聴く', 'ongakuwokiku'], ['本を読む時間', 'honwoyomujikan'],
    ['新しい友達', 'atarashiitomodachi'], ['青い空を見上げる', 'aoisorawomiageru']
  ] },
  { name: '5 達人', description: '長い文章で集中力を試す', words: [
    ['毎日の練習が自信につながる', 'mainichinorenshuugajishinnitsunagaru'],
    ['図書館で新しい物語に出会う', 'toshokandeatarashiimonogatarinideau'],
    ['自転車に乗って海まで出かけよう', 'jitenshaninotteumimadedekakeyou'],
    ['失敗してもあきらめずに挑戦する', 'shippaishitemoakiramezunichousensuru'],
    ['星空を見上げて明日の夢を語る', 'hoshizorawomiageteashitanoyumewokataru']
  ] }
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
  start(now, { mode = 'exam', level = 1 } = {}) {
    if (!['practice', 'exam'].includes(mode) || !Number.isInteger(level) || level < 1 || level > 5) throw new RangeError('Invalid mode or level');
    this.mode = mode;
    this.level = level;
    this.words = mode === 'practice' ? WORDS : LEVELS[level - 1].words;
    this.reset();
    this.state = 'running';
    this.deadline = now + this.duration * 1000;
    this.nextWord();
  }
  nextWord() {
    // Choose another word without retry loops, even with deterministic randomness.
    const count = this.wordIndex < 0 ? this.words.length : this.words.length - 1;
    let index = Math.floor(this.random() * count);
    if (this.wordIndex >= 0 && index >= this.wordIndex) index++;
    this.wordIndex = index;
    this.position = 0;
  }
  get word() { return this.words?.[this.wordIndex]; }
  remaining(now) {
    if (this.mode === 'practice') return Infinity;
    if (this.state === 'idle') return this.duration;
    return Math.max(0, (this.deadline - now) / 1000);
  }
  tick(now) {
    if (this.state === 'running' && this.mode !== 'practice' && now >= this.deadline) this.state = 'finished';
    return this.state;
  }
  stop() {
    if (this.state === 'running') this.state = 'finished';
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
