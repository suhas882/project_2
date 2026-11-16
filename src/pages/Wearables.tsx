import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Moon, HeartPulse, Activity, Footprints, Smartphone, Watch } from 'lucide-react';
import { useStore, useToday } from '@/store/store';
import { addDays, fmtDate, fmtMinutes } from '@/lib/dates';
import { Card, CardTitle, DataTable, Notice, PageHeader, Stat, Tabs, TextAlternative, SimBadge, fmtTip } from '@/components/ui';

const RANGES = [{ id: '7', label: '7 days' }, { id: '30', label: '30 days' }, { id: '70', label: 'All 70 days' }] as const;

export default function Wearables() {
  const { data } = useStore();
  const today = useToday();
  const [r, setR] = useState<'7' | '30' | '70'>('30');
  const rows = useMemo(() => {
    const from = addDays(today, -Number(r));
    return data.wearables.filter(w => w.date >= from && w.date < today).map(w => ({ ...w, d: fmtDate(w.date), sleepH: +(w.sleepMin / 60).toFixed(2) }));
  }, [data.wearables, r, today]);
  const avg = (k: 'sleepMin' | 'rhr' | 'hrv' | 'steps') => rows.length ? rows.reduce((s, x) => s + x[k], 0) / rows.length : 0;

  if (!data.consent.health) {
    return (
      <div className="grid gap-5">
        <PageHeader title="Wearable data" />
        <Notice tone="warn" title="Wearable data is off">You turned off wearable health data in your consents. <Link to="/settings#consent" className="font-semibold underline">Turn it on in Settings</Link> to see sleep, heart rate, HRV and steps.</Notice>
      </div>
    );
  }
  const chart = (title: string, desc: string, el: React.ReactNode, table: (string | number)[][], head: string[]) => (
    <Card>
      <CardTitle eyebrow={title} />
      <div className="h-56" role="img" aria-label={desc}><ResponsiveContainer>{el as React.ReactElement}</ResponsiveContainer></div>
      <TextAlternative><DataTable caption={title} head={head} rows={table} /></TextAlternative>
    </Card>
  );
  return (
    <div className="grid gap-5">
      <PageHeader title="Wearable data" subtitle="Sleep, resting heart rate, heart rate variability and steps." actions={<SimBadge>Synthetic wearable data</SimBadge>} />
      <div className="grid gap-3 md:grid-cols-2">
        {[['Apple Health', 'iPhone and Apple Watch', Smartphone], ['Health Connect', 'Android', Watch]].map(([t, d, Icon]) => (
          <div key={t as string} className="card flex items-center gap-3 p-4">
            <span className="grid size-11 place-items-center rounded-xl bg-danger-50 text-danger"><Icon className="size-5" aria-hidden /></span>
            <span className="flex-1"><span className="block font-bold">{t as string} <span className="text-xs font-semibold text-ink-3">connection preview</span></span><span className="text-sm text-ink-3">{d as string} · read-only sleep, resting HR, HRV, steps</span></span>
            <span className="rounded-full bg-[#EDF1F0] px-3 py-1 text-xs font-bold text-ink-2">Mobile app only</span>
          </div>
        ))}
      </div>
      <Notice tone="sim">Browsers cannot read Apple Health or Health Connect. These charts use synthetic data. The Phase 2 mobile app will read daily totals after you grant permission on your phone.</Notice>
      <div className="max-w-md"><Tabs label="Date range" tabs={RANGES.map(x => ({ id: x.id, label: x.label }))} value={r} onChange={setR} /></div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Average sleep" value={fmtMinutes(avg('sleepMin'))} icon={<Moon className="size-5" aria-hidden />} tone="indigo" />
        <Stat label="Resting heart rate" value={`${Math.round(avg('rhr'))} bpm`} icon={<HeartPulse className="size-5" aria-hidden />} tone="red" />
        <Stat label="HRV (SDNN)" value={`${Math.round(avg('hrv'))} ms`} icon={<Activity className="size-5" aria-hidden />} tone="violet" />
        <Stat label="Daily steps" value={Math.round(avg('steps')).toLocaleString()} icon={<Footprints className="size-5" aria-hidden />} tone="teal" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {chart('Sleep duration (hours)', `Sleep hours per night, average ${fmtMinutes(avg('sleepMin'))}`,
          <AreaChart data={rows} margin={{ left: -16, right: 8 }}><CartesianGrid stroke="#EEF2F1" vertical={false} /><XAxis dataKey="d" fontSize={11} minTickGap={24} /><YAxis fontSize={11} domain={[5, 9]} /><Tooltip formatter={fmtTip((v: number) => [fmtMinutes(v * 60), 'Sleep'])} /><Area dataKey="sleepH" stroke="#4B5BB5" fill="#E8EBF8" strokeWidth={2} /></AreaChart>,
          rows.map(x => [x.d, fmtMinutes(x.sleepMin)]), ['Date', 'Sleep'])}
        {chart('Resting heart rate and HRV', `Resting heart rate average ${Math.round(avg('rhr'))} bpm and HRV average ${Math.round(avg('hrv'))} ms`,
          <LineChart data={rows} margin={{ left: -16, right: 8 }}><CartesianGrid stroke="#EEF2F1" vertical={false} /><XAxis dataKey="d" fontSize={11} minTickGap={24} /><YAxis fontSize={11} /><Tooltip /><Line dataKey="rhr" name="Resting HR (bpm)" stroke="#C84A30" strokeWidth={2} dot={false} /><Line dataKey="hrv" name="HRV (ms)" stroke="#6A4FD0" strokeWidth={2} dot={false} /></LineChart>,
          rows.map(x => [x.d, x.rhr, x.hrv]), ['Date', 'Resting HR (bpm)', 'HRV (ms)'])}
        {chart('Daily steps', `Daily steps, average ${Math.round(avg('steps'))}`,
          <BarChart data={rows} margin={{ left: -8, right: 8 }}><CartesianGrid stroke="#EEF2F1" vertical={false} /><XAxis dataKey="d" fontSize={11} minTickGap={24} /><YAxis fontSize={11} /><Tooltip formatter={fmtTip((v: number) => [v.toLocaleString(), 'Steps'])} /><Bar dataKey="steps" fill="#14806F" radius={[4, 4, 0, 0]} /></BarChart>,
          rows.map(x => [x.d, x.steps.toLocaleString()]), ['Date', 'Steps'])}
        <Card>
          <CardTitle eyebrow="How this data is used" />
          <ul className="grid gap-2 text-sm text-ink-2">
            <li>• Sleep, resting heart rate and HRV feed the 7-day flare outlook (prototype estimate).</li>
            <li>• Sleep is an outcome in personal insights, for example late dinners and sleep length.</li>
            <li>• Only daily totals are stored, as FHIR Observations with LOINC codes (sleep 93832-4, resting HR 40443-4, HRV 80404-7, steps 41950-7).</li>
            <li>• Raw minute-level data would stay on your phone.</li>
          </ul>
          <Link to="/flare" className="mt-3 inline-block font-semibold text-brand-700 underline">Open the flare outlook</Link>
        </Card>
      </div>
    </div>
  );
}
