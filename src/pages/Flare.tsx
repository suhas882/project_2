import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { useFlare } from '@/store/derived';
import { useStore } from '@/store/store';
import { fmtDate } from '@/lib/dates';
import { Card, CardTitle, DataTable, Notice, PageHeader, SimBadge, TextAlternative, fmtTip } from '@/components/ui';
import { FlareRing } from '@/components/health';

const color = (p: number) => (p < 0.2 ? '#14806F' : p < 0.4 ? '#D6A23E' : '#D45E36');

export default function Flare() {
  const f = useFlare();
  const { data } = useStore();
  const hist = f.history.map(h => ({ ...h, d: fmtDate(h.date), pct: Math.round(h.p * 100) }));
  const days = f.days.map(d => ({ ...d, d: fmtDate(d.date, { weekday: 'short', day: 'numeric' }), pct: Math.round(d.p * 100) }));
  return (
    <div className="grid gap-5">
      <PageHeader title="7-day flare outlook" subtitle="How your recent signals compare with your own baseline." actions={<SimBadge>Prototype estimate</SimBadge>} />
      <Notice tone="sim" title="Prototype estimate based on synthetic data">A hand-set score over your last 7 days compared with your last 28. It has not been trained or validated and is not a medical prediction. Target outcomes are to be validated during discovery.</Notice>
      <div className="grid gap-5 lg:grid-cols-[1fr_1.5fr]">
        <div className="on-dark flex items-center gap-5 rounded-[22px] bg-gradient-to-br from-[#0F7464] to-[#0B4E5E] p-6 text-white shadow-[var(--shadow-lift)]">
          <FlareRing p={f.probability} level={f.level} size={110} dark />
          <div>
            <p className="text-xs font-extrabold tracking-[0.1em] text-[#BFEFE2]">NEXT 7 DAYS</p>
            <p className="mt-1 text-xl font-bold leading-snug">{f.headline}</p>
            <p className="mt-1 text-sm text-[#BFE0DA]">Estimated chance of a flare: {Math.round(f.probability * 100)}%</p>
          </div>
        </div>
        <Card>
          <CardTitle eyebrow="Day by day" />
          <div className="h-44" role="img" aria-label={`Daily outlook: ${days.map(d => `${d.d} ${d.pct}%`).join(', ')}`}>
            <ResponsiveContainer><BarChart data={days} margin={{ left: -20, right: 4 }}>
              <CartesianGrid stroke="#EEF2F1" vertical={false} /><XAxis dataKey="d" fontSize={12} tickLine={false} /><YAxis domain={[0, 100]} unit="%" fontSize={11} /><Tooltip formatter={fmtTip((v: number) => [`${v}%`, 'Estimated chance'])} />
              <Bar dataKey="pct" radius={[6, 6, 0, 0]}>{days.map((d, i) => <Cell key={i} fill={color(d.p)} />)}</Bar>
            </BarChart></ResponsiveContainer>
          </div>
        </Card>
      </div>
      <Card>
        <CardTitle eyebrow="Contributing factors" />
        <ul className="divide-y divide-line">
          {[...f.factors].sort((a, b) => Math.abs(b.push) - Math.abs(a.push)).map(x => (
            <li key={x.label} className="flex items-center gap-3 py-3">
              <span className={`grid size-9 place-items-center rounded-xl ${x.push > 0.15 ? 'bg-warn-50 text-warn' : x.push < -0.15 ? 'bg-brand-50 text-brand' : 'bg-[#EDF1F0] text-ink-3'}`}>
                {x.push > 0.15 ? <ArrowUp className="size-4" aria-label="raises the estimate" /> : x.push < -0.15 ? <ArrowDown className="size-4" aria-label="lowers the estimate" /> : <Minus className="size-4" aria-label="little effect" />}
              </span>
              <span className="flex-1"><span className="block font-semibold">{x.label}</span><span className="text-sm text-ink-3">{x.detail}</span></span>
              <span className="tabular text-sm font-bold text-ink-2">{x.push >= 0 ? '+' : ''}{x.push.toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-ink-3">Numbers are each factor's push on the score (log-odds). Positive values raise the estimate.</p>
      </Card>
      <Card>
        <CardTitle eyebrow="Last 60 days: daily estimate and logged flares" />
        <div className="h-56" role="img" aria-label={`Daily estimate over 60 days, flares logged on ${data.flares.map(x => fmtDate(x.date)).join(', ') || 'no days'}`}>
          <ResponsiveContainer><AreaChart data={hist} margin={{ left: -20, right: 8, top: 10 }}>
            <CartesianGrid stroke="#EEF2F1" vertical={false} /><XAxis dataKey="d" fontSize={11} minTickGap={24} /><YAxis domain={[0, 100]} unit="%" fontSize={11} />
            <Tooltip formatter={fmtTip((v: number) => [`${v}%`, 'Estimate'])} />
            <Area dataKey="pct" stroke="#0D6556" fill="#E3F4F0" strokeWidth={2} />
            {hist.filter(h => h.flare).map(h => <ReferenceDot key={h.date} x={h.d} y={h.pct} r={7} fill="#C84A30" stroke="#fff" strokeWidth={2} />)}
          </AreaChart></ResponsiveContainer>
        </div>
        <p className="text-xs text-ink-3">Red dots are logged flares. In the synthetic data the estimate rises around past flares, which is the pattern a trained model would need to learn.</p>
        <TextAlternative><DataTable caption="Daily flare estimate" head={['Date', 'Estimate', 'Flare logged']} rows={hist.map(h => [h.d, `${h.pct}%`, h.flare ? 'Yes' : ''])} /></TextAlternative>
      </Card>
    </div>
  );
}
