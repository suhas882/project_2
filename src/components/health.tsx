/* Domain components shared across pages. */
import { Link } from 'react-router-dom';
import { Camera, Mic, ScanBarcode, Keyboard, Repeat, Flame } from 'lucide-react';
import type { Meal, DietTag } from '@/types';
import type { Insight } from '@/services/analytics';
import { mealTotals } from '@/data/foods';
import { fmtTime } from '@/lib/dates';
import { Badge, cn } from './ui';

export const tagTone = (t: DietTag) => (['Added sugar', 'Dairy', 'Gluten', 'Nightshade', 'Ultra-processed', 'Caffeine'].includes(t) ? 'amber' : t === 'High fiber' || t === 'Omega-3' ? 'gray' : 'teal') as 'amber' | 'gray' | 'teal';

const SLOT_EMOJI: Record<string, string> = { Breakfast: '🥣', Lunch: '🥗', Dinner: '🍽️', Snack: '🍎' };
const SLOT_BG: Record<string, string> = { Breakfast: '#F1E4CE', Lunch: '#E3F4F0', Dinner: '#EDE6F8', Snack: '#FCE8E3' };

export function MealRow({ meal, to }: { meal: Meal; to?: string }) {
  const t = mealTotals(meal.items);
  const tags = [...new Set(meal.items.flatMap(i => i.tags))].slice(0, 2);
  const body = (
    <>
      <span className="grid size-12 shrink-0 place-items-center rounded-xl text-2xl" style={{ background: SLOT_BG[meal.slot] }} aria-hidden>{SLOT_EMOJI[meal.slot]}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{meal.items.map(i => i.name.split(',')[0]).join(', ') || 'Empty meal'}</span>
        <span className="block text-sm text-ink-3">{meal.slot} · {fmtTime(meal.time)} · {Math.round(t.kcal)} kcal{meal.method !== 'synthetic' ? ` · via ${meal.method}` : ''}</span>
      </span>
      <span className="hidden flex-wrap justify-end gap-1 sm:flex">{tags.map(g => <Badge key={g} tone={tagTone(g)}>{g}</Badge>)}</span>
    </>
  );
  return to
    ? <Link to={to} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-canvas">{body}</Link>
    : <div className="flex items-center gap-3 px-2 py-2.5">{body}</div>;
}

export const QUICK_LOG = [
  { mode: 'photo', label: 'Photo', icon: Camera, tone: 'bg-brand-50 text-brand' },
  { mode: 'voice', label: 'Voice', icon: Mic, tone: 'bg-insight-50 text-insight' },
  { mode: 'barcode', label: 'Barcode', icon: ScanBarcode, tone: 'bg-warn-50 text-[#C46A12]' },
  { mode: 'text', label: 'Type it', icon: Keyboard, tone: 'bg-sleep-50 text-sleep' },
  { mode: 'repeat', label: 'Repeat', icon: Repeat, tone: 'bg-[#EDF1F0] text-ink-2' },
] as const;

export function FlareRing({ p, level, size = 84, dark }: { p: number; level: string; size?: number; dark?: boolean }) {
  const r = size / 2 - 7, c = 2 * Math.PI * r;
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }} role="img" aria-label={`Flare outlook ${level}, ${Math.round(p * 100)} percent`}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="7" stroke={dark ? 'rgba(255,255,255,.18)' : '#E6ECEA'} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="7" strokeLinecap="round" stroke={level === 'Low' ? '#7FF0D0' : level === 'Moderate' ? '#F5B85C' : '#F28B6B'} strokeDasharray={`${Math.max(0.04, p) * c} ${c}`} />
      </svg>
      <span className={cn('text-base font-extrabold', dark ? 'text-white' : 'text-ink')}>{level}</span>
    </div>
  );
}

export function insightTone(label: Insight['label']) {
  return label === 'Likely' ? 'amber' : label === 'Possible' ? 'teal' : 'gray';
}

export function InsightBadge({ label }: { label: Insight['label'] }) {
  return <Badge tone={insightTone(label)} icon={label === 'Likely' ? <Flame className="size-3.5" aria-hidden /> : undefined}>{label}</Badge>;
}

export const fmtProb = (p: number) => (p > 0.99 ? '> 0.99' : p.toFixed(2));
