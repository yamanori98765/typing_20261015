// Separate question banks for each mode and level; lengths count roman letters.
const bank = rows => rows.map(row => row.split('|'));
export const LEVELS = [
  { name: '1 やさしい', min: 2, max: 5, description: '短いことば' },
  { name: '2 ふつう', min: 5, max: 6, description: '身近なことば' },
  { name: '3 むずかしい', min: 7, max: 9, description: '長めのことば' },
  { name: '4 上級', min: 10, max: 16, description: '短いフレーズ' },
  { name: '5 達人', min: 17, max: 40, description: '長い文章' }
];
export const QUESTION_BANKS = {
  practice: [
    bank(['猫|neko', '犬|inu', '海|umi', '山|yama', '空|sora', '雨|ame', '花|hana', '春|haru']),
    bank(['桜|sakura', '机|tsukue', '車|kuruma', '光|hikari', '緑|midori', '心|kokoro', '卵|tamago', '遊ぶ|asobu']),
    bank(['ひまわり|himawari', '図書館|toshokan', '自転車|jitensha', '友達|tomodachi', 'ありがとう|arigatou', '星空|hoshizora', 'たんぽぽ|tanpopo', '消しゴム|keshigomu']),
    bank(['朝の散歩|asanosanpo', '音楽を聴く|ongakuwokiku', '本を読む時間|honwoyomujikan', '青い空を見る|aoisorawomiru', '公園で遊ぶ|kouendeasobu', '花に水をやる|hananimizuwoyaru', '海まで歩く|umimadearuku', '夕日を眺める|yuuhiwonagameru']),
    bank(['毎日少しずつ練習しよう|mainichisukoshizutsurenshuushiyou', 'お気に入りの本を読む|okiniirinohonwoyomu', '明日はきっと晴れるだろう|ashitahakittoharerudarou', '家族と一緒にご飯を食べる|kazokutoisshonigohanwotaberu', '新しい靴で散歩に出かける|atarashiikutsudesanponidekakeru', '窓を開けて風を感じる|madowoaketekazewokanjiru', 'ゆっくり深呼吸をしてみよう|yukkurishinkokyuuwoshitemiyou', '小さな目標を一つ決める|chiisanamokuhyouwohitotsukimeru'])
  ],
  exam: [
    bank(['月|tsuki', '雪|yuki', '秋|aki', '夏|natsu', '川|kawa', '森|mori', '鳥|tori', '星|hoshi']),
    bank(['時計|tokei', '笑う|warau', '未来|mirai', '世界|sekai', '言葉|kotoba', '砂糖|satou', '天気|tenki', '朝日|asahi']),
    bank(['冒険者|boukensha', '鉛筆|enpitsu', '教科書|kyoukasho', '約束|yakusoku', '旅行者|ryokousha', 'お手紙|otegami', '思い出す|omoidasu', '料理人|ryourinin']),
    bank(['新しい道|atarashiimichi', '青空を見上げる|aozorawomiageru', '電車に乗る|denshaninoru', '手紙を書く|tegamiwokaku', '旅の計画|tabinokeikaku', '夢への一歩|yumenoippo', '季節の変化|kisetsunohenka', '笑顔で挨拶|egaodeaisatsu']),
    bank(['図書館で新しい物語に出会う|toshokandeatarashiimonogatarinideau', '自転車に乗って海まで出かけよう|jitenshaninotteumimadedekakeyou', '失敗してもあきらめずに挑戦する|shippaishitemoakiramezunichousensuru', '星空を見上げて明日の夢を語る|hoshizorawomiageteashitanoyumewokataru', '毎日の練習が自信につながる|mainichinorenshuugajishinnitsunagaru', '知らない世界への扉を開こう|shiranaisekaihenotobirawohirakou', '遠くの山に朝の光が差し込む|tookunoyamaniasanohikarigasashikomu', '最後まで集中してやり遂げよう|saigomadeshuuchuushiteyaritogeyou'])
  ]
};
// Each level uses an explicit length range in both modes.
// Keep banks separate; update the ranges if adding vocabulary outside them.
export const WORDS = QUESTION_BANKS.practice.flat();

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
    this.remainingIndices = [];
  }
  start(now, { mode = 'exam', level = 1 } = {}) {
    if (!['practice', 'exam'].includes(mode) || !Number.isInteger(level) || level < 1 || level > 5) throw new RangeError('Invalid mode or level');
    this.mode = mode;
    this.level = level;
    this.words = QUESTION_BANKS[mode][level - 1];
    this.reset();
    this.state = 'running';
    this.deadline = now + this.duration * 1000;
    this.nextWord();
  }
  nextWord() {
    if (this.remainingIndices.length === 0) {
      if (this.wordIndex >= 0) {
        this.state = 'finished';
        return;
      }
      this.remainingIndices = this.words.map((_, index) => index);
    }
    const position = Math.floor(this.random() * this.remainingIndices.length);
    this.wordIndex = this.remainingIndices.splice(position, 1)[0];
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
