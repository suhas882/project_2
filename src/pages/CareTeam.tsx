import { useMemo, useState } from 'react';
import { FileDown, FileJson, Link2, CheckCircle2, AlertTriangle, Copy, ShieldOff } from 'lucide-react';
import { useStore, useToday } from '@/store/store';
import { buildReport, downloadJson, downloadPdf } from '@/services/report';
import { buildBundle } from '@/services/fhir';
import { validateBundle, type FhirIssue } from '@/services/fhirValidate';
import { addDays, fmtDate } from '@/lib/dates';
import { Badge, Button, Card, CardTitle, Field, Input, Notice, PageHeader, SimBadge, Switch, Textarea, useToast } from '@/components/ui';

export default function CareTeam() {
  const { data, createShare, revokeShare, logAccess } = useStore();
  const today = useToday();
  const toast = useToast();
  const [period, setPeriod] = useState<'30' | '70' | 'custom'>('70');
  const [custom, setCustom] = useState({ from: addDays(today, -30), to: today });
  const [note, setNote] = useState('');
  const [wear, setWear] = useState(true);
  const [busy, setBusy] = useState<'' | 'pdf' | 'fhir'>('');
  const [validation, setValidation] = useState<{ issues: FhirIssue[]; count: number; server?: string } | null>(null);
  const err = period === 'custom' && custom.from > custom.to ? 'Start date must be on or before the end date.' : '';
  const { from, to } = period === 'custom' && !err ? custom : { from: addDays(today, -Number(period === 'custom' ? 30 : period)), to: today };
  const report = useMemo(() => buildReport(data, from, to, note), [data, from, to, note]);

  const pdf = async () => {
    setBusy('pdf');
    try { await downloadPdf(report); logAccess('Downloaded care team PDF'); toast('PDF downloaded.'); }
    catch { toast('Could not create the PDF. Try again.', 'warn'); }
    setBusy('');
  };
  const fhir = async () => {
    setBusy('fhir');
    const bundle = buildBundle(data, { from, to, includeWearables: wear && data.consent.health });
    const issues = validateBundle(bundle);
    let server: string | undefined;
    try {
      const r = await fetch('/api/fhir/validate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(bundle) });
      if (r.ok && (r.headers.get('content-type') || '').includes('json')) { const j = await r.json(); server = `API server check: ${j.errors} errors, ${j.warnings} warnings`; }
    } catch { /* API server not running; client check is enough */ }
    setValidation({ issues, count: bundle.entry.length, server });
    if (issues.some(i => i.severity === 'error')) { toast('The bundle has validation errors, so it was not downloaded.', 'warn'); setBusy(''); return; }
    downloadJson(bundle, `remitra-fhir-bundle-${to}.json`);
    logAccess('Downloaded FHIR bundle');
    toast(`FHIR bundle downloaded (${bundle.entry.length} resources).`);
    setBusy('');
  };
  const activeShares = data.shares.filter(s => !s.revoked && new Date(s.expiresAt) > new Date());

  return (
    <div className="grid gap-5">
      <PageHeader title="Share with your care team" subtitle="A clear summary for your next visit: PDF, FHIR data bundle, or an expiring link." />
      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        <div className="grid content-start gap-4">
          <Card className="grid gap-3">
            <CardTitle eyebrow="Report options" />
            <div role="group" aria-label="Report period" className="flex flex-wrap gap-1 rounded-2xl bg-[#E4EBE9] p-1">
              {(['30', '70', 'custom'] as const).map(p => <button key={p} aria-pressed={period === p} onClick={() => setPeriod(p)} className={`min-h-10 flex-1 rounded-xl px-3 text-sm font-semibold ${period === p ? 'bg-white shadow-sm' : 'text-ink-2'}`}>{p === 'custom' ? 'Custom' : `${p} days`}</button>)}
            </div>
            {period === 'custom' && <div className="grid grid-cols-2 gap-2">
              <Field label="From" error={err}>{p => <Input {...p} type="date" max={today} value={custom.from} onChange={e => setCustom(c => ({ ...c, from: e.target.value }))} />}</Field>
              <Field label="To">{p => <Input {...p} type="date" max={today} value={custom.to} onChange={e => setCustom(c => ({ ...c, to: e.target.value }))} />}</Field>
            </div>}
            <Field label="Note for your care team (optional)" hint={`${note.length}/400`}>{p => <Textarea {...p} rows={3} maxLength={400} value={note} onChange={e => setNote(e.target.value)} placeholder="Questions or changes you want to discuss" />}</Field>
            <div className="flex items-center gap-3"><span className="flex-1 text-sm font-semibold" id="w">Include daily wearable data in the FHIR bundle</span><Switch checked={wear && data.consent.health} disabled={!data.consent.health} onChange={setWear} label="Include wearable data" describedBy="w" /></div>
          </Card>
          <Card className="grid gap-3">
            <CardTitle eyebrow="Share as" />
            <Button icon={<FileDown className="size-5" />} loading={busy === 'pdf'} onClick={pdf} disabled={!!err}>Download PDF report</Button>
            <Button variant="secondary" icon={<FileJson className="size-5" />} loading={busy === 'fhir'} onClick={fhir} disabled={!!err}>Download FHIR R4 bundle</Button>
            <Button variant="secondary" icon={<Link2 className="size-5" />} onClick={() => { createShare(); toast('Secure link created. It expires in 7 days.'); }}>Create 7-day secure link</Button>
            <p className="text-xs text-ink-3">The PDF has a real text layer and document title; full tagged-PDF accessibility and the SureAccess scan are planned before release.</p>
          </Card>
          {validation && (
            <Card className="grid gap-2">
              <CardTitle eyebrow="FHIR validation" />
              {validation.issues.filter(i => i.severity === 'error').length === 0
                ? <p className="flex items-center gap-2 font-semibold text-brand-700"><CheckCircle2 className="size-5" aria-hidden />{validation.count} resources passed structural checks</p>
                : <p className="flex items-center gap-2 font-semibold text-danger"><AlertTriangle className="size-5" aria-hidden />{validation.issues.filter(i => i.severity === 'error').length} errors</p>}
              {validation.issues.length > 0 && <ul className="max-h-40 overflow-auto text-xs text-ink-2">{validation.issues.slice(0, 20).map((i, k) => <li key={k}><b>{i.severity}</b> {i.path}: {i.message}</li>)}</ul>}
              {validation.server && <p className="text-xs text-ink-3">{validation.server}</p>}
              <p className="text-xs text-ink-3">Structural checks only, not the official HL7 validator.</p>
            </Card>
          )}
          {data.shares.length > 0 && (
            <Card>
              <CardTitle eyebrow="Secure links" action={<SimBadge>Simulated</SimBadge>} />
              <ul className="grid gap-2">
                {data.shares.slice(0, 5).map(s => {
                  const expired = new Date(s.expiresAt) <= new Date();
                  const url = `https://share.remitra.example/r/${s.id.slice(-8)}`;
                  return (
                    <li key={s.id} className="rounded-2xl bg-canvas p-3 text-sm">
                      <p className="break-all font-mono text-xs">{url}</p>
                      <p className="mt-1 text-ink-3">{s.revoked ? 'Revoked' : expired ? 'Expired' : `Expires ${fmtDate(s.expiresAt.slice(0, 10))}`}</p>
                      {!s.revoked && !expired && <div className="mt-2 flex gap-2">
                        <Button size="sm" variant="secondary" icon={<Copy className="size-4" />} onClick={() => { navigator.clipboard?.writeText(url).then(() => toast('Link copied.'), () => toast('Copy failed.', 'warn')); }}>Copy</Button>
                        <Button size="sm" variant="danger" icon={<ShieldOff className="size-4" />} onClick={() => { revokeShare(s.id); toast('Link revoked.'); }}>Revoke</Button>
                      </div>}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-xs text-ink-3">{activeShares.length} active. Links are not hosted in this prototype.</p>
            </Card>
          )}
        </div>

        <Card as="article" className="p-0" aria-label="Report preview">
          <div className="flex items-center justify-between border-b border-line px-6 py-3"><span className="text-sm font-bold text-ink-2">Preview</span><Badge tone="amber">Synthetic data</Badge></div>
          <div className="grid gap-5 p-6 text-sm">
            <header>
              <h2 className="text-2xl font-extrabold tracking-tight">{report.title}</h2>
              <p className="text-ink-2">{report.patient.name} · {report.patient.conditions.join(', ')}</p>
              <p className="text-ink-3">{fmtDate(from, { month: 'long', day: 'numeric', year: 'numeric' })} to {fmtDate(to, { month: 'long', day: 'numeric', year: 'numeric' })} · {report.adherence}</p>
            </header>
            <Section title="Validated scores">{report.scores.length ? report.scores.map(s => <Row key={s.label} a={s.label} b={`${s.first} → ${s.last}`} note={s.note} />) : <p className="text-ink-3">No disease-activity scores in this period.</p>}</Section>
            <Section title="Symptom history (average, first half → second half)">{report.symptoms.map(s => <Row key={s.label} a={s.label} b={`${s.avgFirst} → ${s.avgLast}`} />)}</Section>
            <Section title="Meal patterns">{report.meals.map(m => <Row key={m.label} a={m.label} b={m.value} />)}</Section>
            <Section title="Personal associations">{report.associations.length ? report.associations.map(a => <Row key={a.text} a={a.text} b={`${a.label}, p ${a.probability}`} />) : <p className="text-ink-3">None meet the threshold.</p>}</Section>
            <Section title="Lab results">{report.labs.length ? report.labs.map(l => <Row key={l.analyte} a={l.analyte} b={l.values} note={`Report range ${l.range}`} />) : <p className="text-ink-3">No lab results in this period.</p>}</Section>
            <Section title="Flare history">{report.flares.length ? report.flares.map(f => <Row key={f.date} a={`${f.date} (${f.severity})`} b={f.note} />) : <p className="text-ink-3">No flares in this period.</p>}</Section>
            <Section title="Important notes"><ul className="list-disc pl-5 text-ink-2">{report.notes.map(n => <li key={n}>{n}</li>)}</ul></Section>
          </div>
        </Card>
      </div>
      <Notice>Sharing creates an entry in your access log. You can see who viewed or downloaded your data in Settings.</Notice>
    </div>
  );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section><h3 className="mb-1.5 border-b border-line pb-1 text-xs font-bold uppercase tracking-[0.08em] text-brand-700">{title}</h3><div className="grid gap-1">{children}</div></section>
);
const Row = ({ a, b, note }: { a: string; b: string; note?: string }) => (
  <div className="grid gap-x-4 py-0.5 sm:grid-cols-2"><span>{a}</span><span className="tabular font-semibold">{b}{note && <span className="block text-xs font-normal text-ink-3">{note}</span>}</span></div>
);
