/**
 * app.js
 * ------------------------------------------------------------
 * 「こどもまち会議」のゲームロジックと画面描画をまとめたファイルです。
 *
 * 構成（役割ごとに整理）:
 *   1. 状態管理（State）      … セーブデータの読み書き
 *   2. ゲーム進行（Game Flow） … 年送り・イベント・政策・反応の処理
 *   3. 画面描画（Screens）     … 各タブの HTML を組み立てる関数
 *   4. ナビゲーション（Nav）   … タブ切り替え・初期化
 *
 * データ（住民・政策・お願い・イベント）は data.js にあります。
 * ここでは「data.js の中身をどう使うか」だけを書いています。
 * ------------------------------------------------------------
 */

const SAVE_KEY = "kodomoMachiKaigi_save_v1";
const STAT_KEYS = Object.keys(STAT_META);

// ============================================================
// 1. 状態管理（State）
// ============================================================

let state = null;

function createNewState() {
  return {
    version: GAME_VERSION,
    started: true,
    year: TOWN_INITIAL.startYear,
    budget: TOWN_INITIAL.startBudget,
    stats: { ...TOWN_INITIAL.initialStats },
    builtPolicies: [],       // { policyId, builtYear, fired }
    resolvedRequestIds: [],
    seenRequestIds: [],
    usedEventIds: [],        // 一巡したらリセットする
    flags: {},               // 例: disasterAware
    history: [],             // 記録画面用のログ（議長メモ・町ニュースも含む）
    turn: null,              // 今年の進行状況（beginYearで作られる）
    tutorialSeen: false,     // 初回チュートリアルを見たかどうか
  };
}

function saveState() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("セーブに失敗しました", e);
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("読み込みに失敗しました", e);
    return null;
  }
}

function hasSaveData() {
  return !!localStorage.getItem(SAVE_KEY);
}

function resetSaveData() {
  localStorage.removeItem(SAVE_KEY);
  state = null;
}

// ============================================================
// 小さなユーティリティ
// ============================================================

function clampStat(v) {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function getResident(id) {
  return RESIDENTS.find((r) => r.id === id);
}

function getPolicy(id) {
  return POLICIES.find((p) => p.id === id);
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function applyStatDeltas(stats, deltas) {
  for (const key in deltas) {
    if (STAT_KEYS.includes(key)) {
      stats[key] = clampStat(stats[key] + deltas[key]);
    }
  }
}

// ============================================================
// 2. ゲーム進行（Game Flow）
// ============================================================

/**
 * 新しい年を開始する。
 * ・維持費の支払い
 * ・「数年後イベント」の自動発生チェック
 * ・未解決のお願いによるステータス低下（decay）
 * ・今年のイベントカードを1枚引く
 * ・お願いを最大2件届ける
 */
function beginYear() {
  const notices = []; // この年に自動発生した「その後」の出来事

  // 「なぜ？」表示用に、年のはじめの状態を覚えておく
  const startStats = { ...state.stats };
  const startBudget = state.budget;
  const statReasons = {};
  for (const key of STAT_KEYS) statReasons[key] = [];
  const budgetReasons = [];

  // --- 維持費の支払い ---
  let maintTotal = 0;
  for (const built of state.builtPolicies) {
    const p = getPolicy(built.policyId);
    if (p) maintTotal += p.maintCost;
  }
  if (maintTotal > 0) {
    state.budget -= maintTotal;
    budgetReasons.push(`維持費として ${maintTotal} 使いました`);
  }

  // --- 数年後イベントのチェック ---
  for (const built of state.builtPolicies) {
    const p = getPolicy(built.policyId);
    if (!p || !p.laterEvent || built.fired) continue;
    if (state.year - built.builtYear === p.laterEvent.yearsAfter) {
      applyStatDeltas(state.stats, p.laterEvent.effects);
      for (const key in p.laterEvent.effects) {
        if (statReasons[key]) statReasons[key].push(`「${p.name}」の「${p.laterEvent.name}」のため`);
      }
      built.fired = true;
      notices.push({
        policyName: p.name,
        eventName: p.laterEvent.name,
        comment: p.laterEvent.comment || null,
      });
    }
  }

  // --- 未解決のお願いによる自然減少（一度届いたお願いのみ対象） ---
  for (const rid of state.seenRequestIds) {
    if (state.resolvedRequestIds.includes(rid)) continue;
    const req = REQUESTS.find((r) => r.id === rid);
    if (!req || !req.decay || req.decay.amount === 0) continue;
    applyStatDeltas(state.stats, { [req.decay.stat]: req.decay.amount });
    if (statReasons[req.decay.stat]) {
      statReasons[req.decay.stat].push(`「${req.text}」が解決されていないため`);
    }
  }

  // --- 予算がマイナスにならないように下限だけ設ける（借金は表現しない）---
  if (state.budget < 0) state.budget = 0;

  // --- イベントカードを1枚引く ---
  if (state.usedEventIds.length >= EVENTS.length) {
    state.usedEventIds = []; // 一巡したらリセットして再抽選できるようにする
  }
  const unusedEvents = EVENTS.filter((e) => !state.usedEventIds.includes(e.id));
  const event = pickRandom(unusedEvents);
  state.usedEventIds.push(event.id);

  // --- お願いを最大2件届ける（高緊急度を優先） ---
  const urgencyOrder = { 高: 0, 中: 1, 低: 2 };
  const unseenRequests = REQUESTS.filter((r) => !state.seenRequestIds.includes(r.id)).sort(
    (a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
  );
  const newRequests = unseenRequests.slice(0, 2);
  for (const r of newRequests) state.seenRequestIds.push(r.id);

  // --- 今年の「議題」を決める（届いたお願いの候補政策の中から1つ） ---
  let agendaPolicyId = null;
  for (const r of newRequests) {
    const candidate = r.candidatePolicyIds.find((pid) => POLICY_STANCES[pid]);
    if (candidate) { agendaPolicyId = candidate; break; }
  }

  state.turn = {
    phase: "event",
    eventId: event.id,
    eventChoiceId: null,
    requestIds: newRequests.map((r) => r.id),
    agendaPolicyId,
    selectedPolicyIds: [],
    reactions: [],
    maintTotal,
    yearNotices: notices,
    startStats,
    startBudget,
    statReasons,
    budgetReasons,
  };

  saveState();
}

/** イベントの選択肢を選んだときの処理 */
function resolveEventChoice(choiceId) {
  const event = EVENTS.find((e) => e.id === state.turn.eventId);
  const choice = event.choices.find((c) => c.id === choiceId);
  const budgetChange = choice.apply.budget || 0;
  state.budget += budgetChange;
  applyStatDeltas(state.stats, choice.apply.stats || {});
  if (budgetChange !== 0) {
    state.turn.budgetReasons.push(`「${event.title}」で「${choice.label}」を選んだため`);
  }
  for (const key in choice.apply.stats || {}) {
    if (state.turn.statReasons[key]) {
      state.turn.statReasons[key].push(`「${event.title}」で「${choice.label}」を選んだため`);
    }
  }
  if (event.id === "typhoon" && choiceId === "A") state.flags.disasterAware = true;
  if (state.budget < 0) state.budget = 0;
  state.turn.eventChoiceId = choiceId;
  state.turn.phase = "requests";
  saveState();
  render();
}

/** お願い確認フェーズ → まち会議（議題の話し合い）か、政策選択フェーズへ */
function proceedFromRequests() {
  state.turn.phase = state.turn.agendaPolicyId ? "deliberation" : "policies";
  saveState();
  render();
}

/** まち会議（話し合い）フェーズ → 政策選択フェーズへ */
function proceedFromDeliberation() {
  state.turn.phase = "policies";
  saveState();
  render();
}

/** 政策カードの選択トグル（まだ確定はしない） */
function togglePolicySelection(policyId) {
  const idx = state.turn.selectedPolicyIds.indexOf(policyId);
  if (idx >= 0) {
    state.turn.selectedPolicyIds.splice(idx, 1);
  } else {
    state.turn.selectedPolicyIds.push(policyId);
  }
  render();
}

function getSelectedPolicyCost() {
  return state.turn.selectedPolicyIds.reduce((sum, id) => sum + getPolicy(id).buildCost, 0);
}

/** 政策の決定を確定し、結果フェーズへ進む */
function confirmPolicies() {
  const cost = getSelectedPolicyCost();
  if (cost > state.budget) return; // ボタン側でも制御するが念のため

  const reactions = [];

  for (const policyId of state.turn.selectedPolicyIds) {
    const p = getPolicy(policyId);
    state.budget -= p.buildCost;
    applyStatDeltas(state.stats, p.goodEffects);
    state.builtPolicies.push({ policyId, builtYear: state.year, fired: false });
    if (p.setsFlag) state.flags[p.setsFlag] = true;

    state.turn.budgetReasons.push(`「${p.name}」の実行費用のため ${p.buildCost}`);
    for (const key in p.goodEffects) {
      if (state.turn.statReasons[key]) state.turn.statReasons[key].push(`「${p.name}」を実行したため`);
    }

    // この政策で解決できる、届いているお願いを解決済みにする
    for (const rid of state.turn.requestIds) {
      const req = REQUESTS.find((r) => r.id === rid);
      if (req && req.candidatePolicyIds.includes(policyId)) {
        if (!state.resolvedRequestIds.includes(rid)) state.resolvedRequestIds.push(rid);
      }
    }
    // 過去に届いたお願いの中にも候補が一致するものがあれば解決する
    for (const rid of state.seenRequestIds) {
      if (state.resolvedRequestIds.includes(rid)) continue;
      const req = REQUESTS.find((r) => r.id === rid);
      if (req && req.candidatePolicyIds.includes(policyId)) {
        state.resolvedRequestIds.push(rid);
      }
    }

    for (const c of p.comments) reactions.push({ residentId: c.residentId, text: c.text });
  }

  // 数年後イベントの住民コメントも反応に含める
  for (const notice of state.turn.yearNotices) {
    if (notice.comment) reactions.push({ residentId: notice.comment.residentId, text: notice.comment.text });
  }

  // 反応が少ない年は「日常コメント」で3件以上になるよう補う
  let guard = 0;
  while (reactions.length < 3 && guard < 20) {
    const residentId = pickRandom(RESIDENTS).id;
    const text = pickRandom(GENERIC_COMMENTS[residentId]);
    reactions.push({ residentId, text });
    guard++;
  }

  state.turn.reactions = shuffle(reactions).slice(0, 6);
  state.turn.news = generateTownNews();
  state.turn.phase = "result";

  // 記録用の履歴を1件追加（議長メモは「次の年へ」を押すときに追記する）
  const event = EVENTS.find((e) => e.id === state.turn.eventId);
  const choice = event.choices.find((c) => c.id === state.turn.eventChoiceId);
  state.history.unshift({
    year: state.year,
    eventTitle: event.title,
    eventChoiceLabel: choice.label,
    maintTotal: state.turn.maintTotal,
    builtPolicyNames: state.turn.selectedPolicyIds.map((id) => getPolicy(id).name),
    yearNotices: state.turn.yearNotices.map((n) => `${n.policyName}：${n.eventName}`),
    statsSnapshot: { ...state.stats },
    budgetSnapshot: state.budget,
    reactions: state.turn.reactions.map((r) => ({ residentId: r.residentId, text: r.text })),
    news: state.turn.news,
    chairNote: "",
    chairReason: "",
  });

  saveState();
  render();
}

/**
 * その年のできごとから「町ニュース」を組み立てる。
 * 新しく作ったデータではなく、既存の政策・イベントの情報から自動生成する。
 */
function generateTownNews() {
  const t = state.turn;
  const builtNames = t.selectedPolicyIds.map((id) => getPolicy(id).name);

  if (builtNames.length > 0) {
    const first = getPolicy(t.selectedPolicyIds[0]);
    const effectKey = Object.keys(first.goodEffects)[0];
    return {
      headline: `${builtNames.join("・")}完成！`,
      body: `${STAT_META[effectKey].label}が良くなっています。`,
      downside: t.maintTotal > 0 || first.maintCost > 0
        ? "一方、維持費も増えました。"
        : "住民たちはさっそく使い始めているようです。",
    };
  }

  const event = EVENTS.find((e) => e.id === t.eventId);
  return {
    headline: event.title,
    body: event.content,
    downside: "議長は、今年は新しい施設を作らないことを選びました。",
  };
}

/** 議長メモを保存してから次の年へ進む */
function saveChairMemoAndAdvance() {
  const noteEl = document.getElementById("chair-note-input");
  const reasonEl = document.getElementById("chair-reason-input");
  if (state.history.length > 0) {
    state.history[0].chairNote = noteEl ? noteEl.value.trim() : "";
    state.history[0].chairReason = reasonEl ? reasonEl.value.trim() : "";
  }
  goToNextYear();
}

/** 次の年へ進む */
function goToNextYear() {
  state.year += 1;
  beginYear();
  render();
}

// ============================================================
// 3. 画面描画（Screens）
// ============================================================

const APP_EL = () => document.getElementById("app");

function render() {
  const screen = window.__currentScreen || "home";
  let html = "";
  if (window.__showingTutorial) {
    html = renderTutorialOverlay();
  } else if (!state || !state.started) {
    html = renderHomeNoSave();
  } else {
    switch (screen) {
      case "home": html = renderHome(); break;
      case "meeting": html = renderMeeting(); break;
      case "policies": html = renderPoliciesScreen(); break;
      case "residents": html = renderResidentsScreen(); break;
      case "records": html = renderRecordsScreen(); break;
      case "settings": html = renderSettingsScreen(); break;
      default: html = renderHome();
    }
  }
  APP_EL().innerHTML = html;
  renderNav();
}

function renderNav() {
  const navEl = document.getElementById("bottom-nav");
  if (!navEl) return;
  if (window.__showingTutorial) {
    navEl.innerHTML = "";
    return;
  }
  const tabs = [
    { id: "home", label: "ホーム", emoji: "🏠" },
    { id: "meeting", label: "まち会議", emoji: "🗣️" },
    { id: "policies", label: "政策", emoji: "🗂️" },
    { id: "residents", label: "住民", emoji: "👪" },
    { id: "records", label: "記録", emoji: "📖" },
    { id: "settings", label: "設定", emoji: "⚙️" },
  ];
  const current = window.__currentScreen || "home";
  navEl.innerHTML = tabs
    .map(
      (t) => `
      <button class="nav-btn ${t.id === current ? "active" : ""}" onclick="switchScreen('${t.id}')">
        <span class="nav-emoji">${t.emoji}</span>
        <span class="nav-label">${t.label}</span>
      </button>`
    )
    .join("");
}

function switchScreen(id) {
  if (!state || !state.started) {
    window.__currentScreen = "home";
  } else {
    window.__currentScreen = id;
  }
  render();
  window.scrollTo(0, 0);
}

// --- ホーム画面（セーブなし） ---
function renderHomeNoSave() {
  return `
    <div class="screen home-screen">
      <div class="title-card">
        <div class="title-emoji">🏘️</div>
        <h1>こどもまち会議</h1>
        <p class="subtitle">今日の議長は、あなたです。</p>
      </div>
      <div class="paper-card">
        <p>このゲームに「正解」はありません。<br>
        住民の声を聞いて、話し合いながら、<br>
        あなたの町をつくっていってください。</p>
        <p class="small-note">政策にはどれも「良いこと」と「困ること」があります。<br>
        遊んだあとに「どうしてその政策を選んだの？」と話してみてね。</p>
      </div>
      <button class="big-button primary" onclick="startNewGame()">はじめる</button>
    </div>
  `;
}

// --- ホーム画面（セーブあり／プレイ中） ---
function renderHome() {
  const s = state;
  return `
    <div class="screen home-screen">
      <div class="title-card small">
        <div class="title-emoji">🏘️</div>
        <h1>こどもまち会議</h1>
        <p class="subtitle">${TOWN_INITIAL.name}・${s.year}年目</p>
      </div>
      ${renderStatusPanel()}
      <button class="big-button primary" onclick="switchScreen('meeting')">まち会議へ進む</button>
      <button class="big-button ghost" onclick="confirmResetFromHome()">はじめからやり直す</button>
    </div>
  `;
}

function renderStatusPanel() {
  const s = state;
  const bars = STAT_KEYS.map((key) => {
    const meta = STAT_META[key];
    const val = s.stats[key];
    return `
      <div class="stat-row">
        <span class="stat-label">${meta.emoji} ${meta.label}</span>
        <div class="stat-bar-bg"><div class="stat-bar-fill" style="width:${val}%"></div></div>
        <span class="stat-value">${val}</span>
      </div>`;
  }).join("");
  return `
    <div class="paper-card status-panel">
      <div class="budget-row">
        <span class="budget-label">💰 財布</span>
        <span class="budget-value">${s.budget}</span>
      </div>
      ${bars}
    </div>
  `;
}

// --- まち会議画面（メインの年送りループ） ---
function renderMeeting() {
  const s = state;
  const phase = s.turn ? s.turn.phase : null;

  let phaseHtml = "";
  if (phase === "event") phaseHtml = renderPhaseEvent();
  else if (phase === "requests") phaseHtml = renderPhaseRequests();
  else if (phase === "deliberation") phaseHtml = renderPhaseDeliberation();
  else if (phase === "policies") phaseHtml = renderPhasePolicies();
  else if (phase === "result") phaseHtml = renderPhaseResult();

  return `
    <div class="screen meeting-screen">
      <div class="meeting-header">
        <span class="year-badge">${s.year}年目</span>
        <span class="budget-badge">💰 ${s.budget}</span>
      </div>
      ${phaseHtml}
    </div>
  `;
}

function renderPhaseEvent() {
  const s = state;
  const event = EVENTS.find((e) => e.id === s.turn.eventId);
  const notices = s.turn.yearNotices
    .map(
      (n) => `
      <div class="notice-card">
        <p><strong>${n.policyName}</strong>で「${n.eventName}」が起きました。</p>
        ${n.comment ? `<p class="comment-line">${getResident(n.comment.residentId).emoji} ${getResident(n.comment.residentId).name}「${n.comment.text}」</p>` : ""}
      </div>`
    )
    .join("");

  return `
    ${notices}
    <div class="card event-card">
      <div class="card-emoji">${event.emoji}</div>
      <h2>${event.title}</h2>
      <p>${event.content}</p>
      <div class="choice-list">
        ${event.choices
          .map(
            (c) => `<button class="choice-button" onclick="resolveEventChoice('${c.id}')">${c.label}</button>`
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderPhaseRequests() {
  const s = state;
  const requests = s.turn.requestIds.map((id) => REQUESTS.find((r) => r.id === id));
  const body =
    requests.length === 0
      ? `<p class="empty-note">今年は新しいお願いは届いていません。</p>`
      : requests
          .map((r) => {
            const res = getResident(r.residentId);
            return `
        <div class="card request-card urgency-${r.urgency}">
          <div class="card-emoji">${res.emoji}</div>
          <h3>${res.name}（${res.role}）からのお願い</h3>
          <p class="request-text">「${r.text}」</p>
          <span class="urgency-tag">緊急度：${r.urgency}</span>
        </div>`;
          })
          .join("");

  return `
    <h2 class="phase-title">📢 住民のお願い</h2>
    ${body}
    <button class="big-button primary" onclick="proceedFromRequests()">まち会議へ進む</button>
  `;
}

/** まち会議（話し合い）フェーズ：議題になっている政策への賛否と理由を表示する */
function renderPhaseDeliberation() {
  const s = state;
  const policy = getPolicy(s.turn.agendaPolicyId);
  const stances = POLICY_STANCES[s.turn.agendaPolicyId] || [];

  const voiceCards = stances
    .map((st) => {
      const res = getResident(st.residentId);
      const meta = STANCE_META[st.stance];
      return `
        <div class="card voice-card stance-${st.stance}">
          <div class="voice-top">
            <span class="voice-emoji">${res.emoji}</span>
            <span class="voice-name">${res.name}</span>
            <span class="stance-badge">${meta.emoji} ${meta.label}</span>
          </div>
          <p class="voice-reason">「${st.reason}」</p>
        </div>`;
    })
    .join("");

  return `
    <h2 class="phase-title">🗣️ まち会議</h2>
    <div class="card agenda-card">
      <div class="card-emoji">${policy.emoji}</div>
      <h3>議題：${policy.name}をしますか？</h3>
      <p class="policy-desc">${policy.description}</p>
    </div>
    <p class="small-note">住民の声を聞いてみましょう。全員が賛成する政策は、ほとんどありません。</p>
    ${voiceCards}
    <button class="big-button primary" onclick="proceedFromDeliberation()">政策を決める</button>
  `;
}

function renderPhasePolicies() {
  const s = state;
  const builtIds = s.builtPolicies.map((b) => b.policyId);
  const available = POLICIES.filter((p) => !builtIds.includes(p.id));
  const cost = getSelectedPolicyCost();
  const over = cost > s.budget;

  const cards = available
    .map((p) => {
      const selected = s.turn.selectedPolicyIds.includes(p.id);
      const effectsText = Object.entries(p.goodEffects)
        .map(([k, v]) => `${STAT_META[k].emoji}${v > 0 ? "+" : ""}${v}`)
        .join(" ");
      return `
        <div class="card policy-card ${selected ? "selected" : ""}" onclick="togglePolicySelection('${p.id}')">
          <div class="card-emoji">${p.emoji}</div>
          <h3>${p.name}</h3>
          <p class="policy-desc">${p.description}</p>
          <p class="policy-effect">良い効果：${effectsText}</p>
          <p class="policy-bad">困ること：${p.badEffectText}</p>
          <p class="policy-cost">実行費用 ${p.buildCost}／維持費 ${p.maintCost}</p>
        </div>`;
    })
    .join("");

  return `
    <h2 class="phase-title">🗳️ 今年の政策を選ぶ</h2>
    <p class="small-note">気になるカードをタップして選んでください。何も選ばなくても大丈夫です。</p>
    <div class="policy-grid">${cards}</div>
    <div class="sticky-footer">
      <p class="cost-summary ${over ? "over" : ""}">使うお金：${cost} ／ 財布：${s.budget}</p>
      <button class="big-button primary" ${over ? "disabled" : ""} onclick="confirmPolicies()">この内容で決める</button>
    </div>
  `;
}

function renderPhaseResult() {
  const s = state;
  const reactions = s.turn.reactions
    .map((r) => {
      const res = getResident(r.residentId);
      return `<div class="comment-bubble"><span class="comment-emoji">${res.emoji}</span><span><strong>${res.name}</strong>「${r.text}」</span></div>`;
    })
    .join("");

  const news = s.turn.news;
  const newsCard = `
    <div class="news-card">
      <p class="news-border">━━━━━━━━━━</p>
      <p class="news-title">${TOWN_INITIAL.name}ニュース</p>
      <p class="news-border">━━━━━━━━━━</p>
      <p class="news-headline">${news.headline}</p>
      <p class="news-body">${news.body}</p>
      <p class="news-small">一方</p>
      <p class="news-body">${news.downside}</p>
      <p class="news-border">━━━━━━━━━━</p>
    </div>`;

  const budgetDelta = s.budget - s.turn.startBudget;
  const budgetWhy = renderWhyRow("budget", "💰 財布", budgetDelta, s.turn.budgetReasons);

  const statWhyRows = STAT_KEYS
    .map((key) => {
      const delta = s.stats[key] - s.turn.startStats[key];
      if (delta === 0) return "";
      return renderWhyRow(key, `${STAT_META[key].emoji} ${STAT_META[key].label}`, delta, s.turn.statReasons[key]);
    })
    .join("");

  return `
    <h2 class="phase-title">📣 まち会議の結果</h2>
    ${newsCard}
    <div class="paper-card">
      <p class="small-note">数値をタップすると「なぜ変わったか」がわかります。</p>
      ${budgetWhy}
      ${statWhyRows}
    </div>
    <h3 class="phase-title">住民の反応</h3>
    ${reactions}
    <div class="paper-card chair-note-card">
      <h3>📝 議長メモ（今年のひとこと）</h3>
      <input id="chair-note-input" class="chair-input" type="text" maxlength="40" placeholder="例：公園を作りました">
      <input id="chair-reason-input" class="chair-input" type="text" maxlength="40" placeholder="理由（例：もっと遊びたいという声が多かったから）">
      <p class="small-note">あとで「記録」タブから見返せます。書かなくても大丈夫です。</p>
    </div>
    <button class="big-button primary" onclick="saveChairMemoAndAdvance()">次の年へ</button>
  `;
}

/** 「なぜ？」で理由を開閉できる1行分のHTMLを作る */
function renderWhyRow(key, label, delta, reasons) {
  if (delta === 0 || !reasons || reasons.length === 0) {
    return `<div class="why-row"><span>${label}</span><span class="why-delta">変化なし</span></div>`;
  }
  const sign = delta > 0 ? "+" : "";
  const reasonList = reasons.map((r) => `<li>${r}</li>`).join("");
  return `
    <div class="why-row">
      <button class="why-toggle" onclick="toggleWhy('why-${key}')">
        <span>${label}</span>
        <span class="why-delta">${sign}${delta}　なぜ？</span>
      </button>
      <ul id="why-${key}" class="why-reasons hidden">${reasonList}</ul>
    </div>`;
}

/** 「なぜ？」の理由リストの表示・非表示を切り替える */
function toggleWhy(id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle("hidden");
}

// --- 政策一覧（参考資料としての図鑑） ---
function renderPoliciesScreen() {
  const builtIds = state.builtPolicies.map((b) => b.policyId);
  const cards = POLICIES.map((p) => {
    const built = state.builtPolicies.find((b) => b.policyId === p.id);
    const effectsText = Object.entries(p.goodEffects)
      .map(([k, v]) => `${STAT_META[k].emoji}${v > 0 ? "+" : ""}${v}`)
      .join(" ");
    let statusText = "未実行";
    if (built) {
      statusText = `運営中（${built.builtYear}年目に実行）`;
      if (p.laterEvent && built.fired) statusText += `／「${p.laterEvent.name}」発生済み`;
    }
    return `
      <div class="card policy-card reference">
        <div class="card-emoji">${p.emoji}</div>
        <h3>${p.name}</h3>
        <p class="policy-desc">${p.description}</p>
        <p class="policy-effect">良い効果：${effectsText}</p>
        <p class="policy-bad">困ること：${p.badEffectText}</p>
        <p class="policy-cost">実行費用 ${p.buildCost}／維持費 ${p.maintCost}</p>
        <p class="policy-status">${statusText}</p>
      </div>`;
  }).join("");

  return `
    <div class="screen">
      <h2 class="phase-title">🗂️ 政策図鑑（全20枚）</h2>
      <p class="small-note">実際に選ぶのは「まち会議」タブです。ここでは内容を確認できます。</p>
      <div class="policy-grid">${cards}</div>
    </div>
  `;
}

// --- 住民一覧 ---
function renderResidentsScreen() {
  const cards = RESIDENTS.map((res) => {
    // 直近のコメントを履歴（新しい年から順）から探す
    let latestComment = null;
    for (const h of state.history) {
      if (!h.reactions) continue;
      const found = h.reactions.find((r) => r.residentId === res.id);
      if (found) {
        latestComment = found.text;
        break;
      }
    }
    return `
      <div class="card resident-card">
        <div class="card-emoji big">${res.emoji}</div>
        <h3>${res.name}（${res.age}歳・${res.role}）</h3>
        <p class="policy-desc">気にしていること：${res.concern}</p>
        <p class="policy-desc">好きな場所：${res.favorite}</p>
        ${latestComment ? `<p class="comment-line">最近のひとこと：「${latestComment}」</p>` : ""}
      </div>`;
  }).join("");

  return `
    <div class="screen">
      <h2 class="phase-title">👪 町の住民（6人）</h2>
      <div class="policy-grid">${cards}</div>
    </div>
  `;
}

// --- 記録 ---
function renderRecordsScreen() {
  if (state.history.length === 0) {
    return `<div class="screen"><h2 class="phase-title">📖 町の記録</h2><p class="empty-note">まだ記録がありません。まち会議を進めてみましょう。</p></div>`;
  }
  const items = state.history
    .map((h) => {
      const built = h.builtPolicyNames.length > 0 ? h.builtPolicyNames.join("、") : "なし";
      const notices = h.yearNotices.length > 0 ? `<p class="small-note">その後の変化：${h.yearNotices.join("／")}</p>` : "";
      const memo = h.chairNote
        ? `<div class="chair-memo-view"><p><strong>📝 議長メモ：</strong>${h.chairNote}</p>${h.chairReason ? `<p class="small-note">理由：${h.chairReason}</p>` : ""}</div>`
        : "";
      return `
        <div class="card record-card">
          <h3>${h.year}年目</h3>
          <p>できごと：${h.eventTitle}（選んだ対応：${h.eventChoiceLabel}）</p>
          <p>実行した政策：${built}</p>
          ${notices}
          ${h.news ? `<p class="small-note">📰 ${h.news.headline}</p>` : ""}
          ${memo}
          <p class="small-note">年末の財布：${h.budgetSnapshot}</p>
        </div>`;
    })
    .join("");

  return `
    <div class="screen">
      <h2 class="phase-title">📖 町の記録</h2>
      ${items}
    </div>
  `;
}

// --- 設定 ---
function renderSettingsScreen() {
  return `
    <div class="screen">
      <h2 class="phase-title">⚙️ 設定</h2>
      <div class="paper-card">
        <p>こどもまち会議 v${GAME_VERSION}</p>
        <p class="small-note">このゲームは「正しい政策を当てるゲーム」ではありません。<br>
        あなたは「議長」として、住民の声を聞き、整理し、最後に決める役割です。<br>
        遊び終わったら、ぜひ「どうしてその政策を選んだの？」を話し合ってみてください。</p>
      </div>
      <button class="big-button ghost" onclick="replayTutorial()">チュートリアルをもう一度見る</button>
      <button class="big-button ghost danger" onclick="confirmResetFromSettings()">データを消してはじめから</button>
    </div>
  `;
}

// ============================================================
// 4. ナビゲーション・初期化
// ============================================================

function startNewGame() {
  state = createNewState();
  beginYear();
  window.__currentScreen = "home";
  if (!state.tutorialSeen) {
    window.__tutorialStep = 0;
    window.__showingTutorial = true;
  }
  saveState();
  render();
}

/** チュートリアルの1画面を描画する */
function renderTutorialOverlay() {
  const stepIndex = window.__tutorialStep || 0;
  const step = TUTORIAL_STEPS[stepIndex];
  const isLast = stepIndex === TUTORIAL_STEPS.length - 1;
  return `
    <div class="screen tutorial-screen">
      <div class="card tutorial-card">
        <div class="card-emoji big">${SECRETARY.emoji}</div>
        <p class="small-note">${SECRETARY.name}（${SECRETARY.role}）</p>
        <h2>${step.title}</h2>
        <p>${step.text}</p>
      </div>
      <p class="small-note tutorial-progress">${stepIndex + 1} / ${TUTORIAL_STEPS.length}</p>
      <button class="big-button primary" onclick="nextTutorialStep()">${isLast ? "はじめる" : "次へ"}</button>
      ${isLast ? "" : `<button class="big-button ghost" onclick="skipTutorial()">スキップする</button>`}
    </div>
  `;
}

function nextTutorialStep() {
  const nextIndex = (window.__tutorialStep || 0) + 1;
  if (nextIndex >= TUTORIAL_STEPS.length) {
    skipTutorial();
    return;
  }
  window.__tutorialStep = nextIndex;
  render();
}

function skipTutorial() {
  window.__showingTutorial = false;
  if (state) {
    state.tutorialSeen = true;
    saveState();
  }
  render();
}

/** 設定画面からチュートリアルをもう一度見る */
function replayTutorial() {
  window.__tutorialStep = 0;
  window.__showingTutorial = true;
  render();
}

function confirmResetFromHome() {
  if (confirm("これまでの記録は消えます。はじめからやり直しますか？")) {
    resetSaveData();
    startNewGame();
  }
}

function confirmResetFromSettings() {
  if (confirm("これまでの記録は消えます。本当によろしいですか？")) {
    resetSaveData();
    window.__currentScreen = "home";
    render();
  }
}

function initApp() {
  const loaded = loadState();
  // データ構造が大きく変わるバージョンアップでは、古いセーブを引き継がない
  if (loaded && loaded.version === GAME_VERSION) {
    state = loaded;
    if (!state.turn) beginYear();
    if (typeof state.tutorialSeen === "undefined") state.tutorialSeen = true; // 既存プレイヤーには出さない
  } else {
    if (loaded) resetSaveData(); // バージョンが違う古いセーブは削除する
    state = createNewState();
    state.started = false;
  }
  window.__currentScreen = "home";
  render();
}

document.addEventListener("DOMContentLoaded", initApp);
