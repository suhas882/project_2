/* Personal Insights engine (A3) and Flare outlook (A5), DEMO versions.
   Insights: for each food exposure and outcome, compare outcome days after exposure vs. other days at
   lags 0 to 3, using a normal-normal Bayesian estimate with shrinkage toward "no effect".
   It is NOT adjusted for confounders. The planned engine is a Bayesian hierarchical regression that
   adjusts for sleep, stress, activity, medication changes and illness days.
   Flare outlook: a hand-set logistic score over recent trends. Prototype estimate based on synthetic
   data; not trained, not validated. */
import type { AppData, Meal, SymptomEntry, WearableDay } from '../types.ts';
import { mealTotals } from '../data/foods.ts';
import { addDays } from '../lib/dates.ts';

export const HIGH_SUGAR_G = 40;

export interface DayExposure {
  date: string;
  logged: boolean;
  kcal: number;
  fiber: number;
  addedSugar: number;
  highSugar: boolean;
  lateDinner: boolean;
  dinnerTime?: string;
  dairy: boolean;
  gluten: boolean;
  nightshade: boolean;
  mediterraneanMeals: number;
  mediterraneanDay: boolean;
  upfShare: number;
  upfHigh: boolean;
}

export function dailyExposures(meals: Meal[]): Map<string, DayExposure> {
  const byDay = new Map<string, Meal[]>();
  for (const m of meals) (byDay.get(m.date) ?? byDay.set(m.date, []).get(m.date)!).push(m);
  const out = new Map<string, DayExposure>();
  for (const [date, ms] of byDay) {
    const items = ms.flatMap(m => m.items);
    const t = mealTotals(items);
    const dinner = ms.filter(m => m.slot === 'Dinner').sort((a, b) => b.time.localeCompare(a.time))[0];
    const has = (tag: string) => items.some(i => i.tags.includes(tag as never));
    const medMeals = ms.filter(m => m.items.filter(i => i.tags.includes('Mediterranean')).length >= 2).length;
    const upfKcal = items.filter(i => i.tags.includes('Ultra-processed')).reduce((s, i) => s + mealTotals([i]).kcal, 0);
    const upfShare = t.kcal ? upfKcal / t.kcal : 0;
    out.set(date, {
      date, logged: true, kcal: t.kcal, fiber: t.fiber, addedSugar: t.addedSugar, highSugar: t.addedSugar > HIGH_SUGAR_G,
      lateDinner: !!dinner && dinner.time >= '20:00', dinnerTime: dinner?.time,
      dairy: has('Dairy'), gluten: has('Gluten'), nightshade: has('Nightshade'),
      mediterraneanMeals: medMeals, mediterraneanDay: medMeals >= 1, upfShare, upfHigh: upfShare >= 0.3,
    });
  }
  return out;
}

/* ---------------- insights ---------------- */
export type ExposureKey = 'highSugar' | 'lateDinner' | 'dairy' | 'gluten' | 'nightshade' | 'mediterraneanDay' | 'upfHigh';
export type OutcomeKey = 'pain' | 'fatigue' | 'gi' | 'sleepQuality' | 'sleepMin';

export const EXPOSURES: Record<ExposureKey, { label: string; short: string; testable: boolean }> = {
  highSugar: { label: 'high added-sugar days (over 40 g)', short: 'Added sugar', testable: true },
  lateDinner: { label: 'dinners at or after 8 PM', short: 'Late dinners', testable: true },
  dairy: { label: 'dairy', short: 'Dairy', testable: true },
  gluten: { label: 'gluten-containing foods', short: 'Gluten', testable: true },
  nightshade: { label: 'nightshade vegetables', short: 'Nightshades', testable: true },
  mediterraneanDay: { label: 'Mediterranean-pattern days', short: 'Mediterranean days', testable: false },
  upfHigh: { label: 'days with 30% or more of calories from ultra-processed food', short: 'Ultra-processed', testable: true },
};

export const OUTCOMES: Record<OutcomeKey, { label: string; unit: string; prior: number; minimal: number; higherIsWorse: boolean }> = {
  pain: { label: 'joint pain', unit: 'points', prior: 0.6, minimal: 0.5, higherIsWorse: true },
  fatigue: { label: 'fatigue', unit: 'points', prior: 0.6, minimal: 0.5, higherIsWorse: true },
  gi: { label: 'gut discomfort', unit: 'points', prior: 0.6, minimal: 0.5, higherIsWorse: true },
  sleepQuality: { label: 'sleep quality', unit: 'points', prior: 0.6, minimal: 0.5, higherIsWorse: false },
  sleepMin: { label: 'sleep', unit: 'minutes', prior: 30, minimal: 10, higherIsWorse: false },
};

const PAIRS: [ExposureKey, OutcomeKey][] = [
  ['highSugar', 'pain'], ['highSugar', 'fatigue'], ['lateDinner', 'sleepMin'],
  ['dairy', 'gi'], ['gluten', 'pain'], ['nightshade', 'pain'], ['mediterraneanDay', 'pain'], ['upfHigh', 'fatigue'],
];
const FOOD_WINDOWS = [[0], [1], [2], [0, 1], [1, 2]];
// late dinner can only plausibly affect the same night's sleep
const windowsFor = (ek: ExposureKey, ok: OutcomeKey) => (ek === 'lateDinner' && ok === 'sleepMin' ? [[0]] : FOOD_WINDOWS);
// searching several lag windows inflates chance findings; subtract a z penalty per extra window tried
const SEARCH_PENALTY = (n: number) => (n > 1 ? 1.0 : 0);

export type InsightLabel = 'Likely' | 'Possible' | 'Not enough data' | 'No clear association';

export interface LagStat { lag: number; diff: number; n1: number; n0: number }

export interface Insight {
  id: string;
  exposure: ExposureKey;
  outcome: OutcomeKey;
  label: InsightLabel;
  probability: number;
  effect: number;
  direction: 'higher' | 'lower';
  window: number[];
  lagText: string;
  lags: LagStat[];
  nExposedDays: number;
  nDays: number;
  sentence: string;
  detail: string;
  nextStep: string;
  moreDays?: number;
  favorable: boolean;
}

const phi = (z: number) => {
  // standard normal CDF (Abramowitz-Stegun 7.1.26)
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2);
  return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
};

const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / (a.length || 1);
const variance = (a: number[]) => { const m = mean(a); return a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, a.length - 1); };

export const MIN_DAYS = 14;
export const MIN_EXPOSED = 3;

function outcomeSeries(data: Pick<AppData, 'symptoms' | 'wearables'>, key: OutcomeKey): Map<string, number> {
  const m = new Map<string, number>();
  if (key === 'sleepMin') data.wearables.forEach((w: WearableDay) => m.set(w.date, w.sleepMin));
  else data.symptoms.forEach((s: SymptomEntry) => m.set(s.date, s[key]));
  return m;
}

const lagWords = (w: number[], ok: OutcomeKey) => {
  if (w.length === 1 && w[0] === 0) return ok === 'sleepMin' ? 'on nights after' : 'on the same day as';
  if (w.length === 1) return w[0] === 1 ? '1 day after' : `${w[0]} days after`;
  if (w[0] === 0) return 'on the same day as or the day after';
  return `${w[0]} to ${w[w.length - 1]} days after`;
};

export function computeInsights(data: Pick<AppData, 'meals' | 'symptoms' | 'wearables'>): Insight[] {
  const ex = dailyExposures(data.meals);
  const loggedDays = [...ex.keys()].sort();
  const out: Insight[] = [];
  for (const [ek, ok] of PAIRS) {
    const series = outcomeSeries(data, ok);
    const O = OUTCOMES[ok];
    const nExposedDays = loggedDays.filter(d => ex.get(d)![ek]).length;
    const lags: LagStat[] = [0, 1, 2, 3].map(lag => {
      const a: number[] = [], b: number[] = [];
      for (const d of loggedDays) { const y = series.get(addDays(d, lag)); if (y == null) continue; (ex.get(d)![ek] ? a : b).push(y); }
      return { lag, diff: a.length && b.length ? mean(a) - mean(b) : 0, n1: a.length, n0: b.length };
    });
    const base = { id: `${ek}-${ok}`, exposure: ek, outcome: ok, lags, nExposedDays, nDays: loggedDays.length };
    const notEnough = loggedDays.length < MIN_DAYS || nExposedDays < MIN_EXPOSED || loggedDays.length - nExposedDays < MIN_EXPOSED;
    if (notEnough) {
      out.push({ ...base, label: 'Not enough data', probability: 0, effect: 0, direction: 'higher', window: [], lagText: '', favorable: false,
        sentence: EXPOSURES[ek].short, detail: `Logged on ${nExposedDays} of ${loggedDays.length} days.`,
        nextStep: `Keep logging normally. Insights need at least ${MIN_DAYS} logged days, with the food present on ${MIN_EXPOSED} or more days and absent on ${MIN_EXPOSED} or more.` });
      continue;
    }
    let best: { w: number[]; m: number; sd: number; z: number; n1: number } | null = null;
    const windows = windowsFor(ek, ok);
    for (const w of windows) {
      const a: number[] = [], b: number[] = [];
      for (const d of series.keys()) {
        const hits = w.map(l => ex.get(addDays(d, -l)));
        if (hits.some(h => !h)) continue;
        (hits.some(h => h![ek]) ? a : b).push(series.get(d)!);
      }
      if (a.length < MIN_EXPOSED || b.length < MIN_EXPOSED) continue;
      const diff = mean(a) - mean(b);
      const se2 = variance(a) / a.length + variance(b) / b.length || 1e-6;
      const postVar = 1 / (1 / O.prior ** 2 + 1 / se2);
      const m = diff * (postVar / se2);
      const sd = Math.sqrt(postVar);
      const z = Math.abs(m) / sd;
      if (!best || z > best.z) best = { w, m, sd, z, n1: a.length };
    }
    if (!best) continue;
    const probability = phi((Math.abs(best.m) - O.minimal) / best.sd - SEARCH_PENALTY(windows.length));
    const label: InsightLabel = probability >= 0.8 ? 'Likely' : probability >= 0.6 ? 'Possible' : 'No clear association';
    const direction = best.m >= 0 ? 'higher' : 'lower';
    const worse = O.higherIsWorse ? direction === 'higher' : direction === 'lower';
    const amount = ok === 'sleepMin' ? `${Math.round(Math.abs(best.m))} minutes` : `${Math.abs(best.m).toFixed(1)} points`;
    const outcomeWord = ok === 'sleepMin' ? (direction === 'higher' ? 'Longer sleep' : 'Shorter sleep') : `${direction === 'higher' ? 'Higher' : 'Lower'} ${O.label}`;
    const lagText = lagWords(best.w, ok);
    let moreDays: number | undefined;
    if (label === 'Possible' && Math.abs(best.m) > O.minimal) {
      const target = (Math.abs(best.m) - O.minimal) / (0.84 + SEARCH_PENALTY(windows.length));
      moreDays = Math.max(3, Math.ceil(loggedDays.length * ((best.sd / target) ** 2 - 1)));
    }
    out.push({
      ...base, label, probability, effect: best.m, direction, window: best.w, lagText, moreDays, favorable: !worse,
      sentence: `${outcomeWord} ${lagText} ${EXPOSURES[ek].label}`,
      detail: `About ${direction === 'higher' ? '+' : '−'}${amount} ${ok === 'sleepMin' ? '' : 'on your 0 to 10 scale '}compared with other days. Based on ${best.n1} exposed days out of ${loggedDays.length} logged days.`,
      nextStep: label === 'Likely' && EXPOSURES[ek].testable && worse ? 'Talk it over with your clinician or dietitian, then try a Test It experiment.'
        : label === 'Possible' ? `About ${moreDays ?? 10} more days of normal logging would firm this up or rule it out.`
        : 'Keep logging normally.',
    });
  }
  const rank: Record<InsightLabel, number> = { Likely: 0, Possible: 1, 'Not enough data': 2, 'No clear association': 3 };
  return out.sort((a, b) => rank[a.label] - rank[b.label] || b.probability - a.probability);
}

/* ---------------- flare outlook ---------------- */
export interface FlareFactor { label: string; detail: string; push: number }
export interface FlareOutlook {
  probability: number;
  level: 'Low' | 'Moderate' | 'Elevated';
  headline: string;
  days: { date: string; p: number }[];
  history: { date: string; p: number; flare: boolean }[];
  factors: FlareFactor[];
}

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

function scoreAt(data: Pick<AppData, 'meals' | 'symptoms' | 'wearables'>, endDate: string, ex: Map<string, DayExposure>) {
  const win = (n: number) => Array.from({ length: n }, (_, i) => addDays(endDate, -i));
  const sym = new Map(data.symptoms.map(s => [s.date, s]));
  const wear = new Map(data.wearables.map(w => [w.date, w]));
  const vals = (days: string[], f: (d: string) => number | undefined) => days.map(f).filter((v): v is number => v != null);
  const d7 = win(7), d28 = win(28);
  const pain7 = mean(vals(d7, d => sym.get(d)?.pain)), pain28 = mean(vals(d28, d => sym.get(d)?.pain));
  const sleep7 = mean(vals(d7, d => wear.get(d)?.sleepMin)), sleep28 = mean(vals(d28, d => wear.get(d)?.sleepMin));
  const hrv7 = mean(vals(d7, d => wear.get(d)?.hrv)), hrv28 = mean(vals(d28, d => wear.get(d)?.hrv));
  const rhr7 = mean(vals(d7, d => wear.get(d)?.rhr)), rhr28 = mean(vals(d28, d => wear.get(d)?.rhr));
  const sugar7 = d7.filter(d => ex.get(d)?.highSugar).length;
  const lastSym = sym.get(endDate) ?? sym.get(addDays(endDate, -1));
  const painLast = lastSym?.pain ?? pain7;
  const painLastDate = lastSym?.date;
  const parts = {
    pain: 0.6 * (pain7 - pain28) + 0.25 * (pain7 - 4),
    sleep: 0.03 * (sleep28 - sleep7),
    hrv: 0.09 * (hrv28 - hrv7),
    rhr: 0.15 * (rhr7 - rhr28),
    sugar: 0.22 * sugar7,
    // a single high day should move the estimate, not just the 7-day average
    recent: 0.45 * Math.max(0, painLast - pain28 - 1),
  };
  const score = -2.4 + Object.values(parts).reduce((s, v) => s + (Number.isFinite(v) ? v : 0), 0);
  return { p: sigmoid(score), parts, pain7, pain28, sleep7, sleep28, hrv7, hrv28, rhr7, rhr28, sugar7, painLast, painLastDate };
}

export function flareOutlook(data: Pick<AppData, 'meals' | 'symptoms' | 'wearables' | 'flares'>, today: string): FlareOutlook {
  const ex = dailyExposures(data.meals);
  // include today's check-in when there is one
  const last = data.symptoms.some(x => x.date === today) ? today : addDays(today, -1);
  const s = scoreAt(data, last, ex);
  const p = s.p;
  const level = p < 0.2 ? 'Low' : p < 0.4 ? 'Moderate' : 'Elevated';
  const trend = s.pain7 - s.pain28;
  const days = Array.from({ length: 7 }, (_, k) => ({ date: addDays(today, k), p: Math.min(0.95, Math.max(0.02, p * (1 + 0.04 * k * Math.sign(trend || 0)))) }));
  const flareDates = new Set(data.flares.map(f => f.date));
  const history = Array.from({ length: 60 }, (_, i) => addDays(last, i - 59)).map(d => ({ date: d, p: scoreAt(data, d, ex).p, flare: flareDates.has(d) }));
  const f = (n: number, dp = 1) => (Number.isFinite(n) ? n.toFixed(dp) : 'n/a');
  const factors: FlareFactor[] = [
    { label: 'Joint pain trend', detail: `7-day average ${f(s.pain7)} vs 28-day ${f(s.pain28)}`, push: s.parts.pain },
    { label: 'Sleep', detail: `7-day average ${Math.round(s.sleep7 || 0)} min vs 28-day ${Math.round(s.sleep28 || 0)} min`, push: s.parts.sleep },
    { label: 'Heart rate variability', detail: `7-day ${f(s.hrv7, 0)} ms vs 28-day ${f(s.hrv28, 0)} ms`, push: s.parts.hrv },
    { label: 'Resting heart rate', detail: `7-day ${f(s.rhr7, 0)} bpm vs 28-day ${f(s.rhr28, 0)} bpm`, push: s.parts.rhr },
    { label: 'High added-sugar days', detail: `${s.sugar7} in the last 7 days`, push: s.parts.sugar },
    { label: 'Most recent joint pain', detail: `${s.painLast} of 10${s.painLastDate ? ` on your last check-in` : ''} vs 28-day average ${f(s.pain28)}`, push: s.parts.recent },
  ].map(x => ({ ...x, push: Number.isFinite(x.push) ? x.push : 0 }));
  const spike = s.painLast - s.pain28 >= 2;
  const steady = Math.abs(s.parts.sleep) < 0.4 && Math.abs(trend) < 0.6 && !spike;
  const headline = level === 'Low' ? (spike ? `Joint pain was high on your last check-in (${s.painLast} of 10); other signals look steady` : steady ? 'Steady sleep and symptoms this week' : 'Signals look calm this week')
    : level === 'Moderate' ? 'Some signals are drifting. Keep an eye on rest and pain.' : 'Several signals look like your past flares';
  return { probability: p, level, headline, days, history, factors };
}
