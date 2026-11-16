import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserRound, ShieldCheck, Download, Accessibility, History, AlertTriangle, RotateCcw, Trash2, FlaskConical } from 'lucide-react';
import type { ConditionId, Consent, Prefs } from '@/types';
import { CONDITIONS } from '@/data/conditions';
import { useStore, useToday } from '@/store/store';
import { buildBundle } from '@/services/fhir';
import { downloadBlob, downloadJson } from '@/services/report';
import { mealTotals } from '@/data/foods';
import { Button, Card, CardTitle, Field, Input, Modal, Notice, PageHeader, Select, Switch, cn, useToast } from '@/components/ui';

const csv = (rows: (string | number)[][]) => rows.map(r => r.map(c => { const s = String(c); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(',')).join('\n');

export default function Settings() {
  const { data, setProfile, setConsent, setPrefs, resetDemo, deleteEverything, logAccess, storageOk } = useStore();
  const today = useToday();
  const toast = useToast();
  const nav = useNavigate();
  const { hash } = useLocation();
  const [name, setName] = useState(data.profile.name);
  const [nameErr, setNameErr] = useState('');
  const [conds, setConds] = useState<ConditionId[]>(data.profile.conditions);
  const [researchOpen, setResearchOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => { if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' }); }, [hash]);

  const saveProfile = () => {
    const n = name.trim();
    if (!n) return setNameErr('Enter a name.');
    if (n.length > 40) return setNameErr('Use 40 characters or fewer.');
    if (!conds.length) return setNameErr('Choose at least one condition below.');
    setNameErr(''); setProfile({ name: n, conditions: conds }); toast('Profile saved.');
  };
  const toggleConsent = (k: keyof Consent, v: boolean) => {
    if (k === 'app') return;
    if (k === 'research' && v) { setResearchOpen(true); return; }
    setConsent({ ...data.consent, [k]: v }, `${k === 'health' ? 'Wearable data' : k === 'ai' ? 'AI photo processing' : 'Research sharing'} turned ${v ? 'on' : 'off'}`);
    toast(`Saved as consent version ${(data.consentLog[data.consentLog.length - 1]?.version ?? 0) + 1}.`);
  };
  const exportAll = () => {
    const { chat: _c, ...rest } = data; void _c;
    downloadJson({ note: 'Remitra demo export. Synthetic data only.', exportedAt: new Date().toISOString(), ...rest }, `remitra-export-${today}.json`);
    logAccess('Exported all data (JSON)'); toast('Export downloaded.');
  };
  const exportFhir = () => {
    downloadJson(buildBundle(data, { from: '2000-01-01', to: today, includeWearables: data.consent.health }), `remitra-fhir-all-${today}.json`);
    logAccess('Exported all data (FHIR)'); toast('FHIR bundle downloaded.');
  };
  const exportCsv = () => {
    const meals = csv([['date', 'time', 'meal', 'foods', 'kcal', 'added_sugar_g', 'tags', 'method'], ...data.meals.map(m => { const t = mealTotals(m.items); return [m.date, m.time, m.slot, m.items.map(i => `${i.name} ${i.grams}g`).join('; '), Math.round(t.kcal), Math.round(t.addedSugar), [...new Set(m.items.flatMap(i => i.tags))].join('; '), m.method]; })]);
    const sym = csv([['date', 'fatigue', 'pain', 'gi', 'skin', 'sleep_quality', 'mood', 'stress', 'source'], ...data.symptoms.map(s => [s.date, s.fatigue, s.pain, s.gi, s.skin, s.sleepQuality, s.mood, s.stress, s.source])]);
    downloadBlob(new Blob([meals], { type: 'text/csv' }), `remitra-meals-${today}.csv`);
    setTimeout(() => downloadBlob(new Blob([sym], { type: 'text/csv' }), `remitra-symptoms-${today}.csv`), 400);
    logAccess('Exported meals and symptoms (CSV)'); toast('Two CSV files downloaded.');
  };

  return (
    <div className="mx-auto grid max-w-3xl gap-5">
      <PageHeader title="Settings" subtitle="Profile, privacy, data and accessibility." />
      <nav aria-label="Settings sections" className="flex flex-wrap gap-2">
        {[['profile', 'Profile'], ['consent', 'Privacy and consent'], ['data', 'Your data'], ['accessibility', 'Accessibility'], ['access-log', 'Access log'], ['account', 'Account']].map(([id, l]) => <a key={id} href={`#${id}`} className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-brand-700 shadow-sm hover:bg-brand-50">{l}</a>)}
      </nav>
      {!storageOk && <Notice tone="warn">Browser storage is unavailable, so changes will not be kept after you close this tab.</Notice>}

      <Section id="profile" icon={<UserRound className="size-5 text-brand" aria-hidden />} title="Profile">
        <div className="grid gap-4">
          <Field label="Name" error={nameErr}>{p => <Input {...p} value={name} onChange={e => setName(e.target.value)} maxLength={60} />}</Field>
          <fieldset><legend className="mb-2 text-sm font-semibold text-ink-2">Conditions</legend>
            <div className="grid gap-2 sm:grid-cols-2">{(Object.keys(CONDITIONS) as ConditionId[]).map(c => (
              <label key={c} className="flex min-h-11 items-center gap-2 rounded-xl border border-line px-3 text-sm font-medium"><input type="checkbox" className="size-5 accent-[#14806F]" checked={conds.includes(c)} onChange={e => setConds(x => e.target.checked ? [...x, c] : x.filter(y => y !== c))} />{CONDITIONS[c].label}</label>))}</div>
            <p className="mt-2 text-xs text-ink-3">{conds.map(c => CONDITIONS[c].module ?? CONDITIONS[c].note).filter(Boolean).join(' · ')}</p>
          </fieldset>
          <p className="text-sm text-ink-3">{data.profile.mode === 'guest' ? 'Guest demo' : 'Demo account (simulated passkey)'} · started {new Date(data.profile.createdAt).toLocaleDateString()}</p>
          <Button onClick={saveProfile} className="justify-self-start">Save profile</Button>
        </div>
      </Section>

      <Section id="consent" icon={<ShieldCheck className="size-5 text-brand" aria-hidden />} title="Privacy and consent">
        <div className="grid gap-3">
          {([['app', 'Use Remitra', 'Required to store your logs and run the app.'], ['health', 'Wearable health data', 'Sleep, resting heart rate, HRV and steps. Read only.'],
            ['ai', 'AI reads meal and lab photos', 'Photos are processed and then discarded. Never used for training.'], ['research', 'Research mode', 'Share de-identified data with approved autoimmune studies. Optional.']] as const).map(([k, t, d]) => (
            <div key={k} className="flex items-center gap-3 rounded-2xl border border-line p-4">
              <div className="flex-1"><p className="font-bold">{t}{k === 'app' && <span className="ml-2 rounded-md bg-[#EDF1F0] px-2 py-0.5 text-xs font-semibold text-ink-2">Required</span>}</p><p id={`cs-${k}`} className="text-sm text-ink-2">{d}</p></div>
              <Switch checked={data.consent[k]} disabled={k === 'app'} label={t} describedBy={`cs-${k}`} onChange={v => toggleConsent(k, v)} />
            </div>
          ))}
          <p className="text-sm text-ink-2">What changes: wearable off hides sleep and heart-rate data everywhere; AI photos off blocks photo meal logging and lab-photo reading; research has no effect in Phase 1 beyond the recorded choice.</p>
          <details className="text-sm"><summary className="cursor-pointer font-semibold text-brand-700">Consent history ({data.consentLog.length} {data.consentLog.length === 1 ? 'version' : 'versions'})</summary>
            <ul className="mt-2 grid gap-1">{[...data.consentLog].reverse().map(c => <li key={c.version} className="rounded-xl bg-canvas px-3 py-2"><b>v{c.version}</b> · {new Date(c.at).toLocaleString()} · {c.change}</li>)}</ul>
          </details>
          <Link to="/privacy" className="font-semibold text-brand-700 underline">Read the privacy notice</Link>
        </div>
      </Section>

      <Section id="data" icon={<Download className="size-5 text-brand" aria-hidden />} title="Your data">
        <div className="grid gap-2 sm:grid-cols-3">
          <Button variant="secondary" onClick={exportAll}>Export all (JSON)</Button>
          <Button variant="secondary" onClick={exportFhir}>Export all (FHIR R4)</Button>
          <Button variant="secondary" onClick={exportCsv}>Meals and symptoms (CSV)</Button>
        </div>
        <p className="mt-2 text-sm text-ink-3">Exports are created in your browser and saved to your device.</p>
      </Section>

      <Section id="accessibility" icon={<Accessibility className="size-5 text-brand" aria-hidden />} title="Accessibility">
        <div className="grid gap-3">
          <Field label="Text size">{p => <Select {...p} value={data.prefs.textSize} onChange={e => setPrefs({ textSize: e.target.value as Prefs['textSize'] })} className="max-w-56"><option value="base">Standard</option><option value="large">Large</option><option value="xl">Extra large</option></Select>}</Field>
          <div className="flex items-center gap-3"><span className="flex-1 font-semibold" id="rm">Reduce motion</span><Switch checked={data.prefs.reducedMotion} onChange={v => setPrefs({ reducedMotion: v })} label="Reduce motion" describedBy="rm" /></div>
          <div className="flex items-center gap-3"><span className="flex-1 font-semibold" id="hc">Higher contrast text and borders</span><Switch checked={data.prefs.highContrast} onChange={v => setPrefs({ highContrast: v })} label="Higher contrast" describedBy="hc" /></div>
          <p className="text-sm text-ink-3">Voice input is available for meal logging and check-in answers where your browser supports it.</p>
        </div>
      </Section>

      <Section id="access-log" icon={<History className="size-5 text-brand" aria-hidden />} title="Access log">
        <ul className="max-h-72 divide-y divide-line overflow-auto text-sm">
          {[...data.access].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 50).map((a, i) => <li key={i} className="flex gap-3 py-2"><span className="w-40 shrink-0 text-ink-3">{new Date(a.at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span><span className="flex-1">{a.action}</span><span className="text-ink-3">{a.who}</span></li>)}
        </ul>
      </Section>

      <Section id="account" icon={<AlertTriangle className="size-5 text-warn" aria-hidden />} title="Account">
        <div className="grid gap-3 sm:grid-cols-2">
          <Button variant="secondary" icon={<RotateCcw className="size-5" />} onClick={() => setResetOpen(true)}>Reset demo data</Button>
          <Button variant="danger" icon={<Trash2 className="size-5" />} onClick={() => setDeleteOpen(true)}>Delete account and data</Button>
        </div>
      </Section>

      <Modal open={researchOpen} onClose={() => setResearchOpen(false)} title="Research mode"
        footer={<><Button variant="secondary" onClick={() => setResearchOpen(false)}>Not now</Button><Button onClick={() => { setConsent({ ...data.consent, research: true }, 'Research sharing turned on'); setResearchOpen(false); toast('Research consent saved. You can turn it off any time.'); }} icon={<FlaskConical className="size-4" />}>I agree to share for research</Button></>}>
        <div className="grid gap-3 text-sm text-ink-2">
          <p>Help autoimmune research by sharing a de-identified copy of your data with approved studies. This is separate from app consent and entirely optional.</p>
          <div className="rounded-2xl bg-white p-4"><p className="font-bold text-ink">What would be shared</p><p>Meal tags and nutrients, symptom scores, disease-activity scores, lab values, and daily sleep and heart-rate totals.</p></div>
          <div className="rounded-2xl bg-white p-4"><p className="font-bold text-ink">Never shared</p><p>Your name, contact details, photos, exact birth date or free-text notes. Data is never sold.</p></div>
          <p>Phase 1 records your choice only. De-identified export and study participation begin in later phases, after legal and ethics review. Consent is versioned and you can withdraw in Settings.</p>
        </div>
      </Modal>
      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Reset demo data?" footer={<><Button variant="secondary" onClick={() => setResetOpen(false)}>Cancel</Button><Button onClick={() => { resetDemo(); setResetOpen(false); toast('Demo data reset to the 70-day synthetic history.'); }}>Reset</Button></>}>
        <p className="text-ink-2">Your meals, check-ins, labs, experiments and chat are replaced with a fresh 70-day synthetic history ending yesterday. Your name, conditions and consent choices are kept.</p>
      </Modal>
      <Modal open={deleteOpen} onClose={() => { setDeleteOpen(false); setConfirmText(''); }} title="Delete account and all data?"
        footer={<><Button variant="secondary" onClick={() => { setDeleteOpen(false); setConfirmText(''); }}>Cancel</Button><Button variant="danger" disabled={confirmText !== 'DELETE'} onClick={() => { deleteEverything(); nav('/welcome'); }}>Delete everything</Button></>}>
        <div className="grid gap-3">
          <p className="text-ink-2">This removes everything stored by Remitra in this browser and returns to onboarding. It cannot be undone.</p>
          <Field label='Type DELETE to confirm'>{p => <Input {...p} value={confirmText} onChange={e => setConfirmText(e.target.value)} autoComplete="off" className={cn(confirmText && confirmText !== 'DELETE' && 'border-danger')} />}</Field>
        </div>
      </Modal>
    </div>
  );
}

function Section({ id, icon, title, children }: { id: string; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return <Card id={id} className="scroll-mt-24"><CardTitle><span className="flex items-center gap-2">{icon}{title}</span></CardTitle>{children}</Card>;
}
