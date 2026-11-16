import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, CheckCircle2, AlertTriangle, Lock } from 'lucide-react';
import type { SymptomEntry } from '@/types';
import { useStore, useToday } from '@/store/store';
import { SYMPTOMS, rapid3Total, rapid3Category, hbiPartialScore, hbiReading, HBI_COMPLICATIONS, redFlags, type SymptomKey } from '@/lib/scoring';
import { fmtDate } from '@/lib/dates';
import { checkinPlan } from '@/lib/checkinPlan';
import { Badge, Button, Card, Field, Input, Notice, Scale, SimBadge, cn, useToast } from '@/components/ui';
import { useSpeech } from '@/components/capture';

const RAPID3_Q = [
  { key: 'fn', q: 'Over the past week, how hard were daily activities such as dressing, walking or lifting a full cup?', lo: 'No difficulty', hi: 'Unable to do' },
  { key: 'pain', q: 'How much pain have you had because of your condition over the past week?', lo: 'No pain', hi: 'Pain as bad as it could be' },
  { key: 'global', q: 'Considering all the ways your illness affects you, how well or poorly are you doing this week?', lo: 'Very well', hi: 'Very poorly' },
] as const;
const WORDS: Record<string, number> = { zero: 0, none: 0, one: 1, two: 2, three: 3, four: 4, for: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const numberFrom = (t: string) => { const m = t.toLowerCase().match(/\b(10|[0-9]|zero|none|one|two|three|four|for|five|six|seven|eight|nine|ten)\b/g); if (!m) return null; const v = m[m.length - 1]; return /\d/.test(v) ? Number(v) : WORDS[v]; };

type Step = { kind: 'symptom'; key: SymptomKey } | { kind: 'rapid3'; key: 'fn' | 'pain' | 'global' } | { kind: 'hbi' } | { kind: 'promis' } | { kind: 'done' };

export default function CheckIn() {
  const { data, saveCheckin } = useStore();
  const today = useToday();
  const nav = useNavigate();
  const toast = useToast();
  const existing = data.symptoms.find(s => s.date === today);
  const lastR3 = data.rapid3[data.rapid3.length - 1];
  const { rapid3Due: r3Due, hbiDue, promisDue } = checkinPlan(data, today);
  const [includeR3, setIncludeR3] = useState(r3Due);

  const steps: Step[] = useMemo(() => [
    ...SYMPTOMS.map(s => ({ kind: 'symptom' as const, key: s.key })),
    ...(includeR3 ? RAPID3_Q.map(q => ({ kind: 'rapid3' as const, key: q.key })) : []),
    ...(hbiDue ? [{ kind: 'hbi' as const }] : []),
    ...(promisDue ? [{ kind: 'promis' as const }] : []),
    { kind: 'done' as const },
  ], [includeR3, hbiDue, promisDue]);

  const [i, setI] = useState(0);
  const [sym, setSym] = useState<Partial<Record<SymptomKey, number>>>(() => existing ? { ...existing } : {});
  const [r3, setR3] = useState<Partial<Record<'fn' | 'pain' | 'global', number>>>(() => lastR3?.date === today ? { fn: lastR3.fn, pain: lastR3.pain, global: lastR3.global } : {});
  // nothing is pre-selected: every Harvey-Bradshaw item needs an explicit answer
  const [hbi, setHbi] = useState({ wellbeing: null as number | null, abdominalPain: null as number | null, liquidStools: '', complications: [] as string[], noComplications: false });
  const [hbiErr, setHbiErr] = useState('');
  const [saved, setSaved] = useState(false);
  const t0 = useRef(Date.now());
  const [secs, setSecs] = useState(0);
  const speech = useSpeech();
  const step = steps[Math.min(i, steps.length - 1)];

  useEffect(() => {
    if (!speech.listening && speech.transcript) {
      const n = numberFrom(speech.transcript);
      if (n == null || n > 10) toast(`Heard "${speech.transcript}". Please tap a number.`, 'warn');
      else { answer(n); toast(`Heard "${speech.transcript}". Selected ${n}.`); }
      speech.setTranscript('');
    }
  }, [speech.listening]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = step.kind === 'symptom' ? sym[step.key] ?? null : step.kind === 'rapid3' ? r3[step.key] ?? null : null;
  function answer(n: number) {
    if (step.kind === 'symptom') setSym(s => ({ ...s, [step.key]: n }));
    if (step.kind === 'rapid3') setR3(s => ({ ...s, [step.key]: n }));
  }
  const stoolsValid = /^\d+$/.test(hbi.liquidStools.trim()) && Number(hbi.liquidStools) <= 50;
  const hbiComplete = hbi.wellbeing != null && hbi.abdominalPain != null && stoolsValid && (hbi.noComplications || hbi.complications.length > 0);
  const hbiMissing = [hbi.wellbeing == null && 'general well-being', hbi.abdominalPain == null && 'abdominal pain', !stoolsValid && 'number of liquid stools', !(hbi.noComplications || hbi.complications.length > 0) && 'the complications question'].filter(Boolean) as string[];
  const canNext = step.kind === 'symptom' || step.kind === 'rapid3' ? value != null : step.kind === 'hbi' ? hbiComplete : true;
  // each step opens at the top
  useEffect(() => { window.scrollTo(0, 0); document.getElementById('main')?.focus({ preventScroll: true }); }, [i]);

  const finish = () => {
    const entry: SymptomEntry = { date: today, fatigue: sym.fatigue!, pain: sym.pain!, gi: sym.gi!, skin: sym.skin!, sleepQuality: sym.sleepQuality!, mood: sym.mood!, stress: sym.stress!, source: 'user' };
    const extra: Parameters<typeof saveCheckin>[1] = {};
    if (includeR3 && r3.fn != null && r3.pain != null && r3.global != null) extra.rapid3 = { date: today, fn: r3.fn, pain: r3.pain, global: r3.global, total: rapid3Total(r3.fn, r3.pain, r3.global), source: 'user' };
    if (hbiDue && hbiComplete) {
      const stools = Number(hbi.liquidStools);
      extra.hbi = { date: today, wellbeing: hbi.wellbeing!, abdominalPain: hbi.abdominalPain!, liquidStools: stools, complications: hbi.complications, score: hbiPartialScore(hbi.wellbeing!, hbi.abdominalPain!, stools, hbi.complications.length), source: 'user' };
    }
    // PROMIS-29 placeholder: record that this month's screen was shown so it does not reappear daily
    if (promisDue) extra.promis = { date: today, domains: {} };
    saveCheckin(entry, extra);
    setSecs(Math.round((Date.now() - t0.current) / 1000));
    setSaved(true);
    toast('Check-in saved. Your dashboard and trends are updated.');
  };
  const next = () => {
    if (step.kind === 'hbi') {
      if (!stoolsValid) return setHbiErr('Enter a whole number from 0 to 50.');
      if (!hbiComplete) return;
      setHbiErr('');
    }
    if (steps[i + 1]?.kind === 'done') finish();
    setI(x => Math.min(steps.length - 1, x + 1));
  };

  const symMeta = step.kind === 'symptom' ? SYMPTOMS.find(s => s.key === step.key)! : null;
  const r3Meta = step.kind === 'rapid3' ? RAPID3_Q.find(q => q.key === step.key)! : null;
  const flags = redFlags(sym);
  const progressSteps = steps.filter(s => s.kind !== 'done');

  return (
    <div className="mx-auto grid max-w-2xl gap-4">
      <header className="flex items-center gap-3">
        <button onClick={() => (i > 0 && step.kind !== 'done' ? setI(i - 1) : nav(-1))} className="grid size-11 place-items-center rounded-xl hover:bg-white" aria-label={i > 0 && step.kind !== 'done' ? 'Previous question' : 'Go back'}><ArrowLeft className="size-5" /></button>
        <h1 className="text-2xl font-extrabold tracking-tight">Daily check-in</h1>
        {existing && step.kind !== 'done' && <Badge tone="teal">Editing today</Badge>}
      </header>

      {step.kind !== 'done' && (
        <div className="flex gap-1" aria-hidden>{progressSteps.map((_, j) => <span key={j} className={cn('h-1.5 flex-1 rounded-full', j <= i ? 'bg-brand' : 'bg-[#DCE5E3]')} />)}</div>
      )}

      {(symMeta || r3Meta) && (
        <Card className="grid gap-5">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-brand-700">
            {r3Meta ? `RAPID3 · weekly · question ${RAPID3_Q.indexOf(r3Meta) + 1} of 3` : `Question ${SYMPTOMS.indexOf(symMeta!) + 1} of ${SYMPTOMS.length}`}
          </p>
          <h2 id="qh" className="text-2xl font-extrabold leading-snug tracking-tight sm:text-3xl">{symMeta?.q ?? r3Meta!.q}</h2>
          <p className="-mt-2 text-ink-2">0 means {(symMeta?.lo ?? r3Meta!.lo).toLowerCase()}. 10 means {(symMeta?.hi ?? r3Meta!.hi).toLowerCase()}.</p>
          <Scale value={value} onChange={answer} labelledBy="qh" lo={symMeta?.lo ?? r3Meta!.lo} hi={symMeta?.hi ?? r3Meta!.hi} reverse={symMeta?.higherIsBetter} />
          <button onClick={speech.listening ? speech.stop : speech.start} disabled={!speech.supported} className="flex min-h-14 items-center gap-3 rounded-2xl bg-canvas px-4 text-left font-semibold disabled:opacity-60">
            <span className={cn('grid size-10 place-items-center rounded-xl', speech.listening ? 'animate-pulse bg-insight text-white' : 'bg-insight-50 text-insight')}><Mic className="size-5" aria-hidden /></span>
            <span className="flex-1">{!speech.supported ? 'Voice answers are not supported in this browser' : speech.listening ? 'Listening… say a number, then tap to stop' : 'Answer by voice instead'}</span>
          </button>
          {speech.error && <p className="text-sm font-semibold text-warn" role="alert">{speech.error}</p>}
          {r3Meta && <p className="text-xs text-ink-3"><SimBadge>Demo scoring</SimBadge> The licensed RAPID3 scores function from 10 MDHAQ items. This prototype uses one 0 to 10 item until licensing and wording are confirmed.</p>}
          {symMeta && step.kind === 'symptom' && step.key === 'stress' && data.profile.conditions.includes('ra') && (
            <div className="rounded-2xl bg-gradient-to-br from-[#EAF6F3] to-[#EBEFFA] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-brand-700">After today's questions</p>
              {r3Due ? <p className="font-bold">RAPID3 is due today (weekly)</p> : (
                <label className="mt-1 flex items-center gap-2 font-semibold"><input type="checkbox" className="size-5 accent-[#14806F]" checked={includeR3} onChange={e => setIncludeR3(e.target.checked)} />Also do RAPID3 now (last done {lastR3 ? fmtDate(lastR3.date) : 'never'})</label>
              )}
            </div>
          )}
        </Card>
      )}

      {step.kind === 'hbi' && (
        <Card className="grid gap-4">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-brand-700">Harvey-Bradshaw Index · patient items · weekly</p>
          <fieldset><legend className="mb-2 font-bold">General well-being yesterday</legend>
            <div className="grid grid-cols-5 gap-2">{['Very well', 'Slightly below par', 'Poor', 'Very poor', 'Terrible'].map((t, n) => (
              <button key={t} aria-pressed={hbi.wellbeing === n} onClick={() => setHbi(h => ({ ...h, wellbeing: n }))} className={cn('min-h-14 rounded-xl border-2 px-1 text-xs font-semibold', hbi.wellbeing === n ? 'border-brand bg-brand-50' : 'border-line bg-white')}>{t}</button>))}</div>
          </fieldset>
          <fieldset><legend className="mb-2 font-bold">Abdominal pain yesterday</legend>
            <div className="grid grid-cols-4 gap-2">{['None', 'Mild', 'Moderate', 'Severe'].map((t, n) => (
              <button key={t} aria-pressed={hbi.abdominalPain === n} onClick={() => setHbi(h => ({ ...h, abdominalPain: n }))} className={cn('min-h-12 rounded-xl border-2 text-sm font-semibold', hbi.abdominalPain === n ? 'border-brand bg-brand-50' : 'border-line bg-white')}>{t}</button>))}</div>
          </fieldset>
          <Field label="Number of liquid or soft stools yesterday" hint="Enter 0 if none." error={hbiErr || (hbi.liquidStools.trim() && !stoolsValid ? 'Enter a whole number from 0 to 50.' : undefined)}>{p => <Input {...p} inputMode="numeric" placeholder="0" value={hbi.liquidStools} onChange={e => { setHbiErr(''); setHbi(h => ({ ...h, liquidStools: e.target.value })); }} className="max-w-32" />}</Field>
          <fieldset><legend className="mb-2 font-bold">Any of these right now?</legend>
            <div className="grid gap-1 sm:grid-cols-2">{HBI_COMPLICATIONS.map(c => (
              <label key={c} className="flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm hover:bg-canvas"><input type="checkbox" className="size-5 accent-[#14806F]" checked={hbi.complications.includes(c)} onChange={e => setHbi(h => ({ ...h, noComplications: false, complications: e.target.checked ? [...h.complications, c] : h.complications.filter(x => x !== c) }))} />{c}</label>))}
              <label className="flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-semibold hover:bg-canvas sm:col-span-2"><input type="checkbox" className="size-5 accent-[#14806F]" checked={hbi.noComplications} onChange={e => setHbi(h => ({ ...h, noComplications: e.target.checked, complications: e.target.checked ? [] : h.complications }))} />None of these</label></div>
          </fieldset>
          {!hbiComplete && <p className="text-sm text-ink-2" role="status">Still to answer: {hbiMissing.join(', ')}.</p>}
          <Notice>The abdominal-mass item needs a clinician to examine you, so this score is marked partial.</Notice>
        </Card>
      )}

      {step.kind === 'promis' && (
        <Card className="grid gap-3">
          <div className="flex items-center gap-2"><Lock className="size-5 text-ink-3" aria-hidden /><p className="text-xs font-bold uppercase tracking-[0.1em] text-brand-700">PROMIS-29 · monthly</p></div>
          <h2 className="text-2xl font-extrabold tracking-tight">Monthly profile coming soon</h2>
          <p className="text-ink-2">PROMIS-29 covers physical function, anxiety, depression, fatigue, sleep, social roles, pain interference and pain intensity. Its questions are not shown in this prototype until instrument licensing and approved wording are confirmed with our clinical advisor.</p>
          <p className="text-sm text-ink-3">No answers are collected here. You can continue.</p>
        </Card>
      )}

      {step.kind !== 'done' && (
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => (i > 0 ? setI(i - 1) : nav(-1))}>Back</Button>
          <Button className="flex-1" size="lg" onClick={next} disabled={!canNext}>{steps[i + 1]?.kind === 'done' ? 'Finish and save' : 'Next'}</Button>
        </div>
      )}

      {step.kind === 'done' && saved && (
        <div className="grid gap-4">
          <Card className="grid gap-2">
            <CheckCircle2 className="size-12 text-brand" aria-hidden />
            <h2 className="text-3xl font-extrabold tracking-tight">Saved{secs ? ` in ${secs} seconds` : ''}</h2>
            <p className="text-ink-2">Stored as a questionnaire response with scored observations. Your dashboard, trends and report now include today.</p>
          </Card>
          {flags.length > 0 && (
            <Notice tone="danger" title="Some symptoms are very high today">{flags.join(', ')}. If this is new or getting worse, contact your care team. If it is an emergency, call 911.</Notice>
          )}
          {includeR3 && r3.fn != null && (
            <Card>
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-brand-700">RAPID3 · weekly <SimBadge className="ml-1">Demo scoring</SimBadge></p>
              {(() => { const t = rapid3Total(r3.fn!, r3.pain!, r3.global!); const c = rapid3Category(t); return (
                <div className="mt-2 flex flex-wrap items-baseline gap-3"><span className="text-5xl font-extrabold tracking-tight">{t}</span><span className="text-ink-3">/ 30</span><Badge tone={c === 'High' ? 'red' : c === 'Moderate' ? 'amber' : 'teal'}>{c}</Badge></div>); })()}
              <p className="mt-2 text-sm text-ink-2">Function {r3.fn} + pain {r3.pain} + patient global {r3.global}. Bands: remission ≤ 3, low &gt; 3 to 6, moderate &gt; 6 to 12, high &gt; 12.{lastR3 && lastR3.date !== today ? ` Previous: ${lastR3.total} on ${fmtDate(lastR3.date)}.` : ''}</p>
            </Card>
          )}
          {hbiDue && hbiComplete && (
            <Card><p className="text-xs font-bold uppercase tracking-[0.1em] text-brand-700">Harvey-Bradshaw · partial</p>
              {(() => { const sc = hbiPartialScore(hbi.wellbeing!, hbi.abdominalPain!, Number(hbi.liquidStools), hbi.complications.length); return <p className="mt-1"><span className="text-4xl font-extrabold">{sc}</span> <span className="text-ink-2">{hbiReading(sc)}. Partial: no abdominal-mass item.</span></p>; })()}
            </Card>
          )}
          <Card>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-brand-700">Today's answers</p>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">{SYMPTOMS.map(s => <div key={s.key} className="flex justify-between border-b border-line py-1"><dt className="text-ink-2">{s.label}</dt><dd className="font-bold">{sym[s.key]}</dd></div>)}</dl>
          </Card>
          <div className="flex flex-wrap gap-3"><Button onClick={() => nav('/today')}>Back to Today</Button><Link to="/trends" className="inline-flex min-h-12 items-center rounded-2xl px-5 font-semibold text-brand-700 hover:bg-brand-50">See trends</Link></div>
          {flags.length === 0 && <p className="flex items-center gap-2 text-xs text-ink-3"><AlertTriangle className="size-4" aria-hidden />Red-flag rules are placeholders until defined with the clinical advisor.</p>}
        </div>
      )}
    </div>
  );
}
