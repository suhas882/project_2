import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, TestTube2, Pill, Flame, ChevronRight, Search, Trash2, Pencil, UtensilsCrossed } from 'lucide-react';
import { useStore, useToday } from '@/store/store';
import { fmtDate, fmtLong } from '@/lib/dates';
import { mealTotals } from '@/data/foods';
import { Button, Card, CardTitle, EmptyState, Field, Input, Modal, PageHeader, Select, Textarea, cn, useToast } from '@/components/ui';
import { MealRow, QUICK_LOG } from '@/components/health';
import type { FlareEvent } from '@/types';

export default function Log() {
  const { data, deleteMeal, addFlare, deleteFlare } = useStore();
  const today = useToday();
  const nav = useNavigate();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [days, setDays] = useState(7);
  const [del, setDel] = useState<string | null>(null);
  const [flareOpen, setFlareOpen] = useState(false);
  const [flare, setFlare] = useState({ date: today, severity: 'mild' as FlareEvent['severity'], note: '' });
  const [flareErr, setFlareErr] = useState('');

  const groups = useMemo(() => {
    const term = q.trim().toLowerCase();
    const meals = data.meals.filter(m => !term || m.items.some(i => i.name.toLowerCase().includes(term)) || m.slot.toLowerCase().includes(term));
    const byDate = new Map<string, typeof meals>();
    [...meals].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)).forEach(m => (byDate.get(m.date) ?? byDate.set(m.date, []).get(m.date)!).push(m));
    return [...byDate.entries()];
  }, [data.meals, q]);
  const shown = groups.slice(0, days);
  const quick = (mode: string) => mode === 'repeat' ? nav('/log/meal/repeat') : nav(`/log/meal/${mode}`);

  const saveFlare = () => {
    if (!flare.date || flare.date > today) return setFlareErr('Choose a date that is today or earlier.');
    addFlare({ ...flare, note: flare.note.trim() || 'No note', source: 'user' });
    setFlareOpen(false); setFlareErr(''); setFlare({ date: today, severity: 'mild', note: '' });
    toast('Flare logged. It now appears in Trends and your report.');
  };

  return (
    <div className="grid gap-5">
      <PageHeader title="Log" subtitle="Meals, symptoms, labs, medications and flares." />
      <section aria-labelledby="log-meal">
        <h2 id="log-meal" className="mb-2 text-sm font-bold uppercase tracking-[0.1em] text-brand-700">Log a meal</h2>
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {QUICK_LOG.map(q => (
            <button key={q.mode} onClick={() => quick(q.mode)} className="card grid min-h-24 min-w-0 content-center justify-items-center gap-2 px-1 py-2 text-[12px] font-bold transition hover:-translate-y-0.5 sm:text-sm">
              <span className={cn('grid size-10 place-items-center rounded-xl sm:size-11', q.tone)}><q.icon className="size-5" aria-hidden /></span>{q.label}
            </button>
          ))}
        </div>
      </section>
      <section aria-label="Other logs" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[['/log/checkin', 'Symptoms check-in', data.symptoms.some(s => s.date === today) ? 'Done today · edit' : 'About 60 seconds', Activity, 'bg-brand-50 text-brand'],
          ['/log/labs', 'Lab results', `${data.labs.length} saved`, TestTube2, 'bg-sleep-50 text-sleep'],
          ['/log/meds', 'Medications and supplements', `${data.medications.length} logged as exposures`, Pill, 'bg-insight-50 text-insight']].map(([to, t, d, Icon, tone]) => (
          <Link key={to as string} to={to as string} className="card flex items-center gap-3 p-4 transition hover:-translate-y-0.5">
            <span className={cn('grid size-11 shrink-0 place-items-center rounded-xl', tone as string)}><Icon className="size-5" aria-hidden /></span>
            <span className="min-w-0 flex-1"><span className="block font-bold">{t as string}</span><span className="text-sm text-ink-3">{d as string}</span></span><ChevronRight className="size-5 text-ink-3" aria-hidden />
          </Link>
        ))}
        <button onClick={() => setFlareOpen(true)} className="card flex items-center gap-3 p-4 text-left transition hover:-translate-y-0.5">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-danger-50 text-danger"><Flame className="size-5" aria-hidden /></span>
          <span className="min-w-0 flex-1"><span className="block font-bold">Log a flare</span><span className="text-sm text-ink-3">{data.flares.length} logged</span></span><ChevronRight className="size-5 text-ink-3" aria-hidden />
        </button>
      </section>

      <Card>
        <CardTitle eyebrow="Meal history" action={<span className="text-sm text-ink-3">{data.meals.length} meals</span>} />
        <div className="mb-3 max-w-sm">
          <label htmlFor="mq" className="sr-only">Search meals</label>
          <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden /><Input id="mq" className="pl-9" placeholder="Search meals or foods" value={q} onChange={e => setQ(e.target.value)} /></div>
        </div>
        {!shown.length ? <EmptyState icon={<UtensilsCrossed className="size-6" />} title={q ? 'No meals match your search' : 'No meals yet'}>{q ? 'Try another food name.' : 'Log your first meal above.'}</EmptyState> : (
          <div className="grid gap-4">
            {shown.map(([date, meals]) => (
              <div key={date}>
                <h3 className="mb-1 flex items-baseline justify-between text-sm font-bold text-ink-2"><span>{date === today ? 'Today' : fmtLong(date)}</span><span className="font-medium text-ink-3">{Math.round(mealTotals(meals.flatMap(m => m.items)).kcal)} kcal</span></h3>
                <ul className="divide-y divide-line rounded-2xl bg-canvas/60">
                  {meals.map(m => (
                    <li key={m.id} className="flex items-center gap-1 pr-2">
                      <div className="min-w-0 flex-1"><MealRow meal={m} to={`/log/meal/edit/${m.id}`} /></div>
                      <Link to={`/log/meal/edit/${m.id}`} className="grid size-10 place-items-center rounded-xl text-ink-3 hover:bg-white hover:text-brand-700" aria-label={`Edit ${m.slot.toLowerCase()} on ${fmtDate(m.date)}`}><Pencil className="size-4" /></Link>
                      <button onClick={() => setDel(m.id)} className="grid size-10 place-items-center rounded-xl text-ink-3 hover:bg-danger-50 hover:text-danger" aria-label={`Delete ${m.slot.toLowerCase()} on ${fmtDate(m.date)}`}><Trash2 className="size-4" /></button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {groups.length > days && <Button variant="secondary" onClick={() => setDays(d => d + 14)}>Show more days ({groups.length - days} more)</Button>}
          </div>
        )}
      </Card>

      {data.flares.length > 0 && (
        <Card>
          <CardTitle eyebrow="Flares" />
          <ul className="divide-y divide-line">
            {[...data.flares].reverse().map(f => (
              <li key={f.id} className="flex items-center gap-3 py-2.5">
                <Flame className={cn('size-5', f.severity === 'severe' ? 'text-danger' : 'text-[#D9733A]')} aria-hidden />
                <span className="flex-1"><span className="font-semibold">{fmtDate(f.date)} · {f.severity}</span><span className="block text-sm text-ink-3">{f.note}{f.source === 'synthetic' ? ' (synthetic)' : ''}</span></span>
                <button onClick={() => { deleteFlare(f.id); toast('Flare removed.'); }} className="grid size-10 place-items-center rounded-xl text-ink-3 hover:bg-danger-50 hover:text-danger" aria-label={`Delete flare on ${fmtDate(f.date)}`}><Trash2 className="size-4" /></button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Modal open={!!del} onClose={() => setDel(null)} title="Delete this meal?"
        footer={<><Button variant="secondary" onClick={() => setDel(null)}>Cancel</Button><Button variant="danger" onClick={() => { if (del) deleteMeal(del); setDel(null); toast('Meal deleted.'); }}>Delete meal</Button></>}>
        <p className="text-ink-2">The meal is removed from your log, insights and reports.</p>
      </Modal>
      <Modal open={flareOpen} onClose={() => setFlareOpen(false)} title="Log a flare"
        footer={<><Button variant="secondary" onClick={() => setFlareOpen(false)}>Cancel</Button><Button onClick={saveFlare}>Save flare</Button></>}>
        <div className="grid gap-3">
          <Field label="Date" error={flareErr}>{p => <Input {...p} type="date" max={today} value={flare.date} onChange={e => setFlare(f => ({ ...f, date: e.target.value }))} />}</Field>
          <Field label="How bad?">{p => <Select {...p} value={flare.severity} onChange={e => setFlare(f => ({ ...f, severity: e.target.value as FlareEvent['severity'] }))}><option value="mild">Mild</option><option value="moderate">Moderate</option><option value="severe">Severe</option></Select>}</Field>
          <Field label="Note (optional)">{p => <Textarea {...p} rows={2} maxLength={200} value={flare.note} onChange={e => setFlare(f => ({ ...f, note: e.target.value }))} placeholder="Which joints, how long stiffness lasted…" />}</Field>
          <p className="text-sm text-ink-3">If symptoms are severe or new, contact your care team.</p>
        </div>
      </Modal>
    </div>
  );
}
