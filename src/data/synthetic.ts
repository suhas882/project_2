/* Deterministic 70-day synthetic history for the demo persona "Maya, rheumatoid arthritis".
   Planted patterns (so the insights engine has something real to find):
     - Joint pain is about +1.4 points 1 to 2 days after a high added-sugar day (> 40 g).
     - Dinners at or after 8 PM shorten that night's sleep by about 25 minutes.
     - Dairy appears on only 2 days (too little data for any insight).
     - Two flares (days 20 and 27) raise pain, fatigue and resting heart rate and lower HRV.
     - Overall disease activity drifts down over the 70 days (RAPID3 about 9 to about 6).
   NOTHING here is real patient data. */
import type { AppData, FlareEvent, FoodItem, LabResult, Meal, MealSlot, Rapid3Entry, SymptomEntry, WearableDay } from '../types.ts';
import { addDays, pad } from '../lib/dates.ts';
import { itemFromDb, mealTotals, type FoodKey } from './foods.ts';
import { rapid3Total } from '../lib/scoring.ts';

export const DAYS = 70;
export const HIGH_SUGAR_G = 40;
export const LATE_DINNER = '20:00';

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v: number, lo = 0, hi = 10) => Math.max(lo, Math.min(hi, v));

export function generatePersona(anchor: string, seed = 20261215): Omit<AppData, 'version' | 'onboarded' | 'profile' | 'consent' | 'consentLog' | 'chat' | 'shares' | 'prefs' | 'experiments'> {
  const rnd = mulberry32(seed);
  const gauss = (sd = 1) => {
    const u = 1 - rnd(), v = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * sd;
  };
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)];
  const time = (h0: number, h1: number) => { const m = Math.floor(h0 * 60 + rnd() * (h1 - h0) * 60); return `${pad(Math.floor(m / 60))}:${pad(Math.floor(m % 60 / 5) * 5)}`; };

  const meals: Meal[] = [];
  const symptoms: SymptomEntry[] = [];
  const wearables: WearableDay[] = [];
  const rapid3: Rapid3Entry[] = [];
  const sugarDay: boolean[] = [];
  const flareBoost = (i: number) => ({ 20: 2.5, 21: 2.2, 22: 1.6, 23: 1, 27: 1.6, 28: 1.2, 29: 0.6 } as Record<number, number>)[i] ?? 0;
  const DAIRY_DAYS = new Set([12, 45]);
  let mealSeq = 0;

  const addMeal = (date: string, slot: MealSlot, t: string, keys: FoodKey[]) => {
    const items: FoodItem[] = keys.map(k => itemFromDb(k, 0.9 + rnd() * 0.25));
    meals.push({ id: `syn-${++mealSeq}`, date, time: t, slot, items, method: 'synthetic' });
    return items;
  };

  for (let i = 0; i < DAYS; i++) {
    const date = addDays(anchor, i - DAYS);
    const dayItems: FoodItem[] = [];
    // the last 3 days are kept sugar-free so the demo opens on a calm, consistent dashboard
    const sweet = rnd() < 0.18 && i < DAYS - 3;
    // breakfast
    let bk: FoodKey[];
    if (i === 12) bk = ['greekYogurt', 'granola', 'blueberries', 'oatMilkCoffee'];
    else if (i === 45) bk = ['toast', 'avocado', 'latte'];
    else if (sweet && rnd() < 0.4) bk = ['pastry', 'oatMilkCoffee'];
    else bk = rnd() < 0.62 ? ['oatmeal', 'blueberries', 'walnuts', 'oatMilkCoffee'] : ['toast', 'eggs', 'avocado', 'oatMilkCoffee'];
    dayItems.push(...addMeal(date, 'Breakfast', time(7, 8.6), bk));
    // lunch
    dayItems.push(...addMeal(date, 'Lunch', time(12, 13.5), pick<FoodKey[]>([
      ['salmon', 'quinoa', 'tomatoes', 'oliveOil'], ['lentilSoup', 'sourdough'], ['turkeyWrap', 'apple'],
      ['chickenBowl', 'greens'], ['chickpeas', 'greens', 'oliveOil'],
    ])));
    // snack
    const snack: FoodKey[] = sweet ? pick<FoodKey[]>([['cookies', 'soda'], ['candyBar', 'soda'], ['iceCreamDf', 'cookies']]) : pick<FoodKey[]>([['apple'], ['almonds'], ['hummusCarrots'], ['darkChocolate']]);
    dayItems.push(...addMeal(date, 'Snack', time(15, 16.5), snack));
    // dinner
    const late = rnd() < 0.22;
    dayItems.push(...addMeal(date, 'Dinner', late ? time(20, 21.5) : time(18, 19.75), pick<FoodKey[]>([
      ['pasta', 'greens'], ['stirFry'], ['roastChicken', 'sweetPotato', 'broccoli'], ['salmon', 'greens', 'oliveOil'],
      ['pizza'], ['takeoutCurry'], ['quinoa', 'chickpeas', 'broccoli', 'oliveOil'],
    ])));
    sugarDay[i] = mealTotals(dayItems).addedSugar > HIGH_SUGAR_G;

    const fb = flareBoost(i);
    const afterSugar = (i >= 1 && sugarDay[i - 1]) || (i >= 2 && sugarDay[i - 2]);
    const sleepMin = Math.round(clamp(445 + gauss(22) - (late ? 26 : 0) - fb * 8, 300, 560));
    const pain = clamp(Math.round(5.4 - 1.9 * (i / (DAYS - 1)) + gauss(0.7) + (afterSugar ? 1.4 : 0) + fb));
    wearables.push({
      date, sleepMin,
      rhr: Math.round(62 + fb * 1.8 + gauss(1.5)),
      hrv: Math.round(clamp(49 - fb * 3.5 - (late ? 3 : 0) + gauss(4), 20, 90)),
      steps: Math.round(clamp(6800 - fb * 900 + gauss(1800), 1500, 16000)),
    });
    symptoms.push({
      date, pain,
      fatigue: clamp(Math.round(4.8 - 1 * (i / (DAYS - 1)) + (445 - sleepMin) / 40 + fb * 0.8 + gauss(0.7))),
      gi: clamp(Math.round(1.8 + gauss(0.9) + (DAIRY_DAYS.has(i) ? 1 : 0))),
      skin: clamp(Math.round(1.3 + gauss(0.8))),
      sleepQuality: clamp(Math.round(6.6 + (sleepMin - 445) / 28 + gauss(0.7))),
      mood: clamp(Math.round(6.8 - (pain - 4) * 0.35 + gauss(0.8))),
      stress: clamp(Math.round(4 + gauss(1.3))),
      source: 'synthetic',
    });
    if (i % 7 === 0) {
      const bump = i === 21 ? 1.8 : i === 28 ? 1.5 : 0;
      const total = clamp(9.2 - 3.3 * (i / 63) + bump + gauss(0.4), 0, 30);
      const fn = Math.round(total * 0.28 * 10) / 10, p = Math.round(total * 0.38 * 10) / 10, g = Math.round(total * 0.34 * 10) / 10;
      rapid3.push({ date, fn, pain: p, global: g, total: rapid3Total(fn, p, g), source: 'synthetic' });
    }
  }

  const d = (i: number) => addDays(anchor, i - DAYS);
  const labs: LabResult[] = [
    { id: 'lab-1', date: d(0), analyte: 'CRP', loinc: '1988-5', value: 14, unit: 'mg/L', refRange: 'under 10 mg/L', source: 'synthetic' },
    { id: 'lab-2', date: d(0), analyte: 'ESR', loinc: '4537-7', value: 28, unit: 'mm/h', refRange: '0 to 20 mm/h', source: 'synthetic' },
    { id: 'lab-3', date: d(35), analyte: 'CRP', loinc: '1988-5', value: 11, unit: 'mg/L', refRange: 'under 10 mg/L', source: 'synthetic' },
    { id: 'lab-4', date: d(63), analyte: 'CRP', loinc: '1988-5', value: 7, unit: 'mg/L', refRange: 'under 10 mg/L', source: 'synthetic' },
    { id: 'lab-5', date: d(63), analyte: 'ESR', loinc: '4537-7', value: 18, unit: 'mm/h', refRange: '0 to 20 mm/h', source: 'synthetic' },
    { id: 'lab-6', date: d(63), analyte: 'Vitamin D, 25-OH', loinc: '62292-8', value: 32, unit: 'ng/mL', refRange: '30 to 100 ng/mL', source: 'synthetic' },
    { id: 'lab-7', date: d(40), analyte: 'Fecal calprotectin', loinc: '38445-3', value: 38, unit: 'µg/g', refRange: 'under 50 µg/g', source: 'synthetic', note: 'Ordered to look into gut symptoms (synthetic example)' },
  ];
  const flares: FlareEvent[] = [
    { id: 'fl-1', date: d(20), severity: 'moderate', note: 'Hands and wrists swollen, morning stiffness over 1 hour', source: 'synthetic' },
    { id: 'fl-2', date: d(27), severity: 'mild', note: 'Knee pain and fatigue', source: 'synthetic' },
  ];

  return {
    anchor, meals, symptoms, wearables, rapid3, hbi: [], promis: [], labs, flares,
    medications: [
      { id: 'med-1', name: 'Methotrexate 15 mg', kind: 'medication', schedule: 'Weekly, Sundays' },
      { id: 'med-2', name: 'Folic acid 1 mg', kind: 'supplement', schedule: 'Daily' },
      { id: 'med-3', name: 'Vitamin D3 2000 IU', kind: 'supplement', schedule: 'Daily' },
    ],
    access: [
      // newest first, like entries added later
      { at: `${d(69)}T18:40:00`, who: 'You', action: 'Logged dinner' },
      { at: `${d(63)}T10:05:00`, who: 'You', action: 'Saved lab results' },
    ],
  };
}
