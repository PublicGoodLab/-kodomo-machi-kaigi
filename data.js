/**
 * data.js
 * ------------------------------------------------------------
 * 「こどもまち会議」のゲームデータをまとめたファイルです。
 *
 * ここには「ロジック」は書きません。書くのはデータだけです。
 * 将来、住民・政策・お願い・イベントを増やしたいときは、
 * このファイルの配列に項目を追加するだけで拡張できるように
 * しています（app.js 側のコードは変更不要な設計です）。
 *
 * 数値のバランスは初期案です。プレイテストをしながら
 * POLICIES の buildCost / maintCost / effects を調整してください。
 * ------------------------------------------------------------
 */

// ゲームのバージョン（設定画面などに表示）
const GAME_VERSION = "0.4.0";

// 町ステータスの一覧（キー・表示名・絵文字）
// stats オブジェクトはすべてこのキーを使います。
const STAT_META = {
  life:      { label: "くらし",   emoji: "🏠" },
  finance:   { label: "財政",     emoji: "💰" },
  education: { label: "教育",     emoji: "📚" },
  health:    { label: "健康",     emoji: "❤️" },
  safety:    { label: "安全",     emoji: "🛡️" },
  nature:    { label: "自然",     emoji: "🌳" },
  traffic:   { label: "交通",     emoji: "🚌" },
  vibrancy:  { label: "にぎわい", emoji: "🎉" },
};

// 町の初期設定
const TOWN_INITIAL = {
  name: "みどり町",
  population: 5000,
  startYear: 1,
  startBudget: 100,
  // 各ステータスの開始値（0〜100）。中間の50からスタート。
  initialStats: {
    life: 50, finance: 50, education: 50, health: 50,
    safety: 50, nature: 50, traffic: 50, vibrancy: 50,
  },
};

// 住民（6人）
const RESIDENTS = [
  { id: "akari",  name: "あかり",   age: 9,  role: "小学生",     concern: "公園や学校のこと",   favorite: "公園",     emoji: "🎒" },
  { id: "yuki",   name: "ゆき",     age: 34, role: "子育て世帯", concern: "保育園や病院のこと", favorite: "図書館",   emoji: "🍼" },
  { id: "saburo", name: "さぶろう", age: 78, role: "高齢者",     concern: "病院やバスのこと",   favorite: "公民館",   emoji: "👴" },
  { id: "misaki", name: "みさき",   age: 45, role: "商店主",     concern: "商店街のこと",       favorite: "商店街",   emoji: "🏪" },
  { id: "kenji",  name: "けんじ",   age: 52, role: "農家",       concern: "川や畑のこと",       favorite: "田畑",     emoji: "🌾" },
  { id: "takumi", name: "たくみ",   age: 29, role: "会社員",     concern: "通勤やにぎわいのこと", favorite: "駅前",   emoji: "💼" },
];

/**
 * 政策カード（20枚）
 * ------------------------------------------------------------
 * goodEffects: 実行した年にすぐ反映される効果（値はプラスマイナス両方あり得る）
 * badEffectText: 「困ること」の説明文（数値化していない、雰囲気を伝えるための文章）
 * laterEvent: 数年後に自動で発生する「その後」の変化。null なら発生しない。
 * comments: 実行した年に表示される住民コメント（同じ政策でも住民ごとに反応が違う）
 * ------------------------------------------------------------
 */
const POLICIES = [
  {
    id: "park", name: "公園を作る", emoji: "🌳",
    description: "子どもたちが遊べる公園を新しく作ります。",
    buildCost: 15, maintCost: 2,
    goodEffects: { life: 8, nature: 3 },
    badEffectText: "遊具の音がうるさいと感じる人もいます。他の使い道（駐車場など）ができなくなります。",
    laterEvent: { yearsAfter: 5, name: "遊具が古くなる", effects: { safety: -3 },
      comment: { residentId: "yuki", text: "公園の遊具、すこし壊れかけてるみたい…" } },
    comments: [
      { residentId: "akari",  text: "わーい、遊べる場所ができた！" },
      { residentId: "saburo", text: "にぎやかになるのう…ちょっと心配じゃ" },
      { residentId: "misaki", text: "駐車場のほうが良かったかも" },
    ],
  },
  {
    id: "library", name: "図書館を建てる", emoji: "📚",
    description: "本を借りたり、静かに勉強したりできる図書館を建てます。",
    buildCost: 25, maintCost: 3,
    goodEffects: { education: 10, life: 2 },
    badEffectText: "大きなお金がかかるので、他の政策に使えるお金が減ります。",
    laterEvent: { yearsAfter: 5, name: "本棚が足りなくなる", effects: { education: -2 },
      comment: { residentId: "akari", text: "新しい本があんまり増えないね…" } },
    comments: [
      { residentId: "akari",  text: "本がいっぱいで嬉しい！" },
      { residentId: "takumi", text: "僕はあまり行かないかな" },
      { residentId: "kenji",  text: "畑が忙しくて行けんのう" },
    ],
  },
  {
    id: "school", name: "学校を改修する", emoji: "🏫",
    description: "古くなった教室や設備を新しくします。",
    buildCost: 20, maintCost: 2,
    goodEffects: { education: 8, safety: 3 },
    badEffectText: "工事中はうるさかったり、通学路が変わって不便になったりします。",
    laterEvent: { yearsAfter: 3, name: "エアコンが壊れる", effects: { health: -2, finance: -3 },
      comment: { residentId: "akari", text: "また教室が暑くなってきた…" } },
    comments: [
      { residentId: "akari",  text: "教室が涼しくなった！" },
      { residentId: "saburo", text: "わしには関係ないのう" },
    ],
  },
  {
    id: "road", name: "道路を直す", emoji: "🛣️",
    description: "ひび割れた道路をきれいに直します。",
    buildCost: 18, maintCost: 2,
    goodEffects: { traffic: 8, safety: 2, nature: -1 },
    badEffectText: "工事中は渋滞します。緑を少し削ることもあります。",
    laterEvent: { yearsAfter: 10, name: "また穴が空く", effects: { traffic: -3 },
      comment: { residentId: "kenji", text: "道がまたガタガタになってきたよ" } },
    comments: [
      { residentId: "kenji",  text: "野菜を運びやすくなった" },
      { residentId: "takumi", text: "通勤が楽になった" },
      { residentId: "saburo", text: "工事の音がうるさかったのう" },
    ],
  },
  {
    id: "hospital", name: "病院を増やす", emoji: "🏥",
    description: "新しい病院を町に作ります。",
    buildCost: 30, maintCost: 5,
    goodEffects: { health: 10 },
    badEffectText: "とてもお金がかかります。維持費も高いです。",
    laterEvent: { yearsAfter: 5, name: "お医者さんが足りない", effects: { health: -2 },
      comment: { residentId: "saburo", text: "先生が足りなくて待ち時間が長いのう" } },
    comments: [
      { residentId: "saburo", text: "安心して暮らせるわい" },
      { residentId: "misaki", text: "その分、商店街への予算が減らないか心配" },
    ],
  },
  {
    id: "bus", name: "バスを増便する", emoji: "🚌",
    description: "走るバスの本数を増やします。",
    buildCost: 10, maintCost: 4,
    goodEffects: { traffic: 6, vibrancy: 2 },
    badEffectText: "空いている時間帯も走らせるので、お金がかかり続けます。",
    laterEvent: { yearsAfter: 3, name: "乗る人が少ない路線が出てくる", effects: { finance: -2 },
      comment: { residentId: "takumi", text: "あのバス、いつもガラガラだね" } },
    comments: [
      { residentId: "saburo", text: "病院に行きやすくなった" },
      { residentId: "kenji",  text: "農道は通らないから変わらんのう" },
    ],
  },
  {
    id: "disasterDrill", name: "防災訓練をする", emoji: "🦺",
    description: "台風や地震のときの逃げ方をみんなで練習します。",
    buildCost: 8, maintCost: 1,
    goodEffects: { safety: 7 },
    badEffectText: "訓練の日は仕事や学校が忙しくなります。すぐには町が変わった感じがしません。",
    laterEvent: null,
    comments: [
      { residentId: "yuki",   text: "もしもの時、安心できる" },
      { residentId: "takumi", text: "仕事を抜けるのが大変だった…" },
    ],
    // このカードが建設済みだと、災害系イベントの被害が少し軽くなる
    setsFlag: "disasterAware",
  },
  {
    id: "treePlanting", name: "木を植える", emoji: "🌱",
    description: "町のあちこちに木を植えて緑を増やします。",
    buildCost: 5, maintCost: 1,
    goodEffects: { nature: 6 },
    badEffectText: "すぐには暮らしが良くなった感じがしません。落ち葉の掃除が増えます。",
    laterEvent: { yearsAfter: 10, name: "木が大きくなって剪定が必要", effects: { finance: -2 },
      comment: { residentId: "misaki", text: "落ち葉の掃除、大変になってきたね" } },
    comments: [
      { residentId: "kenji",  text: "緑が増えて嬉しいのう" },
      { residentId: "misaki", text: "落ち葉の掃除が大変…" },
    ],
  },
  {
    id: "shoppingSupport", name: "商店街を応援する", emoji: "🏪",
    description: "商店街のお店にお金を出して盛り上げます。",
    buildCost: 12, maintCost: 2,
    goodEffects: { vibrancy: 7, finance: 2 },
    badEffectText: "お店を持たない人には恩恵を感じにくいです。",
    laterEvent: { yearsAfter: 5, name: "後を継ぐ人がいない", effects: { vibrancy: -2 },
      comment: { residentId: "misaki", text: "お店を継いでくれる人がいなくて…" } },
    comments: [
      { residentId: "misaki", text: "お店に活気が戻った！" },
      { residentId: "saburo", text: "わしには関係ないのう" },
    ],
  },
  {
    id: "festival", name: "お祭りを開く", emoji: "🎆",
    description: "町のみんなで楽しむお祭りを開きます。",
    buildCost: 10, maintCost: 0,
    goodEffects: { vibrancy: 9, life: 2 },
    badEffectText: "効果は1年だけです。毎年開くとお金がかかり続けます。",
    laterEvent: null,
    comments: [
      { residentId: "akari",  text: "お祭り楽しかった！" },
      { residentId: "takumi", text: "準備が大変だった…" },
    ],
  },
  {
    id: "nursery", name: "保育園を作る", emoji: "👶",
    description: "小さい子どもを預けられる保育園を作ります。",
    buildCost: 22, maintCost: 4,
    goodEffects: { life: 7, education: 3 },
    badEffectText: "子育て中でない人には関係が薄いです。",
    laterEvent: { yearsAfter: 5, name: "入りたい子が増えすぎる", effects: { life: -2 },
      comment: { residentId: "yuki", text: "入りたい子が多くて大変みたい" } },
    comments: [
      { residentId: "yuki",   text: "働きに出られるようになった！" },
      { residentId: "saburo", text: "わしの若い頃はなかったのう" },
    ],
  },
  {
    id: "wasteFacility", name: "ごみ処理場を改修する", emoji: "♻️",
    description: "ごみを処理する施設をきれいに新しくします。",
    buildCost: 20, maintCost: 3,
    goodEffects: { nature: 5, health: 3 },
    badEffectText: "目立たない政策なので「何に使ったお金かわからない」と言われがちです。",
    laterEvent: null,
    comments: [
      { residentId: "kenji", text: "川がきれいになった" },
      { residentId: "akari", text: "よくわからないけど、いいことなのかな？" },
    ],
  },
  {
    id: "fireStation", name: "消防署を増設する", emoji: "🚒",
    description: "火事や事故に備えて消防署を増やします。",
    buildCost: 25, maintCost: 4,
    goodEffects: { safety: 9 },
    badEffectText: "とてもお金がかかります。何も起きないと「使わなかったお金」に見えます。",
    laterEvent: null,
    comments: [
      { residentId: "yuki",   text: "何かあった時に安心" },
      { residentId: "takumi", text: "税金が高くなった気がする" },
    ],
  },
  {
    id: "solarPower", name: "太陽光発電を導入する", emoji: "☀️",
    description: "太陽の光で電気を作る設備を町に入れます。",
    buildCost: 18, maintCost: 1,
    goodEffects: { nature: 6, finance: 2 },
    badEffectText: "天気が悪い日は発電できません。土地が必要です。",
    laterEvent: { yearsAfter: 10, name: "設備が古くなる", effects: { finance: -2 },
      comment: { residentId: "kenji", text: "発電のパネル、そろそろ交換らしいよ" } },
    comments: [
      { residentId: "kenji",  text: "畑の日当たりが心配だったが大丈夫だった" },
      { residentId: "misaki", text: "見た目が少し変わったね" },
    ],
  },
  {
    id: "elderlyWelfare", name: "高齢者福祉施設を作る", emoji: "🧓",
    description: "お年寄りが集まって話したり相談したりできる施設を作ります。",
    buildCost: 28, maintCost: 5,
    goodEffects: { health: 7, life: 4 },
    badEffectText: "とてもお金がかかります。若い人には直接の恩恵が少ないです。",
    laterEvent: null,
    comments: [
      { residentId: "saburo", text: "みんなと話せて楽しいのう" },
      { residentId: "takumi", text: "僕にはまだ早いかな" },
    ],
  },
  {
    id: "schoolRoute", name: "通学路を整備する", emoji: "🚸",
    description: "子どもが安全に通学できるよう道を整えます。",
    buildCost: 12, maintCost: 1,
    goodEffects: { safety: 6, education: 2 },
    badEffectText: "工事中は遠回りが必要になることがあります。",
    laterEvent: null,
    comments: [
      { residentId: "akari", text: "安心して歩けるようになった" },
      { residentId: "yuki",  text: "本当にありがたい" },
    ],
  },
  {
    id: "agriSupport", name: "農業支援をする", emoji: "🌾",
    description: "農家の仕事を助けるお金や道具を用意します。",
    buildCost: 15, maintCost: 2,
    goodEffects: { finance: 3, nature: 2 },
    badEffectText: "農業をしていない人には恩恵がわかりにくいです。",
    laterEvent: { yearsAfter: 3, name: "継ぐ人がいない問題", effects: { finance: -1, nature: -1 },
      comment: { residentId: "kenji", text: "若い人が少なくて心配じゃ" } },
    comments: [
      { residentId: "kenji",  text: "これで農業を続けられる" },
      { residentId: "takumi", text: "僕には関係ないかな" },
    ],
  },
  {
    id: "touristInfo", name: "観光案内所を作る", emoji: "🗺️",
    description: "町に来た人に見どころを案内する場所を作ります。",
    buildCost: 14, maintCost: 2,
    goodEffects: { vibrancy: 6, finance: 2 },
    badEffectText: "観光客が増えると混雑やゴミが増えることがあります。",
    laterEvent: null,
    comments: [
      { residentId: "misaki", text: "観光客が増えてお店が忙しくなった" },
      { residentId: "saburo", text: "静かな町が少しにぎやかになったのう" },
    ],
  },
  {
    id: "communityCenter", name: "公民館を改修する", emoji: "🏛️",
    description: "みんなが集まって話し合ったり活動したりする場所をきれいにします。",
    buildCost: 16, maintCost: 2,
    goodEffects: { life: 5, vibrancy: 3 },
    badEffectText: "使わない人にはあまり実感がありません。",
    laterEvent: null,
    comments: [
      { residentId: "yuki",   text: "町内会の集まりがしやすくなった" },
      { residentId: "takumi", text: "あまり行く機会がないな" },
    ],
  },
  {
    id: "riverControl", name: "河川を整備する（治水）", emoji: "🌊",
    description: "大雨のときに川があふれないように工事をします。",
    buildCost: 22, maintCost: 2,
    goodEffects: { safety: 8, nature: 2 },
    badEffectText: "工事中は川の周りの自然が一時的に減ります。お金もかなりかかります。",
    laterEvent: null,
    comments: [
      { residentId: "kenji",  text: "大雨の時も安心できる" },
      { residentId: "misaki", text: "工事の音がうるさかった" },
    ],
  },
];

/**
 * 住民のお願い（20件）
 * ------------------------------------------------------------
 * decay: 「放置した場合の変化」を数値化したもの。毎年、未解決なら
 *        該当ステータスがこの分だけゆっくり下がる（低緊急度は 0 のものが多い＝
 *        自然に消えるわけではなく、雰囲気として残り続けるだけ）。
 * candidatePolicyIds: 解決の「候補」（これが唯一の正解ではない）
 * ------------------------------------------------------------
 */
const REQUESTS = [
  { id: "r01", residentId: "akari",  text: "公園が少なくて遊ぶ場所がありません。", urgency: "中",
    decay: { stat: "life", amount: -1 }, candidatePolicyIds: ["park"] },
  { id: "r02", residentId: "akari",  text: "教室が暑くて勉強に集中できません。", urgency: "高",
    decay: { stat: "health", amount: -2 }, candidatePolicyIds: ["school"] },
  { id: "r03", residentId: "akari",  text: "図書館の本が少なくて読みたい本がありません。", urgency: "低",
    decay: { stat: "education", amount: 0 }, candidatePolicyIds: ["library"] },
  { id: "r04", residentId: "akari",  text: "通学路が暗くて怖いです。", urgency: "高",
    decay: { stat: "safety", amount: -2 }, candidatePolicyIds: ["schoolRoute"] },
  { id: "r05", residentId: "yuki",   text: "保育園に入れなくて働きに出られません。", urgency: "高",
    decay: { stat: "life", amount: -2 }, candidatePolicyIds: ["nursery"] },
  { id: "r06", residentId: "yuki",   text: "近くに病院がなくて不安です。", urgency: "中",
    decay: { stat: "health", amount: -1 }, candidatePolicyIds: ["hospital"] },
  { id: "r07", residentId: "yuki",   text: "公園の遊具が壊れていて危ないです。", urgency: "高",
    decay: { stat: "safety", amount: -2 }, candidatePolicyIds: ["park"] },
  { id: "r08", residentId: "yuki",   text: "子育ての相談ができる場所がありません。", urgency: "低",
    decay: { stat: "life", amount: 0 }, candidatePolicyIds: ["nursery", "communityCenter"] },
  { id: "r09", residentId: "saburo", text: "バスの本数が少なくて出かけにくいです。", urgency: "中",
    decay: { stat: "life", amount: -1 }, candidatePolicyIds: ["bus"] },
  { id: "r10", residentId: "saburo", text: "夜道が暗くて心配です。", urgency: "中",
    decay: { stat: "safety", amount: -1 }, candidatePolicyIds: ["road"] },
  { id: "r11", residentId: "saburo", text: "病院が遠くて通うのが大変です。", urgency: "高",
    decay: { stat: "health", amount: -2 }, candidatePolicyIds: ["hospital"] },
  { id: "r12", residentId: "saburo", text: "お年寄りが集まれる場所がほしいです。", urgency: "低",
    decay: { stat: "life", amount: 0 }, candidatePolicyIds: ["elderlyWelfare"] },
  { id: "r13", residentId: "misaki", text: "商店街に人が来なくてお店が困っています。", urgency: "高",
    decay: { stat: "vibrancy", amount: -2 }, candidatePolicyIds: ["shoppingSupport"] },
  { id: "r14", residentId: "misaki", text: "お祭りをやってほしいです。町が静かすぎます。", urgency: "低",
    decay: { stat: "vibrancy", amount: 0 }, candidatePolicyIds: ["festival"] },
  { id: "r15", residentId: "misaki", text: "観光客がもっと来てくれたら嬉しいです。", urgency: "低",
    decay: { stat: "vibrancy", amount: 0 }, candidatePolicyIds: ["touristInfo"] },
  { id: "r16", residentId: "kenji",  text: "大雨のたびに川があふれないか心配です。", urgency: "高",
    decay: { stat: "safety", amount: -2 }, candidatePolicyIds: ["riverControl"] },
  { id: "r17", residentId: "kenji",  text: "農業を継ぐ若い人がいなくて困っています。", urgency: "中",
    decay: { stat: "finance", amount: -1 }, candidatePolicyIds: ["agriSupport"] },
  { id: "r18", residentId: "kenji",  text: "道路が悪くて野菜を運ぶのが大変です。", urgency: "中",
    decay: { stat: "traffic", amount: -1 }, candidatePolicyIds: ["road"] },
  { id: "r19", residentId: "takumi", text: "通勤に使うバスが少なくて困っています。", urgency: "中",
    decay: { stat: "traffic", amount: -1 }, candidatePolicyIds: ["bus"] },
  { id: "r20", residentId: "takumi", text: "町に活気がなくてつまらないです。", urgency: "低",
    decay: { stat: "vibrancy", amount: 0 }, candidatePolicyIds: ["festival", "shoppingSupport"] },
];

/**
 * イベントカード（20枚・毎年ランダムで1枚発生）
 * ------------------------------------------------------------
 * choices: 2択（A/B）。どちらも一長一短になるように作ってあります。
 * apply: { budget: 数値, stats: {キー: 数値} } の形で効果を表す
 * laterEffectText: 「その後」の雰囲気を伝える一言（数値には影響しない）
 * ------------------------------------------------------------
 */
const EVENTS = [
  { id: "typhoon", title: "台風接近", emoji: "🌀", content: "大型の台風が町に近づいています。",
    choices: [
      { id: "A", label: "避難所を開いて備える", apply: { budget: -5, stats: { safety: 3 } } },
      { id: "B", label: "いつも通り過ごす",     apply: { budget: 0,  stats: { safety: -6, nature: -3 } } },
    ],
    laterEffectText: "備えをした年は、その後の災害でも被害が少しやわらぐと言われています。" },

  { id: "heavyRain", title: "大雨が続く", emoji: "☔", content: "数日間、雨が降り続いています。",
    choices: [
      { id: "A", label: "川の見回りを増やす", apply: { budget: -3, stats: { safety: -1 } } },
      { id: "B", label: "特に対策しない",     apply: { budget: 0,  stats: { traffic: -4, nature: -2 } } },
    ],
    laterEffectText: "何もしない年が続くと、川があふれやすくなっていきます。" },

  { id: "decliningBirthrate", title: "少子化が進む", emoji: "🍼", content: "町で生まれる子どもの数が減ってきました。",
    choices: [
      { id: "A", label: "子育て支援にお金を使う", apply: { budget: -8, stats: { life: 3, education: 2 } } },
      { id: "B", label: "今のままにする",         apply: { budget: 0,  stats: { education: -3, vibrancy: -2 } } },
    ],
    laterEffectText: "対策をしないままだと、いつか学校の生徒数にも影響が出てきます。" },

  { id: "newBaby", title: "赤ちゃんが生まれる", emoji: "👶", content: "町でたくさんの赤ちゃんが生まれました。",
    choices: [
      { id: "A", label: "お祝いイベントを開く", apply: { budget: -3, stats: { life: 3, vibrancy: 2 } } },
      { id: "B", label: "静かにお祝いする",     apply: { budget: 0,  stats: { life: 2 } } },
    ],
    laterEffectText: "明るい話題で、住民たちの気持ちが少し前向きになりました。" },

  { id: "companyMove", title: "会社が進出したいと申し出る", emoji: "🏭", content: "大きな会社が町に工場を建てたいと言っています。",
    choices: [
      { id: "A", label: "受け入れる", apply: { budget: 8, stats: { vibrancy: 3, nature: -3 } } },
      { id: "B", label: "断る",       apply: { budget: 0, stats: {} } },
    ],
    laterEffectText: "受け入れた場合、数年後に交通量が増えて道路が傷みやすくなります。" },

  { id: "shopClosing", title: "商店が閉店しそう", emoji: "🚪", content: "商店街のお店が「もう続けられない」と困っています。",
    choices: [
      { id: "A", label: "商店街を応援する政策をすぐ使う", apply: { budget: -5, stats: { vibrancy: -2 } } },
      { id: "B", label: "様子を見る",                     apply: { budget: 0,  stats: { vibrancy: -5, finance: -2 } } },
    ],
    laterEffectText: "一度閉まったお店は、なかなか元には戻りません。" },

  { id: "tourismBoost", title: "観光客が増えている", emoji: "📸", content: "SNSで町が話題になり、観光客が増えています。",
    choices: [
      { id: "A", label: "観光案内所を急いで作る", apply: { budget: -8, stats: { vibrancy: 6 } } },
      { id: "B", label: "そのままにする",         apply: { budget: 0,  stats: { vibrancy: 3 } } },
    ],
    laterEffectText: "観光客が増えすぎると、ゴミ問題や混雑が起きることもあります。" },

  { id: "festivalRequest", title: "お祭りをやりたいという声が集まる", emoji: "🎏", content: "住民から「お祭りをやりたい」という声が集まっています。",
    choices: [
      { id: "A", label: "予算を出してお祭りを開く", apply: { budget: -10, stats: { vibrancy: 5, life: 2 } } },
      { id: "B", label: "今年は見送る",             apply: { budget: 0,   stats: {} } },
    ],
    laterEffectText: "お祭りの効果はその年限りですが、良い思い出は残ります。" },

  { id: "earthquake", title: "地震が起きる", emoji: "🌏", content: "大きな地震が町を襲いました。",
    choices: [
      { id: "A", label: "急いで応急対応をする", apply: { budget: -8, stats: { safety: -3 } } },
      { id: "B", label: "様子を見ながら対応する", apply: { budget: 0,  stats: { safety: -6 } } },
    ],
    laterEffectText: "防災訓練をしていた町は、被害が少しやわらいだようです。" },

  { id: "heatwave", title: "猛暑がやってくる", emoji: "🥵", content: "とても暑い夏になりました。",
    choices: [
      { id: "A", label: "高齢者や子どもへの声かけを強化する", apply: { budget: -3, stats: { health: -1 } } },
      { id: "B", label: "特に対策しない",                     apply: { budget: 0,  stats: { health: -4 } } },
    ],
    laterEffectText: "毎年暑さが厳しくなっていて、これからも注意が必要です。" },

  { id: "heavySnow", title: "大雪が降る", emoji: "❄️", content: "珍しく大雪が積もりました。",
    choices: [
      { id: "A", label: "除雪にお金を使う",       apply: { budget: -4, stats: { traffic: -1 } } },
      { id: "B", label: "自然に溶けるのを待つ",   apply: { budget: 0,  stats: { traffic: -5, safety: -2 } } },
    ],
    laterEffectText: "特になし。" },

  { id: "migration", title: "移住者が増えている", emoji: "🚚", content: "「みどり町に住みたい」という人が増えてきました。",
    choices: [
      { id: "A", label: "歓迎イベントを開く", apply: { budget: -3, stats: { life: 2, vibrancy: 2 } } },
      { id: "B", label: "特に何もしない",     apply: { budget: 0,  stats: { life: 2 } } },
    ],
    laterEffectText: "人口が増えすぎると、保育園や学校が足りなくなることがあります。" },

  { id: "aging", title: "高齢化が進む", emoji: "🧓", content: "お年寄りの人口の割合が増えてきました。",
    choices: [
      { id: "A", label: "福祉に力を入れる", apply: { budget: -6, stats: { health: 3 } } },
      { id: "B", label: "今のままにする",   apply: { budget: 0,  stats: { health: -2 } } },
    ],
    laterEffectText: "特になし。" },

  { id: "newspaper", title: "新聞に町が紹介される", emoji: "📰", content: "新聞記者が「みどり町」の取り組みを取材したいと言っています。",
    choices: [
      { id: "A", label: "時間を作って丁寧に対応する", apply: { budget: -1, stats: { vibrancy: 6 } } },
      { id: "B", label: "資料だけ渡してすぐ済ませる", apply: { budget: 0,  stats: { vibrancy: 4 } } },
    ],
    laterEffectText: "特になし。" },

  { id: "subsidy", title: "補助金が当たる", emoji: "💴", content: "国や県から「がんばっている町」として補助金がもらえます。使い道は自由です。",
    choices: [
      { id: "A", label: "町の貯金にする",         apply: { budget: 10, stats: {} } },
      { id: "B", label: "すぐに子育て支援に使う", apply: { budget: 4,  stats: { life: 3 } } },
    ],
    laterEffectText: "特になし。" },

  { id: "epidemic", title: "感染症が流行する", emoji: "🤧", content: "町で風邪のような病気が流行しています。",
    choices: [
      { id: "A", label: "病院や消毒にお金を使う", apply: { budget: -5, stats: { health: -3 } } },
      { id: "B", label: "様子を見る",             apply: { budget: 0,  stats: { health: -6, vibrancy: -3 } } },
    ],
    laterEffectText: "特になし。" },

  { id: "goodHarvest", title: "農作物が豊作になる", emoji: "🌾", content: "今年はけんじさんの畑で野菜がたくさんとれました。",
    choices: [
      { id: "A", label: "町全体でお祝いする", apply: { budget: 4, stats: { life: 2, vibrancy: 1 } } },
      { id: "B", label: "特に何もしない",     apply: { budget: 4, stats: {} } },
    ],
    laterEffectText: "特になし。" },

  { id: "vacantHouses", title: "空き家が増えている", emoji: "📦", content: "誰も住んでいない家が増えてきました。",
    choices: [
      { id: "A", label: "空き家対策にお金を使う", apply: { budget: -3, stats: { life: -1 } } },
      { id: "B", label: "そのままにする",         apply: { budget: 0,  stats: { life: -3, vibrancy: -2 } } },
    ],
    laterEffectText: "放置し続けると、町の見た目が寂しくなり、にぎわいがさらに下がります。" },

  { id: "fireworks", title: "花火大会が成功する", emoji: "🎆", content: "近くの町と合同で花火大会を開くことになりました。",
    choices: [
      { id: "A", label: "町のお金を出して協力する", apply: { budget: -4, stats: { vibrancy: 7 } } },
      { id: "B", label: "見に行くだけにする",       apply: { budget: 0,  stats: { vibrancy: 3 } } },
    ],
    laterEffectText: "特になし。" },

  { id: "blackout", title: "停電が起きる", emoji: "⚡", content: "設備の故障で町の一部が停電しました。",
    choices: [
      { id: "A", label: "すぐに直す",             apply: { budget: -6, stats: { safety: -1 } } },
      { id: "B", label: "少し我慢して様子を見る", apply: { budget: 0,  stats: { safety: -4, health: -2 } } },
    ],
    laterEffectText: "特になし。" },
];

// 何も政策を実行しなかった年に表示する「日常コメント」（住民ごとに数種類）
// 毎年ランダムに選ばれるので、同じ年でも変化が出ます。
const GENERIC_COMMENTS = {
  akari:  ["今日も元気だよ！", "友達と公園で遊んだよ", "議長さん、今年は何をするの？"],
  yuki:   ["子どもと一緒に町を歩くの、楽しいです", "少しずつでも町が良くなるといいな"],
  saburo: ["今日も天気がいいのう", "この町に長いこと住んどるが、まだまだ変わるもんじゃな"],
  misaki: ["お店の様子はまあまあかな", "議長さん、次は何を考えてるの？"],
  kenji:  ["畑の様子を見てきたよ", "今年の天気は畑にとって大事じゃ"],
  takumi: ["仕事帰りに町を見て回ってます", "この町、もっと便利になるといいな"],
};

/**
 * 秘書キャラクター（チュートリアル案内役）
 * 住民6人とは別に、はじめて遊ぶ人に説明するための案内役です。
 */
const SECRETARY = { name: "しおり", role: "議会事務局のスタッフ", emoji: "🐦" };

/**
 * 初回だけ表示するチュートリアルの内容。
 * TUTORIAL_STEPS に項目を追加すれば説明を増やせます。
 */
const TUTORIAL_STEPS = [
  {
    title: "「こどもまち会議」へようこそ",
    text: "はじめまして、議会事務局のしおりです。今日から、あなたに「議長」をお願いします。",
  },
  {
    title: "議長ってなに？",
    text: "議長は、命令する人ではありません。みんなの意見を聞いて、整理して、最後にどうするかを決める人のことです。",
  },
  {
    title: "財政ってなに？",
    text: "財政は「町のお財布の元気さ」のことです。使いすぎるとお財布が心配になりますが、何もしないと町の困りごとが減りません。",
  },
  {
    title: "維持費ってなに？",
    text: "施設は作ったら終わりではありません。毎年、動かし続けるための「維持費」がかかります。",
  },
  {
    title: "住民ってなに？",
    text: "この町には6人の住民がいます。それぞれ違う暮らしをしていて、同じ政策でも感じ方が違います。",
  },
  {
    title: "話し合いってなに？",
    text: "「まち会議」では、住民たちの賛成・反対・どちらでもないの声を聞いてから、政策を決めます。全員が賛成する政策はほとんどありません。だからこそ、話し合いが大切です。",
  },
];

// 賛成・どちらでもない・心配、の見た目
const STANCE_META = {
  agree:     { emoji: "🟢", label: "賛成" },
  neutral:   { emoji: "🟡", label: "どちらでもない" },
  concerned: { emoji: "🔴", label: "心配" },
};

/**
 * 政策ごとの住民の賛否・理由（まち会議画面で使用）。
 * 全員が賛成する政策は作らない、という方針にもとづき、
 * 必ず賛成・どちらでもない・心配が混ざるようにしています。
 * キーは POLICIES の id と対応しています。
 */
const POLICY_STANCES = {
  park: [
    { residentId: "akari",  stance: "agree",     reason: "もっと遊びたいから！" },
    { residentId: "yuki",   stance: "agree",     reason: "子どもには必要だと思う" },
    { residentId: "saburo", stance: "concerned", reason: "静かな場所が減るのが心配じゃ" },
    { residentId: "misaki", stance: "agree",     reason: "人が増えるならお店にも嬉しい" },
    { residentId: "kenji",  stance: "neutral",   reason: "畑には関係ないけど、いいと思うよ" },
    { residentId: "takumi", stance: "neutral",   reason: "僕はあまり使わないかな" },
  ],
  library: [
    { residentId: "akari",  stance: "agree",     reason: "本がたくさん読めるから嬉しい" },
    { residentId: "yuki",   stance: "agree",     reason: "静かに勉強できる場所は大事" },
    { residentId: "saburo", stance: "neutral",   reason: "わしにはあまり縁がないのう" },
    { residentId: "misaki", stance: "neutral",   reason: "お店には直接関係ないかな" },
    { residentId: "kenji",  stance: "concerned", reason: "そんなにお金をかけて大丈夫かのう" },
    { residentId: "takumi", stance: "neutral",   reason: "あまり行かないと思う" },
  ],
  school: [
    { residentId: "akari",  stance: "agree",     reason: "教室が涼しくなるなら嬉しい！" },
    { residentId: "yuki",   stance: "agree",     reason: "子どもの環境が良くなるのは大事" },
    { residentId: "saburo", stance: "neutral",   reason: "若い人のためになるならええ" },
    { residentId: "misaki", stance: "neutral",   reason: "商店街には関係ないかな" },
    { residentId: "kenji",  stance: "neutral",   reason: "うちの子はもう卒業したしのう" },
    { residentId: "takumi", stance: "concerned", reason: "また税金が上がらないか心配" },
  ],
  road: [
    { residentId: "akari",  stance: "neutral",   reason: "工事の音がうるさいのはやだな" },
    { residentId: "yuki",   stance: "neutral",   reason: "安全になるならいいけど" },
    { residentId: "saburo", stance: "concerned", reason: "工事の間、うるさくて困る" },
    { residentId: "misaki", stance: "agree",     reason: "お客さんが来やすくなるかも" },
    { residentId: "kenji",  stance: "agree",     reason: "野菜を運びやすくなるから助かる" },
    { residentId: "takumi", stance: "agree",     reason: "通勤が楽になるのは嬉しい" },
  ],
  hospital: [
    { residentId: "akari",  stance: "neutral",   reason: "よくわからないけど、いいことだと思う" },
    { residentId: "yuki",   stance: "agree",     reason: "近くに病院があると安心" },
    { residentId: "saburo", stance: "agree",     reason: "何より安心できるのう" },
    { residentId: "misaki", stance: "concerned", reason: "商店街への予算が減らないか心配" },
    { residentId: "kenji",  stance: "neutral",   reason: "畑からは遠いけど、あるといいな" },
    { residentId: "takumi", stance: "neutral",   reason: "僕はまだお世話にならないから" },
  ],
  bus: [
    { residentId: "akari",  stance: "neutral",   reason: "バスにはあまり乗らないな" },
    { residentId: "yuki",   stance: "agree",     reason: "子どもと出かけやすくなる" },
    { residentId: "saburo", stance: "agree",     reason: "病院に行きやすくなって助かる" },
    { residentId: "misaki", stance: "neutral",   reason: "お店には直接関係ないかな" },
    { residentId: "kenji",  stance: "neutral",   reason: "農道は通らないから変わらんのう" },
    { residentId: "takumi", stance: "agree",     reason: "通勤が楽になるから嬉しい" },
  ],
  disasterDrill: [
    { residentId: "akari",  stance: "neutral",   reason: "訓練はちょっと緊張するけど大事" },
    { residentId: "yuki",   stance: "agree",     reason: "もしもの時、安心できる" },
    { residentId: "saburo", stance: "agree",     reason: "備えあれば憂いなしじゃ" },
    { residentId: "misaki", stance: "neutral",   reason: "商売への影響は少ないかな" },
    { residentId: "kenji",  stance: "agree",     reason: "災害への備えは大事じゃ" },
    { residentId: "takumi", stance: "concerned", reason: "仕事を抜けるのが大変" },
  ],
  treePlanting: [
    { residentId: "akari",  stance: "neutral",   reason: "緑が増えるのはいいと思う" },
    { residentId: "yuki",   stance: "neutral",   reason: "きれいな町になりそう" },
    { residentId: "saburo", stance: "neutral",   reason: "落ち葉の掃除が増えそうじゃな" },
    { residentId: "misaki", stance: "neutral",   reason: "お店には関係ないかな" },
    { residentId: "kenji",  stance: "agree",     reason: "緑が増えるのは嬉しいのう" },
    { residentId: "takumi", stance: "neutral",   reason: "特に意見はないかな" },
  ],
  shoppingSupport: [
    { residentId: "akari",  stance: "neutral",   reason: "お店が増えたら嬉しいかな" },
    { residentId: "yuki",   stance: "neutral",   reason: "買い物しやすくなるといいな" },
    { residentId: "saburo", stance: "neutral",   reason: "わしには関係ないのう" },
    { residentId: "misaki", stance: "agree",     reason: "お店に活気が戻ってほしい！" },
    { residentId: "kenji",  stance: "neutral",   reason: "畑には直接関係ないかな" },
    { residentId: "takumi", stance: "agree",     reason: "町に活気が出るのはいいこと" },
  ],
  festival: [
    { residentId: "akari",  stance: "agree",     reason: "お祭り楽しみ！" },
    { residentId: "yuki",   stance: "agree",     reason: "家族で楽しめそう" },
    { residentId: "saburo", stance: "concerned", reason: "毎年だと出費が心配じゃ" },
    { residentId: "misaki", stance: "agree",     reason: "お客さんが増えるから嬉しい" },
    { residentId: "kenji",  stance: "neutral",   reason: "農作業の時期でなければいいな" },
    { residentId: "takumi", stance: "neutral",   reason: "準備が大変そうだけど、まあいいか" },
  ],
  nursery: [
    { residentId: "akari",  stance: "neutral",   reason: "小さい子のための場所だね" },
    { residentId: "yuki",   stance: "agree",     reason: "働きに出られるようになる！" },
    { residentId: "saburo", stance: "neutral",   reason: "わしの若い頃はなかったのう" },
    { residentId: "misaki", stance: "neutral",   reason: "商売には関係ないかな" },
    { residentId: "kenji",  stance: "neutral",   reason: "必要な人もいるじゃろう" },
    { residentId: "takumi", stance: "concerned", reason: "税金の使い道として大丈夫か心配" },
  ],
  wasteFacility: [
    { residentId: "akari",  stance: "neutral",   reason: "よくわからないけど、いいことなのかな" },
    { residentId: "yuki",   stance: "neutral",   reason: "きれいになるならいいと思う" },
    { residentId: "saburo", stance: "neutral",   reason: "地味だけど大事な仕事じゃ" },
    { residentId: "misaki", stance: "neutral",   reason: "見た目には関係ないかな" },
    { residentId: "kenji",  stance: "agree",     reason: "川がきれいになるのは嬉しい" },
    { residentId: "takumi", stance: "neutral",   reason: "あまり実感はないかな" },
  ],
  fireStation: [
    { residentId: "akari",  stance: "neutral",   reason: "火事は怖いから、あるといいと思う" },
    { residentId: "yuki",   stance: "agree",     reason: "何かあった時に安心" },
    { residentId: "saburo", stance: "agree",     reason: "備えは大事じゃ" },
    { residentId: "misaki", stance: "concerned", reason: "そんなにお金をかけて大丈夫か心配" },
    { residentId: "kenji",  stance: "neutral",   reason: "畑の方まで来てくれるなら嬉しいけど" },
    { residentId: "takumi", stance: "concerned", reason: "税金が高くなった気がする" },
  ],
  solarPower: [
    { residentId: "akari",  stance: "neutral",   reason: "地球にやさしいならいいね" },
    { residentId: "yuki",   stance: "neutral",   reason: "電気代が浮くならいいかも" },
    { residentId: "saburo", stance: "neutral",   reason: "わしにはよくわからんが、まあいいじゃろう" },
    { residentId: "misaki", stance: "neutral",   reason: "見た目が変わるのはちょっと気になる" },
    { residentId: "kenji",  stance: "concerned", reason: "畑の日当たりが心配じゃ" },
    { residentId: "takumi", stance: "agree",     reason: "環境にいいことはいいことだと思う" },
  ],
  elderlyWelfare: [
    { residentId: "akari",  stance: "neutral",   reason: "おじいちゃんおばあちゃんが喜ぶならいいね" },
    { residentId: "yuki",   stance: "neutral",   reason: "地域のつながりが増えるのはいいこと" },
    { residentId: "saburo", stance: "agree",     reason: "みんなと話せる場所ができて嬉しいのう" },
    { residentId: "misaki", stance: "neutral",   reason: "商売には直接関係ないかな" },
    { residentId: "kenji",  stance: "neutral",   reason: "うちの親も使うかもしれん" },
    { residentId: "takumi", stance: "concerned", reason: "お金がかかりすぎな気がする" },
  ],
  schoolRoute: [
    { residentId: "akari",  stance: "agree",     reason: "安心して歩けるようになる！" },
    { residentId: "yuki",   stance: "agree",     reason: "本当にありがたい" },
    { residentId: "saburo", stance: "neutral",   reason: "わしには関係ないが、良いことじゃ" },
    { residentId: "misaki", stance: "neutral",   reason: "商店街には関係ないかな" },
    { residentId: "kenji",  stance: "neutral",   reason: "特に意見はないかな" },
    { residentId: "takumi", stance: "neutral",   reason: "自分は電車通勤だから変わらないかな" },
  ],
  agriSupport: [
    { residentId: "akari",  stance: "neutral",   reason: "農業のことはよくわからないな" },
    { residentId: "yuki",   stance: "neutral",   reason: "野菜が美味しくなるならいいな" },
    { residentId: "saburo", stance: "neutral",   reason: "わしも昔は畑をやっとったのう" },
    { residentId: "misaki", stance: "neutral",   reason: "商店街には直接関係ないかな" },
    { residentId: "kenji",  stance: "agree",     reason: "これで農業を続けられる！" },
    { residentId: "takumi", stance: "concerned", reason: "税金の使い道が気になる" },
  ],
  touristInfo: [
    { residentId: "akari",  stance: "neutral",   reason: "観光客が来るのは楽しそう" },
    { residentId: "yuki",   stance: "neutral",   reason: "町の魅力が伝わるといいな" },
    { residentId: "saburo", stance: "concerned", reason: "静かな町が変わってしまわないか心配" },
    { residentId: "misaki", stance: "agree",     reason: "観光客が増えてお店が忙しくなる！" },
    { residentId: "kenji",  stance: "neutral",   reason: "畑には関係ないかな" },
    { residentId: "takumi", stance: "neutral",   reason: "特に意見はないかな" },
  ],
  communityCenter: [
    { residentId: "akari",  stance: "neutral",   reason: "集会所がきれいになるのはいいね" },
    { residentId: "yuki",   stance: "agree",     reason: "町内会の集まりがしやすくなる" },
    { residentId: "saburo", stance: "agree",     reason: "みんなで集まれる場所は大事じゃ" },
    { residentId: "misaki", stance: "neutral",   reason: "商売には直接関係ないかな" },
    { residentId: "kenji",  stance: "neutral",   reason: "たまに使うから、あるといいな" },
    { residentId: "takumi", stance: "neutral",   reason: "あまり行く機会がないな" },
  ],
  riverControl: [
    { residentId: "akari",  stance: "neutral",   reason: "川が安全になるのはいいことだね" },
    { residentId: "yuki",   stance: "neutral",   reason: "安心して子どもと過ごせそう" },
    { residentId: "saburo", stance: "agree",     reason: "大雨の時に安心できるのう" },
    { residentId: "misaki", stance: "concerned", reason: "工事の間、お店への影響が心配" },
    { residentId: "kenji",  stance: "agree",     reason: "大雨の時も安心できる！" },
    { residentId: "takumi", stance: "neutral",   reason: "特に意見はないかな" },
  ],
};
