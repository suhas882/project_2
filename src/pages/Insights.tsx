import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from 'recharts';
import { MessageCircle, FlaskConical, ChevronDown, Info, Sparkles } from 'lucide-react';
import { useInsights } from '@/store/derived';
import { useStore } from '@/store/store';
import { EXPOSURES, OUTCOMES, MIN_DAYS, MIN_EXPOSED, type Insight } from '@/services/analytics';
import { Button, ButtonLink, Card, DataTable, EmptyState, Notice, PageHeader, SimBadge, TextAlternative, cn, fmtTip } from '@/components/ui';
import { InsightBadge, fmtProb } from '@/components/health';

export default function Insights() {
  const insights = useInsights();
  const { data } = useStore();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [showAll, setShowAll] = useState(false);
  const main = insights.filter(i => i.label === 'Likely' || i.label === 'Possible');
  const notEnough = insights.filter(i => i.label === 'Not enough data');
  const unclear = insights.filter(i => i.label === 'No clear association');
  const synthDays = new Set(data.meals.filter(m => m.method === 'synthetic').map(m => m.date));
  const userDays = new Set(data.meals.filter(m => m.method !== 'synthetic' && !synthDays.has(m.date)).map(m => m.date)).size;
  const daysLabel = synthDays.size
    ? `From your ${synthDays.size}-day synthetic history${userDays ? ` plus ${userDays} day${userDays > 1 ? 's' : ''} you logged` : ''}`
    : `From ${userDays} day${userDays === 1 ? '' : 's'} of your logs`;

  return (
    <div className="grid gap-5">
      <PageHeader title="Your patterns" subtitle={daysLabel} actions={<ButtonLink to="/insights/ask" variant="insight" size="sm" icon={<MessageCircle className="size-4" />}>Ask Remitra</ButtonLink>} />
      <Notice tone="sim" title="Demo analysis on synthetic data">
        Patterns are computed live from the stored logs using a simple Bayesian comparison with shrinkage. It is not adjusted for sleep, stress or medication changes yet; the planned engine is a hierarchical model that is. Associations are not causes and not medical findings.
      </Notice>

      {main.length === 0 ? <EmptyState icon={<Sparkles className="size-6" />} title="No clear patterns yet">Keep logging. Insights need at least {MIN_DAYS} logged days.</EmptyState> : (
        <div className="grid gap-4 lg:grid-cols-2">
          {main.map(i => <InsightCard key={i.id} i={i} open={!!open[i.id]} toggle={() => setOpen(o => ({ ...o, [i.id]: !o[i.id] }))} />)}
        </div>
      )}

      {notEnough.length > 0 && (
        <section aria-labelledby="ne">
          <h2 id="ne" className="mb-2 text-sm font-bold uppercase tracking-[0.1em] text-brand-700">Not enough data yet</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {notEnough.map(i => (
              <Card key={i.id} as="article" className="p-4">
                <InsightBadge label={i.label} />
                <p className="mt-2 font-bold">{EXPOSURES[i.exposure].short}</p>
                <p className="text-sm text-ink-2">{i.detail} {i.nextStep}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="checked">
        <button className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.1em] text-brand-700" aria-expanded={showAll} aria-controls="checked-list" onClick={() => setShowAll(s => !s)}>
          <span id="checked">Also checked, no clear association ({unclear.length})</span><ChevronDown className={cn('size-4 transition', showAll && 'rotate-180')} aria-hidden />
        </button>
        {showAll && (
          <Card className="mt-2" id="checked-list">
            <DataTable caption="Exposures checked with no clear association" head={['Exposure', 'Outcome', 'Estimate', 'Probability']}
              rows={unclear.map(i => [EXPOSURES[i.exposure].short, OUTCOMES[i.outcome].label, `${i.effect >= 0 ? '+' : '−'}${Math.abs(i.effect).toFixed(i.outcome === 'sleepMin' ? 0 : 1)} ${OUTCOMES[i.outcome].unit}`, i.probability.toFixed(2)])} />
          </Card>
        )}
      </section>

      <Card>
        <h2 className="mb-2 flex items-center gap-2 font-bold"><Info className="size-5 text-brand" aria-hidden />How labels work</h2>
        <ul className="grid gap-1 text-sm text-ink-2">
          <li><b className="text-ink">Likely</b>: probability 0.80 or higher that the effect is bigger than a small, meaningful amount.</li>
          <li><b className="text-ink">Possible</b>: probability 0.60 to 0.79 [est.]. More logging will firm it up or rule it out.</li>
          <li><b className="text-ink">Not enough data</b>: fewer than {MIN_DAYS} logged days, or the food present on fewer than {MIN_EXPOSED} days or absent on fewer than {MIN_EXPOSED} days.</li>
          <li>Lags checked: the same day and 1 to 2 days later. A penalty is applied for checking several lags so chance findings are less likely.</li>
        </ul>
      </Card>
    </div>
  );
}

function InsightCard({ i, open, toggle }: { i: Insight; open: boolean; toggle: () => void }) {
  const O = OUTCOMES[i.outcome];
  const lagData = i.lags.slice(0, 3).map(l => ({ name: l.lag === 0 ? 'Same day' : `+${l.lag} day${l.lag > 1 ? 's' : ''}`, v: +l.diff.toFixed(i.outcome === 'sleepMin' ? 0 : 2), hot: i.window.includes(l.lag) }));
  const worse = !i.favorable;
  return (
    <Card as="article" className="grid gap-3">
      <div className="flex items-center justify-between"><InsightBadge label={i.label} /><span className="text-sm text-ink-3">probability <b className="text-base text-ink">{fmtProb(i.probability)}</b></span></div>
      <h2 className="text-lg font-extrabold leading-snug">{i.sentence}</h2>
      <p className="text-sm text-ink-2">{i.detail}</p>
      <div className="h-36" role="img" aria-label={`Difference in ${O.label} by lag: ${lagData.map(l => `${l.name} ${l.v} ${O.unit}`).join(', ')}`}>
        <ResponsiveContainer>
          <BarChart data={lagData} margin={{ left: -20, right: 4, top: 6 }}>
            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis fontSize={11} tickLine={false} axisLine={false} />
            <ReferenceLine y={0} stroke="#C9D4D1" />
            <Tooltip formatter={fmtTip((v: number) => [`${v > 0 ? '+' : ''}${v} ${O.unit}`, `Difference in ${O.label}`])} />
            <Bar dataKey="v" radius={[6, 6, 6, 6]}>{lagData.map((d, k) => <Cell key={k} fill={d.hot ? (worse ? '#E2793C' : '#14806F') : '#D7E0DE'} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <TextAlternative summary="Show lag data as a table">
        <DataTable caption="Difference by lag" head={['Lag', `Difference (${O.unit})`, 'Exposed days', 'Other days']} rows={i.lags.slice(0, 3).map(l => [l.lag === 0 ? 'Same day' : `${l.lag} day(s) later`, l.diff.toFixed(2), l.n1, l.n0])} />
      </TextAlternative>
      <p className="rounded-xl bg-canvas p-3 text-sm"><b>Next step:</b> {i.nextStep}</p>
      {open && (
        <div className="rounded-xl bg-[#F6F9F8] p-3 text-sm leading-relaxed text-ink-2">
          <p>Compared {O.label} {i.lagText} {EXPOSURES[i.exposure].label} with all other logged days. Found on {i.nExposedDays} of {i.nDays} logged days.</p>
          <p className="mt-1">Method: difference in means, shrunk toward zero with a normal prior (sd {O.prior} {O.unit}); probability that the true effect exceeds {O.minimal} {O.unit}. <SimBadge>Not adjusted for confounders</SimBadge></p>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {i.label === 'Likely' && EXPOSURES[i.exposure].testable && worse && <ButtonLink to={`/insights/test-it?exposure=${i.exposure}&outcome=${i.outcome}`} icon={<FlaskConical className="size-4" />} className="flex-1">Test it</ButtonLink>}
        <Button variant="secondary" className="flex-1" aria-expanded={open} onClick={toggle}>{open ? 'Hide details' : 'Why we think so'}</Button>
      </div>
      <Link to="/insights/ask" className="sr-only">Ask Remitra about this pattern</Link>
    </Card>
  );
}
