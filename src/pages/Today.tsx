import { Link, useNavigate } from 'react-router-dom';
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { CheckCircle2, ChevronRight, Moon, Footprints, HeartPulse, MessageCircle, FlaskConical, FileText, TestTube2, Sparkles, Activity } from 'lucide-react';
import { useStore, useToday } from '@/store/store';
import { useFlare, useInsights } from '@/store/derived';
import { addDays, fmtDate, fmtLong, fmtMinutes } from '@/lib/dates';
import { rapid3Category } from '@/lib/scoring';
import { checkinPlan } from '@/lib/checkinPlan';
import { Card, CardTitle, DemoBadge, Stat, cn, ButtonLink, useToast, EmptyState, fmtTip } from '@/components/ui';
import { FlareRing, InsightBadge, MealRow, QUICK_LOG, fmtProb } from '@/components/health';

export default function Today() {
  const { data } = useStore();
  const today = useToday();
  const nav = useNavigate();
  const toast = useToast();
  const flare = useFlare();
  const insights = useInsights().filter(i => i.label === 'Likely' || i.label === 'Possible').slice(0, 2);
  const yesterday = addDays(today, -1);
  const checkinToday = data.symptoms.find(s => s.date === today);
  const lastSym = checkinToday ?? data.symptoms.find(s => s.date === yesterday);
  const lastNight = data.wearables.find(w => w.date === today) ?? data.wearables.find(w => w.date === yesterday);
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 7));
  const wear7 = week.map(d => data.wearables.find(w => w.date === d)).filter(Boolean) as typeof data.wearables;
  const r3 = data.rapid3[data.rapid3.length - 1];
  const plan = checkinPlan(data, today);
  const recentPain = data.symptoms.filter(x => x.date >= addDays(today, -28) && x.date <= today).map(x => x.pain);
  const pain28 = recentPain.length ? recentPain.reduce((a, b) => a + b, 0) / recentPain.length : null;
  const mealsToday = data.meals.filter(m => m.date === today).sort((a, b) => a.time.localeCompare(b.time));
  const mealsShown = mealsToday.length ? mealsToday : data.meals.filter(m => m.date === yesterday).sort((a, b) => a.time.localeCompare(b.time));
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const quick = (mode: string) => {
    if (mode === 'repeat') {
      const last = [...data.meals].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))[0];
      if (!last) return toast('No previous meal to repeat.', 'warn');
      nav(`/log/meal/repeat?from=${last.id}`);
      return;
    }
    nav(`/log/meal/${mode}`);
  };

  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-ink-2">{fmtLong(today)}</p>
          <h1 className="text-3xl font-extrabold tracking-tight">{greet}, {data.profile.name}</h1>
          <p className="mt-1 text-ink-2">Here's your health overview for today.</p>
        </div>
        <DemoBadge />
      </header>

      <div className="grid gap-5 lg:grid-cols-3">
        <Link to="/flare" className="on-dark group flex items-center gap-5 rounded-[22px] bg-gradient-to-br from-[#0F7464] to-[#0B4E5E] p-5 text-white shadow-[var(--shadow-lift)] lg:col-span-2">
          <FlareRing p={flare.probability} level={flare.level} dark />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold tracking-[0.1em] text-[#BFEFE2]">7-DAY FLARE OUTLOOK</p>
            <p className="mt-1 text-lg font-bold leading-snug">{flare.headline}</p>
            <p className="mt-1 text-sm text-[#BFE0DA]">Prototype estimate based on synthetic data</p>
          </div>
          <ChevronRight className="size-6 shrink-0 opacity-70 transition group-hover:translate-x-1" aria-hidden />
        </Link>
        <Card className="flex flex-col justify-between">
          {checkinToday ? (
            <>
              <div className="flex items-center gap-3"><CheckCircle2 className="size-8 text-brand" aria-hidden /><div><p className="font-bold">Check-in done</p><p className="text-sm text-ink-2">Pain {checkinToday.pain} · Fatigue {checkinToday.fatigue} · Sleep {checkinToday.sleepQuality}</p></div></div>
              <ButtonLink to="/log/checkin" variant="secondary" size="sm" className="mt-4">Edit today's answers</ButtonLink>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3"><Activity className="size-8 text-brand" aria-hidden /><div><p className="font-bold">Daily check-in</p><p className="text-sm text-ink-2">About 60 seconds{plan.summary ? `, plus ${plan.summary}` : ''}</p></div></div>
              <ButtonLink to="/log/checkin" className="mt-4">Start check-in</ButtonLink>
            </>
          )}
        </Card>
      </div>

      <section aria-labelledby="quick-log">
        <h2 id="quick-log" className="mb-2 text-sm font-bold uppercase tracking-[0.1em] text-brand-700">Log a meal</h2>
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {QUICK_LOG.map(q => (
            <button key={q.mode} onClick={() => quick(q.mode)} className="card grid min-h-24 min-w-0 content-center justify-items-center gap-2 px-1 py-2 text-[12px] font-bold transition hover:-translate-y-0.5 sm:text-sm">
              <span className={cn('grid size-10 place-items-center rounded-xl sm:size-11', q.tone)}><q.icon className="size-5" aria-hidden /></span>{q.label}
            </button>
          ))}
        </div>
      </section>

      <section aria-label="Today's overview" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={checkinToday ? 'Joint pain today' : 'Joint pain yesterday'} value={lastSym ? `${lastSym.pain} / 10` : '—'} sub={pain28 != null ? `28-day average ${pain28.toFixed(1)}` : undefined} icon={<Activity className="size-5" aria-hidden />} tone="amber" />
        {data.consent.health ? <>
          <Stat label="Last night's sleep" value={lastNight ? fmtMinutes(lastNight.sleepMin) : '—'} icon={<Moon className="size-5" aria-hidden />} tone="indigo" />
          <Stat label="Steps yesterday" value={lastNight ? lastNight.steps.toLocaleString() : '—'} icon={<Footprints className="size-5" aria-hidden />} tone="teal" />
        </> : <Stat label="Wearable data" value="Off" sub="Turn on in Settings" icon={<HeartPulse className="size-5" aria-hidden />} tone="gray" />}
        <Stat label="RAPID3 (latest)" value={r3 ? `${r3.total}` : '—'} sub={r3 ? `${rapid3Category(r3.total)} · ${fmtDate(r3.date)}` : undefined} icon={<Sparkles className="size-5" aria-hidden />} tone="violet" />
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardTitle eyebrow={mealsToday.length ? 'Meals today' : 'Yesterday\'s meals'} action={<Link to="/log" className="text-sm font-semibold text-brand-700 hover:underline">All meals</Link>} />
          {mealsShown.length ? <div className="-mx-2 divide-y divide-line">{mealsShown.map(m => <MealRow key={m.id} meal={m} to={`/log/meal/edit/${m.id}`} />)}</div>
            : <EmptyState icon={<Sparkles className="size-6" />} title="No meals logged yet">Use the buttons above to log your first meal.</EmptyState>}
        </Card>
        <Card>
          <CardTitle eyebrow="Latest insights" action={<Link to="/insights" className="text-sm font-semibold text-brand-700 hover:underline">All insights</Link>} />
          {insights.length ? (
            <ul className="grid gap-3">
              {insights.map(i => (
                <li key={i.id} className="rounded-2xl bg-canvas p-4">
                  <div className="mb-1 flex items-center justify-between"><InsightBadge label={i.label} /><span className="text-xs text-ink-3">probability <b className="text-ink">{fmtProb(i.probability)}</b></span></div>
                  <p className="font-semibold">{i.sentence}</p>
                </li>
              ))}
            </ul>
          ) : <EmptyState icon={<Sparkles className="size-6" />} title="No patterns yet">Insights appear after at least 14 logged days.</EmptyState>}
          <p className="mt-3 text-xs text-ink-3">Associations in your synthetic demo data, not medical findings.</p>
        </Card>
      </div>

      {data.consent.health && wear7.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardTitle eyebrow="Sleep summary · last 7 nights" action={<Link to="/wearables" className="text-sm font-semibold text-brand-700 hover:underline">Details</Link>} />
            <p className="text-2xl font-extrabold">{fmtMinutes(wear7.reduce((s, w) => s + w.sleepMin, 0) / wear7.length)} <span className="text-sm font-medium text-ink-3">average · HRV {Math.round(wear7.reduce((s, w) => s + w.hrv, 0) / wear7.length)} ms</span></p>
            <div className="h-28" role="img" aria-label={`Sleep minutes over 7 nights: ${wear7.map(w => w.sleepMin).join(', ')}`}>
              <ResponsiveContainer><LineChart data={wear7.map(w => ({ d: fmtDate(w.date, { weekday: 'short' }), v: w.sleepMin }))}><XAxis dataKey="d" tickLine={false} axisLine={false} fontSize={12} /><Tooltip formatter={fmtTip((v: number) => [fmtMinutes(v), 'Sleep'])} /><Line type="monotone" dataKey="v" stroke="#4B5BB5" strokeWidth={2.5} dot={{ r: 3 }} /></LineChart></ResponsiveContainer>
            </div>
          </Card>
          <Card>
            <CardTitle eyebrow="Activity · last 7 days" action={<Link to="/wearables" className="text-sm font-semibold text-brand-700 hover:underline">Details</Link>} />
            <p className="text-2xl font-extrabold">{Math.round(wear7.reduce((s, w) => s + w.steps, 0) / wear7.length).toLocaleString()} <span className="text-sm font-medium text-ink-3">steps a day · resting HR {Math.round(wear7.reduce((s, w) => s + w.rhr, 0) / wear7.length)} bpm</span></p>
            <div className="h-28" role="img" aria-label={`Steps over 7 days: ${wear7.map(w => w.steps).join(', ')}`}>
              <ResponsiveContainer><BarChart data={wear7.map(w => ({ d: fmtDate(w.date, { weekday: 'short' }), v: w.steps }))}><XAxis dataKey="d" tickLine={false} axisLine={false} fontSize={12} /><Tooltip formatter={fmtTip((v: number) => [v.toLocaleString(), 'Steps'])} /><Bar dataKey="v" fill="#14806F" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      <section aria-labelledby="qa">
        <h2 id="qa" className="mb-2 text-sm font-bold uppercase tracking-[0.1em] text-brand-700">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[['/insights/ask', 'Ask Remitra', 'Questions about your data', MessageCircle, 'bg-insight-50 text-insight'], ['/insights/test-it', 'Test It', 'Guided experiment', FlaskConical, 'bg-brand-50 text-brand'],
            ['/care', 'Care team report', 'PDF or FHIR', FileText, 'bg-sleep-50 text-sleep'], ['/log/labs', 'Add lab results', 'CRP, ESR and more', TestTube2, 'bg-warn-50 text-[#C46A12]']].map(([to, t, d, Icon, tone]) => (
            <Link key={to as string} to={to as string} className="card flex items-center gap-3 p-4 transition hover:-translate-y-0.5">
              <span className={cn('grid size-11 shrink-0 place-items-center rounded-xl', tone as string)}><Icon className="size-5" aria-hidden /></span>
              <span><span className="block font-bold">{t as string}</span><span className="text-sm text-ink-3">{d as string}</span></span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
