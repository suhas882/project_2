/* Remitra web prototype. Synthetic demo data only (persona: Maya, rheumatoid arthritis). */
(() => {
'use strict';

/* ================= icons (line style) ================= */
const P = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  plus: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  spark: '<path d="M10 3l1.8 4.7L16.5 9.5l-4.7 1.8L10 16l-1.8-4.7L3.5 9.5l4.7-1.8z"/><path d="M18 14l.9 2.1L21 17l-2.1.9L18 20l-.9-2.1L15 17l2.1-.9z"/>',
  trend: '<path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 5-6"/>',
  team: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.5 3.3-5.5 6.5-5.5s5.9 2 6.5 5.5"/><circle cx="17" cy="8.5" r="2.8"/><path d="M17 13.8c2.4.2 4.1 1.9 4.5 4.7"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  barcode: '<path d="M4 5v14M7 5v14M10 5v14M13 5v14M15.5 5v14M18 5v14M20 5v14"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  back: '<path d="m15 5-7 7 7 7"/>',
  chev: '<path d="m9 5 7 7-7 7"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z"/><path d="m8.8 12 2.2 2.2 4.3-4.4"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
  flask: '<path d="M9 3h6M10 3v6L4.5 19a1.3 1.3 0 0 0 1.1 2h12.8a1.3 1.3 0 0 0 1.1-2L14 9V3"/><path d="M7 15h10"/>',
  doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1"/>',
  send: '<path d="M21 3 3 10.5l7 3 3 7z"/><path d="m10 13.5 4-4"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  pill: '<rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-35 12 12)"/><path d="m9.5 8.5 5 7"/>',
  pencil: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  repeat: '<path d="M4 11V9a3 3 0 0 1 3-3h12l-3-3M20 13v2a3 3 0 0 1-3 3H5l3 3"/>',
  activity: '<path d="M3 12h4l3-7 4 14 3-7h4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  download: '<path d="M12 4v12m-5-5 5 5 5-5M4 20h16"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  flame: '<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-5 0 2 1 3 2 3 0-3-1-5.5.5-8z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v5M12 17.5v.5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M15 8l2 2"/>',
};
const ic = (n, s = 22, sw = 1.9) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ================= synthetic demo data ================= */
const TODAY_LABEL = 'Tuesday, December 15';
const seedMeals = () => ([
  { id: 'm1', nm: 'Oatmeal, blueberries, walnuts', tm: '7:40 AM', tag: 'High fiber', emoji: '🥣', bg: '#F1E4CE' },
  { id: 'm2', nm: 'Coffee with oat milk', tm: '8:05 AM', tag: 'Caffeine', emoji: '☕', bg: '#EFE3D9' },
]);
// weekly RAPID3, Oct 6 to Dec 8 (synthetic)
const RAPID3_WEEKS = [
  ['Oct 6', 9], ['Oct 13', 10], ['Oct 20', 8.3], ['Oct 27', 11.2], ['Nov 3', 9.3],
  ['Nov 10', 7.6], ['Nov 17', 6.7], ['Nov 24', 6.7], ['Dec 1', 5.6], ['Dec 8', 6],
];
const PROMIS = [
  ['Physical function', 41, 'lower is worse'], ['Anxiety', 53, 'higher is worse'], ['Depression', 49, 'higher is worse'],
  ['Fatigue', 58, 'higher is worse'], ['Sleep disturbance', 54, 'higher is worse'], ['Social roles', 46, 'lower is worse'],
  ['Pain interference', 57, 'higher is worse'],
];
const SYMPTOMS = ['Fatigue', 'Pain', 'GI discomfort', 'Skin', 'Sleep quality', 'Mood', 'Stress'];
// deterministic pseudo-random for 14-day symptom history
const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
const SYM_HIST = SYMPTOMS.map((n, i) => {
  const base = [4.5, 4, 2, 1.5, 6.5, 6.5, 4][i];
  return Array.from({ length: 14 }, (_, d) => Math.max(0, Math.min(10, +(base + (rnd() - .5) * 3 - d * (i < 2 ? .07 : 0)).toFixed(1))));
});

const CHECKIN_Q = [
  { k: 'fatigue', q: 'How much fatigue did you have today?', lo: 'None', hi: 'Worst' },
  { k: 'pain', q: 'How much joint pain did you have today?', lo: 'None', hi: 'Worst' },
  { k: 'gi', q: 'How much stomach or gut discomfort today?', lo: 'None', hi: 'Worst' },
  { k: 'skin', q: 'How bothersome were skin symptoms today?', lo: 'None', hi: 'Worst' },
  { k: 'sleep', q: 'How well did you sleep last night?', lo: 'Very badly', hi: 'Very well', rev: true },
  { k: 'mood', q: 'How was your mood today?', lo: 'Very low', hi: 'Very good', rev: true },
  { k: 'stress', q: 'How stressed did you feel today?', lo: 'Not at all', hi: 'Extremely' },
];
const RAPID3_Q = [
  { k: 'fn', q: 'Over the past week, how hard were daily activities like dressing, walking, or lifting a cup?', lo: 'No difficulty', hi: 'Unable to do' },
  { k: 'rpain', q: 'How much pain have you had because of your condition over the past week?', lo: 'No pain', hi: 'Pain as bad as it could be' },
  { k: 'glob', q: 'Considering everything, how well or poorly are you doing this week?', lo: 'Very well', hi: 'Very poorly' },
];

const rapidCat = s => s <= 3 ? ['Remission', 'teal'] : s <= 6 ? ['Low', 'teal'] : s <= 12 ? ['Moderate', 'amber'] : ['High', 'red'];

/* ================= state ================= */
const KEY = 'remitra-demo-v1';
const fresh = () => ({
  route: 'onboard', step: 3, prev: 'today',
  name: 'Maya', conditions: ['Rheumatoid arthritis'], goals: ['Find food triggers', 'Better visits'],
  consent: { app: true, health: true, ai: true, research: false },
  healthConnected: true,
  meals: seedMeals(), draft: null,
  checkin: { done: false, i: 0, ans: {}, result: null },
  labs: { pending: null, saved: [{ nm: 'CRP', v: 14, u: 'mg/L', d: 'Oct 6' }] },
  test: { agreed: false, remind: true, started: false },
  trendTab: 'RAPID3', why: {},
  chat: [],
  share: { pdf: true, fhir: false, link: false, linkActive: false },
  supplements: ['Methotrexate 15 mg weekly (logged as exposure)', 'Folic acid 1 mg daily', 'Vitamin D3 2000 IU daily'],
  access: [['Dec 15 09:12', 'You', 'Viewed Trends'], ['Dec 14 18:40', 'You', 'Logged dinner'], ['Dec 8 10:05', 'You', 'Saved lab results']],
});
let S;
try { S = JSON.parse(localStorage.getItem(KEY)) || fresh(); } catch { S = fresh(); }
if (S.draft && (S.draft.stage !== 'review' || (S.draft.items || []).some(i => i.f))) { S.draft = null; if (S.route === 'meal') S.route = 'log'; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };

/* ================= screens registry (for the side panel) ================= */
const SCREENS = [
  ['onboard', 'Onboarding and consent', 'F10'],
  ['today', 'Today', 'F1 F2 F3 F7'],
  ['meal', 'Meal photo review', 'F1'],
  ['checkin', 'Daily check-in', 'F2'],
  ['labs', 'Lab report review', 'F4'],
  ['insights', 'Personal insights', 'F5'],
  ['ask', 'Ask Remitra', 'F8'],
  ['testit', 'Test It experiment', 'F6'],
  ['trends', 'Trends', 'F2 F4'],
  ['care', 'Care team report', 'F9'],
];
const NOTES = {
  onboard: ['Four steps: account (passkey), conditions and goals, consent, connect health data.', 'Separate opt-ins; "Use Remitra" is required, research is off by default.', 'Consent is stored as a versioned FHIR Consent resource.'],
  today: ['Flare outlook is labeled "prototype estimate" (synthetic model).', 'Photo, voice and barcode buttons are at least 48 px tall.', 'Tap the M avatar for Settings.'],
  meal: ['Photo: live camera or upload. An on-device demo model (MobileNet) names the main food; you confirm or edit every item.', 'Voice: browser speech recognition, then you check the transcript.', 'Barcode: camera scan, photo or typed number, looked up in Open Food Facts.', 'Nutrients from USDA FoodData Central. Nothing is saved until Confirm meal.'],
  checkin: ['Seven daily items, one tap each, then weekly RAPID3 (0 to 30).', 'RAPID3 bands: remission ≤ 3, low > 3 to 6, moderate > 6 to 12, high > 12.', 'Voice answer is simulated.'],
  labs: ['Values read from a lab-report photo (simulated).', 'User confirms every value; unclear units are flagged, never guessed.', 'LOINC-coded; photo deleted after save.'],
  insights: ['"Associated with" wording, never "causes".', 'Likely at 0.80 or higher, Possible 0.60 to 0.79 [est.].', 'Minimum-data rule shows "Not enough data".'],
  ask: ['Answers from the user\'s own data and approved sources; sources shown on every answer.', 'Medication and diagnosis questions are refused with a care-team pointer.', 'Try: "Should I stop my methotrexate?"'],
  testit: ['A-B-A-B plan: usual, low sugar, usual, low sugar.', 'Cannot start without the clinician-agreement check. Stop any time.'],
  trends: ['RAPID3 plotted against published category bands.', 'Labs shown as text, not on the RAPID3 axis.', 'Each chart has a text alternative.'],
  care: ['One tap to a tagged PDF, FHIR bundle or expiring, revocable link.'],
  log: ['Log tab: meal (photo, voice, barcode, text, repeat), symptoms, labs, supplements and medications.'],
  settings: ['Consents, research mode, export, delete account and access log.'],
};

/* ================= layout helpers ================= */
const statusbar = (dark) => `<div class="statusbar${dark ? ' dark' : ''}"><span>9:41</span><div class="island"></div><span class="sb-icons">
  <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5" width="3" height="7" rx="1"/><rect x="10" y="2.5" width="3" height="9.5" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
  <svg width="26" height="12" viewBox="0 0 26 12" aria-hidden="true"><rect x=".5" y=".5" width="22" height="11" rx="3" fill="none" stroke="currentColor"/><rect x="2" y="2" width="19" height="8" rx="2" fill="currentColor"/><rect x="23.5" y="4" width="2" height="4" rx="1" fill="currentColor"/></svg></span></div>`;
const TABS = [['today', 'home', 'Today'], ['log', 'plus', 'Log'], ['insights', 'spark', 'Insights'], ['trends', 'trend', 'Trends'], ['care', 'team', 'Care team']];
const TAB_OF = { today: 'today', log: 'log', meal: 'log', labs: 'log', checkin: 'log', insights: 'insights', ask: 'insights', testit: 'insights', trends: 'trends', care: 'care' };
const tabbar = (active) => `<nav class="tabbar" aria-label="Main">${TABS.map(([r, i, l]) =>
  `<button data-act="go" data-arg="${r}" ${active === r ? 'aria-current="page"' : ''}>${ic(i, 24, active === r ? 2.2 : 1.8)}<span>${l}</span></button>`).join('')}</nav>`;
const topbar = (title, backTo) => `<div class="topbar"><button class="back" data-act="go" data-arg="${backTo}" aria-label="Back">${ic('back', 24, 2.2)}</button><span class="title">${title}</span><span class="demo-badge">Synthetic demo data</span></div>`;
const sw = (on, act, arg, label, disabled) => `<button class="switch" role="switch" aria-checked="${!!on}" aria-label="${esc(label)}" data-act="${act}" data-arg="${arg || ''}" ${disabled ? 'disabled' : ''}></button>`;

/* ================= views ================= */
const V = {};

V.onboard = () => {
  const st = S.step;
  const segs = `<div class="segs" aria-hidden="true">${[1, 2, 3, 4].map(i => `<span class="${i <= st ? 'on' : ''}"></span>`).join('')}</div>`;
  const names = ['Account', 'Conditions and goals', 'Consent', 'Connect health data'];
  let body = '';
  if (st === 1) {
    body = `<h1 class="big">Welcome to Remitra</h1><p class="sub">Your friend on the way to remission. Create your account with a passkey: no password to remember.</p>
      <div class="field"><label for="nm">First name or nickname</label><input id="nm" value="${esc(S.name)}" data-input="name" autocomplete="off"></div>
      <div class="card row"><div class="ico teal">${ic('key')}</div><div class="grow"><b>Passkey</b><div class="note">Uses Face ID, fingerprint or your device PIN.</div></div></div>
      <p class="note">${ic('info', 14)} Demo build: no account is created and nothing leaves this browser.</p>
      <button class="btn primary block" data-act="obNext" style="margin-top:12px">${ic('key', 20)} Create passkey</button>`;
  } else if (st === 2) {
    const conds = ['Rheumatoid arthritis', "Crohn's disease", 'Lupus (SLE)', 'Ulcerative colitis', 'Psoriasis', 'Celiac disease', "Hashimoto's", 'Multiple sclerosis', 'At risk / early signs', 'Not sure yet'];
    const goals = ['Find food triggers', 'Fewer flares', 'Better visits', 'Track labs', 'Join research'];
    body = `<h1 class="big">What are you managing?</h1><p class="sub">Pick all that apply. Your daily check-in adapts to these.</p>
      <div class="choice-grid">${conds.map(c => `<button class="choice" aria-pressed="${S.conditions.includes(c)}" data-act="toggleCond" data-arg="${esc(c)}">${esc(c)}</button>`).join('')}</div>
      <h2 class="mid" style="font-size:18px">Your goals</h2>
      <div class="chips">${goals.map(g => `<button class="pill pill-btn ${S.goals.includes(g) ? 'teal' : 'gray'}" aria-pressed="${S.goals.includes(g)}" data-act="toggleGoal" data-arg="${esc(g)}">${S.goals.includes(g) ? ic('check', 14, 2.6) : ''}${esc(g)}</button>`).join('')}</div>
      <p class="note" style="margin-top:12px">Weekly disease module for rheumatoid arthritis: RAPID3. Others are added as configuration with our clinical advisor.</p>
      <div class="btn-row"><button class="btn ghost" data-act="obBack">Back</button><button class="btn primary" data-act="obNext" ${S.conditions.length ? '' : 'disabled'}>Continue</button></div>`;
  } else if (st === 3) {
    const C = S.consent;
    const row = (k, icon, cls, title, desc, req) => `<div class="card"><div class="ico ${cls}">${ic(icon)}</div><div class="grow"><div class="ttl">${title}${req ? '<span class="req">Required</span>' : ''}</div><div class="desc">${desc}</div></div>${sw(C[k], 'consent', k, title, req)}</div>`;
    body = `<h1 class="big">Your data,<br>your choices</h1><p class="sub">Turn on only what you want. Change any of these later in Settings.</p>
      <div class="consent">
        ${row('app', 'shield', 'teal', 'Use Remitra', 'Store your logs securely to run the app.', true)}
        ${row('health', 'heart', 'red', 'Read Apple Health', 'Sleep, resting heart rate, HRV, steps. Read only. (Health Connect on Android.)')}
        ${row('ai', 'spark', 'violet', 'AI reads meal and lab photos', 'Deleted after processing. Never used to train models.')}
        ${row('research', 'flask', 'blue', 'Share for research', 'De-identified data for approved autoimmune studies. Off unless you turn it on.')}
      </div>
      <p class="note row" style="gap:6px">${ic('shield', 16)} We never sell your health data. <button class="linkbtn" data-act="modal" data-arg="privacy">Privacy notice</button></p>
      <div class="btn-row"><button class="btn ghost" data-act="obBack">Back</button><button class="btn primary" data-act="obNext">Continue</button></div>`;
  } else {
    body = `<h1 class="big">Connect health data</h1><p class="sub">Remitra reads daily totals only after you allow it. You can disconnect any time.</p>
      <div class="card row"><div class="ico red">${ic('heart')}</div><div class="grow"><b>Apple Health</b><div class="note">Sleep · resting heart rate · HRV · steps</div></div>${S.consent.health ? `<span class="pill teal">${ic('check', 14, 2.6)} ${S.healthConnected ? 'Connected' : 'Allowed'}</span>` : '<span class="pill gray">Off</span>'}</div>
      ${S.consent.health ? '' : `<p class="note">Health data is off in your consent choices. Go back to turn it on, or continue without it.</p>`}
      <div class="card row"><div class="ico indigo">${ic('activity')}</div><div class="grow"><b>What we read</b><div class="note">Daily aggregates stored as FHIR Observations. Raw minute-level data stays on your phone.</div></div></div>
      <div class="btn-row"><button class="btn ghost" data-act="obBack">Back</button><button class="btn primary" data-act="obDone">Finish</button></div>`;
  }
  return `${statusbar()}<div class="view">${segs}<div class="muted" style="font-size:14px">Step ${st} of 4 · ${names[st - 1]}</div>${body}</div><div class="homebar"></div>`;
};

V.today = () => {
  const ci = S.checkin.done
    ? `<div class="card row"><div class="ico teal">${ic('check', 22, 2.4)}</div><div class="grow"><b>Check-in done</b><div class="note">${S.checkin.result ? `RAPID3 ${S.checkin.result.r3} · ${rapidCat(S.checkin.result.r3)[0]}` : 'Thanks, see you tomorrow.'}</div></div><button class="pill teal pill-btn" data-act="go" data-arg="trends">View</button></div>`
    : `<div class="card row"><div class="ico teal">${ic('check', 22, 2.4)}</div><div class="grow"><b style="font-size:16px">Daily check-in</b><div class="note" style="font-size:14px">About 60 seconds, plus weekly RAPID3</div></div><button class="pill teal pill-btn" style="min-height:40px;padding:0 16px;font-size:15px" data-act="startCheckin">Start</button></div>`;
  const meals = S.meals.map(m => `<div class="meal"><div class="thumb" style="background:${m.bg}" aria-hidden="true">${m.emoji}</div><div class="grow"><div class="nm">${esc(m.nm)}</div><div class="tm">${m.tm}</div></div>${m.tag ? `<span class="pill ${m.tag === 'Caffeine' || m.tag === 'Dairy' ? 'gray' : 'teal'}">${esc(m.tag)}</span>` : ''}</div>`).join('');
  return `${statusbar()}<div class="view">
    <div class="hello"><div><div class="date">${TODAY_LABEL}</div><h1>Good morning, ${esc(S.name)}</h1><span class="demo-badge">Synthetic demo data</span></div><button class="avatar" data-act="go" data-arg="settings" aria-label="Profile and settings">${esc(S.name[0] || 'M')}</button></div>
    <button class="outlook" data-act="modal" data-arg="outlook">
      <div class="ring"><svg viewBox="0 0 78 78"><circle cx="39" cy="39" r="32" stroke="rgba(255,255,255,.18)" stroke-width="7" fill="none"/><circle cx="39" cy="39" r="32" stroke="#7FF0D0" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="40 201" transform="rotate(-90 39 39)"/></svg>Low</div>
      <div><div class="k">7-DAY FLARE OUTLOOK</div><div class="h">Steady sleep and symptoms this week</div><div class="s">Prototype estimate · tap for details</div></div>
    </button>
    <div class="quick">
      <button data-act="logMeal" data-arg="photo"><span class="ico teal" style="width:40px;height:40px">${ic('camera')}</span>Photo</button>
      <button data-act="logMeal" data-arg="voice"><span class="ico violet" style="width:40px;height:40px">${ic('mic')}</span>Voice</button>
      <button data-act="logMeal" data-arg="barcode"><span class="ico amber" style="width:40px;height:40px">${ic('barcode')}</span>Barcode</button>
    </div>
    ${ci}
    <div class="card"><div class="eyebrow">Meals today</div>${meals || '<p class="note">No meals yet.</p>'}</div>
    ${S.consent.health ? `<div class="card row"><div class="ico indigo">${ic('moon')}</div><div class="grow"><div class="note" style="font-size:14px">Last night · Apple Health</div><b style="font-size:17px">7 h 20 m · HRV 48 ms</b></div>
      <svg class="spark" viewBox="0 0 110 36" aria-label="HRV over the last 7 nights, steady"><polyline points="2,26 18,30 34,14 50,22 66,18 82,20 108,20" fill="none" stroke="#4B5BB5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`
      : `<div class="card row"><div class="ico indigo">${ic('moon')}</div><div class="grow"><b>Sleep and HRV are off</b><div class="note">Turn on health data in Settings to see them.</div></div></div>`}
  </div>${tabbar('today')}<div class="homebar" style="background:#fff"></div>`;
};

V.log = () => {
  const opt = (act, arg, icon, cls, t, d) => `<button class="card row" style="width:100%;border:0;text-align:left;min-height:72px" data-act="${act}" data-arg="${arg}"><span class="ico ${cls}">${ic(icon)}</span><span class="grow"><b style="font-size:16px">${t}</b><br><span class="note">${d}</span></span>${ic('chev', 20)}</button>`;
  return `${statusbar()}<div class="view">
    <div class="topbar"><span class="title" style="font-size:28px;font-weight:800">Log</span><span class="demo-badge" style="margin-left:auto">Synthetic demo data</span></div>
    <div class="eyebrow">Meal</div>
    ${opt('logMeal', 'photo', 'camera', 'teal', 'Photo', 'AI finds foods and portions')}
    ${opt('logMeal', 'voice', 'mic', 'violet', 'Voice', 'Say what you ate')}
    ${opt('logMeal', 'barcode', 'barcode', 'amber', 'Barcode', 'Packaged foods via Open Food Facts')}
    ${opt('logMeal', 'text', 'pencil', 'gray', 'Type it', 'Quick text entry')}
    ${opt('repeatMeal', '', 'repeat', 'teal', 'Repeat a meal', 'Oatmeal, blueberries, walnuts')}
    <div class="eyebrow" style="margin-top:18px">Health</div>
    ${opt('startCheckin', '', 'activity', 'teal', 'Symptoms check-in', S.checkin.done ? 'Done today · tap to redo' : 'About 60 seconds')}
    ${opt('startLabs', '', 'flask', 'blue', 'Lab results', 'Photo of a report, or enter by hand')}
    ${opt('modal', 'meds', 'pill', 'violet', 'Supplements and medications', `${S.supplements.length} logged as exposures`)}
  </div>${tabbar('log')}<div class="homebar" style="background:#fff"></div>`;
};

/* ================= meal logging: real camera, voice, barcode, text ================= */
const media = { stream: null, rec: null, qr: null, photo: null, model: null, modelP: null, search: null };
const stopMedia = () => {
  if (media.stream) { media.stream.getTracks().forEach(t => t.stop()); media.stream = null; }
  if (media.rec) { const r = media.rec; media.rec = null; r.onend = null; try { r.abort(); } catch {} }
  if (media.qr) { const q = media.qr; media.qr = null; q.stop().catch(() => {}).finally(() => { try { q.clear(); } catch {} }); }
};
const scripts = {};
const loadScript = src => scripts[src] || (scripts[src] = new Promise((res, rej) => {
  const s = document.createElement('script'); s.src = src; s.onload = res;
  s.onerror = () => { delete scripts[src]; rej(new Error('Could not load ' + src)); };
  document.head.appendChild(s);
}));
const loadModel = () => media.modelP || (media.modelP = (async () => {
  await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js');
  await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js');
  media.model = await window.mobilenet.load({ version: 2, alpha: 1.0 });
  return media.model;
})().catch(e => { media.modelP = null; throw e; }));
const loadQr = () => loadScript('https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js');
const setStatus = t => { const el = document.getElementById('mstatus'); if (el) el.textContent = t; };

// ImageNet classes the on-device demo model can name, mapped to [display name, USDA query, typical grams]
const FOOD_LABELS = {
  'banana': ['Banana', 'bananas raw', 118], 'pizza': ['Pizza', 'pizza cheese', 107], 'cheeseburger': ['Cheeseburger', 'cheeseburger', 200],
  'hotdog': ['Hot dog', 'frankfurter', 100], 'bagel': ['Bagel', 'bagels plain', 105], 'pretzel': ['Pretzel', 'pretzels hard', 60],
  'french loaf': ['French bread', 'bread french', 64], 'burrito': ['Burrito', 'burrito beans', 220], 'guacamole': ['Guacamole', 'guacamole', 60],
  'consomme': ['Clear soup', 'soup broth', 240], 'hot pot': ['Soup or stew', 'soup vegetable', 240], 'trifle': ['Layered dessert', 'pudding vanilla', 150],
  'ice cream': ['Ice cream', 'ice cream vanilla', 66], 'ice lolly': ['Ice pop', 'frozen novelties fruit', 60], 'meat loaf': ['Meatloaf', 'meatloaf', 115],
  'potpie': ['Pot pie', 'chicken pot pie', 200], 'carbonara': ['Pasta carbonara', 'spaghetti cooked', 250], 'chocolate sauce': ['Chocolate sauce', 'chocolate syrup', 38],
  'dough': ['Bread', 'bread white', 50], 'mashed potato': ['Mashed potatoes', 'potatoes mashed', 210], 'head cabbage': ['Cabbage', 'cabbage raw', 90],
  'broccoli': ['Broccoli', 'broccoli cooked', 90], 'cauliflower': ['Cauliflower', 'cauliflower cooked', 100], 'zucchini': ['Zucchini', 'squash zucchini raw', 120],
  'spaghetti squash': ['Spaghetti squash', 'squash spaghetti cooked', 155], 'acorn squash': ['Acorn squash', 'squash acorn baked', 205],
  'butternut squash': ['Butternut squash', 'squash butternut baked', 205], 'cucumber': ['Cucumber', 'cucumber raw', 100], 'artichoke': ['Artichoke', 'artichokes cooked', 120],
  'bell pepper': ['Bell pepper', 'peppers sweet red raw', 120], 'mushroom': ['Mushrooms', 'mushrooms white raw', 70], 'granny smith': ['Apple', 'apples raw with skin', 182],
  'strawberry': ['Strawberries', 'strawberries raw', 150], 'orange': ['Orange', 'oranges raw', 140], 'lemon': ['Lemon', 'lemons raw', 58], 'fig': ['Figs', 'figs raw', 50],
  'pineapple': ['Pineapple', 'pineapple raw', 165], 'jackfruit': ['Jackfruit', 'jackfruit raw', 165], 'custard apple': ['Custard apple', 'custard-apple raw', 100],
  'pomegranate': ['Pomegranate', 'pomegranates raw', 87], 'corn': ['Corn', 'corn sweet yellow cooked', 150], 'ear': ['Corn on the cob', 'corn sweet yellow cooked', 100],
  'espresso': ['Espresso', 'coffee espresso', 60], 'coffee mug': ['Coffee', 'coffee brewed', 240], 'eggnog': ['Eggnog', 'eggnog', 250], 'red wine': ['Red wine', 'wine table red', 150],
  'soup bowl': ['Soup', 'soup vegetable', 240],
};
const MEAL_CONTEXT = /^(plate|mixing bowl|tray|dining table|restaurant|frying pan|wok|caldron|crock pot|spatula|wooden spoon|ladle|cup|soup bowl)$/;
const PORTIONS = [[/coffee|tea|milk|juice|latte|smoothie/, 240], [/soda|cola|beer/, 355], [/rice/, 158], [/pasta|noodle|spaghetti/, 140], [/eggs/, 100], [/egg/, 50],
  [/toast|bread/, 30], [/sandwich|wrap/, 150], [/apple/, 182], [/banana/, 118], [/orange/, 140], [/salad/, 150], [/soup|stew|curry|dal/, 240],
  [/chicken|salmon|fish|tuna|turkey|pork|beef|steak|tofu/, 120], [/yogurt|yoghurt/, 170], [/oat|porridge/, 234], [/cereal|granola/, 40],
  [/cheese/, 28], [/nut|almond|walnut|cashew/, 28], [/cookie|biscuit/, 30], [/cake|muffin|donut/, 80], [/pizza/, 107], [/burger/, 200],
  [/fries|chips/, 117], [/potato/, 170], [/avocado/, 150], [/berr/, 150], [/oil|butter/, 14]];
const gramsFor = name => (PORTIONS.find(([re]) => re.test(name.toLowerCase())) || [0, 100])[1];
// per-100 g fallback when the USDA API is unreachable
const LOCAL_NUT = { banana: [89, 1.1, 2.6, 12], apple: [52, .3, 2.4, 10], orange: [47, .9, 2.4, 9], berr: [57, .7, 2.4, 10], rice: [130, 2.7, .4, 0], pasta: [158, 5.8, 1.8, .6],
  toast: [293, 9, 2.6, 5], bread: [265, 9, 2.7, 5], egg: [155, 12.6, 0, 1.1], milk: [61, 3.2, 0, 5], cheese: [403, 23, 0, .5], butter: [717, .9, 0, .1], yog: [61, 3.5, 0, 4.7],
  coffee: [1, .1, 0, 0], tea: [1, 0, 0, 0], juice: [45, .7, .2, 8.4], soda: [41, 0, 0, 10], chicken: [165, 31, 0, 0], salmon: [208, 20, 0, 0], fish: [105, 23, 0, 0],
  beef: [250, 26, 0, 0], steak: [250, 26, 0, 0], tofu: [76, 8, .3, .6], bean: [132, 8.9, 8.7, .3], oat: [71, 2.5, 1.7, .3], potato: [93, 2.5, 2.2, 1.2], salad: [15, 1.3, 1.5, 1.5],
  broccoli: [35, 2.4, 3.3, 1.4], spinach: [23, 2.9, 2.2, .4], tomato: [18, .9, 1.2, 2.6], avocado: [160, 2, 6.7, .7], almond: [579, 21, 12.5, 4.4], walnut: [654, 15, 6.7, 2.6],
  nut: [607, 20, 7, 4], pizza: [266, 11, 2.3, 3.6], burger: [254, 13, 1.1, 4], sandwich: [250, 11, 2, 4], 'ice cream': [207, 3.5, .7, 21], cookie: [488, 5, 2, 30], cake: [371, 4, 1, 35] };
let nutCache = {};
try { nutCache = JSON.parse(localStorage.getItem('remitra-nut-cache')) || {}; } catch {}
const saveNut = () => { try { localStorage.setItem('remitra-nut-cache', JSON.stringify(nutCache)); } catch {} };
async function usdaSearch(q, n = 8) {
  const key = (window.REMITRA_CONFIG || {}).usdaKey || 'DEMO_KEY';
  const r = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(key)}&pageSize=${n}&dataType=Foundation,SR%20Legacy&query=${encodeURIComponent(q)}`);
  if (!r.ok) { const e = new Error('USDA ' + r.status); e.limit = r.status === 429; throw e; }
  const j = await r.json();
  return (j.foods || []).map(f => {
    const g = id => { const x = (f.foodNutrients || []).find(k => k.nutrientId === id); return x ? x.value : undefined; };
    return { fdc: f.fdcId, desc: f.description, n: { kcal: g(1008) ?? g(2047) ?? g(2048) ?? 0, pro: g(1003) || 0, fib: g(1079) || 0, sug: g(2000) || 0 } };
  });
}
const bestMatch = (q, list) => {
  const words = q.toLowerCase().split(/\s+/).filter(w => w.length > 1);
  return list.map(f => {
    const d = f.desc.toLowerCase();
    let s = words.filter(w => d.includes(w.replace(/s$/, ''))).length * 10 - d.length / 15;
    if (d.startsWith(words[0] ? words[0].replace(/s$/, '') : '')) s += 4;
    if (/\b(raw|cooked|plain|brewed|baked|boiled)\b/.test(d)) s += 3;
    if (/dehydrated|powder|infant|baby food|formula/.test(d)) s -= 10;
    if (/whole/.test(d)) s += 3;
    for (const w of ['yolk', 'white', 'dried', 'frozen', 'canned', 'imitation', 'substitute']) if (d.includes(w) && !q.includes(w)) s -= 6;
    return [s, f];
  }).sort((a, b) => b[0] - a[0])[0]?.[1];
};
// plain words people say mapped to clearer USDA searches
const QUERY_SYN = [[/^eggs?$/, 'egg whole cooked hard-boiled'], [/^toast$/, 'bread white toasted'], [/^rice$/, 'rice white cooked'], [/^brown rice$/, 'rice brown cooked'],
  [/^pasta$|^spaghetti$/, 'pasta cooked'], [/^chicken$/, 'chicken breast roasted'], [/^oatmeal$|^porridge$|^oats$/, 'oats cooked water'], [/^salad$/, 'lettuce green leaf raw'],
  [/^coffee$/, 'coffee brewed'], [/^tea$/, 'tea black brewed'], [/^milk$/, 'milk whole'], [/^yogh?urt$/, 'yogurt plain whole milk'], [/^potatoe?s?$/, 'potatoes baked flesh and skin'],
  [/^beans$/, 'beans black cooked'], [/^steak$/, 'beef steak grilled'], [/^fish$/, 'fish cod cooked']];
async function lookupFood(name, query) {
  const raw = (query || name).toLowerCase().trim();
  const q = (QUERY_SYN.find(([re]) => re.test(raw)) || [0, raw])[1];
  if (nutCache[q] !== undefined) return nutCache[q];
  let res = null;
  try { const b = bestMatch(q, await usdaSearch(q)); if (b) res = { n: b.n, src: 'USDA FoodData Central', fdc: b.fdc, match: b.desc }; }
  catch {
    const k = Object.keys(LOCAL_NUT).find(k => raw.includes(k) || q.includes(k));
    if (k) { const [kcal, pro, fib, sug] = LOCAL_NUT[k]; res = { n: { kcal, pro, fib, sug }, src: 'Offline estimate' }; }
    return res; // don't cache fallbacks, so USDA is tried again later
  }
  nutCache[q] = res; saveNut();
  return res;
}
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
async function makeItem(name, opts = {}) {
  const hit = await lookupFood(name, opts.query);
  const grams = Math.round((opts.grams || gramsFor(name)) * (opts.count || 1));
  return { name: cap(name), grams, n: hit ? hit.n : null, src: hit ? hit.src : 'Not found', fdc: hit ? hit.fdc : null, match: hit ? hit.match : null, conf: opts.conf ?? null, nova: opts.nova ?? null, allergens: opts.allergens || [] };
}
const NUMS = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, some: 1, half: .5 };
function parseFoods(text) {
  return text.toLowerCase()
    .replace(/\b(i had|i ate|i've had|i have had|for (breakfast|lunch|dinner|a snack|snack))\b/g, ',')
    .split(/,|\band\b|\bwith\b|\bplus\b|\+|;|\n/)
    .map(s => s.replace(/[.!?"]/g, '').trim()).filter(Boolean)
    .map(s => {
      let count = 1; const m = s.match(/^(\d+(?:\.\d+)?|a|an|one|two|three|four|five|some|half)\s+/);
      if (m) { count = NUMS[m[1]] ?? parseFloat(m[1]); s = s.slice(m[0].length); }
      s = s.replace(/^(cups?|glass(es)?|bowls?|slices?|pieces?|plates?|servings?|handfuls?|mugs?|bottles?|cans?|tablespoons?|tbsp|teaspoons?)\s+(of\s+)?/, '').replace(/^(of|the|my|some)\s+/, '').trim();
      return s && s.length > 1 ? { name: s, count } : null;
    }).filter(Boolean).slice(0, 8);
}
const tagsFor = it => {
  const n = it.name.toLowerCase(), t = [];
  if (/salmon|sardine|mackerel|trout|tuna|walnut|chia|flax/.test(n)) t.push('Omega-3 rich');
  if (/olive|salmon|fish|lentil|bean|chickpea|quinoa|tomato|spinach|broccoli|salad|nuts?|almond|walnut/.test(n)) t.push('Mediterranean pattern');
  if (/tomato|potato|pepper|eggplant|aubergine|chili|paprika/.test(n) && !/sweet potato/.test(n)) t.push('Nightshade');
  if (/bread|wheat|pasta|spaghetti|pizza|bagel|pretzel|sandwich|cereal|cookie|cake|burger|burrito|noodle|toast|muffin/.test(n) || it.allergens.includes('en:gluten')) t.push('Contains gluten');
  if (/milk|cheese|yog|butter|cream|eggnog|latte/.test(n) && !/oat milk|almond milk|soy milk|coconut milk/.test(n) || it.allergens.includes('en:milk')) t.push('Dairy');
  if (/coffee|espresso|tea|cola|latte/.test(n)) t.push('Caffeine');
  if (it.n && it.n.sug * it.grams / 100 >= 15 || /ice cream|chocolate|candy|soda|cake|cookie|donut|syrup/.test(n)) t.push('Added sugar');
  if (it.n && it.n.fib * it.grams / 100 >= 5) t.push('High fiber');
  if (it.nova === 4) t.push('Ultra-processed');
  return t;
};
const mealTotals = items => items.reduce((t, it) => { if (it.n) { t.kcal += it.n.kcal * it.grams / 100; t.pro += it.n.pro * it.grams / 100; t.fib += it.n.fib * it.grams / 100; } return t; }, { kcal: 0, pro: 0, fib: 0 });
const tagClass = g => /Nightshade|gluten|Dairy|sugar|Ultra|Caffeine/.test(g) ? 'amber' : /Omega|fiber/.test(g) ? 'gray' : 'teal';
const camBtn = (act, icon, label, extra = '') => `<button class="cam-btn" data-act="${act}" ${extra}>${ic(icon, 22)}<span>${label}</span></button>`;
const fileBtn = (kind, label) => `<label class="cam-btn">${ic('download', 22)}<span>${label}</span><input type="file" accept="image/*" data-file="${kind}" class="sr-only"></label>`;

V.meal = () => {
  const d = S.draft;
  if (!d) { S.route = 'log'; return V.log(); }
  if (d.stage === 'camera') {
    return `${statusbar(true)}<div class="view flush cam">
      <video id="cam" autoplay playsinline muted aria-label="Camera preview"></video>
      <div class="cam-top"><button class="back dark" data-act="cancelMeal" aria-label="Cancel">${ic('x', 24, 2.2)}</button><span class="chip">${ic('spark', 16)} Photo of your meal</span></div>
      <div class="cam-msg" id="mstatus">${esc(d.msg || 'Starting camera…')}</div>
      <div class="cam-bar">${fileBtn('photo', 'Upload')}<button class="shutter" data-act="capture" aria-label="Take photo"></button><span style="width:72px"></span></div>
    </div><div class="homebar" style="background:#000"></div>`;
  }
  if (d.stage === 'processing') {
    return `${statusbar(true)}<div class="view flush cam"><img class="snap" src="${media.photo}" alt="Your meal photo">
      <div class="cam-msg busy" id="mstatus">${esc(d.msg || 'Finding foods…')}</div></div><div class="homebar" style="background:#000"></div>`;
  }
  if (d.stage === 'listen') {
    return `${statusbar()}<div class="view">${topbar('Log · Voice', 'log')}
      <div class="listen"><div class="mic">${ic('mic')}</div><b style="font-size:18px" id="mstatus">${esc(d.msg || 'Listening… say what you ate')}</b>
      <p class="sub" id="live" style="text-align:center;min-height:48px">${esc(d.text || 'For example: "a bowl of oatmeal with blueberries and a coffee"')}</p></div>
      <button class="btn primary block" data-act="stopListen">Done</button>
      <p class="note" style="text-align:center;margin-top:10px">Uses your browser's speech recognition. The app version uses on-device speech-to-text.</p>
    </div><div class="homebar"></div>`;
  }
  if (d.stage === 'text') {
    const voice = d.mode === 'voice';
    return `${statusbar()}<div class="view">${topbar(voice ? 'Log · Voice' : 'Log · Type it', 'log')}
      <h1 class="big">${voice ? 'Check what we heard' : 'What did you eat?'}</h1>
      ${d.msg ? `<p class="note" style="color:var(--amber)">${esc(d.msg)}</p>` : ''}
      <div class="field"><label for="mt">${voice ? 'Edit if needed' : 'Describe your meal'}</label><textarea id="mt" rows="3" data-input="mealText" placeholder="e.g. 2 eggs, toast with butter and a coffee">${esc(d.text || '')}</textarea></div>
      <p class="note">Separate foods with commas or "and". Nutrients come from USDA FoodData Central.</p>
      <div class="btn-row">${voice ? `<button class="btn ghost" data-act="logMeal" data-arg="voice">${ic('mic', 20)} Again</button>` : ''}<button class="btn primary" data-act="parseText" ${d.text && d.text.trim() ? '' : ''}>Find foods</button></div>
    </div><div class="homebar"></div>`;
  }
  if (d.stage === 'scan') {
    return `${statusbar(true)}<div class="view flush cam">
      <div id="qr-reader" class="qr"></div><div id="qr-file" hidden></div>
      <div class="cam-top"><button class="back dark" data-act="cancelMeal" aria-label="Cancel">${ic('x', 24, 2.2)}</button><span class="chip">${ic('barcode', 16)} Scan a barcode</span></div>
      <div class="cam-msg" id="mstatus">${esc(d.msg || 'Starting camera…')}</div>
      <form class="cam-form" data-form="barcode"><label for="bc" class="sr-only">Barcode number</label><input id="bc" inputmode="numeric" placeholder="Or type the barcode number" autocomplete="off"><button class="btn primary" type="submit">Look up</button></form>
      <div class="cam-bar">${fileBtn('barcode', 'Upload photo')}</div>
    </div><div class="homebar" style="background:#000"></div>`;
  }
  // review
  const t = mealTotals(d.items);
  const tags = [...new Set(d.items.flatMap(tagsFor))];
  const items = d.items.map((it, idx) => `<div class="item"><div class="grow"><div class="nm">${esc(it.name)}</div>
      <div class="meta">≈ ${it.grams} g${it.conf != null ? ` · <span class="${it.conf < 50 ? 'conf-low' : ''}">${it.conf}% match</span>` : ''}${it.n ? ` · ${Math.round(it.n.kcal * it.grams / 100)} kcal` : ' · <span class="conf-low">nutrients not found</span>'}</div>
      ${it.match ? `<div class="loinc" title="USDA match">${esc(it.match)}</div>` : ''}</div>
      <div class="stepper"><button data-act="portion" data-arg="${idx}:-1" aria-label="Less ${esc(it.name)}">−</button><button data-act="portion" data-arg="${idx}:1" aria-label="More ${esc(it.name)}">+</button><button data-act="rmItem" data-arg="${idx}" aria-label="Remove ${esc(it.name)}">${ic('x', 16, 2.4)}</button></div></div>`).join('');
  const photoHead = d.mode === 'photo' && media.photo
    ? `<div class="photo"><img class="snap" src="${media.photo}" alt="Your meal photo"><span class="chip">${ic('spark', 16)} Your photo · ${d.time}</span>
        ${d.dets && d.dets.length ? `<div class="dets">${d.dets.map(x => `<span class="lbl">${esc(x.name)} ${x.p}%</span>`).join('')}</div>` : ''}</div>`
    : `<div style="padding:0 20px">${topbar({ photo: 'Photo result', barcode: 'Barcode result', voice: 'Voice result', text: 'Text result' }[d.mode], 'log')}</div>`;
  const srcs = [...new Set(d.items.map(i => i.src).filter(s => s !== 'Not found'))];
  return `${statusbar(!!(d.mode === 'photo' && media.photo))}<div class="view flush" ${d.mode === 'photo' && media.photo ? 'style="margin-top:-50px"' : ''}>${photoHead}
    <div class="${d.mode === 'photo' && media.photo ? 'sheet' : ''}" style="${d.mode === 'photo' && media.photo ? '' : 'padding:0 20px'}">
      <div class="row" style="justify-content:space-between;margin-bottom:10px"><h2 class="mid" style="margin:0">${d.items.length ? `We found ${d.items.length} item${d.items.length === 1 ? '' : 's'}` : 'No foods yet'}</h2>${d.items.length ? '<span class="note">Adjust or remove</span>' : ''}</div>
      ${d.msg ? `<div class="card row" style="background:var(--amber-soft)"><span style="color:var(--amber)">${ic('info')}</span><span class="grow" style="font-size:14px">${esc(d.msg)}</span></div>` : ''}
      ${d.items.length ? `<div class="card" style="padding:4px 16px">${items}</div>` : ''}
      ${tags.length ? `<div class="chips" style="margin:6px 0 10px">${tags.map(g => `<span class="pill ${tagClass(g)}">${esc(g)}</span>`).join('')}</div>` : ''}
      ${d.items.length ? `<p class="note" style="margin:0"><b style="color:var(--ink)">About ${Math.round(t.kcal / 10) * 10} kcal</b> · ${Math.round(t.pro)} g protein · ${Math.round(t.fib)} g fiber${srcs.length ? ' · Source: ' + srcs.join(', ') : ''}</p>` : ''}
      <div class="btn-row"><button class="btn ghost" data-act="openSearch">Add item</button><button class="btn primary" data-act="confirmMeal" ${d.items.length ? '' : 'disabled'}>${ic('check', 20, 2.6)} Confirm meal</button></div>
      <p class="note" style="text-align:center;margin-top:10px">Nothing is saved until you confirm.${d.mode === 'photo' ? ' The photo is not kept after you leave this screen.' : ''}</p>
      ${d.mode === 'photo' ? '<p class="note" style="text-align:center">Prototype uses a general on-device image model that knows a limited set of foods and names one main item. The app uses a vision-language model that lists every item and portion.</p>' : ''}
    </div></div><div class="homebar"></div>`;
};

// called after every render to (re)attach live media to new DOM nodes
function afterRender() {
  if (S.route !== 'meal' || !S.draft) return;
  const v = document.getElementById('cam');
  if (v && media.stream && v.srcObject !== media.stream) { v.srcObject = media.stream; v.play().catch(() => {}); }
}
async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { S.draft.msg = 'Camera not available here. Upload a photo instead.'; setStatus(S.draft.msg); return; }
  try {
    const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }, audio: false });
    if (!S.draft || S.draft.stage !== 'camera') { s.getTracks().forEach(t => t.stop()); return; }
    media.stream = s; afterRender();
    S.draft.msg = 'Point at your plate and tap the shutter'; setStatus(S.draft.msg);
  } catch (e) {
    S.draft.msg = e.name === 'NotAllowedError' ? 'Camera permission was blocked. Allow it in your browser, or upload a photo.' : 'No camera found. Upload a photo instead.';
    setStatus(S.draft.msg);
  }
}
async function processPhoto(url) {
  stopMedia();
  media.photo = url;
  const d = S.draft; d.stage = 'processing'; d.msg = media.model ? 'Finding foods…' : 'Loading the on-device food model (first time only)…'; d.time = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  render();
  let preds = [];
  const fail = msg => { if (S.draft !== d) return; d.stage = 'review'; d.items = []; d.dets = []; d.msg = msg; render(); };
  const img = new Image(); img.src = url;
  try { await img.decode(); } catch { media.photo = null; return fail('We could not read that image. Try another photo (JPG or PNG).'); }
  let model;
  try { model = await loadModel(); } catch { return fail('The food model could not load (are you offline?). Add the foods by name with Add item.'); }
  if (S.draft !== d) return;
  setStatus('Finding foods…');
  try { preds = await model.classify(img, 10); } catch { return fail('Food detection failed on this photo. Add the foods with Add item.'); }
  if (S.draft !== d) return;
  const seen = new Set(), dets = [];
  let context = false;
  for (const p of preds) {
    const key = p.className.split(',')[0].trim().toLowerCase();
    if (MEAL_CONTEXT.test(key)) context = true;
    const f = FOOD_LABELS[key];
    if (f && !seen.has(f[0]) && p.probability >= .08 && dets.length < 3) { seen.add(f[0]); dets.push({ name: f[0], query: f[1], grams: f[2], p: Math.round(p.probability * 100) }); }
  }
  setStatus(dets.length ? 'Looking up nutrients…' : 'Finishing…');
  d.dets = dets;
  d.items = await Promise.all(dets.map(x => makeItem(x.name, { query: x.query, grams: x.grams, conf: x.p })));
  if (S.draft !== d) return;
  d.msg = dets.length ? (dets.some(x => x.p < 50) ? 'Low-confidence match. Check each item, and add anything we missed.' : '')
    : context ? 'We can see a meal but could not name the foods. Add them with Add item.' : 'We could not find food in this photo. Try again, or add the foods with Add item.';
  d.stage = 'review'; render();
}
function startListening() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const d = S.draft;
  if (!SR) { d.stage = 'text'; d.msg = 'Voice input is not supported in this browser. Type your meal instead.'; return render(); }
  const rec = new SR(); media.rec = rec;
  rec.lang = 'en-US'; rec.interimResults = true; rec.continuous = true;
  let finalText = '';
  rec.onresult = e => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) { const r = e.results[i]; if (r.isFinal) finalText += r[0].transcript + ' '; else interim += r[0].transcript; }
    d.text = (finalText + interim).trim();
    const live = document.getElementById('live'); if (live) live.textContent = '"' + d.text + '"';
  };
  rec.onerror = e => {
    d.msg = e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'Microphone permission was blocked. Allow it in your browser, or type your meal.'
      : e.error === 'no-speech' ? 'We did not hear anything. Try again, or type your meal.'
      : e.error === 'network' ? 'Speech service unavailable. Type your meal instead.' : 'Voice input stopped (' + e.error + '). Type your meal instead.';
  };
  rec.onend = () => { if (media.rec !== rec) return; media.rec = null; if (S.draft === d && d.stage === 'listen') { d.stage = 'text'; if (d.text) d.msg = d.msg || ''; render(); } };
  try { rec.start(); } catch { d.stage = 'text'; d.msg = 'Could not start voice input. Type your meal instead.'; render(); }
}
async function startScanner() {
  const d = S.draft;
  try {
    await loadQr();
    if (S.draft !== d || d.stage !== 'scan') return;
    const q = new window.Html5Qrcode('qr-reader', { verbose: false });
    media.qr = q;
    await q.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 260, height: 140 } }, code => { if (S.draft === d && d.stage === 'scan') barcodeFound(code); }, () => {});
    if (media.qr !== q) { q.stop().catch(() => {}); return; }
    d.msg = 'Line up the barcode inside the box'; setStatus(d.msg);
  } catch (e) {
    media.qr = null;
    d.msg = /NotAllowed|Permission/i.test(String(e)) ? 'Camera permission was blocked. Type the number or upload a photo of the barcode.' : 'No camera available. Type the barcode number or upload a photo of it.';
    setStatus(d.msg);
  }
}
async function barcodeFound(code) {
  code = String(code).replace(/\D/g, '');
  const d = S.draft; if (!d) return;
  if (code.length < 8) { setStatus('That does not look like a food barcode. Try again.'); return; }
  stopMedia();
  setStatus(`Found ${code}. Looking it up in Open Food Facts…`);
  let p = null;
  try {
    const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,brands,nutriments,serving_quantity,nova_group,allergens_tags,quantity`);
    const j = await r.json(); if (j.status === 1 && j.product) p = j.product;
  } catch {}
  if (S.draft !== d) return;
  d.stage = 'review'; d.items = [];
  if (!p || !p.product_name) {
    d.msg = p === null ? `Barcode ${code} was not found in Open Food Facts (or the lookup failed). Add the food with Add item.` : `Barcode ${code} has no product name in Open Food Facts. Add the food with Add item.`;
    return render();
  }
  const n = p.nutriments || {};
  const name = [p.product_name, p.brands ? `(${p.brands.split(',')[0].trim()})` : ''].join(' ').trim();
  d.items = [{ name, grams: Math.round(+p.serving_quantity || 100), n: { kcal: +n['energy-kcal_100g'] || 0, pro: +n.proteins_100g || 0, fib: +n.fiber_100g || 0, sug: +n.sugars_100g || 0 },
    src: 'Open Food Facts', fdc: null, match: `Barcode ${code}${p.quantity ? ' · ' + p.quantity : ''}`, conf: null, nova: p.nova_group ?? null, allergens: p.allergens_tags || [] }];
  d.msg = n['energy-kcal_100g'] == null ? 'This product has no nutrition data in Open Food Facts.' : '';
  render();
}

V.checkin = () => {
  const c = S.checkin;
  const all = [...CHECKIN_Q, ...RAPID3_Q];
  if (c.i >= all.length) {
    const r = c.result;
    const [cat] = rapidCat(r.r3);
    const flag = Object.entries(c.ans).some(([k, v]) => v >= 9 && !['sleep', 'mood'].includes(k));
    return `${statusbar()}<div class="view">${topbar('Daily check-in', 'today')}
      <div class="ico teal" style="width:64px;height:64px;border-radius:20px;margin:10px 0">${ic('check', 34, 2.4)}</div>
      <h1 class="big">Done in ${r.secs} seconds</h1><p class="sub">Thanks, ${esc(S.name)}. Saved as a QuestionnaireResponse with scored Observations.</p>
      ${flag ? `<div class="card row" style="background:var(--red-soft)"><div class="ico red">${ic('alert')}</div><div class="grow"><b>Some symptoms are very high today</b><div class="note" style="color:var(--ink-2)">If this is new or getting worse, contact your care team. If it is an emergency, call 911.</div></div></div>` : ''}
      <div class="card"><div class="eyebrow">RAPID3 · weekly</div><div class="row" style="align-items:baseline"><span class="score-big">${r.r3}</span><span class="muted">/ 30</span><span class="pill ${rapidCat(r.r3)[1]}" style="margin-left:auto">${cat}</span></div>
        <div class="note" style="margin-top:8px">Function ${r.fn} + pain ${r.rpain} + patient global ${r.glob}. Bands: remission ≤ 3, low > 3 to 6, moderate > 6 to 12, high > 12. Last week: 6.</div></div>
      <div class="card"><div class="eyebrow">Today</div>${CHECKIN_Q.map(q => `<div class="row" style="justify-content:space-between;padding:4px 0"><span>${SYMPTOMS[CHECKIN_Q.indexOf(q)]}</span><b>${c.ans[q.k]}</b></div>`).join('')}</div>
      <div class="soft-card"><b>PROMIS-29 next due Dec 31 (monthly).</b><div class="note">Validated questionnaires used in clinics and research.</div></div>
      <button class="btn primary block" data-act="go" data-arg="today" style="margin-top:14px">Back to Today</button>
    </div><div class="homebar"></div>`;
  }
  const isR = c.i >= CHECKIN_Q.length;
  const q = all[c.i];
  const idx = isR ? c.i - CHECKIN_Q.length : c.i;
  const total = isR ? RAPID3_Q.length : CHECKIN_Q.length;
  const colors = ['#14806F', '#1F8C70', '#3C9A6E', '#6AA867', '#93B661', '#BDB75A', '#D5A64F', '#E39446', '#E47E3E', '#E16838', '#D95232'];
  const v = c.ans[q.k];
  const scale = Array.from({ length: 11 }, (_, n) => { const col = q.rev ? colors[10 - n] : colors[n]; return `<button role="radio" aria-checked="${v === n}" aria-label="${n}${n === 0 ? ', ' + q.lo : n === 10 ? ', ' + q.hi : ''}" style="--c:${col}" data-act="answer" data-arg="${n}">${n}</button>`; }).join('');
  return `${statusbar()}<div class="view">${topbar('Daily check-in', 'today')}
    <div class="segs" aria-hidden="true">${Array.from({ length: total }, (_, n) => `<span class="${n <= idx ? 'on' : ''}"></span>`).join('')}</div>
    <div class="eyebrow">${isR ? 'RAPID3 · weekly · ' : ''}Question ${idx + 1} of ${total}</div>
    <h1 class="big" style="font-size:28px" id="qh">${q.q}</h1>
    <p class="sub">0 means ${q.lo.toLowerCase()}. 10 means ${q.hi.toLowerCase()}.</p>
    <div class="scale" role="radiogroup" aria-labelledby="qh">${scale}</div>
    <div class="scale-ends"><span>${q.lo}</span><span>${q.hi}</span></div>
    <button class="card row" style="width:100%;border:0;text-align:left;margin-top:18px" data-act="voiceAnswer"><span class="ico violet">${ic('mic')}</span><b class="grow" style="font-size:16px">Answer by voice instead</b>${ic('chev', 20)}</button>
    ${isR ? '' : `<div class="soft-card"><div class="eyebrow">After today's questions</div><b>RAPID3, due today (weekly)</b><div class="note" style="margin-top:4px">Function, pain and overall. PROMIS-29 next due Dec 31 (monthly). Validated questionnaires used in clinics and research.</div></div>`}
    <div class="btn-row"><button class="btn ghost" data-act="ciBack">Back</button><button class="btn primary" data-act="ciNext" ${v == null ? 'disabled' : ''}>${c.i === all.length - 1 ? 'Finish' : 'Next'}</button></div>
  </div><div class="homebar"></div>`;
};

V.labs = () => {
  const L = S.labs.pending;
  if (!L) {
    return `${statusbar()}<div class="view">${topbar('Log · Labs', 'log')}<h1 class="big">Add lab results</h1><p class="sub">Take a photo of a printed lab report, or type values in. You confirm every value before it is saved.</p>
      <button class="card row" style="width:100%;border:0;text-align:left" data-act="scanLab"><span class="ico blue">${ic('camera')}</span><span class="grow"><b>Photograph a lab report</b><br><span class="note">${S.consent.ai ? 'AI reads analyte, value, unit and range' : 'AI reading is off in your consents'}</span></span>${ic('chev', 20)}</button>
      <button class="card row" style="width:100%;border:0;text-align:left" data-act="modal" data-arg="manualLab"><span class="ico teal">${ic('pencil')}</span><span class="grow"><b>Enter by hand</b><br><span class="note">CRP, ESR, fecal calprotectin and more</span></span>${ic('chev', 20)}</button>
      <div class="card"><div class="eyebrow">Saved results</div>${S.labs.saved.map(l => `<div class="row" style="justify-content:space-between;padding:4px 0"><span>${esc(l.nm)} <span class="note">· ${esc(l.d)}</span></span><b>${l.v} ${esc(l.u)}</b></div>`).join('')}</div>
      <p class="note">Patient-portal import through SMART on FHIR is a Phase 2 goal.</p></div><div class="homebar"></div>`;
  }
  const allOk = L.every(x => x.ok);
  const rows = L.map((x, i) => `<div class="card lab"><div class="grow"><div class="nm">${esc(x.nm)}</div><div class="note">${x.unclear && !x.u ? 'Unit unclear on photo' : `Report range: ${esc(x.range)}`}</div><div class="loinc">LOINC ${x.loinc}</div></div>
    <div class="val"><b>${x.v}</b><small>${x.u ? esc(x.u) : '<span style="color:var(--amber);font-weight:800">?</span>'}</small><br>
    ${x.unclear && !x.u ? `<button class="pill amber pill-btn" data-act="modal" data-arg="unit:${i}">Check unit</button>` : `<button class="ok" aria-pressed="${!!x.ok}" data-act="labOk" data-arg="${i}">${ic('check', 14, 2.8)} ${x.ok ? 'Confirmed' : 'Confirm'}</button>`}</div></div>`).join('');
  return `${statusbar()}<div class="view">${topbar('Log · Labs', 'log')}
    <div class="labhero" role="img" aria-label="Lab report being read"><div class="paper"><i class="h"></i><i class="m"></i><i></i><i class="m"></i><i></i><i class="m"></i><i></i></div><div class="scan"></div><span class="chip">${ic('spark', 14)} Report dated Dec 8</span></div>
    <h2 class="mid" style="margin-top:0">We read ${L.length} results</h2><p class="sub">Check each value before saving.</p>
    ${rows}
    <div class="btn-row"><button class="btn ghost" data-act="modal" data-arg="manualLab">Add manually</button><button class="btn primary" data-act="saveLabs" ${allOk ? '' : 'disabled'}>Save results</button></div>
    <p class="note" style="text-align:center;margin-top:10px">${allOk ? 'Ready to save. The photo is deleted after saving.' : 'Confirm every value to save. Unclear values are never guessed.'}</p>
  </div><div class="homebar"></div>`;
};

const INSIGHTS = [
  { id: 'sugar', lvl: 'Likely', cls: 'amber', p: .82, t: 'Higher joint pain 1 to 2 days after high added-sugar days', d: 'About +1.4 points on your 0 to 10 pain scale. Seen on 9 of 12 high-sugar days.', lags: [8, 64, 56, 10], why: 'Bayesian hierarchical model on 70 days. Exposure: added sugar above 40 g/day (12 days). Outcome: daily pain. Lags 0 to 3 days; the "1 to 2 days after" label combines lags 1 and 2. Adjusted for <b>sleep, stress, activity and medication changes</b>. Partly pooled with others who have RA, so early estimates are steadier.', test: true },
  { id: 'dinner', lvl: 'Possible', cls: 'teal', p: .68, t: 'Less morning stiffness after dinners before 7 PM', d: 'About −0.8 points. Needs about 10 more days to be sure.', why: 'Early dinners on 22 of 70 days. Probability is between 0.60 and 0.79, so this is "Possible". More logging will firm it up or rule it out.' },
  { id: 'dairy', lvl: 'Not enough data', cls: 'gray', t: 'Dairy', d: 'Logged on 2 days. Keep logging normally.', why: 'Minimum-data rule: an exposure needs at least 14 logged days, present on 3 or more and absent on 3 or more [est.].' },
];

V.insights = () => {
  const cards = INSIGHTS.map(x => `<div class="card">
    <div class="ins-head"><span class="pill ${x.cls}">${x.lvl === 'Likely' ? ic('flame', 15) : ''}${x.lvl}</span>${x.p ? `<span class="prob">probability <b>${x.p.toFixed(2)}</b></span>` : ''}</div>
    <div class="ins-title">${x.t}</div><div class="note" style="font-size:14.5px;color:var(--ink-2)">${x.d}</div>
    ${x.lags ? `<div class="lagbars" role="img" aria-label="Effect by lag: same day small, 1 day large, 2 days large, 3 days small">${x.lags.map(h => `<div class="${h > 30 ? 'hot' : ''}" style="height:${Math.max(h, 10)}px"></div>`).join('')}</div><div class="laglbl"><span>Same day</span><span>+1 day</span><span>+2 days</span><span>+3 days</span></div>` : ''}
    ${S.why[x.id] ? `<div class="why">${x.why}</div>` : ''}
    <div class="btn-row" style="margin-top:12px">${x.test ? `<button class="btn primary" style="flex:1" data-act="go" data-arg="testit">Test it</button>` : ''}<button class="btn ghost" style="flex:1" data-act="why" data-arg="${x.id}">${S.why[x.id] ? 'Hide details' : 'Why we think so'}</button></div>
  </div>`).join('');
  return `${statusbar()}<div class="view">
    <div class="row" style="justify-content:space-between"><h1 class="big" style="margin:0">Your patterns</h1><button class="ico violet" style="border:0;border-radius:50%;width:48px;height:48px" data-act="go" data-arg="ask" aria-label="Ask Remitra">${ic('spark', 24)}</button></div>
    <div class="row" style="justify-content:space-between;margin:6px 0 14px"><span class="muted">From 70 days of your logs</span><span class="demo-badge">Synthetic demo data</span></div>
    ${cards}
    <button class="card row" style="width:100%;border:0;text-align:left" data-act="go" data-arg="ask"><span class="ico violet">${ic('spark')}</span><span class="grow"><b>Ask Remitra</b><br><span class="note">Questions about your own data</span></span>${ic('chev', 20)}</button>
    ${S.test.started ? `<button class="card row" style="width:100%;border:0;text-align:left" data-act="go" data-arg="testit"><span class="ico teal">${ic('flask')}</span><span class="grow"><b>Experiment running</b><br><span class="note">Added sugar · week 1 of 4</span></span>${ic('chev', 20)}</button>` : ''}
    <p class="note">Associations, not medical findings. Adjusted for sleep, stress and medication changes.</p>
  </div>${tabbar('insights')}<div class="homebar" style="background:#fff"></div>`;
};

/* ---- Ask Remitra: grounded canned answers with guardrails ---- */
const ASK_SUGGEST = ['Do I sleep worse after late dinners?', 'Should I stop my methotrexate?', 'What foods have vitamin D?', 'How is my pain trending?', 'Do I have lupus?'];
function answer(q) {
  const s = q.toLowerCase();
  if (/chest pain|can'?t breathe|trouble breathing|suicid|faint|high fever/.test(s)) return { refuse: true, html: 'This could need urgent care. <b>If it is an emergency, call 911.</b> Otherwise contact your care team today.', src: ['Red-flag guidance'] };
  if (/(stop|start|skip|change|increase|decrease|dose|dosage|take).*(med|methotrexate|prednisone|drug|pill|biologic|humira|dose)|methotrexate|prednisone|medication|medicine|dosage/.test(s)) return { refuse: true, html: "I can't advise on medicines. Please talk to your rheumatologist before changing any treatment.", src: [] };
  if (/do i have|diagnos|is it (lupus|crohn|ms)|what disease/.test(s)) return { refuse: true, html: "I can't diagnose conditions. Your clinician can review your symptoms and tests. I can help you prepare a report for the visit.", src: [], cta: 'care' };
  if (/sleep|late dinner|dinner|evening/.test(s)) return { html: 'Last 70 days: after dinners past 8 PM, sleep was about <b>25 minutes shorter</b> on average (14 nights). An association in your own data.', bars: [['Dinner by 8 PM', 82, '#C9D3F5'], ['After 8 PM', 62, '#4B5BB5']], src: ['Meal times', 'Apple Health sleep'] };
  if (/sugar|sweet|dessert/.test(s)) return { html: 'On high added-sugar days (12 of 70), your joint pain was about <b>+1.4 points</b> higher 1 to 2 days later. Probability 0.82, labeled "Likely". You can test this with your care team using Test It.', src: ['Meal logs', 'Daily check-ins'], cta: 'testit' };
  if (/vitamin d/.test(s)) return { html: 'Food sources of vitamin D include fatty fish such as salmon and trout, fortified milk and plant milks, fortified cereals, egg yolks and some mushrooms. Your last vitamin D result was 32 ng/mL (Dec 8). Ask your clinician what level is right for you.', src: ['NIH ODS: Vitamin D fact sheet', 'Your labs, Dec 8'] };
  if (/omega|fish oil|salmon/.test(s)) return { html: 'You logged fish on 11 of the last 70 days. Omega-3 fats are found in fatty fish, walnuts, flaxseed and chia. There is no personal association yet: "Not enough data".', src: ['NIH ODS: Omega-3 fact sheet', 'Meal logs'] };
  if (/pain|rapid3|trend|better|worse/.test(s)) return { html: 'Your weekly RAPID3 moved from <b>9 (moderate)</b> on Oct 6 to <b>6 (low)</b> on Dec 8. CRP went from 14 to 7 mg/L.', src: ['RAPID3 weekly', 'Your labs'], cta: 'trends' };
  return { html: 'I can answer questions about your own logs (meals, symptoms, sleep, labs) and share facts from approved sources. Try asking about sleep, sugar, vitamin D or your pain trend.', src: [] };
}
V.ask = () => {
  const msgs = S.chat.map(m => m.u ? `<div class="bub-u">${esc(m.u)}</div>` : m.typing ? `<div class="bub-a typing" aria-label="Remitra is typing"><span></span><span></span><span></span></div>` :
    `<div class="bub-a ${m.a.refuse ? 'refuse' : ''}">${m.a.html}
      ${m.a.bars ? `<div class="minibars" role="img" aria-label="${m.a.bars.map(b => b[0]).join(' versus ')}">${m.a.bars.map(b => `<div style="height:${b[1] * .7}px;background:${b[2]}"></div>`).join('')}</div><div class="row" style="justify-content:space-around;font-size:13px;color:var(--ink-3)">${m.a.bars.map(b => `<span>${b[0]}</span>`).join('')}</div>` : ''}
      ${m.a.src.length ? `<div class="chips">${m.a.src.map(s => `<span class="pill gray src">${ic(/ODS|guidance/.test(s) ? 'doc' : /Health|sleep/.test(s) ? 'heart' : 'doc', 13)} ${esc(s)}</span>`).join('')}</div>` : ''}
      ${m.a.cta ? `<div style="margin-top:10px"><button class="pill teal pill-btn" data-act="go" data-arg="${m.a.cta}">${{ testit: 'Open Test It', trends: 'Open Trends', care: 'Prepare report' }[m.a.cta]} ›</button></div>` : ''}
    </div>`).join('');
  return `${statusbar()}<div class="view" id="chatview">${topbar('Insights', 'insights')}
    <div class="row" style="align-items:flex-start;margin-bottom:14px"><div class="ico" style="width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#6A4FD0,#14806F);color:#fff">${ic('spark', 28)}</div><div><b style="font-size:24px;letter-spacing:-.02em">Ask Remitra</b><div class="note" style="font-size:14px">Your data and approved sources · Not medical advice</div></div></div>
    <div class="chat">${msgs || '<p class="note">Ask a question about your logs. Every answer shows its sources. I don\'t give diagnoses or medication advice.</p>'}</div>
  </div>
  <div class="suggest">${ASK_SUGGEST.map(q => `<button data-act="ask" data-arg="${esc(q)}">${esc(q)}</button>`).join('')}</div>
  <form class="askbar" data-form="ask"><label for="askin" class="sr-only">Ask about your data</label><input id="askin" placeholder="Ask about your data…" autocomplete="off"><button type="submit" aria-label="Send">${ic('send', 22)}</button></form>
  ${tabbar('insights')}<div class="homebar" style="background:#fff"></div>`;
};

V.testit = () => {
  const T = S.test;
  const plan = [['Usual', 'Wk 1 · Dec 21', 'A'], ['Low sugar', 'Wk 2 · Dec 28', 'B'], ['Usual', 'Wk 3 · Jan 4', 'A'], ['Low sugar', 'Wk 4 · Jan 11', 'B']];
  const planHtml = `<div class="card"><div class="eyebrow">Your plan</div><ol class="plan">${plan.map(([n, w, ph], i) => `<li><span class="dot ${ph === 'B' ? 'fill' : ''}"></span><div class="grow"><b>${n}</b><div class="note">${w}${T.started && i === 0 ? ' · <b style="color:var(--teal)">now</b>' : ''}</div></div><span class="pill ${ph === 'B' ? 'teal' : 'gray'}">Phase ${ph}</span></li>`).join('')}</ol>
    <div class="divider"></div><div class="note">Daily: pain, stiffness, fatigue · Weekly: RAPID3 · Optional: CRP at start and end</div></div>`;
  if (T.started) {
    return `${statusbar()}<div class="view">${topbar('Test It · running', 'insights')}
      <h1 class="big">Does added sugar affect your joint pain?</h1>
      <div class="card row"><div class="ico teal">${ic('flask')}</div><div class="grow"><b>Week 1 of 4 · Phase A (usual)</b><div class="note">Day 1. Keep everything else the same.</div></div></div>
      ${planHtml}
      <div class="card"><div class="eyebrow">Adherence</div><div class="bar"><i style="width:100%;background:var(--teal)"></i></div><div class="note">1 of 1 check-ins so far. At the end, a Bayesian analysis compares A and B weeks.</div></div>
      <div class="card row">${ic('bell', 22)}<span class="grow">Remind me at 8:00 PM</span>${sw(T.remind, 'testRemind', '', 'Reminder')}</div>
      <button class="btn danger block" data-act="stopTest">Stop experiment</button>
      <p class="note" style="text-align:center">You can stop any time. Restriction never runs longer than the planned 4 weeks.</p>
    </div><div class="homebar"></div>`;
  }
  return `${statusbar()}<div class="view">${topbar('Test It · draft plan', 'insights')}
    <h1 class="big">Does added sugar affect your joint pain?</h1><p class="sub">A 4-week personal experiment. Keep everything else the same.</p>
    ${planHtml}
    <button class="check" role="checkbox" aria-checked="${T.agreed}" data-act="testAgree"><span class="grow"><b>I have discussed this</b> with my clinician or dietitian</span><span class="box-ck">${T.agreed ? ic('check', 20, 3) : ''}</span></button>
    <div class="card row" style="margin-top:12px">${ic('bell', 22)}<span class="grow">Remind me at 8:00 PM</span>${sw(T.remind, 'testRemind', '', 'Reminder')}</div>
    <button class="btn primary block" data-act="startTest" ${T.agreed ? '' : 'disabled'}>Start on Monday, Dec 21</button>
    ${T.agreed ? '' : '<p class="note" style="text-align:center">Confirm you talked with your care team to start.</p>'}
  </div><div class="homebar"></div>`;
};

const rapidWeeks = () => S.checkin.result ? [...RAPID3_WEEKS, ['Dec 15', S.checkin.result.r3]] : RAPID3_WEEKS;
function rapidChart() {
  const WEEKS = rapidWeeks();
  const W = 330, H = 190, pl = 24, pr = 18, pt = 14, pb = 22, max = Math.max(14, ...WEEKS.map(w => w[1] + 1));
  const x = i => pl + i * (W - pl - pr) / (WEEKS.length - 1);
  const y = v => pt + (1 - v / max) * (H - pt - pb);
  const band = (a, b, c) => `<rect x="${pl}" y="${y(b)}" width="${W - pl - pr}" height="${y(a) - y(b)}" fill="${c}"/>`;
  const pts = WEEKS.map(([, v], i) => `${x(i)},${y(v)}`).join(' ');
  const last = WEEKS.length - 1;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="r3t"><title id="r3t">RAPID3 weekly from Oct 6 to ${WEEKS[last][0]}, from 9 (moderate) to ${WEEKS[last][1]} (${rapidCat(WEEKS[last][1])[0].toLowerCase()}). Full values in the table below.</title>
    ${band(0, 3, '#E1F3EE')}${band(3, 6, '#EEF6F3')}${band(6, 12, '#FFF3E4')}${band(12, max, '#FDE9E6')}
    ${[3, 6, 12].map(v => `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" stroke="#fff" stroke-width="1.5"/><text x="${pl - 6}" y="${y(v) + 4}" font-size="10" text-anchor="end" fill="#7B8A87">${v}</text>`).join('')}
    <polygon points="${x(0)},${y(0)} ${pts} ${x(last)},${y(0)}" fill="rgba(20,128,111,.12)"/>
    <polyline points="${pts}" fill="none" stroke="#0D6556" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>
    ${WEEKS.map(([, v], i) => `<circle cx="${x(i)}" cy="${y(v)}" r="${i === last ? 6 : 3.5}" fill="${i === last ? '#fff' : '#0D6556'}" stroke="#0D6556" stroke-width="2.5"/>`).join('')}
    <text x="${x(last)}" y="${y(WEEKS[last][1]) - 12}" font-size="13" font-weight="800" text-anchor="middle" fill="#10221F">${WEEKS[last][1]}</text>
    <text x="${pl}" y="${H - 4}" font-size="11" fill="#7B8A87">Oct 6</text><text x="${W - pr}" y="${H - 4}" font-size="11" fill="#7B8A87" text-anchor="end">${WEEKS[last][0]}</text>
  </svg>`;
}
V.trends = () => {
  const tab = S.trendTab;
  let body = '';
  if (tab === 'RAPID3') {
    const r3 = S.checkin.result ? S.checkin.result.r3 : 6;
    body = `<div class="card"><div class="row" style="justify-content:space-between;align-items:flex-start"><div><div class="eyebrow">RAPID3 · weekly</div><span class="score-big" style="font-size:36px">${r3}</span> <b style="color:var(--teal)">${rapidCat(r3)[0]}</b></div><span class="pill ${r3 < 9 ? 'teal' : 'amber'}">${r3 < 9 ? '↓' : r3 > 9 ? '↑' : '='} from 9 · ${rapidWeeks().length} weeks</span></div>
      ${rapidChart()}
      <div class="legend"><span><i style="background:#E1F3EE"></i>Remission ≤ 3</span><span><i style="background:#EEF6F3"></i>Low &gt; 3 to 6</span><span><i style="background:#FFF3E4"></i>Moderate &gt; 6 to 12</span><span><i style="background:#FDE9E6"></i>High &gt; 12</span></div>
      <details class="textalt"><summary>Show values as a table</summary><table><tr><th>Week of</th><th>RAPID3</th><th>Category</th></tr>${rapidWeeks().map(([d, v]) => `<tr><td>${d}</td><td>${v}</td><td>${rapidCat(v)[0]}</td></tr>`).join('')}</table></details>
      <div class="divider"></div>
      <div class="row">${ic('flask', 20)}<span class="grow">CRP, patient-entered</span><b>14 → 7 mg/L</b></div>
      <div class="row" style="margin-top:6px">${ic('flask', 20)}<span class="grow">ESR, Dec 8</span><b>18 mm/h</b></div>
      <p class="note" style="margin-bottom:0">Labs are shown as text, not on the RAPID3 axis.</p></div>`;
  } else if (tab === 'PROMIS-29') {
    body = `<div class="card"><div class="eyebrow">PROMIS-29 · Dec 1 (monthly)</div><p class="note">T-scores: 50 is the U.S. average, 10 points is one standard deviation.</p>
      ${PROMIS.map(([n, t, dir]) => `<div class="row" style="justify-content:space-between;margin-top:8px"><span>${n}</span><b>${t}</b></div><div class="bar" style="margin:6px 0 4px"><i style="width:${(t - 20) / 60 * 100}%;background:${(dir.startsWith('higher') ? t > 55 : t < 45) ? '#E2793C' : 'var(--teal)'}"></i></div><div class="note" style="font-size:12px">${dir}</div>`).join('')}
      <div class="row" style="justify-content:space-between;margin-top:10px"><span>Pain intensity (0 to 10)</span><b>4</b></div>
      <p class="note" style="margin-bottom:0">Next due Dec 31.</p></div>`;
  } else if (tab === 'Symptoms') {
    body = `<div class="card"><div class="eyebrow">Daily symptoms · last 14 days</div>${SYMPTOMS.map((n, i) => {
      const h = SYM_HIST[i], avg = (h.reduce((a, b) => a + b, 0) / h.length).toFixed(1);
      const pts = h.map((v, d) => `${d * (120 / 13)},${30 - v * 3}`).join(' ');
      return `<div class="row" style="padding:6px 0;border-bottom:1px solid var(--line)"><span class="grow">${n}</span><svg width="120" height="32" viewBox="0 0 120 32" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="${i === 4 || i === 5 ? '#4B5BB5' : '#14806F'}" stroke-width="2" stroke-linejoin="round"/></svg><b style="width:36px;text-align:right">${avg}</b></div>`;
    }).join('')}<p class="note" style="margin-bottom:0">Average shown on the right (0 to 10). Sleep and mood: higher is better.</p></div>`;
  } else {
    body = `<div class="card"><div class="eyebrow">Diet pattern · last 4 weeks</div>
      <div class="row" style="justify-content:space-between"><span>Mediterranean days</span><b style="font-size:20px">18 of 28</b></div><div class="bar"><i style="width:64%;background:linear-gradient(90deg,#14806F,#3CC9A6)"></i></div>
      <div class="row" style="justify-content:space-between"><span>Ultra-processed share</span><b style="font-size:20px">22%</b></div><div class="bar"><i style="width:22%;background:linear-gradient(90deg,#E2793C,#F0A458)"></i></div>
      <div class="row" style="justify-content:space-between"><span>High added-sugar days</span><b style="font-size:20px">5 of 28</b></div><div class="bar"><i style="width:18%;background:#E2793C"></i></div>
      <div class="row" style="justify-content:space-between"><span>Dinners before 7 PM</span><b style="font-size:20px">11 of 28</b></div><div class="bar"><i style="width:39%;background:var(--indigo)"></i></div>
      <p class="note" style="margin-bottom:0">Exact pattern scores to be chosen with our clinical advisor.</p></div>`;
  }
  return `${statusbar()}<div class="view">
    <div class="row" style="justify-content:space-between;margin:4px 0 14px"><h1 class="big" style="margin:0">Trends</h1><span class="demo-badge">Synthetic demo data</span></div>
    <div class="seg" role="tablist">${['RAPID3', 'PROMIS-29', 'Symptoms', 'Diet'].map(t => `<button role="tab" aria-selected="${tab === t}" data-act="trendTab" data-arg="${t}">${t}</button>`).join('')}</div>
    ${body}
  </div>${tabbar('trends')}<div class="homebar" style="background:#fff"></div>`;
};

V.care = () => {
  const sh = S.share;
  const opt = (k, icon, cls, t, d) => `<div class="card share-opt"><span class="ico ${cls}">${ic(icon)}</span><div class="grow"><div class="ttl">${t}</div><div class="desc">${d}</div></div>${sw(sh[k], 'share', k, t)}</div>`;
  const any = sh.pdf || sh.fhir || sh.link;
  return `${statusbar()}<div class="view">
    <div class="row" style="justify-content:space-between;align-items:flex-start;margin-top:4px"><h1 class="big" style="margin:0">Share with your care team</h1><span class="demo-badge" style="margin-top:8px">Synthetic demo data</span></div>
    <p class="muted" style="margin:6px 0 14px">Next visit: Jan 12 (example)</p>
    <div class="reportcard"><div class="mini-doc" aria-hidden="true"><i style="background:var(--teal);width:70%;height:6px"></i><svg viewBox="0 0 84 30" width="84" height="30"><polyline points="2,20 14,14 24,22 36,8 50,20 62,22 82,18" fill="none" stroke="#0D6556" stroke-width="2"/></svg><i></i><i></i><i style="width:80%"></i><i></i><i style="width:60%"></i></div>
      <div><div class="eyebrow">Oct 6 to Dec 15</div><b style="font-size:17px;line-height:1.3;display:block">RAPID3 moved from moderate (9) to low (6)</b><div class="note" style="color:var(--ink-2);margin-top:6px;line-height:1.7">CRP 14 → 7 mg/L<br>Top association: added sugar, pain<br>Flares logged: 2<br>Check-in adherence: 91%</div></div></div>
    <div class="eyebrow">Share as</div>
    ${opt('pdf', 'doc', 'teal', 'PDF report', 'Tagged PDF for screen readers')}
    ${opt('fhir', 'globe', 'blue', 'FHIR data bundle', 'For clinic systems that accept FHIR')}
    ${opt('link', 'link', 'violet', 'Secure link, 7 days', 'Revoke it any time')}
    ${sh.linkActive ? `<div class="card row" style="background:var(--violet-soft)"><span class="grow"><b>Link active</b><div class="note">Expires Dec 22 · opened 0 times</div></span><button class="pill pill-btn violet" data-act="revoke">Revoke</button></div>` : ''}
    <button class="btn primary block" data-act="createReport" ${any ? '' : 'disabled'}>Create report</button>
  </div>${tabbar('care')}<div class="homebar" style="background:#fff"></div>`;
};

V.settings = () => {
  const C = S.consent;
  const row = (k, t, d, req) => `<div class="card row"><div class="grow"><b>${t}</b>${req ? ' <span class="req">Required</span>' : ''}<div class="note">${d}</div></div>${sw(C[k], 'consent', k, t, req)}</div>`;
  return `${statusbar()}<div class="view">${topbar('Settings', 'today')}
    <div class="card row"><div class="avatar" style="display:grid;place-items:center">${esc(S.name[0] || 'M')}</div><div class="grow"><b style="font-size:18px">${esc(S.name)}</b><div class="note">${esc(S.conditions.join(', '))} · passkey on</div></div><button class="pill gray pill-btn" data-act="reOnboard">Edit</button></div>
    <div class="eyebrow" style="margin-top:16px">Consents (version 1.0)</div>
    ${row('app', 'Use Remitra', 'Store your logs securely to run the app.', true)}
    ${row('health', 'Apple Health', 'Sleep, resting heart rate, HRV, steps. Read only.')}
    ${row('ai', 'AI reads meal and lab photos', 'Deleted after processing.')}
    ${row('research', 'Research mode', 'Share de-identified data for approved studies.')}
    <div class="eyebrow" style="margin-top:16px">Your data</div>
    <button class="card row" style="width:100%;border:0;text-align:left" data-act="exportData"><span class="ico teal">${ic('download')}</span><span class="grow"><b>Export all data</b><br><span class="note">FHIR bundle and CSV</span></span>${ic('chev', 20)}</button>
    <button class="card row" style="width:100%;border:0;text-align:left" data-act="modal" data-arg="access"><span class="ico indigo">${ic('lock')}</span><span class="grow"><b>Access log</b><br><span class="note">Who viewed or shared your data</span></span>${ic('chev', 20)}</button>
    <button class="card row" style="width:100%;border:0;text-align:left" data-act="modal" data-arg="privacy"><span class="ico blue">${ic('shield')}</span><span class="grow"><b>Privacy notice</b><br><span class="note">No sale of health data. No ad SDKs.</span></span>${ic('chev', 20)}</button>
    <button class="btn danger block" data-act="modal" data-arg="delete" style="margin-top:6px">${ic('trash', 20)} Delete account and data</button>
  </div><div class="homebar"></div>`;
};

/* ================= modals ================= */
const MODALS = {
  privacy: () => `<h2>Privacy notice (summary)</h2><ul class="note" style="color:var(--ink-2);line-height:1.6;padding-left:18px">
    <li>We never sell your health data. No advertising SDKs. No third-party tracking.</li>
    <li>Separate opt-ins for app use, health data, AI photo reading and research sharing. Each can be turned off in Settings.</li>
    <li>Meal and lab photos are deleted after processing unless you keep them.</li>
    <li>AI runs inside our own cloud account; prompts and outputs are not used to train models.</li>
    <li>Export or delete everything at any time.</li>
    <li>Designed for Washington's My Health My Data Act. Built on HIPAA-eligible cloud services with HIPAA-aligned controls.</li></ul>
    <p class="note">Prototype summary. Final notice pending counsel review.</p><button class="btn primary block" data-act="close">Close</button>`,
  outlook: () => `<h2>7-day flare outlook</h2><p class="sub">Low · estimated probability of a flare in the next 7 days: 0.12</p>
    <div class="card"><div class="eyebrow">What's driving it</div>
    <div class="row" style="justify-content:space-between;padding:4px 0"><span>Sleep, 7-day average</span><b style="color:var(--teal)">7 h 10 m · steady</b></div>
    <div class="row" style="justify-content:space-between;padding:4px 0"><span>HRV trend</span><b style="color:var(--teal)">steady</b></div>
    <div class="row" style="justify-content:space-between;padding:4px 0"><span>Pain, 14-day trend</span><b style="color:var(--teal)">down</b></div>
    <div class="row" style="justify-content:space-between;padding:4px 0"><span>High-sugar days this week</span><b style="color:var(--amber)">2</b></div></div>
    <p class="note">Prototype estimate. Model trained on synthetic data only; target outcomes to be validated during discovery. Not a medical prediction.</p><button class="btn primary block" data-act="close">Close</button>`,
  meds: () => `<h2>Supplements and medications</h2><p class="sub">Logged as exposures so they are not confused with diet effects. Remitra never recommends changing medication.</p>
    <div class="card">${S.supplements.map((m, i) => `<div class="row" style="padding:6px 0;border-bottom:1px solid var(--line)"><span class="ico violet" style="width:36px;height:36px">${ic('pill', 18)}</span><span class="grow">${esc(m)}</span><button class="linkbtn" data-act="rmSupp" data-arg="${i}" aria-label="Remove ${esc(m)}">Remove</button></div>`).join('')}</div>
    <form data-form="supp" class="row"><label for="sp" class="sr-only">Add supplement or medication</label><input id="sp" class="grow" style="border:1.5px solid var(--line);border-radius:12px;padding:12px;min-height:48px" placeholder="e.g. Fish oil 1 g daily"><button class="btn primary" type="submit">Add</button></form>
    <button class="btn ghost block" data-act="close" style="margin-top:12px">Done</button>`,
  addItem: () => { const s = media.search || { q: '', results: [] }; return `<h2>Add an item</h2>
    <form data-form="foodsearch" class="row"><label for="fs" class="sr-only">Search foods</label><input id="fs" class="grow" style="border:1.5px solid var(--line);border-radius:12px;padding:12px;min-height:48px;min-width:0" value="${esc(s.q)}" placeholder="Search foods, e.g. brown rice" autocomplete="off"><button class="btn primary" type="submit">Search</button></form>
    ${s.busy ? '<p class="note">Searching USDA FoodData Central…</p>' : ''}${s.err ? `<p class="note" style="color:var(--amber)">${esc(s.err)}</p>` : ''}
    ${s.results.length ? `<div class="card" style="margin-top:12px;padding:4px 16px">${s.results.map((f, i) => `<button class="row" style="width:100%;background:none;border:0;padding:10px 0;text-align:left;border-bottom:1px solid var(--line)" data-act="pickFood" data-arg="${i}"><span class="grow"><b>${esc(f.desc)}</b><br><span class="note">${Math.round(f.n.kcal)} kcal per 100 g · FDC ${f.fdc}</span></span>${ic('plus', 22)}</button>`).join('')}</div>` : ''}
    ${s.q && !s.busy ? `<p><button class="linkbtn" data-act="addTyped">Add "${esc(s.q)}" without nutrients</button></p>` : ''}
    <button class="btn ghost block" data-act="close" style="margin-top:12px">Cancel</button>`; },
  manualLab: () => `<h2>Enter a lab result</h2><form data-form="lab">
    <div class="field"><label for="la">Test</label><select id="la"><option>CRP</option><option>ESR</option><option>Fecal calprotectin</option><option>Vitamin D, 25-OH</option></select></div>
    <div class="field"><label for="lv">Value</label><input id="lv" type="number" step="any" required inputmode="decimal"></div>
    <div class="field"><label for="ld">Date</label><input id="ld" value="Dec 8"></div>
    <button class="btn primary block" type="submit">Save result</button></form><button class="btn ghost block" data-act="close" style="margin-top:10px">Cancel</button>`,
  access: () => `<h2>Access log</h2><div class="card">${S.access.map(([t, w, a]) => `<div class="row" style="padding:6px 0;border-bottom:1px solid var(--line)"><span class="note" style="width:96px">${t}</span><span class="grow">${esc(a)}</span><span class="note">${esc(w)}</span></div>`).join('')}</div><button class="btn primary block" data-act="close">Close</button>`,
  delete: () => `<h2>Delete account and data?</h2><p class="sub">This removes your logs, check-ins, labs and reports. In this demo, it resets the prototype to the start.</p><button class="btn danger block" data-act="doDelete">Delete everything</button><button class="btn ghost block" data-act="close" style="margin-top:10px">Cancel</button>`,
  research: () => `<h2>Research mode</h2><p class="sub">Help autoimmune research by sharing a de-identified copy of your data with approved studies.</p>
    <div class="card"><div class="eyebrow">What is shared</div><div class="note" style="color:var(--ink-2);line-height:1.6">Meal tags and nutrients, symptom scores, RAPID3 and PROMIS-29 scores, lab values, daily sleep and heart-rate totals.</div>
    <div class="eyebrow" style="margin-top:12px">What is never shared</div><div class="note" style="color:var(--ink-2);line-height:1.6">Your name, contact details, photos, exact dates of birth or free-text notes. Data is never sold.</div></div>
    <p class="note">Separate from app consent. Versioned and revocable in Settings. Data exports begin in Phase 2.</p>
    <button class="btn primary block" data-act="researchYes">I agree to share for research</button><button class="btn ghost block" data-act="close" style="margin-top:10px">Not now</button>`,
};
MODALS.unit = i => { const x = S.labs.pending[i]; return `<h2>Check the unit</h2><p class="sub">${esc(x.nm)}: we read <b>${x.v}</b> but could not read the unit. Which does your report show?</p>
  <div class="choice-grid"><button class="choice" data-act="setUnit" data-arg="${i}:ng/mL">ng/mL</button><button class="choice" data-act="setUnit" data-arg="${i}:nmol/L">nmol/L</button></div>
  <p class="note">We never guess unclear values.</p><button class="btn ghost block" data-act="close">Cancel</button>`; };
MODALS.report = () => {
  const sh = S.share;
  const fhir = { resourceType: 'Bundle', type: 'collection', meta: { tag: [{ code: 'SYNTHETIC' }] }, entry: [
    { resource: { resourceType: 'Patient', id: 'pseudo-7f3a', active: true } },
    { resource: { resourceType: 'Observation', status: 'final', code: { text: 'RAPID3 score' }, effectiveDateTime: '2026-12-08', valueQuantity: { value: 6 } } },
    { resource: { resourceType: 'Observation', status: 'final', code: { coding: [{ system: 'http://loinc.org', code: '1988-5', display: 'C reactive protein' }] }, valueQuantity: { value: 7, unit: 'mg/L' } } },
    { resource: { resourceType: 'Consent', status: 'active', scope: { text: 'app use' } } },
  ] };
  return `<div class="grabber"></div><h2>Report ready</h2>
    ${sh.pdf ? `<div class="pdf" role="document" aria-label="Report preview"><h3>Remitra care team report</h3><div class="note">Maya (synthetic) · Rheumatoid arthritis · Oct 6 to Dec 15</div>
      <h4>Validated scores</h4><table><tr><td>RAPID3 (weekly)</td><td>9 → 6 · moderate → low</td></tr><tr><td>PROMIS-29 fatigue</td><td>T = 58</td></tr><tr><td>PROMIS-29 pain interference</td><td>T = 57</td></tr></table>
      <h4>Labs</h4><table><tr><td>CRP</td><td>14 → 7 mg/L</td></tr><tr><td>ESR (Dec 8)</td><td>18 mm/h</td></tr><tr><td>Vitamin D, 25-OH (Dec 8)</td><td>32 ng/mL</td></tr></table>
      <h4>Diet patterns (4 weeks)</h4><table><tr><td>Mediterranean days</td><td>18 of 28</td></tr><tr><td>Ultra-processed share</td><td>22%</td></tr></table>
      <h4>Top associations</h4><p style="margin:0">Higher joint pain 1 to 2 days after high added-sugar days (probability 0.82). Association in personal data, not a medical finding.</p>
      <h4>Flares</h4><p style="margin:0">2 logged (Oct 27, Nov 4). Check-in adherence 91%.</p></div>
      <button class="btn ghost block" style="margin-top:10px" data-act="dlPdf">${ic('download', 20)} Save PDF</button>` : ''}
    ${sh.fhir ? `<h4 class="eyebrow" style="margin-top:16px">FHIR R4 bundle</h4><pre class="code">${esc(JSON.stringify(fhir, null, 2))}</pre>` : ''}
    ${sh.link ? `<div class="card row" style="margin-top:12px;background:var(--violet-soft)"><span class="grow"><b>Secure link created</b><div class="note">remitra.example/r/7Kp2 · expires in 7 days</div></span></div>` : ''}
    <button class="btn primary block" style="margin-top:12px" data-act="close">Done</button>`;
};

/* ================= render ================= */
const screen = document.getElementById('screen');
let modal = null, toastT;
function render(keepScroll) {
  const v = screen.querySelector('.view');
  const top = keepScroll && v ? v.scrollTop : 0;
  const fn = V[S.route] || V.today;
  screen.innerHTML = fn() + (modal ? `<div class="modal-wrap" data-act="backdrop"><div class="modal" role="dialog" aria-modal="true">${modal}</div></div>` : '');
  const nv = screen.querySelector('.view');
  if (nv) nv.scrollTop = top;
  afterRender();
  if (S.route === 'ask') { const cv = document.getElementById('chatview'); if (cv) cv.scrollTop = cv.scrollHeight; }
  renderSide();
  save();
}
function renderSide() {
  const cur = TAB_OF[S.route] === 'log' && S.route !== 'log' ? S.route : S.route;
  document.getElementById('jump').innerHTML = SCREENS.map(([r, n, f], i) => `<li><button data-jump="${r}" aria-current="${cur === r}"><span class="n">${i + 1}</span>${n}<span class="f">${f}</span></button></li>`).join('');
  const notes = NOTES[S.route] || [];
  document.getElementById('notes').innerHTML = `<h3>${(SCREENS.find(s => s[0] === S.route) || [0, S.route[0].toUpperCase() + S.route.slice(1)])[1]}</h3><ul>${notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>`;
}
function toast(msg) {
  clearTimeout(toastT);
  screen.querySelectorAll('.toast').forEach(t => t.remove());
  const el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status');
  el.innerHTML = `${ic('check', 18, 2.6)}<span>${msg}</span>`; screen.appendChild(el);
  toastT = setTimeout(() => el.remove(), 2600);
}
const go = r => { if (r !== 'meal') stopMedia(); S.route = r; modal = null; render(); };
const openModal = name => { const [k, a] = name.split(':'); modal = MODALS[k](a); render(true); const m = screen.querySelector('.modal'); m && m.querySelector('button, input, select')?.focus(); };

/* ================= actions ================= */
const A = {
  go,
  close: () => { modal = null; render(true); },
  backdrop: (_, e) => { if (e.target.classList.contains('modal-wrap')) A.close(); },
  modal: openModal,
  obNext: () => { S.step = Math.min(4, S.step + 1); render(); },
  obBack: () => { S.step = Math.max(1, S.step - 1); render(); },
  obDone: () => { S.healthConnected = S.consent.health; go('today'); toast('Welcome. Consent saved (version 1.0).'); },
  reOnboard: () => { S.step = 1; go('onboard'); },
  toggleCond: c => { S.conditions = S.conditions.includes(c) ? S.conditions.filter(x => x !== c) : [...S.conditions, c]; render(true); },
  toggleGoal: g => { S.goals = S.goals.includes(g) ? S.goals.filter(x => x !== g) : [...S.goals, g]; render(true); },
  consent: k => {
    if (k === 'app') return;
    if (k === 'research' && !S.consent.research) return openModal('research');
    S.consent[k] = !S.consent[k]; render(true);
    if (S.route === 'settings') toast(`${k === 'research' ? 'Research mode' : 'Consent'} ${S.consent[k] ? 'on' : 'off'}. Saved as a new consent version.`);
  },
  researchYes: () => { S.consent.research = true; modal = null; render(true); toast('Research consent saved. Revoke any time in Settings.'); },
  logMeal: mode => {
    stopMedia();
    if (mode === 'photo' && !S.consent.ai) { toast('AI photo reading is off. Turn it on in Settings, or type the meal.'); return; }
    media.photo = null;
    if (mode === 'photo') { S.draft = { mode, stage: 'camera', items: [] }; go('meal'); startCamera(); loadModel().catch(() => {}); }
    else if (mode === 'voice') { S.draft = { mode, stage: 'listen', items: [], text: '' }; go('meal'); startListening(); }
    else if (mode === 'barcode') { S.draft = { mode, stage: 'scan', items: [] }; go('meal'); startScanner(); }
    else { S.draft = { mode: 'text', stage: 'text', items: [], text: '' }; go('meal'); document.getElementById('mt')?.focus(); }
  },
  cancelMeal: () => { stopMedia(); S.draft = null; media.photo = null; go('log'); },
  capture: () => {
    const v = document.getElementById('cam');
    if (!v || !media.stream || !v.videoWidth) { toast('Camera is not ready. You can upload a photo instead.'); return; }
    const k = Math.min(1, 800 / Math.max(v.videoWidth, v.videoHeight));
    const c = document.createElement('canvas'); c.width = Math.round(v.videoWidth * k); c.height = Math.round(v.videoHeight * k);
    c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
    processPhoto(c.toDataURL('image/jpeg', .85));
  },
  stopListen: () => { if (media.rec) { try { media.rec.stop(); } catch {} } else if (S.draft) { S.draft.stage = 'text'; render(); } },
  parseText: async () => {
    const d = S.draft; const list = parseFoods(d.text || '');
    if (!list.length) { d.msg = 'Type at least one food.'; return render(); }
    d.msg = ''; const btn = document.querySelector('[data-act="parseText"]'); if (btn) { btn.disabled = true; btn.textContent = 'Looking up nutrients…'; }
    d.items = await Promise.all(list.map(x => makeItem(x.name, { count: x.count })));
    if (S.draft !== d) return;
    if (d.items.some(i => !i.n)) d.msg = 'Some foods were not found in USDA FoodData Central. Check the names, or remove them.';
    else if (d.items.some(i => i.src === 'Offline estimate')) d.msg = 'USDA lookup is unavailable right now (shared demo key limit), so some nutrients are offline estimates.';
    d.stage = 'review'; render();
  },
  portion: arg => { const [i, dir] = arg.split(':').map(Number); const it = S.draft.items[i]; const step = it.grams >= 60 ? 25 : 10; it.grams = Math.max(step, it.grams + dir * step); render(true); },
  rmItem: i => { S.draft.items.splice(+i, 1); render(true); },
  openSearch: () => { media.search = { q: '', results: [], busy: false, err: '' }; openModal('addItem'); },
  pickFood: i => {
    const s = media.search; const f = s.results[+i]; if (!f) return;
    const name = f.desc.split(',').slice(0, 2).join(',');
    S.draft.items.push({ name, grams: gramsFor(f.desc), n: f.n, src: 'USDA FoodData Central', fdc: f.fdc, match: f.desc, conf: null, nova: null, allergens: [] });
    if (S.draft.items.length) S.draft.msg = '';
    modal = null; render(true);
  },
  addTyped: () => {
    const s = media.search; if (!s.q) return;
    S.draft.items.push({ name: cap(s.q), grams: gramsFor(s.q), n: null, src: 'Not found', fdc: null, match: null, conf: null, nova: null, allergens: [] });
    modal = null; render(true);
  },
  confirmMeal: () => {
    const d = S.draft; if (!d || !d.items.length) { toast('Add at least one item.'); return; }
    const nm = d.items.map(i => i.name.split(',')[0]).join(', ');
    const tags = [...new Set(d.items.flatMap(tagsFor))];
    const now = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const kcal = Math.round(mealTotals(d.items).kcal);
    S.meals.push({ id: 'm' + Date.now(), nm, tm: `${now} · ${kcal} kcal`, tag: tags[0] || '', emoji: { photo: '📷', voice: '🎙️', barcode: '🏷️', text: '🍽️' }[d.mode], bg: { photo: '#F7DCCF', voice: '#EEEAFB', barcode: '#E8EEF6', text: '#EDF1F0' }[d.mode] });
    S.access.unshift(['Dec 15 ' + now, 'You', 'Logged a meal']);
    stopMedia(); S.draft = null; media.photo = null; go('today');
    toast(d.mode === 'photo' ? 'Meal saved. Photo discarded.' : 'Meal saved.');
  },
  repeatMeal: () => { S.meals.push({ ...seedMeals()[0], id: 'm' + Date.now(), tm: '4:15 PM' }); go('today'); toast('Repeated: oatmeal, blueberries, walnuts.'); },
  startCheckin: () => { S.checkin = { done: false, i: 0, ans: {}, result: null, t0: Date.now() }; go('checkin'); },
  answer: n => { S.checkin.ans[[...CHECKIN_Q, ...RAPID3_Q][S.checkin.i].k] = +n; render(true); },
  voiceAnswer: () => {
    modal = `<div class="listen"><div class="mic">${ic('mic')}</div><b>Listening…</b><p class="sub" style="text-align:center">"I'd say about a four."</p></div>`; render(true);
    setTimeout(() => { modal = null; A.answer(4); toast('Heard "about a four". Selected 4.'); }, 1500);
  },
  ciBack: () => { if (S.checkin.i === 0) go('today'); else { S.checkin.i--; render(); } },
  ciNext: () => {
    const c = S.checkin; const all = [...CHECKIN_Q, ...RAPID3_Q];
    c.i++;
    if (c.i >= all.length) {
      const fn = c.ans.fn, rp = c.ans.rpain, gl = c.ans.glob;
      const secs = Math.max(20, Math.min(95, Math.round((Date.now() - (c.t0 || Date.now())) / 1000)));
      c.result = { fn, rpain: rp, glob: gl, r3: fn + rp + gl, secs }; c.done = true;
    }
    render();
  },
  startLabs: () => { S.labs.pending = null; go('labs'); },
  scanLab: () => {
    if (!S.consent.ai) { toast('AI reading is off. Enter values by hand, or turn it on in Settings.'); return; }
    S.labs.pending = [
      { nm: 'C-reactive protein (CRP)', v: 7, u: 'mg/L', range: 'under 10 mg/L', loinc: '1988-5', ok: false },
      { nm: 'Erythrocyte sedimentation rate', v: 18, u: 'mm/h', range: '0 to 20 mm/h', loinc: '4537-7', ok: false },
      { nm: 'Vitamin D, 25-OH', v: 32, u: '', range: '30 to 100 ng/mL', loinc: '1989-3', ok: false, unclear: true },
    ]; render();
  },
  labOk: i => { const x = S.labs.pending[+i]; x.ok = !x.ok; render(true); },
  setUnit: arg => { const [i, u] = arg.split(':'); const x = S.labs.pending[+i]; x.u = u; x.ok = true; if (u === 'nmol/L') x.range = '75 to 250 nmol/L'; modal = null; render(true); },
  saveLabs: () => {
    S.labs.saved.push(...S.labs.pending.map(x => ({ nm: x.nm.replace(/ \(.*\)/, '').replace('Erythrocyte sedimentation rate', 'ESR'), v: x.v, u: x.u, d: 'Dec 8' })));
    S.labs.pending = null; S.access.unshift(['Dec 15 10:02', 'You', 'Saved 3 lab results']);
    render(); toast('3 results saved as LOINC-coded Observations. Photo deleted.');
  },
  why: id => { S.why[id] = !S.why[id]; render(true); },
  ask: q => sendAsk(q),
  testAgree: () => { S.test.agreed = !S.test.agreed; render(true); },
  testRemind: () => { S.test.remind = !S.test.remind; render(true); },
  startTest: () => { if (!S.test.agreed) return; S.test.started = true; render(); toast('Experiment scheduled. First check-in Monday, Dec 21.'); },
  stopTest: () => { S.test.started = false; S.test.agreed = false; render(); toast('Experiment stopped. Your data so far is kept.'); },
  trendTab: t => { S.trendTab = t; render(); },
  share: k => { S.share[k] = !S.share[k]; if (k === 'link' && !S.share.link) S.share.linkActive = false; render(true); },
  createReport: () => { if (S.share.link) S.share.linkActive = true; S.access.unshift(['Dec 15 10:30', 'You', 'Created care team report']); openModal('report'); },
  revoke: () => { S.share.linkActive = false; S.share.link = false; render(true); toast('Link revoked. It no longer opens.'); },
  dlPdf: () => toast('In the app this saves a tagged, screen-reader friendly PDF.'),
  rmSupp: i => { S.supplements.splice(+i, 1); openModal('meds'); },
  exportData: () => {
    const blob = new Blob([JSON.stringify({ note: 'Synthetic demo export', meals: S.meals, labs: S.labs.saved, checkin: S.checkin.result, consent: S.consent }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'remitra-demo-export.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Export created (demo JSON).');
  },
  doDelete: () => { S = fresh(); S.step = 1; modal = null; render(); toast('All demo data deleted.'); },
};

function sendAsk(q) {
  q = q.trim(); if (!q) return;
  S.chat.push({ u: q }, { typing: true }); render(true);
  setTimeout(() => { S.chat = S.chat.filter(m => !m.typing); S.chat.push({ a: answer(q) }); render(true); }, 900);
}

/* ================= events ================= */
document.addEventListener('click', e => {
  const j = e.target.closest('[data-jump]');
  if (j) { jump(j.dataset.jump); return; }
  const el = e.target.closest('[data-act]');
  if (!el || !screen.contains(el)) return;
  const fn = A[el.dataset.act];
  if (fn) { if (el.dataset.act !== 'backdrop') e.preventDefault(); fn(el.dataset.arg, e); }
});
document.addEventListener('submit', e => {
  const f = e.target.closest('[data-form]'); if (!f) return;
  e.preventDefault();
  if (f.dataset.form === 'ask') { const i = f.querySelector('input'); sendAsk(i.value); }
  if (f.dataset.form === 'barcode') { const v = f.querySelector('input').value; barcodeFound(v); }
  if (f.dataset.form === 'foodsearch') {
    const q = f.querySelector('input').value.trim(); if (!q) return;
    media.search = { q, results: [], busy: true, err: '' }; modal = MODALS.addItem(); render(true);
    usdaSearch(q, 10).then(r => { media.search.results = r; if (!r.length) media.search.err = 'No USDA match. You can add it without nutrients.'; })
      .catch(e => { media.search.err = e.limit ? 'USDA lookup limit reached for the shared demo key. Add a free key in config.js, or add this food without nutrients.' : 'Could not reach USDA FoodData Central. You can add it without nutrients.'; })
      .finally(() => { media.search.busy = false; if (modal) { modal = MODALS.addItem(); render(true); } });
  }
  if (f.dataset.form === 'supp') { const v = f.querySelector('input').value.trim(); if (v) { S.supplements.push(v); openModal('meds'); } }
  if (f.dataset.form === 'lab') {
    const nm = f.querySelector('#la').value, v = +f.querySelector('#lv').value, d = f.querySelector('#ld').value || 'Dec 15';
    const u = { CRP: 'mg/L', ESR: 'mm/h', 'Fecal calprotectin': 'µg/g', 'Vitamin D, 25-OH': 'ng/mL' }[nm];
    S.labs.saved.push({ nm, v, u, d }); modal = null; render(); toast(`${nm} ${v} ${u} saved.`);
  }
});
document.addEventListener('input', e => {
  const k = e.target.dataset && e.target.dataset.input;
  if (k === 'name') S.name = e.target.value || 'Maya';
  if (k === 'mealText' && S.draft) S.draft.text = e.target.value;
  save();
});
document.addEventListener('change', e => {
  const k = e.target.dataset && e.target.dataset.file; const file = e.target.files && e.target.files[0];
  if (!k || !file || !S.draft) return;
  if (k === 'photo') { const r = new FileReader(); r.onload = () => processPhoto(r.result); r.readAsDataURL(file); }
  if (k === 'barcode') {
    setStatus('Reading the barcode in your photo…');
    loadQr().then(() => new window.Html5Qrcode('qr-file').scanFile(file, false)).then(barcodeFound)
      .catch(() => setStatus('No barcode found in that photo. Try a sharper photo or type the number.'));
  }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal) A.close(); });
document.getElementById('reset').addEventListener('click', () => { S = fresh(); modal = null; render(); toast('Demo data reset.'); });

function jump(r) {
  modal = null;
  if (r === 'onboard') S.step = 3;
  if (r === 'meal') { A.logMeal('photo'); return; }
  if (r === 'checkin') { S.checkin = { done: S.checkin.done, i: 0, ans: {}, result: S.checkin.result, t0: Date.now() }; }
  if (r === 'labs') { A.scanLab(); if (!S.labs.pending) S.labs.pending = null; }
  if (r === 'ask' && !S.chat.length) { S.chat = [{ u: 'Do I sleep worse after late dinners?' }, { a: answer('late dinners sleep') }, { u: 'Should I stop my methotrexate?' }, { a: answer('stop methotrexate') }]; }
  go(r);
}

// fit the phone frame to short desktop windows
const fit = () => document.documentElement.style.setProperty('--z', Math.min(1, Math.max(.6, (innerHeight - 40) / 868)).toFixed(3));
addEventListener('resize', fit); fit();

render();
})();
