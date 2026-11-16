import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Camera, PencilLine, FileText, Check, AlertTriangle, Trash2, TestTube2 } from 'lucide-react';
import type { Analyte, LabResult } from '@/types';
import { useStore, useToday } from '@/store/store';
import { ANALYTES, ocrImage, parseLabText, SAMPLE_REPORT_TEXT, type ExtractedValue } from '@/services/labs';
import { fileToDataUrl } from '@/services/vision';
import { fmtDate } from '@/lib/dates';
import { Badge, Button, Card, CardTitle, DataTable, EmptyState, Field, Input, Modal, Notice, PageHeader, Progress, Select, SimBadge, Tabs, TextAlternative, cn, useToast, fmtTip } from '@/components/ui';

const ALL = Object.keys(ANALYTES) as Analyte[];

export default function Labs() {
  const { data, addLabs, deleteLab } = useStore();
  const today = useToday();
  const toast = useToast();
  const [manualOpen, setManualOpen] = useState(false);
  const [review, setReview] = useState<{ values: ExtractedValue[]; date: string; source: 'photo'; simulated: boolean; image?: string } | null>(null);
  const [ocr, setOcr] = useState<{ p: number; status: string } | null>(null);
  const [err, setErr] = useState('');
  const [chartAnalyte, setChartAnalyte] = useState<Analyte>('CRP');
  const [del, setDel] = useState<LabResult | null>(null);

  const startOcr = async (file?: File) => {
    if (!file) return;
    if (!data.consent.ai) { setErr('AI reading of lab photos is off in your consents. Enter values by hand, or turn it on in Settings.'); return; }
    setErr('');
    try {
      const url = await fileToDataUrl(file, 1600);
      setOcr({ p: 0, status: 'Starting text recognition' });
      const text = await ocrImage(url, (p, status) => setOcr({ p, status }));
      const values = parseLabText(text);
      setOcr(null);
      if (!values.length) { setErr('No known lab tests (CRP, ESR, fecal calprotectin, vitamin D) were found in that image. Try a sharper photo, or enter values by hand.'); return; }
      setReview({ values, date: today, source: 'photo', simulated: false, image: url });
    } catch {
      setOcr(null);
      setErr('Text recognition could not run (it downloads language data on first use, so check your connection). Enter values by hand instead.');
    }
  };
  const sample = () => setReview({ values: parseLabText(SAMPLE_REPORT_TEXT), date: today, source: 'photo', simulated: true });

  const setVal = (i: number, patch: Partial<ExtractedValue>) => setReview(r => r && ({ ...r, values: r.values.map((v, j) => (j === i ? { ...v, ...patch, confirmed: patch.confirmed ?? false } : v)) }));
  const allConfirmed = !!review && review.values.every(v => v.confirmed);
  const saveReview = () => {
    if (!review || !allConfirmed) return;
    addLabs(review.values.map(v => ({ date: review.date, analyte: v.analyte, loinc: ANALYTES[v.analyte].loinc, value: v.value!, unit: v.unit!, refRange: v.refRange, source: 'photo' })));
    toast(`${review.values.length} results saved as LOINC-coded observations. The photo was discarded.`);
    setReview(null);
  };

  const sorted = useMemo(() => [...data.labs].sort((a, b) => b.date.localeCompare(a.date)), [data.labs]);
  const series = useMemo(() => data.labs.filter(l => l.analyte === chartAnalyte).sort((a, b) => a.date.localeCompare(b.date)), [data.labs, chartAnalyte]);
  const unitsInSeries = [...new Set(series.map(s => s.unit))];
  const refMax = chartAnalyte === 'CRP' ? 10 : chartAnalyte === 'ESR' ? 20 : chartAnalyte === 'Fecal calprotectin' ? 50 : undefined;

  return (
    <div className="grid gap-5">
      <PageHeader title="Labs and biomarkers" subtitle="Add results by hand or from a report photo. You confirm every value before it is saved." />

      {!review && (
        <div className="grid gap-3 md:grid-cols-3">
          <label className="card flex cursor-pointer items-center gap-3 p-4 transition focus-within:outline focus-within:outline-3 focus-within:outline-brand-700 hover:-translate-y-0.5">
            <span className="grid size-11 place-items-center rounded-xl bg-sleep-50 text-sleep"><Camera className="size-5" aria-hidden /></span>
            <span className="flex-1"><span className="block font-bold">Upload a report photo</span><span className="text-sm text-ink-3">Read with open-source OCR in your browser</span></span>
            <input type="file" accept="image/*" className="sr-only" onChange={e => startOcr(e.target.files?.[0])} disabled={!!ocr} />
          </label>
          <button onClick={() => setManualOpen(true)} className="card flex items-center gap-3 p-4 text-left transition hover:-translate-y-0.5">
            <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand"><PencilLine className="size-5" aria-hidden /></span>
            <span className="flex-1"><span className="block font-bold">Enter by hand</span><span className="text-sm text-ink-3">CRP, ESR, calprotectin, vitamin D</span></span>
          </button>
          <button onClick={sample} className="card flex items-center gap-3 p-4 text-left transition hover:-translate-y-0.5">
            <span className="grid size-11 place-items-center rounded-xl bg-insight-50 text-insight"><FileText className="size-5" aria-hidden /></span>
            <span className="flex-1"><span className="block font-bold">Try a sample report</span><span className="text-sm text-ink-3">Simulated extraction from synthetic text</span></span>
          </button>
        </div>
      )}
      {ocr && <Card><p className="mb-2 font-semibold" role="status">Reading your report… {ocr.status}</p><Progress value={ocr.p * 100} label="Text recognition progress" /></Card>}
      {err && <Notice tone="warn">{err}</Notice>}

      {review && (
        <Card className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><h2 className="text-xl font-bold">We read {review.values.length} result{review.values.length > 1 ? 's' : ''}</h2><p className="text-sm text-ink-2">Check each value against your report, fix anything wrong, then confirm.</p></div>
            {review.simulated ? <SimBadge>Simulated sample</SimBadge> : <Badge tone="violet">OCR, needs your review</Badge>}
          </div>
          {review.image && <img src={review.image} alt="Your lab report" className="max-h-56 rounded-2xl object-contain" />}
          <Field label="Report date">{p => <Input {...p} type="date" max={today} value={review.date} onChange={e => setReview(r => r && ({ ...r, date: e.target.value || today }))} className="max-w-48" />}</Field>
          <ul className="grid gap-3">
            {review.values.map((v, i) => {
              const problem = v.value == null || !v.unit;
              return (
                <li key={v.analyte} className={cn('rounded-2xl border-2 p-4', v.confirmed ? 'border-brand bg-brand-50/50' : problem ? 'border-[#F3D9B5] bg-warn-50/60' : 'border-line bg-white')}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div><p className="font-bold">{v.analyte}</p><p className="font-mono text-xs text-ink-3">LOINC {ANALYTES[v.analyte].loinc} · read from: "{v.line}"</p></div>
                    {v.issues.length > 0 && !v.confirmed && <Badge tone="amber" icon={<AlertTriangle className="size-3.5" aria-hidden />}>{v.issues.join(' · ')}</Badge>}
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_1.4fr_auto] sm:items-end">
                    <Field label="Value">{p => <Input {...p} inputMode="decimal" value={v.value ?? ''} placeholder="Not readable" onChange={e => setVal(i, { value: e.target.value === '' ? null : Number(e.target.value) })} />}</Field>
                    <Field label="Unit">{p => <Select {...p} value={v.unit ?? ''} onChange={e => setVal(i, { unit: e.target.value || null, refRange: e.target.value ? ANALYTES[v.analyte].defaultRange[e.target.value] ?? v.refRange : v.refRange })}><option value="">Choose unit…</option>{ANALYTES[v.analyte].units.map(u => <option key={u}>{u}</option>)}</Select>}</Field>
                    <Field label="Range as printed">{p => <Input {...p} value={v.refRange} onChange={e => setVal(i, { refRange: e.target.value })} />}</Field>
                    <Button variant={v.confirmed ? 'primary' : 'secondary'} disabled={v.value == null || !v.unit || !Number.isFinite(v.value)} aria-pressed={v.confirmed} icon={<Check className="size-4" />} onClick={() => setVal(i, { confirmed: !v.confirmed })}>{v.confirmed ? 'Confirmed' : 'Confirm'}</Button>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setReview(null)}>Cancel</Button>
            <Button className="flex-1" disabled={!allConfirmed} onClick={saveReview}>Save {review.values.length} results</Button>
          </div>
          <p className="text-sm text-ink-3">{allConfirmed ? 'Ready to save. The photo is discarded after saving.' : 'Confirm every value to save. Unclear values are flagged and never guessed.'}</p>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardTitle eyebrow="History chart" />
          <Tabs label="Biomarker" tabs={ALL.map(a => ({ id: a, label: a === 'Fecal calprotectin' ? 'Calprotectin' : a === 'Vitamin D, 25-OH' ? 'Vitamin D' : a }))} value={chartAnalyte} onChange={setChartAnalyte} />
          <div id={`panel-${chartAnalyte}`} role="tabpanel" aria-labelledby={`tab-${chartAnalyte}`} className="mt-4">
            {series.length === 0 ? <EmptyState icon={<TestTube2 className="size-6" />} title={`No ${chartAnalyte} results yet`}>Add one by hand or from a report.</EmptyState> : (
              <>
                <div className="h-56" role="img" aria-label={`${chartAnalyte} over time: ${series.map(s => `${s.value} ${s.unit} on ${fmtDate(s.date)}`).join('; ')}`}>
                  <ResponsiveContainer>
                    <LineChart data={series.map(s => ({ d: fmtDate(s.date), v: s.value }))} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                      <CartesianGrid stroke="#EEF2F1" vertical={false} />
                      <XAxis dataKey="d" fontSize={12} tickLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip formatter={fmtTip((v: number) => [`${v} ${unitsInSeries[0]}`, chartAnalyte])} />
                      {refMax && unitsInSeries.length === 1 && <ReferenceLine y={refMax} stroke="#94520C" strokeDasharray="4 4" label={{ value: `Typical upper limit ${refMax}`, fontSize: 11, fill: '#94520C', position: 'insideTopRight' }} />}
                      <Line type="monotone" dataKey="v" stroke="#14806F" strokeWidth={2.5} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {unitsInSeries.length > 1 && <p className="text-sm font-semibold text-warn">Results use different units ({unitsInSeries.join(', ')}); compare with care.</p>}
                <TextAlternative><DataTable caption={`${chartAnalyte} results`} head={['Date', 'Value', 'Report range', 'Source']} rows={series.map(s => [fmtDate(s.date), `${s.value} ${s.unit}`, s.refRange, s.source])} /></TextAlternative>
              </>
            )}
          </div>
        </Card>
        <Card>
          <CardTitle eyebrow="All results" action={<span className="text-sm text-ink-3">{data.labs.length}</span>} />
          {sorted.length === 0 ? <EmptyState icon={<TestTube2 className="size-6" />} title="No lab results yet" /> : (
            <ul className="divide-y divide-line">
              {sorted.map(l => (
                <li key={l.id} className="flex items-center gap-3 py-2.5">
                  <span className="flex-1"><span className="block font-semibold">{l.analyte} <span className="tabular font-extrabold">{l.value} {l.unit}</span></span><span className="text-sm text-ink-3">{fmtDate(l.date, { month: 'short', day: 'numeric', year: 'numeric' })} · range {l.refRange} · {l.source}</span>{l.note && <span className="block text-xs text-ink-3">{l.note}</span>}</span>
                  <button onClick={() => setDel(l)} className="grid size-10 place-items-center rounded-xl text-ink-3 hover:bg-danger-50 hover:text-danger" aria-label={`Delete ${l.analyte} from ${fmtDate(l.date)}`}><Trash2 className="size-4" /></button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-ink-3">Patient-portal import through SMART on FHIR is planned for Phase 2.</p>
        </Card>
      </div>

      <ManualLab open={manualOpen} onClose={() => setManualOpen(false)} onSave={l => { addLabs([l]); setManualOpen(false); toast(`${l.analyte} ${l.value} ${l.unit} saved.`); }} />
      <Modal open={!!del} onClose={() => setDel(null)} title="Delete this result?" footer={<><Button variant="secondary" onClick={() => setDel(null)}>Cancel</Button><Button variant="danger" onClick={() => { if (del) { deleteLab(del.id); toast('Result deleted.'); } setDel(null); }}>Delete</Button></>}>
        <p className="text-ink-2">{del?.analyte} {del?.value} {del?.unit} from {del && fmtDate(del.date)} will be removed from charts and reports.</p>
      </Modal>
    </div>
  );
}

function ManualLab({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (l: Omit<LabResult, 'id'>) => void }) {
  const today = useToday();
  const [analyte, setAnalyte] = useState<Analyte>('CRP');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('mg/L');
  const [date, setDate] = useState(today);
  const [range, setRange] = useState(ANALYTES.CRP.defaultRange['mg/L']);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const changeAnalyte = (a: Analyte) => { setAnalyte(a); const u = ANALYTES[a].units[0]; setUnit(u); setRange(ANALYTES[a].defaultRange[u]); };
  const submit = () => {
    const e: Record<string, string> = {};
    const v = Number(value);
    if (value.trim() === '' || !Number.isFinite(v)) e.value = 'Enter a number.';
    else if (v < ANALYTES[analyte].plausible[0] || v > ANALYTES[analyte].plausible[1]) e.value = `That is outside the expected range (${ANALYTES[analyte].plausible.join(' to ')}). Check the report.`;
    if (!date || date > today) e.date = 'Choose a date that is today or earlier.';
    setErrs(e);
    if (Object.keys(e).length) return;
    onSave({ analyte, value: v, unit, date, refRange: range, loinc: ANALYTES[analyte].loinc, source: 'manual' });
    setValue('');
  };
  return (
    <Modal open={open} onClose={onClose} title="Enter a lab result" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>Save result</Button></>}>
      <form className="grid gap-3" onSubmit={e => { e.preventDefault(); submit(); }}>
        <Field label="Test">{p => <Select {...p} value={analyte} onChange={e => changeAnalyte(e.target.value as Analyte)}>{ALL.map(a => <option key={a}>{a}</option>)}</Select>}</Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Value" error={errs.value}>{p => <Input {...p} inputMode="decimal" value={value} onChange={e => setValue(e.target.value)} />}</Field>
          <Field label="Unit">{p => <Select {...p} value={unit} onChange={e => { setUnit(e.target.value); setRange(ANALYTES[analyte].defaultRange[e.target.value] ?? range); }}>{ANALYTES[analyte].units.map(u => <option key={u}>{u}</option>)}</Select>}</Field>
        </div>
        <Field label="Date" error={errs.date}>{p => <Input {...p} type="date" max={today} value={date} onChange={e => setDate(e.target.value)} />}</Field>
        <Field label="Reference range as printed on your report" hint="Ranges differ between labs.">{p => <Input {...p} value={range} onChange={e => setRange(e.target.value)} />}</Field>
        <p className="font-mono text-xs text-ink-3">LOINC {ANALYTES[analyte].loinc}</p>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
