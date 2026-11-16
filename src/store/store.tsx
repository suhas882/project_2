/* App state with demo persistence in localStorage. Every mutation goes through a named action so the
   same API can later be backed by a real service (Node API, HealthLake) without touching the UI. */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AppData, ChatMessage, Consent, Experiment, FlareEvent, HbiEntry, LabResult, Meal, Medication, Prefs, Profile, PromisPlaceholder, Rapid3Entry, SymptomEntry } from '@/types';
import { generatePersona } from '@/data/synthetic';
import { todayISO } from '@/lib/dates';

const KEY = 'remitra:data:v1';
/* Opt-in by default: only the required app-use consent starts on. */
export const DEFAULT_CONSENT: Consent = { app: true, health: false, ai: false, research: false };
const DEFAULT_PREFS: Prefs = { textSize: 'base', reducedMotion: false, highContrast: false };

export function createDemoData(profile?: Partial<Profile>, consent: Consent = DEFAULT_CONSENT, onboarded = false): AppData {
  const anchor = todayISO();
  const now = new Date().toISOString();
  return {
    version: 1,
    onboarded,
    ...generatePersona(anchor),
    profile: { name: 'Maya', conditions: ['ra'], goals: ['Find food triggers', 'Better clinic visits'], mode: 'guest', createdAt: now, ...profile },
    consent,
    consentLog: [{ version: 1, at: now, consent, change: 'Initial consent' }],
    experiments: [],
    chat: [],
    shares: [],
    prefs: DEFAULT_PREFS,
  };
}

function load(): AppData | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as AppData;
    return d.version === 1 ? d : null;
  } catch { return null; }
}

const uid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

function useStoreValue() {
  const [data, setData] = useState<AppData>(() => load() ?? createDemoData());
  const [storageOk, setStorageOk] = useState(true);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; }
    const t = setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify(data)); setStorageOk(true); } catch { setStorageOk(false); }
    }, 150);
    return () => clearTimeout(t);
  }, [data]);

  const update = useCallback((fn: (d: AppData) => AppData) => setData(d => fn(d)), []);
  const logAccess = (d: AppData, action: string): AppData => ({ ...d, access: [{ at: new Date().toISOString(), who: 'You', action }, ...d.access].slice(0, 200) });

  const actions = useMemo(() => ({
    completeOnboarding: (profile: Partial<Profile>, consent: Consent) => setData(() => {
      const d = createDemoData(profile, consent, true);
      return logAccess(d, profile.mode === 'account' ? 'Created demo account' : 'Started guest demo');
    }),
    setProfile: (p: Partial<Profile>) => update(d => logAccess({ ...d, profile: { ...d.profile, ...p } }, 'Updated profile')),
    setConsent: (c: Consent, change: string) => update(d => {
      const version = (d.consentLog[d.consentLog.length - 1]?.version ?? 0) + 1;
      const next = { ...d, consent: { ...c, app: true }, consentLog: [...d.consentLog, { version, at: new Date().toISOString(), consent: { ...c, app: true }, change }] };
      return logAccess(next, `Consent changed: ${change}`);
    }),
    addMeal: (m: Omit<Meal, 'id'>) => update(d => logAccess({ ...d, meals: [...d.meals, { ...m, id: uid('meal') }] }, `Logged ${m.slot.toLowerCase()}`)),
    updateMeal: (m: Meal) => update(d => logAccess({ ...d, meals: d.meals.map(x => (x.id === m.id ? m : x)) }, `Edited ${m.slot.toLowerCase()}`)),
    deleteMeal: (id: string) => update(d => logAccess({ ...d, meals: d.meals.filter(x => x.id !== id) }, 'Deleted a meal')),
    saveCheckin: (s: SymptomEntry, extra: { rapid3?: Rapid3Entry; hbi?: HbiEntry; promis?: PromisPlaceholder }) => update(d => {
      const replace = <T extends { date: string }>(arr: T[], v?: T) => (v ? [...arr.filter(x => x.date !== v.date), v].sort((a, b) => a.date.localeCompare(b.date)) : arr);
      return logAccess({ ...d, symptoms: replace(d.symptoms, s), rapid3: replace(d.rapid3, extra.rapid3), hbi: replace(d.hbi, extra.hbi), promis: replace(d.promis, extra.promis) }, 'Completed daily check-in');
    }),
    addLabs: (labs: Omit<LabResult, 'id'>[]) => update(d => logAccess({ ...d, labs: [...d.labs, ...labs.map(l => ({ ...l, id: uid('lab') }))] }, `Saved ${labs.length} lab result${labs.length > 1 ? 's' : ''}`)),
    deleteLab: (id: string) => update(d => logAccess({ ...d, labs: d.labs.filter(l => l.id !== id) }, 'Deleted a lab result')),
    addFlare: (f: Omit<FlareEvent, 'id'>) => update(d => logAccess({ ...d, flares: [...d.flares, { ...f, id: uid('fl') }].sort((a, b) => a.date.localeCompare(b.date)) }, 'Logged a flare')),
    deleteFlare: (id: string) => update(d => ({ ...d, flares: d.flares.filter(f => f.id !== id) })),
    addMedication: (m: Omit<Medication, 'id'>) => update(d => logAccess({ ...d, medications: [...d.medications, { ...m, id: uid('med') }] }, 'Added a medication or supplement')),
    deleteMedication: (id: string) => update(d => ({ ...d, medications: d.medications.filter(m => m.id !== id) })),
    startExperiment: (e: Omit<Experiment, 'id' | 'createdAt' | 'status'>) => update(d => logAccess({ ...d, experiments: [...d.experiments.map(x => (x.status === 'active' ? { ...x, status: 'stopped' as const, stoppedAt: new Date().toISOString() } : x)), { ...e, id: uid('exp'), createdAt: new Date().toISOString(), status: 'active' }] }, 'Started a Test It experiment')),
    stopExperiment: (id: string) => update(d => logAccess({ ...d, experiments: d.experiments.map(x => (x.id === id ? { ...x, status: 'stopped', stoppedAt: new Date().toISOString() } : x)) }, 'Stopped an experiment')),
    setExperimentReminder: (id: string, on: boolean) => update(d => ({ ...d, experiments: d.experiments.map(x => (x.id === id ? { ...x, reminder: on } : x)) })),
    addChat: (m: Omit<ChatMessage, 'id' | 'at'>) => update(d => ({ ...d, chat: [...d.chat, { ...m, id: uid('msg'), at: new Date().toISOString() }].slice(-100) })),
    clearChat: () => update(d => ({ ...d, chat: [] })),
    createShare: () => update(d => {
      const now = new Date();
      const exp = new Date(now.getTime() + 7 * 86400000);
      return logAccess({ ...d, shares: [{ id: uid('share'), createdAt: now.toISOString(), expiresAt: exp.toISOString(), revoked: false }, ...d.shares] }, 'Created a 7-day share link');
    }),
    revokeShare: (id: string) => update(d => logAccess({ ...d, shares: d.shares.map(s => (s.id === id ? { ...s, revoked: true } : s)) }, 'Revoked a share link')),
    logAccess: (action: string) => update(d => logAccess(d, action)),
    setPrefs: (p: Partial<Prefs>) => update(d => ({ ...d, prefs: { ...d.prefs, ...p } })),
    resetDemo: () => setData(d => logAccess(createDemoData({ name: d.profile.name, conditions: d.profile.conditions, goals: d.profile.goals, mode: d.profile.mode }, d.consent, true), 'Reset demo data')),
    deleteEverything: () => { try { localStorage.removeItem(KEY); localStorage.removeItem('remitra:nutrient-cache'); } catch { /* ignore */ } setData(createDemoData()); },
  }), [update]);

  return { data, storageOk, ...actions };
}

type Store = ReturnType<typeof useStoreValue>;
const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore outside StoreProvider');
  return v;
}

/* "Today" for the app: the real calendar day. History ends the day before the anchor. */
export const useToday = () => todayISO();
