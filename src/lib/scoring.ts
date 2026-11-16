/* Instrument scoring.
   RAPID3: category cut-offs follow the guide (remission <= 3, low > 3 to 6, moderate > 6 to 12, high > 12).
   The real RAPID3 derives "function" from 10 MDHAQ items (0-3 each, summed and divided by 3). This
   prototype uses ONE 0-10 function item instead, so totals are a DEMONSTRATION PLACEHOLDER until the
   licensed MDHAQ wording is confirmed.
   Harvey-Bradshaw Index: patient-reported items only. The abdominal-mass item needs a clinician, so
   every score is PARTIAL. HBI < 5 is commonly read as clinical remission. */

export type Rapid3Category = 'Remission' | 'Low' | 'Moderate' | 'High';

export function rapid3Total(fn: number, pain: number, global: number): number {
  for (const v of [fn, pain, global]) if (!(v >= 0 && v <= 10)) throw new RangeError('RAPID3 items must be between 0 and 10');
  return Math.round((fn + pain + global) * 10) / 10;
}

export function rapid3Category(total: number): Rapid3Category {
  if (total <= 3) return 'Remission';
  if (total <= 6) return 'Low';
  if (total <= 12) return 'Moderate';
  return 'High';
}

export const RAPID3_BANDS = [
  { label: 'Remission', from: 0, to: 3, color: '#DDF2EC' },
  { label: 'Low', from: 3, to: 6, color: '#EAF5F1' },
  { label: 'Moderate', from: 6, to: 12, color: '#FFF1DF' },
  { label: 'High', from: 12, to: 30, color: '#FCE4E1' },
] as const;

export const HBI_COMPLICATIONS = [
  'Joint pain (arthralgia)',
  'Inflamed eye (uveitis)',
  'Red, tender skin bumps (erythema nodosum)',
  'Mouth ulcers (aphthous ulcers)',
  'Painful skin ulcer (pyoderma gangrenosum)',
  'Anal fissure',
  'New fistula',
  'Abscess',
] as const;

export function hbiPartialScore(wellbeing: number, abdominalPain: number, liquidStools: number, complications: number): number {
  if (!(wellbeing >= 0 && wellbeing <= 4)) throw new RangeError('wellbeing 0-4');
  if (!(abdominalPain >= 0 && abdominalPain <= 3)) throw new RangeError('abdominal pain 0-3');
  if (!(liquidStools >= 0 && Number.isFinite(liquidStools))) throw new RangeError('liquid stools must be 0 or more');
  return wellbeing + abdominalPain + Math.round(liquidStools) + complications;
}

export const hbiReading = (score: number) => (score < 5 ? 'Below 5 (often read as remission)' : score <= 7 ? '5 to 7 (often read as mild activity)' : '8 or more (often read as moderate or higher)');

/* Daily general symptoms. Higher is worse except sleep quality and mood. */
export const SYMPTOMS = [
  { key: 'fatigue', label: 'Fatigue', q: 'How much fatigue did you have today?', lo: 'None', hi: 'Worst imaginable', higherIsBetter: false },
  { key: 'pain', label: 'Joint pain', q: 'How much joint pain did you have today?', lo: 'None', hi: 'Worst imaginable', higherIsBetter: false },
  { key: 'gi', label: 'GI discomfort', q: 'How much stomach or gut discomfort did you have today?', lo: 'None', hi: 'Worst imaginable', higherIsBetter: false },
  { key: 'skin', label: 'Skin', q: 'How bothersome were skin symptoms today?', lo: 'Not at all', hi: 'Extremely', higherIsBetter: false },
  { key: 'sleepQuality', label: 'Sleep quality', q: 'How well did you sleep last night?', lo: 'Very badly', hi: 'Very well', higherIsBetter: true },
  { key: 'mood', label: 'Mood', q: 'How was your mood today?', lo: 'Very low', hi: 'Very good', higherIsBetter: true },
  { key: 'stress', label: 'Stress', q: 'How stressed did you feel today?', lo: 'Not at all', hi: 'Extremely', higherIsBetter: false },
] as const;

export type SymptomKey = (typeof SYMPTOMS)[number]['key'];

/* Red-flag rule (placeholder until the clinical advisor defines it). */
export function redFlags(values: Partial<Record<SymptomKey, number>>): string[] {
  const out: string[] = [];
  if ((values.pain ?? 0) >= 9) out.push('Very severe joint pain');
  if ((values.fatigue ?? 0) >= 9) out.push('Very severe fatigue');
  if ((values.gi ?? 0) >= 9) out.push('Very severe stomach or gut symptoms');
  return out;
}
