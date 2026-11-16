import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Heart, Sparkles, FlaskConical, KeyRound, UserRound, Check, Smartphone, Watch } from 'lucide-react';
import type { ConditionId, Consent } from '@/types';
import { CONDITIONS, GOALS } from '@/data/conditions';
import { useStore, DEFAULT_CONSENT } from '@/store/store';
import { Button, Field, Input, Switch, Notice, SimBadge, cn, useToast } from '@/components/ui';
import { Logo } from '@/components/AppShell';

const STEPS = ['Account', 'Conditions and goals', 'Privacy and consent', 'Health data'];

export default function Onboarding() {
  const { completeOnboarding } = useStore();
  const nav = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const top = useRef<HTMLParagraphElement>(null);
  // every step opens at the top, with focus on the step label for screen readers
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    window.scrollTo(0, 0);
    top.current?.focus({ preventScroll: true });
  }, [step]);
  const [mode, setMode] = useState<'guest' | 'account'>('guest');
  const [name, setName] = useState('Maya');
  const [nameErr, setNameErr] = useState('');
  const [passkey, setPasskey] = useState(false);
  const [conditions, setConditions] = useState<ConditionId[]>(['ra']);
  const [goals, setGoals] = useState<string[]>(['Find food triggers', 'Better clinic visits']);
  const [consent, setConsent] = useState<Consent>(DEFAULT_CONSENT);

  const next = () => {
    if (step === 1) {
      const n = name.trim();
      if (!n) return setNameErr('Enter a first name or nickname.');
      if (n.length > 40) return setNameErr('Use 40 characters or fewer.');
      if (mode === 'account' && !passkey) return setNameErr('Create the demo passkey first, or continue as a guest.');
      setNameErr('');
    }
    setStep(s => Math.min(4, s + 1));
  };
  const finish = () => {
    completeOnboarding({ name: name.trim() || 'Maya', conditions, goals, mode }, consent);
    toast('Welcome to Remitra. Consent saved as version 1.');
    nav('/today');
  };
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

  return (
    <div className="min-h-dvh px-4 py-8 sm:py-12" style={{ background: 'radial-gradient(1200px 700px at 0% 0%, #0F6B5E, transparent 60%), radial-gradient(900px 700px at 100% 100%, #0B4A63, transparent 60%), #0A2A2C' }}>
      <div className="mx-auto grid max-w-5xl items-start gap-10 lg:grid-cols-[1fr_520px]">
        <div className="on-dark hidden pt-10 text-[#DCEDEA] lg:block">
          <div className="[&_span]:text-white"><Logo /></div>
          <h1 className="mt-8 text-4xl font-extrabold leading-tight tracking-tight text-white">Your friend on the way to remission.</h1>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-[#B9D3CF]">Link what you eat to how your autoimmune condition behaves, using validated questionnaires, wearable signals and lab results. Then share a clear report with your care team.</p>
          <ul className="mt-8 grid gap-3 text-[15px]">
            {['10-second photo, voice or barcode meal logging', '60-second daily check-in plus weekly disease index', 'Personal patterns, worded as associations, never causes', 'You choose what is shared. We never sell health data.'].map(t => (
              <li key={t} className="flex gap-3"><Check className="mt-0.5 size-5 text-mint" aria-hidden />{t}</li>
            ))}
          </ul>
          <p className="mt-10 text-sm text-[#8FB5AF]">Prototype. Uses synthetic demonstration data for the persona Maya (rheumatoid arthritis).</p>
        </div>

        <div className="card animate-pop p-6 sm:p-8">
          <div className="mb-5 lg:hidden"><Logo /></div>
          <div className="mb-2 flex gap-1.5" aria-hidden>{STEPS.map((_, i) => <span key={i} className={cn('h-1.5 flex-1 rounded-full', i < step ? 'bg-brand' : 'bg-[#DCE5E3]')} />)}</div>
          <p ref={top} tabIndex={-1} className="text-sm font-medium text-ink-3 outline-none" aria-live="polite">Step {step} of 4 · {STEPS[step - 1]}</p>

          {step === 1 && (
            <div className="mt-4 grid gap-4">
              <h2 className="text-3xl font-extrabold tracking-tight">Welcome to Remitra</h2>
              <p className="text-ink-2">Explore the full app with Maya's 70 days of synthetic data. Nothing you enter is sent to a server account.</p>
              <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="How do you want to start?">
                {([['guest', 'Continue as guest', 'Instant demo, no sign-up', UserRound], ['account', 'Create demo account', 'Name plus a simulated passkey', KeyRound]] as const).map(([id, t, d, Icon]) => (
                  <button key={id} role="radio" aria-checked={mode === id} onClick={() => setMode(id)}
                    className={cn('rounded-2xl border-2 p-4 text-left transition', mode === id ? 'border-brand bg-brand-50' : 'border-line bg-white hover:border-brand-100')}>
                    <Icon className="mb-2 size-6 text-brand" aria-hidden /><span className="block font-bold">{t}</span><span className="text-sm text-ink-2">{d}</span>
                  </button>
                ))}
              </div>
              <Field label="First name or nickname" error={nameErr}>
                {p => <Input {...p} value={name} onChange={e => setName(e.target.value)} autoComplete="given-name" maxLength={60} />}
              </Field>
              {mode === 'account' && (
                <div className="flex items-center gap-3 rounded-2xl border border-line p-4">
                  <KeyRound className="size-6 text-brand" aria-hidden />
                  <div className="flex-1"><p className="font-semibold">Passkey <SimBadge className="ml-1" /></p><p className="text-sm text-ink-2">The real app uses device passkeys through Amazon Cognito. Here it is simulated.</p></div>
                  <Button size="sm" variant={passkey ? 'subtle' : 'secondary'} onClick={() => setPasskey(true)} icon={passkey ? <Check className="size-4" /> : undefined}>{passkey ? 'Created' : 'Create'}</Button>
                </div>
              )}
              <Button size="lg" onClick={next}>Continue</Button>
            </div>
          )}

          {step === 2 && (
            <div className="mt-4 grid gap-4">
              <h2 className="text-3xl font-extrabold tracking-tight">What are you managing?</h2>
              <p className="text-ink-2">Pick all that apply. Your check-in adapts to these.</p>
              <fieldset><legend className="sr-only">Conditions</legend>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {(Object.keys(CONDITIONS) as ConditionId[]).map(c => (
                    <button key={c} type="button" aria-pressed={conditions.includes(c)} onClick={() => setConditions(x => toggle(x, c))}
                      className={cn('min-h-12 rounded-xl border-2 px-3 py-2 text-left text-sm font-semibold transition', conditions.includes(c) ? 'border-brand bg-brand-50 text-brand-700' : 'border-line bg-white hover:border-brand-100')}>
                      {CONDITIONS[c].label}
                      {CONDITIONS[c].module && <span className="block text-xs font-normal text-ink-3">{CONDITIONS[c].module}</span>}
                    </button>
                  ))}
                </div>
              </fieldset>
              {!conditions.length && <p className="text-sm font-semibold text-danger" role="alert">Choose at least one option.</p>}
              <fieldset><legend className="mb-2 font-bold">Your goals</legend>
                <div className="flex flex-wrap gap-2">
                  {GOALS.map(g => (
                    <button key={g} type="button" aria-pressed={goals.includes(g)} onClick={() => setGoals(x => toggle(x, g))}
                      className={cn('inline-flex min-h-10 items-center gap-1 rounded-full px-4 text-sm font-semibold', goals.includes(g) ? 'bg-brand text-white' : 'bg-[#EDF1F0] text-ink-2')}>
                      {goals.includes(g) && <Check className="size-4" aria-hidden />}{g}
                    </button>
                  ))}
                </div>
              </fieldset>
              <Notice>The demo history is for rheumatoid arthritis. Choosing Crohn's disease adds the Harvey-Bradshaw patient items to your check-in.</Notice>
              <div className="flex gap-3"><Button variant="secondary" onClick={() => setStep(1)}>Back</Button><Button className="flex-1" onClick={next} disabled={!conditions.length}>Continue</Button></div>
            </div>
          )}

          {step === 3 && (
            <div className="mt-4 grid gap-3">
              <h2 className="text-3xl font-extrabold tracking-tight">Your data, your choices</h2>
              <p className="text-ink-2">Turn on only what you want. You can change any of these later in Settings.</p>
              {([
                ['app', ShieldCheck, 'bg-brand-50 text-brand', 'Use Remitra', 'Store your logs securely so the app can work.', true],
                ['health', Heart, 'bg-danger-50 text-danger', 'Read wearable health data', 'Sleep, resting heart rate, HRV and steps from Apple Health or Health Connect. Read only.', false],
                ['ai', Sparkles, 'bg-insight-50 text-insight', 'AI reads meal and lab photos', 'Photos are processed and then discarded. Never used to train models.', false],
                ['research', FlaskConical, 'bg-sleep-50 text-sleep', 'Share for research', 'De-identified data for approved autoimmune studies. Off unless you turn it on.', false],
              ] as const).map(([k, Icon, tone, t, d, req]) => (
                <div key={k} className="flex items-start gap-3 rounded-2xl border border-line bg-white p-4">
                  <div className={cn('grid size-11 shrink-0 place-items-center rounded-xl', tone)}><Icon className="size-5" aria-hidden /></div>
                  <div className="flex-1"><p className="font-bold" id={`c-${k}`}>{t} {req && <span className="ml-1 rounded-md bg-[#EDF1F0] px-2 py-0.5 text-xs font-semibold text-ink-2">Required</span>}</p><p id={`cd-${k}`} className="text-sm text-ink-2">{d}</p></div>
                  <Switch checked={consent[k]} disabled={req} label={t} describedBy={`cd-${k}`} onChange={v => setConsent(c => ({ ...c, [k]: v }))} />
                </div>
              ))}
              <p className="flex items-center gap-2 text-sm text-ink-2"><ShieldCheck className="size-4 text-brand" aria-hidden />We never sell your health data. <Link to="/privacy" className="font-semibold text-brand-700 underline" target="_blank">Privacy notice</Link></p>
              <div className="flex gap-3"><Button variant="secondary" onClick={() => setStep(2)}>Back</Button><Button className="flex-1" onClick={next}>Continue</Button></div>
            </div>
          )}

          {step === 4 && (
            <div className="mt-4 grid gap-4">
              <h2 className="text-3xl font-extrabold tracking-tight">Connect health data</h2>
              <Notice tone="sim" title="Connection preview">Web browsers cannot read Apple Health or Android Health Connect. The mobile app (Phase 2) will request access on your phone. This demo shows synthetic sleep, heart rate, HRV and step data instead.</Notice>
              {[['Apple Health', 'iPhone and Apple Watch', Smartphone], ['Health Connect', 'Android phones and watches', Watch]].map(([t, d, Icon]) => (
                <div key={t as string} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4">
                  <div className="grid size-11 place-items-center rounded-xl bg-danger-50 text-danger"><Icon className="size-5" aria-hidden /></div>
                  <div className="flex-1"><p className="font-bold">{t as string}</p><p className="text-sm text-ink-2">{d as string} · sleep, resting heart rate, HRV, steps</p></div>
                  <span className={cn('rounded-full px-3 py-1 text-xs font-bold', consent.health ? 'bg-brand-50 text-brand-700' : 'bg-[#EDF1F0] text-ink-2')}>{consent.health ? 'Synthetic data on' : 'Off'}</span>
                </div>
              ))}
              {!consent.health && (
                <div className="grid gap-2 rounded-2xl bg-canvas p-4">
                  <p className="text-sm text-ink-2">Wearable data is off, so sleep, heart-rate and step cards stay hidden. You can turn it on now or later in Settings.</p>
                  <Button variant="secondary" size="sm" className="justify-self-start" onClick={() => setConsent(c => ({ ...c, health: true }))}>Turn on wearable data</Button>
                </div>
              )}
              <div className="flex gap-3"><Button variant="secondary" onClick={() => setStep(3)}>Back</Button><Button className="flex-1" size="lg" onClick={finish}>Finish and open Today</Button></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
