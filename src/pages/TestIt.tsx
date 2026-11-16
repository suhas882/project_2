import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Bell, Check, FlaskConical, ShieldCheck, StopCircle, CalendarDays, AlertTriangle } from 'lucide-react';
import type { Experiment, ExperimentPhase } from '@/types';
import { useStore, useToday } from '@/store/store';
import { useExposures } from '@/store/derived';
import { addDays, daysBetween, fmtDate, fromISODate, toISODate } from '@/lib/dates';
import { Badge, Button, Card, CardTitle, DataTable, EmptyState, Modal, Notice, PageHeader, Progress, Select, SimBadge, Switch, TextAlternative, useToast } from '@/components/ui';

const OPTIONS: { exposure: Experiment['exposure']; outcome: Experiment['outcome']; title: string; b: string; bRule: string }[] = [
  { exposure: 'addedSugar', outcome: 'pain', title: 'Does added sugar affect your joint pain?', b: 'Low added sugar', bRule: 'Keep added sugar under 25 g a day. Swap sweets and soda for fruit, nuts or sparkling water.' },
  { exposure: 'lateDinner', outcome: 'sleepQuality', title: 'Do late dinners affect your sleep?', b: 'Dinner by 7:30 PM', bRule: 'Finish dinner by 7:30 PM. Keep what you eat the same.' },
  { exposure: 'gluten', outcome: 'pain', title: 'Does gluten affect your joint pain?', b: 'Gluten-free', bRule: 'Avoid wheat, barley and rye for the B weeks only. Keep other foods the same.' },
  { exposure: 'nightshade', outcome: 'pain', title: 'Do nightshade vegetables affect your joint pain?', b: 'No nightshades', bRule: 'Skip tomatoes, potatoes, peppers and eggplant during B weeks only.' },
];
const OUTCOME_LABEL = { pain: 'joint pain', fatigue: 'fatigue', sleepQuality: 'sleep quality' } as const;

function nextMonday(from: string) {
  const d = fromISODate(from);
  d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
  return toISODate(d);
}
function buildPhases(start: string, b: string): ExperimentPhase[] {
  return [['Baseline (usual eating)', 'A'], [b, 'B'], ['Reintroduce (usual eating)', 'A'], [b, 'B']].map(([label, kind], i) => ({ label, kind: kind as 'A' | 'B', start: addDays(start, i * 7), end: addDays(start, i * 7 + 6) }));
}

export default function TestIt() {
  const { data, startExperiment, stopExperiment, setExperimentReminder } = useStore();
  const today = useToday();
  const toast = useToast();
  const [sp] = useSearchParams();
  const ex = useExposures();
  const active = data.experiments.find(e => e.status === 'active');
  const preset = OPTIONS.find(o => o.exposure === (sp.get('exposure') === 'highSugar' ? 'addedSugar' : sp.get('exposure'))) ?? OPTIONS[0];
  const [choice, setChoice] = useState(preset.exposure);
  const opt = OPTIONS.find(o => o.exposure === choice)!;
  const [agreed, setAgreed] = useState(false);
  const [reminder, setReminder] = useState(true);
  const [startNow, setStartNow] = useState(false);
  const [stopOpen, setStopOpen] = useState(false);
  const start = startNow ? today : nextMonday(today);
  const phases = buildPhases(start, opt.b);

  const begin = () => {
    if (!agreed) return;
    startExperiment({ exposure: opt.exposure, outcome: opt.outcome, title: opt.title, phases, agreed, reminder });
    toast(`Experiment scheduled. Week 1 starts ${fmtDate(start, { weekday: 'long', month: 'short', day: 'numeric' })}.`);
  };

  const progress = useMemo(() => {
    if (!active) return null;
    const first = active.phases[0].start, last = active.phases[3].end;
    const elapsed = Math.max(0, Math.min(28, daysBetween(first, today) + 1));
    const days = Array.from({ length: Math.max(0, Math.min(28, daysBetween(first, today))) }, (_, i) => addDays(first, i));
    const checkins = days.filter(d => data.symptoms.some(s => s.date === d)).length;
    const current = active.phases.findIndex(p => today >= p.start && today <= p.end);
    const perPhase = active.phases.map(p => {
      const ds = Array.from({ length: 7 }, (_, i) => addDays(p.start, i)).filter(d => d < today);
      const vals = ds.map(d => data.symptoms.find(s => s.date === d)?.[active.outcome]).filter((v): v is number => v != null);
      const adherence = ds.filter(d => {
        const e = ex.get(d); if (!e || p.kind === 'A') return !!e;
        return active.exposure === 'addedSugar' ? e.addedSugar < 25 : active.exposure === 'lateDinner' ? !e.lateDinner : active.exposure === 'gluten' ? !e.gluten : !e.nightshade;
      }).length;
      return { ...p, n: vals.length, mean: vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null, adherence, days: ds.length };
    });
    return { first, last, elapsed, checkins, daysSoFar: days.length, current, perPhase, complete: today > last };
  }, [active, data.symptoms, ex, today]);

  const result = useMemo(() => {
    if (!progress || !active) return null;
    const a = progress.perPhase.filter(p => p.kind === 'A' && p.mean != null), b = progress.perPhase.filter(p => p.kind === 'B' && p.mean != null);
    if (!a.length || !b.length) return null;
    const ma = a.reduce((s, p) => s + p.mean!, 0) / a.length, mb = b.reduce((s, p) => s + p.mean!, 0) / b.length;
    return { ma, mb, diff: mb - ma };
  }, [progress, active]);

  return (
    <div className="mx-auto grid max-w-4xl gap-5">
      <PageHeader title="Test It" subtitle="A guided personal experiment (N-of-1) you plan with your clinician or dietitian." />
      {!active ? (
        <>
          <Card className="grid gap-4">
            <div className="grid gap-1.5 sm:max-w-md">
              <label htmlFor="exp" className="text-sm font-semibold text-ink-2">Suspected trigger</label>
              <Select id="exp" value={choice} onChange={e => setChoice(e.target.value as Experiment['exposure'])}>{OPTIONS.map(o => <option key={o.exposure} value={o.exposure}>{o.title}</option>)}</Select>
            </div>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight">{opt.title}</h2>
            <p className="text-ink-2">A 4-week A-B-A-B experiment. Weeks alternate between your usual eating (A) and one change (B). Keep everything else the same, including medicines.</p>
            <ol className="relative grid gap-0" aria-label="Experiment plan">
              {phases.map((p, i) => (
                <li key={i} className="relative flex items-center gap-3 py-2.5">
                  {i < 3 && <span className="absolute left-[10px] top-9 h-8 w-0.5 bg-[#DDE6E4]" aria-hidden />}
                  <span className={`relative z-10 size-[22px] shrink-0 rounded-full border-[2.5px] border-brand ${p.kind === 'B' ? 'bg-brand' : 'bg-white'}`} aria-hidden />
                  <span className="flex-1"><span className="block font-bold">{p.label}</span><span className="text-sm text-ink-3">Week {i + 1} · {fmtDate(p.start)} to {fmtDate(p.end)}</span></span>
                  <Badge tone={p.kind === 'B' ? 'teal' : 'gray'}>Phase {p.kind}</Badge>
                </li>
              ))}
            </ol>
            <div className="rounded-2xl bg-canvas p-4 text-sm"><b>During B weeks:</b> {opt.bRule}</div>
            <p className="text-sm text-ink-2">Daily: {OUTCOME_LABEL[opt.outcome]}, fatigue and sleep in your check-in · Weekly: RAPID3 · Optional: CRP at the start and end, if your clinician orders it.</p>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="size-5 accent-[#14806F]" checked={startNow} onChange={e => setStartNow(e.target.checked)} />Start today instead of next Monday</label>
          </Card>
          <Notice tone="warn" title="Safety">Experiments change one food for one week at a time and never run longer than 4 weeks. Don't cut out whole food groups long term, and don't change medicines, without your care team. Stop any time.</Notice>
          <button role="checkbox" aria-checked={agreed} onClick={() => setAgreed(a => !a)} className="flex items-center gap-4 rounded-[var(--radius-card)] bg-brand-50 p-5 text-left">
            <ShieldCheck className="size-6 shrink-0 text-brand" aria-hidden />
            <span className="flex-1 text-[15px]"><b>I have discussed this plan</b> with my clinician or dietitian, and they agree it is safe for me.</span>
            <span className={`grid size-8 shrink-0 place-items-center rounded-lg border-2 border-brand ${agreed ? 'bg-brand text-white' : 'bg-white'}`}>{agreed && <Check className="size-5" aria-hidden />}</span>
          </button>
          <div className="card flex items-center gap-3 p-4"><Bell className="size-5 text-ink-2" aria-hidden /><span className="flex-1" id="rem">Daily reminder at 8:00 PM <span className="text-xs text-ink-3">(shown in-app in this prototype)</span></span><Switch checked={reminder} onChange={setReminder} label="Daily reminder" describedBy="rem" /></div>
          <Button size="lg" disabled={!agreed} onClick={begin} icon={<CalendarDays className="size-5" />}>Start on {fmtDate(start, { weekday: 'long', month: 'short', day: 'numeric' })}</Button>
          {!agreed && <p className="-mt-3 text-center text-sm text-ink-3">Confirm you talked with your care team to start.</p>}
        </>
      ) : progress && (
        <>
          <Card className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><Badge tone="teal" icon={<FlaskConical className="size-3.5" aria-hidden />}>{progress.complete ? 'Complete' : today < progress.first ? 'Scheduled' : 'Running'}</Badge><span className="text-sm text-ink-3">Started plan {fmtDate(active.createdAt.slice(0, 10))}</span></div>
            <h2 className="text-2xl font-extrabold tracking-tight">{active.title}</h2>
            {today < progress.first ? <p className="text-ink-2">Starts {fmtDate(progress.first, { weekday: 'long', month: 'short', day: 'numeric' })}. Keep logging normally until then.</p>
              : progress.complete ? <p className="text-ink-2">All 4 weeks are done. See your results below.</p>
              : <p className="text-ink-2">Week {progress.current + 1} of 4 · <b>{active.phases[progress.current]?.label}</b> · day {progress.elapsed} of 28</p>}
            <Progress value={(progress.elapsed / 28) * 100} label="Experiment progress" />
            <ol className="grid gap-2 sm:grid-cols-4">
              {progress.perPhase.map((p, i) => (
                <li key={i} className={`rounded-2xl border-2 p-3 ${i === progress.current ? 'border-brand bg-brand-50' : 'border-line bg-white'}`}>
                  <p className="text-xs font-bold text-ink-3">Week {i + 1} · Phase {p.kind}</p>
                  <p className="text-sm font-bold">{p.label}</p>
                  <p className="text-xs text-ink-3">{fmtDate(p.start)} to {fmtDate(p.end)}</p>
                  <p className="mt-1 text-xs">{p.days ? `${p.n} check-ins · ${p.mean != null ? `avg ${OUTCOME_LABEL[active.outcome]} ${p.mean.toFixed(1)}` : 'no data'}` : 'Not started'}</p>
                  {p.days > 0 && p.kind === 'B' && <p className="text-xs text-ink-3">Plan followed {p.adherence} of {p.days} days</p>}
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-canvas p-4 text-sm">
              <span className="flex-1">Daily check-ins so far: <b>{progress.checkins} of {progress.daysSoFar}</b></span>
              <Link to="/log/checkin" className="font-semibold text-brand-700 underline">Do today's check-in</Link>
            </div>
            <div className="card flex items-center gap-3 p-4 shadow-none ring-1 ring-line"><Bell className="size-5 text-ink-2" aria-hidden /><span className="flex-1" id="rem2">Daily reminder at 8:00 PM</span><Switch checked={active.reminder} onChange={v => setExperimentReminder(active.id, v)} label="Daily reminder" describedBy="rem2" /></div>
            <Button variant="danger" icon={<StopCircle className="size-5" />} onClick={() => setStopOpen(true)}>Stop experiment</Button>
            <p className="text-center text-sm text-ink-3">You can stop at any time. Your data so far is kept.</p>
          </Card>
          <Card>
            <CardTitle eyebrow="Results summary" action={<SimBadge>Simplified analysis</SimBadge>} />
            {!result ? <EmptyState icon={<FlaskConical className="size-6" />} title="Results appear after an A week and a B week">Keep doing your daily check-in.</EmptyState> : (
              <>
                <p className="mb-2">Average {OUTCOME_LABEL[active.outcome]}: <b>{result.ma.toFixed(1)}</b> in A weeks vs <b>{result.mb.toFixed(1)}</b> in B weeks ({result.diff >= 0 ? '+' : '−'}{Math.abs(result.diff).toFixed(1)} points).</p>
                <div className="h-48" role="img" aria-label={`Average ${OUTCOME_LABEL[active.outcome]} by week`}>
                  <ResponsiveContainer><BarChart data={progress.perPhase.filter(p => p.mean != null).map((p, i) => ({ w: `Wk ${i + 1} (${p.kind})`, v: +p.mean!.toFixed(2), k: p.kind }))} margin={{ left: -20 }}>
                    <CartesianGrid stroke="#EEF2F1" vertical={false} /><XAxis dataKey="w" fontSize={12} /><YAxis domain={[0, 10]} fontSize={11} /><Tooltip />
                    <Bar dataKey="v" radius={[6, 6, 0, 0]}>{progress.perPhase.filter(p => p.mean != null).map((p, i) => <Cell key={i} fill={p.kind === 'B' ? '#14806F' : '#C9D4D1'} />)}</Bar>
                  </BarChart></ResponsiveContainer>
                </div>
                <TextAlternative><DataTable caption="Experiment weeks" head={['Week', 'Phase', 'Check-ins', 'Average']} rows={progress.perPhase.map((p, i) => [i + 1, p.kind, p.n, p.mean != null ? p.mean.toFixed(1) : '—'])} /></TextAlternative>
                <p className="mt-3 text-sm text-ink-2">This summary compares simple averages. The planned version runs a Bayesian analysis of the A-B-A-B design. Share the results with your care team before making any lasting change.</p>
              </>
            )}
          </Card>
        </>
      )}
      {data.experiments.filter(e => e.status !== 'active').length > 0 && (
        <Card>
          <CardTitle eyebrow="Past experiments" />
          <ul className="divide-y divide-line">{data.experiments.filter(e => e.status !== 'active').map(e => <li key={e.id} className="py-2 text-sm"><b>{e.title}</b> · {e.status}{e.stoppedAt ? ` ${fmtDate(e.stoppedAt.slice(0, 10))}` : ''}</li>)}</ul>
        </Card>
      )}
      <Modal open={stopOpen} onClose={() => setStopOpen(false)} title="Stop this experiment?" footer={<><Button variant="secondary" onClick={() => setStopOpen(false)}>Keep going</Button><Button variant="danger" onClick={() => { if (active) stopExperiment(active.id); setStopOpen(false); toast('Experiment stopped. Your data so far is kept.'); }}>Stop experiment</Button></>}>
        <p className="flex gap-2 text-ink-2"><AlertTriangle className="size-5 shrink-0 text-warn" aria-hidden />Go back to your usual eating. Logs you made during the experiment are kept.</p>
      </Modal>
    </div>
  );
}
