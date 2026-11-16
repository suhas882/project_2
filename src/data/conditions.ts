import type { ConditionId } from '../types.ts';

export const CONDITIONS: Record<ConditionId, { label: string; module: string | null; note?: string }> = {
  ra: { label: 'Rheumatoid arthritis', module: 'RAPID3 (weekly)' },
  crohns: { label: "Crohn's disease", module: 'Harvey-Bradshaw Index, patient items (weekly)' },
  sle: { label: 'Lupus (SLE)', module: null, note: 'SLAQ module pending clinical advisor confirmation' },
  uc: { label: 'Ulcerative colitis', module: null, note: 'Index to be chosen with the clinical advisor' },
  psoriasis: { label: 'Psoriasis', module: null, note: 'Index to be chosen with the clinical advisor' },
  celiac: { label: 'Celiac disease', module: null, note: 'Index to be chosen with the clinical advisor' },
  hashimotos: { label: "Hashimoto's thyroiditis", module: null, note: 'Index to be chosen with the clinical advisor' },
  ms: { label: 'Multiple sclerosis', module: null, note: 'Index to be chosen with the clinical advisor' },
  'at-risk': { label: 'At risk or early signs', module: null, note: 'Prevention profile with general symptom tracking' },
};

export const GOALS = ['Find food triggers', 'Fewer flares', 'Better clinic visits', 'Track labs', 'Understand sleep and energy', 'Take part in research'];
