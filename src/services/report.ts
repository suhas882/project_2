/* Care team report (F9): one model feeds both the on-screen preview and the PDF. */
import type { AppData } from '@/types';
import { CONDITIONS } from '@/data/conditions';
import { fmtDate, addDays } from '@/lib/dates';
import { rapid3Category, SYMPTOMS } from '@/lib/scoring';
import { computeInsights, dailyExposures } from './analytics';

export interface ReportModel {
  title: string;
  period: { from: string; to: string };
  patient: { name: string; conditions: string[] };
  scores: { label: string; first: string; last: string; note: string }[];
  symptoms: { label: string; avgFirst: string; avgLast: string }[];
  meals: { label: string; value: string }[];
  associations: { text: string; label: string; probability: string }[];
  labs: { analyte: string; values: string; range: string }[];
  flares: { date: string; severity: string; note: string }[];
  adherence: string;
  notes: string[];
}

const avg = (a: number[]) => (a.length ? (a.reduce((s, x) => s + x, 0) / a.length).toFixed(1) : 'n/a');

export function buildReport(data: AppData, from: string, to: string, extraNote = ''): ReportModel {
  const inR = (d: string) => d >= from && d <= to;
  const sym = data.symptoms.filter(s => inR(s.date));
  const mid = addDays(from, Math.floor((new Date(to).getTime() - new Date(from).getTime()) / 86400000 / 2));
  const r3 = data.rapid3.filter(r => inR(r.date));
  const ex = [...dailyExposures(data.meals.filter(m => inR(m.date))).values()];
  const days = ex.length || 1;
  const insights = computeInsights(data).filter(i => i.label === 'Likely' || i.label === 'Possible');
  const labs = new Map<string, string[]>();
  const ranges = new Map<string, string>();
  [...data.labs].filter(l => inR(l.date)).sort((a, b) => a.date.localeCompare(b.date)).forEach(l => {
    labs.set(l.analyte, [...(labs.get(l.analyte) ?? []), `${l.value} ${l.unit} (${fmtDate(l.date)})`]);
    ranges.set(l.analyte, l.refRange);
  });
  const totalDays = Math.max(1, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000) + 1);
  const scores: ReportModel['scores'] = [];
  if (r3.length) scores.push({ label: 'RAPID3 (weekly)', first: `${r3[0].total} ${rapid3Category(r3[0].total).toLowerCase()} (${fmtDate(r3[0].date)})`, last: `${r3[r3.length - 1].total} ${rapid3Category(r3[r3.length - 1].total).toLowerCase()} (${fmtDate(r3[r3.length - 1].date)})`, note: 'Demonstration scoring: one 0-10 function item replaces the 10-item MDHAQ.' });
  const hbi = data.hbi.filter(h => inR(h.date));
  if (hbi.length) scores.push({ label: 'Harvey-Bradshaw (patient items)', first: `${hbi[0].score}`, last: `${hbi[hbi.length - 1].score}`, note: 'Partial score: the abdominal-mass item needs a clinician.' });
  return {
    title: 'Remitra care team report',
    period: { from, to },
    patient: { name: `${data.profile.name} (synthetic demo persona)`, conditions: data.profile.conditions.map(c => CONDITIONS[c].label) },
    scores,
    symptoms: SYMPTOMS.map(s => ({ label: s.label, avgFirst: avg(sym.filter(x => x.date < mid).map(x => x[s.key])), avgLast: avg(sym.filter(x => x.date >= mid).map(x => x[s.key])) })),
    meals: [
      { label: 'Days with meals logged', value: `${ex.length} of ${totalDays}` },
      { label: 'Mediterranean-pattern days', value: `${ex.filter(e => e.mediterraneanDay).length} of ${ex.length}` },
      { label: 'High added-sugar days (over 40 g)', value: `${ex.filter(e => e.highSugar).length} of ${ex.length}` },
      { label: 'Dinners at or after 8 PM', value: `${ex.filter(e => e.lateDinner).length} of ${ex.length}` },
      { label: 'Average share of calories from ultra-processed food', value: `${Math.round((ex.reduce((s, e) => s + e.upfShare, 0) / days) * 100)}%` },
    ],
    associations: insights.map(i => ({ text: i.sentence, label: i.label, probability: i.probability > 0.99 ? '> 0.99' : i.probability.toFixed(2) })),
    labs: [...labs.entries()].map(([analyte, values]) => ({ analyte, values: values.join(' → '), range: ranges.get(analyte) ?? '' })),
    flares: data.flares.filter(f => inR(f.date)).map(f => ({ date: fmtDate(f.date), severity: f.severity, note: f.note })),
    adherence: `${Math.round((sym.length / totalDays) * 100)}% of days with a check-in`,
    notes: [
      'All data in this report is synthetic demonstration data.',
      'Associations are patterns in personal data, not medical findings or causes.',
      'Remitra does not diagnose or recommend medication changes.',
      ...(extraNote.trim() ? [`Patient note: ${extraNote.trim()}`] : []),
    ],
  };
}

export async function downloadPdf(m: ReportModel) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  doc.setProperties({ title: m.title, subject: 'Synthetic demonstration report', creator: 'Remitra prototype' });
  doc.setLanguage('en-US');
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
  const M = 54;
  let y = M;
  const need = (h: number) => { if (y + h > H - M) { doc.addPage(); y = M; } };
  const text = (t: string, size = 10.5, style: 'normal' | 'bold' = 'normal', color: [number, number, number] = [16, 34, 31]) => {
    doc.setFont('helvetica', style); doc.setFontSize(size); doc.setTextColor(...color);
    const lines = doc.splitTextToSize(t, W - 2 * M) as string[];
    need(lines.length * size * 1.35);
    doc.text(lines, M, y + size); y += lines.length * size * 1.35;
  };
  const h = (t: string) => { y += 10; need(30); text(t.toUpperCase(), 10, 'bold', [13, 101, 86]); doc.setDrawColor(228, 234, 232); doc.line(M, y + 2, W - M, y + 2); y += 8; };
  const row = (a: string, b: string) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(16, 34, 31);
    const bl = doc.splitTextToSize(b, W / 2 - M) as string[];
    need(bl.length * 13 + 4);
    doc.text(a, M, y + 10); doc.text(bl, W / 2, y + 10); y += bl.length * 13 + 4;
  };
  doc.setFillColor(20, 128, 111); doc.rect(0, 0, W, 6, 'F');
  text(m.title, 20, 'bold');
  text(`${m.patient.name} · ${m.patient.conditions.join(', ')}`, 11, 'normal', [78, 95, 91]);
  text(`Period: ${fmtDate(m.period.from, { month: 'long', day: 'numeric', year: 'numeric' })} to ${fmtDate(m.period.to, { month: 'long', day: 'numeric', year: 'numeric' })} · ${m.adherence}`, 10, 'normal', [78, 95, 91]);
  text('SYNTHETIC DEMONSTRATION DATA. NOT FOR CLINICAL USE.', 9, 'bold', [148, 82, 12]);
  h('Validated scores');
  if (!m.scores.length) text('No disease-activity scores in this period.');
  m.scores.forEach(s => { row(s.label, `${s.first} → ${s.last}`); text(s.note, 8.5, 'normal', [95, 110, 107]); });
  h('Daily symptoms (average, first half → second half, 0 to 10)');
  m.symptoms.forEach(s => row(s.label, `${s.avgFirst} → ${s.avgLast}`));
  h('Meal patterns');
  m.meals.forEach(x => row(x.label, x.value));
  h('Personal associations');
  if (!m.associations.length) text('No associations meet the threshold yet.');
  m.associations.forEach(a => row(a.text, `${a.label}, probability ${a.probability}`));
  h('Lab results');
  if (!m.labs.length) text('No lab results in this period.');
  m.labs.forEach(l => row(l.analyte, `${l.values}  [report range ${l.range}]`));
  h('Flares');
  if (!m.flares.length) text('No flares logged in this period.');
  m.flares.forEach(f => row(`${f.date} (${f.severity})`, f.note));
  h('Important notes');
  m.notes.forEach(n => text(`• ${n}`, 9.5));
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) { doc.setPage(i); doc.setFontSize(8); doc.setTextColor(120); doc.text(`Remitra prototype · synthetic data · page ${i} of ${pages}`, M, H - 24); }
  downloadBlob(doc.output('blob'), `remitra-report-${m.period.to}.pdf`);
}

export function downloadJson(obj: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  downloadBlob(blob, filename);
}
export function downloadBlob(blob: Blob, filename: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
