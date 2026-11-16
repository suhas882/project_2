/* Unit tests for scoring, parsing, insights and FHIR validation. Run: npm test */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rapid3Total, rapid3Category, hbiPartialScore } from '../src/lib/scoring.ts';
import { parseFoods } from '../src/lib/parse.ts';
import { parseLabText, SAMPLE_REPORT_TEXT } from '../src/services/labs.ts';
import { generatePersona } from '../src/data/synthetic.ts';
import { computeInsights, dailyExposures } from '../src/services/analytics.ts';
import { validateBundle } from '../src/services/fhirValidate.ts';

test('RAPID3 total and published category cut-offs', () => {
  assert.equal(rapid3Total(2, 3, 1), 6);
  assert.equal(rapid3Category(3), 'Remission');
  assert.equal(rapid3Category(3.1), 'Low');
  assert.equal(rapid3Category(6), 'Low');
  assert.equal(rapid3Category(6.1), 'Moderate');
  assert.equal(rapid3Category(12), 'Moderate');
  assert.equal(rapid3Category(12.1), 'High');
  assert.throws(() => rapid3Total(11, 0, 0));
});

test('Harvey-Bradshaw partial score (patient items only)', () => {
  assert.equal(hbiPartialScore(1, 1, 2, 0), 4);
  assert.equal(hbiPartialScore(4, 3, 6, 2), 15);
  assert.throws(() => hbiPartialScore(5, 0, 0, 0));
});

test('food text parser handles counts, units and joiners', () => {
  assert.deepEqual(parseFoods('2 eggs, a slice of toast with butter and a cup of coffee'), [
    { name: 'eggs', count: 2, explicit: true }, { name: 'toast', count: 1, explicit: true }, { name: 'butter', count: 1, explicit: false }, { name: 'coffee', count: 1, explicit: true },
  ]);
  assert.deepEqual(parseFoods(''), []);
});

test('lab parser reads values and flags a missing unit instead of guessing', () => {
  const r = parseLabText(SAMPLE_REPORT_TEXT);
  const crp = r.find(x => x.analyte === 'CRP')!;
  assert.equal(crp.value, 7); assert.equal(crp.unit, 'mg/L'); assert.equal(crp.refRange, 'under 10 mg/L');
  const esr = r.find(x => x.analyte === 'ESR')!;
  assert.equal(esr.value, 18); assert.equal(esr.refRange, '0 to 20 mm/h');
  const vd = r.find(x => x.analyte === 'Vitamin D, 25-OH')!;
  assert.equal(vd.value, 32, 'must not read the 25 from "25-OH"');
  assert.equal(vd.unit, null);
  assert.ok(vd.issues.includes('Unit unclear'));
});

test('synthetic persona is deterministic and has 70 days', () => {
  const a = generatePersona('2026-12-15'), b = generatePersona('2026-12-15');
  assert.equal(a.symptoms.length, 70);
  assert.equal(a.wearables.length, 70);
  assert.equal(a.rapid3.length, 10);
  assert.deepEqual(a.symptoms.map(s => s.pain), b.symptoms.map(s => s.pain));
  assert.equal([...dailyExposures(a.meals).values()].filter(e => e.dairy).length, 2);
});

test('insights recover planted triggers and enforce the minimum-data rule', () => {
  const p = generatePersona('2026-12-15');
  const ins = computeInsights(p);
  const sugar = ins.find(i => i.exposure === 'highSugar' && i.outcome === 'pain')!;
  assert.equal(sugar.label, 'Likely');
  assert.equal(sugar.direction, 'higher');
  const late = ins.find(i => i.exposure === 'lateDinner' && i.outcome === 'sleepMin')!;
  assert.notEqual(late.label, 'No clear association');
  assert.equal(late.direction, 'lower');
  assert.equal(ins.find(i => i.exposure === 'dairy')!.label, 'Not enough data');
  for (const i of ins) assert.ok(!/cause/i.test(i.sentence), 'never says "causes"');
});

test('FHIR validator catches broken references and missing fields', () => {
  const ok = { resourceType: 'Bundle', type: 'collection', entry: [
    { fullUrl: 'urn:uuid:p', resource: { resourceType: 'Patient' } },
    { fullUrl: 'urn:uuid:o', resource: { resourceType: 'Observation', status: 'final', code: { text: 'x' }, subject: { reference: 'urn:uuid:p' }, valueQuantity: { value: 1, unit: 'mg/L' } } },
  ] };
  assert.equal(validateBundle(ok).filter(i => i.severity === 'error').length, 0);
  const bad = structuredClone(ok);
  (bad.entry[1].resource as Record<string, unknown>).subject = { reference: 'urn:uuid:missing' };
  delete (bad.entry[1].resource as Record<string, unknown>).status;
  assert.equal(validateBundle(bad).filter(i => i.severity === 'error').length, 2);
});
