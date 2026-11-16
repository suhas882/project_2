/* Builds a demonstration FHIR R4 "collection" Bundle from app data (F9).
   Codes: LOINC for labs and wearable aggregates, SNOMED CT for conditions. Daily symptoms and the
   demo RAPID3 use an internal code system until official codes and licensing are confirmed.
   Codes should be re-verified against the current LOINC / SNOMED releases before real use. */
import type { AppData, ConditionId } from '@/types';
import { CONDITIONS } from '@/data/conditions';

const INTERNAL = 'https://remitra.example/fhir/CodeSystem/remitra-demo';
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`);

export const SNOMED: Record<ConditionId, string | null> = {
  ra: '69896004', crohns: '34000006', sle: '55464009', uc: '64766004', psoriasis: '9014002',
  celiac: '396331005', hashimotos: '21983002', ms: '24700007', 'at-risk': null,
};

const WEAR_CODES = {
  sleepMin: { code: '93832-4', display: 'Sleep duration', unit: 'min', ucum: 'min' },
  rhr: { code: '40443-4', display: 'Heart rate --resting', unit: 'beats/min', ucum: '/min' },
  hrv: { code: '80404-7', display: 'R-R interval.standard deviation (Heart rate variability)', unit: 'ms', ucum: 'ms' },
  steps: { code: '41950-7', display: 'Number of steps in 24 hour Measured', unit: 'steps', ucum: '/(24.h)' },
} as const;

export interface BundleOptions { from: string; to: string; includeWearables?: boolean }

export function buildBundle(data: AppData, opts: BundleOptions) {
  const inRange = (d: string) => d >= opts.from && d <= opts.to;
  const patientUrl = `urn:uuid:${uuid()}`;
  const subject = { reference: patientUrl };
  const entries: { fullUrl: string; resource: Record<string, unknown> }[] = [];
  const add = (resource: Record<string, unknown>) => entries.push({ fullUrl: `urn:uuid:${uuid()}`, resource });

  entries.push({ fullUrl: patientUrl, resource: { resourceType: 'Patient', active: true, meta: { tag: [{ system: INTERNAL, code: 'synthetic', display: 'Synthetic demonstration data' }] } } });

  for (const c of data.profile.conditions) {
    const sct = SNOMED[c];
    add({ resourceType: 'Condition', subject, clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }] },
      code: sct ? { coding: [{ system: 'http://snomed.info/sct', code: sct, display: CONDITIONS[c].label }], text: CONDITIONS[c].label } : { text: CONDITIONS[c].label } });
  }
  for (const l of data.labs.filter(l => inRange(l.date))) {
    add({ resourceType: 'Observation', status: 'final', subject, effectiveDateTime: l.date,
      category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory' }] }],
      code: { coding: [{ system: 'http://loinc.org', code: l.loinc, display: l.analyte }], text: l.analyte },
      valueQuantity: { value: l.value, unit: l.unit }, referenceRange: [{ text: l.refRange }] });
  }
  for (const r of data.rapid3.filter(r => inRange(r.date))) {
    add({ resourceType: 'Observation', status: 'final', subject, effectiveDateTime: r.date,
      category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'survey' }] }],
      code: { coding: [{ system: INTERNAL, code: 'rapid3-demo', display: 'RAPID3 total (demonstration scoring)' }], text: 'RAPID3 total (demonstration scoring)' },
      valueQuantity: { value: r.total, unit: 'score' },
      component: [['rapid3-function', r.fn], ['rapid3-pain', r.pain], ['rapid3-global', r.global]].map(([code, v]) => ({ code: { coding: [{ system: INTERNAL, code }] }, valueQuantity: { value: v, unit: 'score' } })) });
  }
  for (const s of data.symptoms.filter(s => inRange(s.date))) {
    add({ resourceType: 'Observation', status: 'final', subject, effectiveDateTime: s.date,
      code: { coding: [{ system: INTERNAL, code: 'daily-symptoms', display: 'Daily general symptoms (0 to 10)' }] },
      component: (['fatigue', 'pain', 'gi', 'skin', 'sleepQuality', 'mood', 'stress'] as const).map(k => ({ code: { coding: [{ system: INTERNAL, code: k }] }, valueInteger: s[k] })) });
  }
  if (opts.includeWearables) {
    for (const w of data.wearables.filter(w => inRange(w.date))) {
      for (const [k, c] of Object.entries(WEAR_CODES) as [keyof typeof WEAR_CODES, (typeof WEAR_CODES)[keyof typeof WEAR_CODES]][]) {
        add({ resourceType: 'Observation', status: 'final', subject, effectiveDateTime: w.date,
          category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'activity' }] }],
          code: { coding: [{ system: 'http://loinc.org', code: c.code, display: c.display }] },
          valueQuantity: { value: w[k], unit: c.unit, system: 'http://unitsofmeasure.org', code: c.ucum } });
      }
    }
  }
  for (const m of data.medications) {
    add({ resourceType: 'MedicationStatement', status: 'active', subject, medicationCodeableConcept: { text: m.name }, dosage: [{ text: m.schedule }],
      note: [{ text: 'Logged by the user as an exposure. Remitra does not recommend medication changes.' }] });
  }
  const latest = data.consentLog[data.consentLog.length - 1];
  const consents: [string, boolean][] = [['app-use', data.consent.app], ['health-data', data.consent.health], ['ai-photo-processing', data.consent.ai], ['research-sharing', data.consent.research]];
  for (const [code, on] of consents) {
    add({ resourceType: 'Consent', status: on ? 'active' : 'inactive', patient: subject, dateTime: latest?.at,
      scope: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/consentscope', code: code === 'research-sharing' ? 'research' : 'patient-privacy' }] },
      category: [{ coding: [{ system: INTERNAL, code }] }],
      meta: { versionId: String(latest?.version ?? 1) } });
  }
  return { resourceType: 'Bundle', type: 'collection', timestamp: new Date().toISOString(),
    meta: { tag: [{ system: INTERNAL, code: 'synthetic', display: 'Synthetic demonstration data, not for clinical use' }] }, entry: entries };
}
