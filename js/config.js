/* 背面調查局｜設定檔：題目、四極、類型、文案。改文案只需改這個檔。 */
(function (root) {
  var CONFIG = {
    idleResetSec: 120,       // 閒置幾秒後回到待機並清空
    autoAnalyzeSec: 0,       // 10 題完成後自動分析秒數；0 = 需按 Enter
    keys: { analyze: 'Enter', reset: '0' }, // 重新開始：數字鍵 0（或 Esc）

    scale: ['完全不認同', '不太認同', '不確定', '大致認同', '完全認同'],

    // 四極順序即雷達圖順序：上、右、下、左
    poles: [
      { id: 'object', zh: '物件', en: 'OBJECT' },
      { id: 'space',  zh: '空間', en: 'SPACE' },
      { id: 'event',  zh: '事件', en: 'EVENT' },
      { id: 'person', zh: '人物', en: 'PERSON' }
    ],

    questions: [
      { id: 'Q01', pole: 'person', text: '起床時煮了一壺咖啡' },
      { id: 'Q02', pole: 'object', text: '早餐吃了自己做的煎蛋土司並削了一顆蘋果' },
      { id: 'Q03', pole: 'space',  text: '上班時打掃了辦公桌' },
      { id: 'Q04', pole: 'event',  text: '在工作校對文稿時發現多處錯誤' },
      { id: 'Q05', pole: 'object', text: '中午用完餐換了新的衛生紙捲' },
      { id: 'Q06', pole: 'object', text: '收到之前購買的語言檢定書籍' },
      { id: 'Q07', pole: 'space',  text: '晚餐在家裡吃了火鍋' },
      { id: 'Q08', pole: 'space',  text: '洗完澡後在沙發上追劇放鬆' },
      { id: 'Q09', pole: 'person', text: '和同事一起外出購買午餐' },
      { id: 'Q10', pole: 'event',  text: '晚飯後身體不適吃了止痛藥' }
    ],

    // 相鄰兩極組合 → 類型（key 為極順序中相鄰的兩個 id，以 "主+副" 不分順序）
    types: {
      'object+space': {
        name: '現場勘查員', en: 'SCENE SURVEYOR',
        body: '你相信東西與場所不會說謊。看到蛋殼、紙捲，會想到它出現在哪個房間、哪張桌子；看到辦公桌，也會留意桌上留下什麼。你的視角踏實、重視現場，但也容易把「東西在這裡」當成全部，忽略人當時在想什麼。',
        back: '現場記錄了位置，不記錄原因。'
      },
      'space+event': {
        name: '情境調查員', en: 'CONTEXT INVESTIGATOR',
        body: '你習慣把一件事放回發生的地方來理解。火鍋之所以是火鍋，因為在家；錯誤之所以被發現，因為在校稿的辦公桌前。你的視角有畫面、有脈絡，但也可能被「應該是這樣的場景」帶著走，把常見的劇本當成事實。',
        back: '同一個場所，可以同時發生很多件不同的事。'
      },
      'event+person': {
        name: '事件調查員', en: 'INCIDENT INVESTIGATOR',
        body: '你關注的是誰在什麼時候遇到了什麼。一顆止痛藥、一個校對錯誤，在你眼中都是某個人生活裡的轉折。你的視角有故事感，也容易代入當事人，但可能對沒有留下痕跡的部分補上自己的想像。',
        back: '事件被記下來的，往往只是它被看見的那一面。'
      },
      'person+object': {
        name: '人物側寫員', en: 'PROFILER',
        body: '你相信東西反映使用者。一杯咖啡、一本語言書，你會讀出主人的習慣與生活樣貌，並從中拼出一個人。你的視角細膩，擅長從小物件看人，但也可能因此過早為一個人下定義。',
        back: '物件能說明一個人用了什麼，不能說明他是誰。'
      }
    },
    specials: {
      trusting:  { name: '全信者', en: 'THE BELIEVER',
        body: '你對每一項推測都表示認同。這份信任很珍貴，不過調查員的第一守則是：每一項證據都有它沒說出口的部分。',
        back: '每一項證據都有它沒說出口的部分。' },
      reserved:  { name: '保留者', en: 'THE RESERVIST',
        body: '你對所有推測都保持距離。這是優秀調查員的特質，只是別忘了，保留之後仍要選一個方向前進。',
        back: '保留之後，仍要選一個方向。' },
      balanced:  { name: '均衡者', en: 'THE ALL-ROUNDER',
        body: '物件、空間、事件、人物你都用得差不多。你沒有特別偏愛的視角，這讓你能站在不同位置看同一件事。',
        back: '沒有偏愛的視角，也是一種視角。' }
    },
    closing: '你剛剛評分的，並不是垃圾桶，而是你看待別人日常的方式。這份結果只代表此刻的你，不是結論。',

    // 場景系統：10 張場景。圖片放 assets/scenes/scn_01.jpg … scn_10.jpg，缺圖顯示佔位圖。
    scenes: [1,2,3,4,5,6,7,8,9,10].map(function (n) {
      var id = 'SCN_' + (n < 10 ? '0' : '') + n;
      return { id: id, src: 'assets/scenes/' + id.toLowerCase() + '.jpg', meta: 'UNKNOWN LOCATION' };
    }),

    // 語音與 AI（見 README「語音與 AI」）
    speech: { lang: 'zh-TW', maxSec: 60 },
    ai: {
      endpoint: '', // 空白 = 離線模式（僅做簡單斷句）。填入你的後端網址後，會以 POST {scene, transcript} 呼叫，回傳 {guess, location, story, summary}
      timeoutMs: 15000
    },
    // 沒有其他觀眾紀錄時，用這裡的範例描述（⚠️ 範例，請替換成真實內容）
    seedDescriptions: {
      SCN_01: { summary: '我覺得這是深夜末班車前的月台，一個人在等車，廣播剛剛停了，整個空間很安靜，大概在某個郊區的轉運站。' }
    },
    seedFallback: '（尚無其他觀眾針對這張照片的描述。這裡將顯示另一位觀眾的版本。）',

    // 列印（點陣印表機，黑白）。⚠️ 紙張尺寸待確認：中一刀暫設 241 × 140 mm
    print: { widthMm: 241, heightMm: 140, key: 'p' }
  };
  root.B2BB = root.B2BB || {};
  root.B2BB.CONFIG = CONFIG;
  if (typeof module !== 'undefined') module.exports = CONFIG;
})(typeof window !== 'undefined' ? window : globalThis);
