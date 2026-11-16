import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Area, Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, LineChart, ReferenceArea, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Flame, TrendingDown, TrendingUp } from 'lucide-react';
import { useStore, useToday } from '@/store/store';
import { useExposures } from '@/store/derived';
import { addDays, fmtDate, fmtMinutes } from '@/lib/dates';
import { RAPID3_BANDS, rapid3Category, SYMPTOMS, type SymptomKey } from '@/lib/scoring';
import { mealTotals } from '@/data/foods';
import { Badge, Card, CardTitle, DataTable, EmptyState, Field, Input, PageHeader, Progress, Tabs, TextAlternative, cn, fmtTip } from '@/components/ui';
import { MealRow } from '@/components/health';

type TabId = 'symptoms' | 'activity' | 'sleep' | 'nutrition' | 'meals' | 'labs' | 'flares';
const TABS: { id: TabId; label: string }[] = [
  { id: 'symptoms', label: 'Symptoms' }, { id: 'activity', label: 'Disease activity' }, { id: 'sleep', label: 'Sleep' },
  { id: 'nutrition', label: 'Nutrition' }, { id: 'meals', label: 'Meals' }, { id: 'labs', label: 'Biomarkers' }, { id: 'flares', label: 'Flares' },
];
const COLORS: Record<SymptomKey, string> = { fatigue: '#6A4FD0', pain: '#D9733A', gi: '#B4AE52', skin: '#C84A30', sleepQuality: '#4B5BB5', mood: '#14806F', stress: '#5B6A67' };

export default function Trends() {
  const { data } = useStore();
  const today = useToday();
  const ex = useExposures();
  const [sp, setSp] = useSearchParams();
  const tab = (TABS.find(t => t.id === sp.get('tab'))?.id ?? 'symptoms') as TabId;
  const setTab = (t: TabId) => setSp(p => { p.set('tab', t); return p; }, { replace: true });
  const [preset, setPreset] = useState<'7' | '30' | '90' | 'custom'>('30');
  const [custom, setCustom] = useState({ from: addDays(today, -21), to: today });
  const [visible, setVisible] = useState<Record<SymptomKey, boolean>>({ fatigue: true, pain: true, gi: false, skin: false, sleepQuality: true, mood: false, stress: false });
  const rangeErr = preset === 'custom' && custom.from > custom.to ? 'Start date must be on or before the end date.' : '';
  const { from, to } = preset === 'custom' && !rangeErr ? custom : { from: addDays(today, -Number(preset === 'custom' ? 30 : preset)), to: today };
  const inR = (d: string) => d >= from && d <= to;

  const symRows = useMemo(() => data.symptoms.filter(s => inR(s.date)).map(s => ({ ...s, d: fmtDate(s.date) })), [data.symptoms, from, to]); // eslint-disable-line react-hooks/exhaustive-deps
  const r3Rows = data.rapid3.filter(r => inR(r.date)).map(r => ({ ...r, d: fmtDate(r.date) }));
  const wearRows = data.wearables.filter(w => inR(w.date)).map(w => ({ ...w, d: fmtDate(w.date), sleepH: +(w.sleepMin / 60).toFixed(2) }));
  const exRows = [...ex.values()].filter(e => inR(e.date)).sort((a, b) => a.date.localeCompare(b.date)).map(e => ({ ...e, d: fmtDate(e.date), upf: Math.round(e.upfShare * 100) }));
  const flares = data.flares.filter(f => inR(f.date));
  const meals = data.meals.filter(m => inR(m.date)).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const r3Max = Math.max(14, ...r3Rows.map(r => r.total + 1));

  return (
    <div className="grid gap-5">
      <PageHeader title="Trends" subtitle="Your symptoms, scores, sleep, nutrition, labs and flares over time." />
      <Card className="grid gap-3 p-4 sm:grid-cols-[auto_1fr] sm:items-end">
        <div role="group" aria-label="Time range" className="flex flex-wrap gap-1 rounded-2xl bg-[#E4EBE9] p-1">
          {(['7', '30', '90', 'custom'] as const).map(p => (
            <button key={p} aria-pressed={preset === p} onClick={() => setPreset(p)} className={cn('min-h-10 rounded-xl px-4 text-sm font-semibold', preset === p ? 'bg-white shadow-sm' : 'text-ink-2')}>{p === 'custom' ? 'Custom range' : `${p} days`}</button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="flex flex-wrap gap-3">
            <Field label="From" error={rangeErr}>{p => <Input {...p} type="date" max={today} value={custom.from} onChange={e => setCustom(c => ({ ...c, from: e.target.value }))} />}</Field>
            <Field label="To">{p => <Input {...p} type="date" max={today} value={custom.to} onChange={e => setCustom(c => ({ ...c, to: e.target.value }))} />}</Field>
          </div>
        )}
      </Card>
      <Tabs label="Trend type" tabs={TABS} value={tab} onChange={setTab} />
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="grid gap-5">
        <p className="text-sm text-ink-3">Showing {fmtDate(from, { month: 'short', day: 'numeric', year: 'numeric' })} to {fmtDate(to, { month: 'short', day: 'numeric', year: 'numeric' })}</p>

        {tab === 'symptoms' && (symRows.length === 0 ? <EmptyState icon={<TrendingDown className="size-6" />} title="No check-ins in this range" /> : (
          <>
            <Card>
              <CardTitle eyebrow="Daily symptoms (0 to 10)" />
              <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Symptoms shown">
                {SYMPTOMS.map(s => (
                  <button key={s.key} aria-pressed={visible[s.key]} onClick={() => setVisible(v => ({ ...v, [s.key]: !v[s.key] }))}
                    className={cn('inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-sm font-semibold', visible[s.key] ? 'border-transparent bg-ink text-white' : 'border-line bg-white text-ink-2')}>
                    <span className="size-2.5 rounded-full" style={{ background: COLORS[s.key] }} aria-hidden />{s.label}
                  </button>
                ))}
              </div>
              <div className="h-72" role="img" aria-label={`Daily symptom scores from ${fmtDate(from)} to ${fmtDate(to)}. Table below.`}>
                <ResponsiveContainer>
                  <LineChart data={symRows} margin={{ left: -20, right: 8, top: 8 }}>
                    <CartesianGrid stroke="#EEF2F1" vertical={false} /><XAxis dataKey="d" fontSize={11} minTickGap={20} /><YAxis domain={[0, 10]} fontSize={11} />
                    <Tooltip />
                    {flares.map(f => <ReferenceArea key={f.id} x1={fmtDate(f.date)} x2={fmtDate(f.date)} stroke="#F28B6B" strokeOpacity={0.6} />)}
                    {SYMPTOMS.filter(s => visible[s.key]).map(s => <Line key={s.key} dataKey={s.key} name={s.label} stroke={COLORS[s.key]} strokeWidth={2} dot={false} />)}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-ink-3">Higher is worse, except sleep quality and mood. Orange lines mark logged flares.</p>
              <TextAlternative><DataTable caption="Daily symptoms" head={['Date', ...SYMPTOMS.map(s => s.label)]} rows={symRows.map(r => [r.d, ...SYMPTOMS.map(s => r[s.key])])} /></TextAlternative>
            </Card>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {SYMPTOMS.slice(0, 4).map(s => {
                const half = Math.floor(symRows.length / 2);
                const a = symRows.slice(0, half).reduce((t, r) => t + r[s.key], 0) / (half || 1);
                const b = symRows.slice(half).reduce((t, r) => t + r[s.key], 0) / ((symRows.length - half) || 1);
                const better = s.higherIsBetter ? b > a : b < a;
                return (
                  <div key={s.key} className="card p-4">
                    <p className="text-xs font-semibold text-ink-3">{s.label}</p>
                    <p className="flex items-center gap-1 text-xl font-extrabold">{b.toFixed(1)} {Math.abs(b - a) >= 0.3 && (better ? <TrendingDown className="size-5 text-brand" aria-label="improving" /> : <TrendingUp className="size-5 text-[#D9733A]" aria-label="worsening" />)}</p>
                    <p className="text-xs text-ink-3">vs {a.toFixed(1)} earlier in range</p>
                  </div>
                );
              })}
            </div>
          </>
        ))}

        {tab === 'activity' && (
          <Card>
            <CardTitle eyebrow="RAPID3 · weekly" action={<Badge tone="violet">Demo scoring</Badge>} />
            {r3Rows.length === 0 ? <EmptyState icon={<TrendingDown className="size-6" />} title="No RAPID3 scores in this range">Try 90 days, or complete a weekly RAPID3 in your check-in.</EmptyState> : (
              <>
                <p className="mb-2"><span className="text-4xl font-extrabold">{r3Rows[r3Rows.length - 1].total}</span> <span className="font-bold text-brand-700">{rapid3Category(r3Rows[r3Rows.length - 1].total)}</span>{r3Rows.length > 1 && <span className="ml-2 text-sm text-ink-3">from {r3Rows[0].total} on {r3Rows[0].d}</span>}</p>
                <div className="h-72" role="img" aria-label={`RAPID3 weekly scores: ${r3Rows.map(r => `${r.d} ${r.total}`).join(', ')}`}>
                  <ResponsiveContainer>
                    <ComposedChart data={r3Rows} margin={{ left: -16, right: 12, top: 8 }}>
                      {RAPID3_BANDS.map(b => <ReferenceArea key={b.label} y1={b.from} y2={Math.min(b.to, r3Max)} fill={b.color} fillOpacity={1} ifOverflow="hidden" />)}
                      <CartesianGrid stroke="#ffffff" vertical={false} />
                      <XAxis dataKey="d" fontSize={11} /><YAxis domain={[0, r3Max]} ticks={[0, 3, 6, 12, r3Max]} fontSize={11} />
                      <Tooltip formatter={fmtTip((v: number) => [`${v} (${rapid3Category(v)})`, 'RAPID3'])} />
                      <Area dataKey="total" stroke="none" fill="#14806F" fillOpacity={0.12} />
                      <Line dataKey="total" stroke="#0D6556" strokeWidth={2.5} dot={{ r: 4 }} name="RAPID3" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold text-ink-2">{RAPID3_BANDS.map(b => <span key={b.label} className="inline-flex items-center gap-1"><span className="size-3 rounded border border-line" style={{ background: b.color }} aria-hidden />{b.label} {b.label === 'Remission' ? '≤ 3' : b.label === 'High' ? '> 12' : `> ${b.from} to ${b.to}`}</span>)}</div>
                <p className="mt-2 text-xs text-ink-3">Bands follow the published RAPID3 cut-offs. Function uses one 0 to 10 item in this prototype instead of the 10-item MDHAQ, so totals are a demonstration. Labs are shown under Biomarkers, not on this axis.</p>
                <TextAlternative><DataTable caption="RAPID3 weekly" head={['Week of', 'Function', 'Pain', 'Global', 'Total', 'Category']} rows={r3Rows.map(r => [r.d, r.fn, r.pain, r.global, r.total, rapid3Category(r.total)])} /></TextAlternative>
              </>
            )}
            {data.hbi.length > 0 && <p className="mt-4 text-sm">Harvey-Bradshaw (partial): {data.hbi.filter(h => inR(h.date)).map(h => `${fmtDate(h.date)} ${h.score}`).join(', ') || 'none in range'}.</p>}
          </Card>
        )}

        {tab === 'sleep' && (!data.consent.health ? <EmptyState icon={<TrendingDown className="size-6" />} title="Wearable data is off"><Link to="/settings#consent" className="font-semibold text-brand-700 underline">Turn it on in Settings</Link></EmptyState> : (
          <Card>
            <CardTitle eyebrow="Sleep (synthetic wearable data) and sleep-quality rating" />
            <div className="h-72" role="img" aria-label={`Sleep hours and sleep quality from ${fmtDate(from)} to ${fmtDate(to)}. Table below.`}>
              <ResponsiveContainer>
                <ComposedChart data={wearRows.map(w => ({ ...w, q: data.symptoms.find(s => s.date === w.date)?.sleepQuality, late: ex.get(w.date)?.lateDinner ? w.sleepH : null }))} margin={{ left: -16, right: 8, top: 8 }}>
                  <CartesianGrid stroke="#EEF2F1" vertical={false} /><XAxis dataKey="d" fontSize={11} minTickGap={20} />
                  <YAxis yAxisId="h" domain={[4, 9.5]} fontSize={11} /><YAxis yAxisId="q" orientation="right" domain={[0, 10]} fontSize={11} />
                  <Tooltip /><Legend />
                  <Bar yAxisId="h" dataKey="sleepH" name="Sleep (hours)" fill="#C9D3F5" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="q" dataKey="q" name="Sleep quality (0-10)" stroke="#4B5BB5" strokeWidth={2} dot={false} />
                  {wearRows.filter(w => ex.get(w.date)?.lateDinner).map(w => <ReferenceDot key={w.date} yAxisId="h" x={w.d} y={w.sleepH} r={4} fill="#E2793C" stroke="none" />)}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-ink-3">Orange dots mark nights after dinners at or after 8 PM.</p>
            <TextAlternative><DataTable caption="Sleep" head={['Date', 'Sleep', 'HRV (ms)', 'Late dinner']} rows={wearRows.map(w => [w.d, fmtMinutes(w.sleepMin), w.hrv, ex.get(w.date)?.lateDinner ? 'Yes' : 'No'])} /></TextAlternative>
          </Card>
        ))}

        {tab === 'nutrition' && (exRows.length === 0 ? <EmptyState icon={<TrendingDown className="size-6" />} title="No meals in this range" /> : (
          <>
            <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
              <Card>
                <CardTitle eyebrow="Diet pattern summary" />
                {[['Mediterranean-pattern days', exRows.filter(e => e.mediterraneanDay).length, 'linear-gradient(90deg,#14806F,#3CC9A6)'], ['High added-sugar days (over 40 g)', exRows.filter(e => e.highSugar).length, '#E2793C'],
                  ['Dinners at or after 8 PM', exRows.filter(e => e.lateDinner).length, '#4B5BB5'], ['Days with dairy', exRows.filter(e => e.dairy).length, '#B4AE52']].map(([l, n, c]) => (
                  <div key={l as string} className="mb-3">
                    <div className="mb-1 flex justify-between text-sm"><span>{l as string}</span><b>{n as number} of {exRows.length}</b></div>
                    <Progress value={((n as number) / exRows.length) * 100} color={c as string} label={l as string} />
                  </div>
                ))}
                <div className="mb-1 flex justify-between text-sm"><span>Average ultra-processed share of calories</span><b>{Math.round(exRows.reduce((s, e) => s + e.upf, 0) / exRows.length)}%</b></div>
                <Progress value={exRows.reduce((s, e) => s + e.upf, 0) / exRows.length} color="#E2793C" label="Ultra-processed share" />
                <p className="mt-3 text-xs text-ink-3">Exact pattern scores are to be chosen with the clinical advisor.</p>
              </Card>
              <Card>
                <CardTitle eyebrow="Added sugar and fiber per day (estimated grams)" />
                <div className="h-64" role="img" aria-label="Added sugar and fiber per day. Table below.">
                  <ResponsiveContainer>
                    <BarChart data={exRows} margin={{ left: -16, right: 8, top: 8 }}>
                      <CartesianGrid stroke="#EEF2F1" vertical={false} /><XAxis dataKey="d" fontSize={11} minTickGap={20} /><YAxis fontSize={11} /><Tooltip formatter={fmtTip((v: number) => `${Math.round(v)} g`)} /><Legend />
                      <Bar dataKey="addedSugar" name="Added sugar" fill="#E2793C" radius={[4, 4, 0, 0]} /><Bar dataKey="fiber" name="Fiber" fill="#14806F" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <TextAlternative><DataTable caption="Daily nutrition" head={['Date', 'kcal', 'Added sugar (g)', 'Fiber (g)', 'Ultra-processed %']} rows={exRows.map(e => [e.d, Math.round(e.kcal), Math.round(e.addedSugar), Math.round(e.fiber), `${e.upf}%`])} /></TextAlternative>
              </Card>
            </div>
          </>
        ))}

        {tab === 'meals' && (
          <Card>
            <CardTitle eyebrow={`Meal history · ${meals.length} meals`} action={<Link to="/log" className="text-sm font-semibold text-brand-700 hover:underline">Edit in Log</Link>} />
            {meals.length === 0 ? <EmptyState icon={<TrendingDown className="size-6" />} title="No meals in this range" /> : (
              <div className="max-h-[560px] divide-y divide-line overflow-y-auto">{meals.slice(0, 150).map(m => <div key={m.id}><p className="px-2 pt-2 text-xs font-semibold text-ink-3">{fmtDate(m.date, { weekday: 'short', month: 'short', day: 'numeric' })} · {Math.round(mealTotals(m.items).kcal)} kcal</p><MealRow meal={m} to={`/log/meal/edit/${m.id}`} /></div>)}</div>
            )}
          </Card>
        )}

        {tab === 'labs' && (
          <Card>
            <CardTitle eyebrow="Biomarker history" action={<Link to="/log/labs" className="text-sm font-semibold text-brand-700 hover:underline">Open Labs</Link>} />
            {(() => {
              const labs = data.labs.filter(l => inR(l.date)).sort((a, b) => a.date.localeCompare(b.date));
              if (!labs.length) return <EmptyState icon={<TrendingDown className="size-6" />} title="No lab results in this range">Try 90 days.</EmptyState>;
              const by = [...new Set(labs.map(l => l.analyte))];
              return (
                <div className="grid gap-4 md:grid-cols-2">
                  {by.map(a => {
                    const s = labs.filter(l => l.analyte === a);
                    return (
                      <div key={a} className="rounded-2xl bg-canvas p-4">
                        <p className="font-bold">{a}</p>
                        <p className="text-2xl font-extrabold">{s.map(x => x.value).join(' → ')} <span className="text-sm font-medium text-ink-3">{s[s.length - 1].unit}</span></p>
                        <p className="text-xs text-ink-3">{s.map(x => fmtDate(x.date)).join(' · ')} · report range {s[s.length - 1].refRange}</p>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </Card>
        )}

        {tab === 'flares' && (
          <Card>
            <CardTitle eyebrow="Flare history" action={<Link to="/log" className="text-sm font-semibold text-brand-700 hover:underline">Log a flare</Link>} />
            {flares.length === 0 ? <EmptyState icon={<Flame className="size-6" />} title="No flares in this range">Try 90 days.</EmptyState> : (
              <>
                <div className="h-48" role="img" aria-label={`Joint pain with flares marked: ${flares.map(f => `${fmtDate(f.date)} ${f.severity}`).join(', ')}`}>
                  <ResponsiveContainer>
                    <LineChart data={symRows} margin={{ left: -20, right: 8, top: 8 }}>
                      <CartesianGrid stroke="#EEF2F1" vertical={false} /><XAxis dataKey="d" fontSize={11} minTickGap={20} /><YAxis domain={[0, 10]} fontSize={11} /><Tooltip />
                      <Line dataKey="pain" name="Joint pain" stroke="#D9733A" strokeWidth={2} dot={false} />
                      {flares.map(f => { const p = data.symptoms.find(s => s.date === f.date)?.pain; return p != null ? <ReferenceDot key={f.id} x={fmtDate(f.date)} y={p} r={7} fill="#C84A30" stroke="#fff" strokeWidth={2} /> : null; })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <ul className="mt-3 divide-y divide-line">{flares.map(f => <li key={f.id} className="flex items-center gap-3 py-2"><Flame className="size-5 text-[#D9733A]" aria-hidden /><span><b>{fmtDate(f.date)}</b> · {f.severity} · <span className="text-ink-2">{f.note}</span></span></li>)}</ul>
              </>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
