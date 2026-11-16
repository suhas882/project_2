/* Ask Remitra (F8 / A7), DEMO version.
   A deterministic, rule-based responder: it matches the question to an intent and computes the answer
   from the user's own stored records, or from a short list of vetted public sources. It is not a
   language model. Guardrails: no diagnosis, no medication or dosing advice, red-flag escalation.
   Production plan: retrieval over the user's records plus an advisor-approved library on Bedrock. */
import type { AppData, ChatMessage, Source } from '@/types';
import { addDays, fmtDate, fmtTime } from '@/lib/dates';
import { mealTotals } from '@/data/foods';
import { SYMPTOMS } from '@/lib/scoring';
import { computeInsights, dailyExposures, flareOutlook, EXPOSURES } from './analytics';

export const LIBRARY = {
  vitaminD: { label: 'NIH Office of Dietary Supplements: Vitamin D fact sheet', kind: 'library', url: 'https://ods.od.nih.gov/factsheets/VitaminD-Consumer/' },
  omega3: { label: 'NIH Office of Dietary Supplements: Omega-3 fact sheet', kind: 'library', url: 'https://ods.od.nih.gov/factsheets/Omega3FattyAcids-Consumer/' },
  fdc: { label: 'USDA FoodData Central', kind: 'library', url: 'https://fdc.nal.usda.gov/' },
} satisfies Record<string, Source>;

const D = (label: string): Source => ({ label, kind: 'data' });
const mean = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const f1 = (n: number) => (Number.isFinite(n) ? n.toFixed(1) : 'n/a');

export const SUGGESTED_QUESTIONS = [
  'What foods were associated with my fatigue?',
  'How has my sleep changed this week?',
  'Show my symptom trends.',
  'What happened after I logged dairy products?',
  'Summarize my recent health tracking.',
  'What did I eat today?',
  'Should I stop my methotrexate?',
];

type Reply = Omit<ChatMessage, 'id' | 'role' | 'at'>;

export function answerQuestion(q: string, data: AppData, today: string): Reply {
  const s = q.toLowerCase();
  const insights = computeInsights(data);

  if (/chest pain|can'?t breathe|cannot breathe|trouble breathing|suicid|kill myself|faint|passed out|high fever|vomiting blood|blood in (my )?stool/.test(s)) {
    return { kind: 'urgent', text: 'This could need urgent care. If it is an emergency, call 911 or your local emergency number now. Otherwise, contact your care team today.', sources: [] };
  }
  if (/\b(stop|start|skip|quit|change|increase|decrease|double|reduce|switch)\b.*\b(med|meds|medicine|medication|methotrexate|prednisone|steroid|biologic|humira|dose|pill|drug|treatment)/.test(s)
    || /\b(dose|dosage|how much .* take|should i take|methotrexate|prednisone|hydroxychloroquine|medication)\b/.test(s)) {
    return { kind: 'refusal', text: "I can't advise on medicines or doses. Please talk to your rheumatologist or pharmacist before changing any treatment. I can help you prepare a report for your next visit.", sources: [], links: [{ label: 'Prepare a care team report', to: '/care' }] };
  }
  if (/\b(do i have|diagnos|what disease|is (it|this) (lupus|crohn|ms|cancer|arthritis))\b/.test(s)) {
    return { kind: 'refusal', text: "I can't diagnose conditions. Your clinician can review your symptoms and tests. I can summarize your logs so the visit goes further.", sources: [], links: [{ label: 'Prepare a care team report', to: '/care' }] };
  }

  if (/\b(what (did|have) i (eat|eaten|had)|what i (ate|had)|did i eat|my meals|meals? (today|yesterday)|eaten (today|yesterday)|ate (today|yesterday))\b/.test(s)) {
    const day = /yesterday/.test(s) ? addDays(today, -1) : today;
    const label = day === today ? 'today' : 'yesterday';
    const list = (d: string) => data.meals.filter(m => m.date === d).sort((a, b) => a.time.localeCompare(b.time));
    let meals = list(day);
    let note = '';
    if (!meals.length && day === today) { meals = list(addDays(today, -1)); note = meals.length ? 'You have not logged anything today yet. Yesterday you had: ' : ''; }
    if (!meals.length) return { kind: 'answer', text: `You have no meals logged ${label}. Use Log a meal to add one.`, sources: [D('Meal logs')], links: [{ label: 'Log a meal', to: '/log' }] };
    const kcal = meals.reduce((t, m) => t + mealTotals(m.items).kcal, 0);
    const lines = meals.map(m => `${m.slot} at ${fmtTime(m.time)}: ${m.items.map(i => i.name.split(',')[0]).join(', ')}`);
    return { kind: 'answer', text: `${note || `${label === 'today' ? 'Today' : 'Yesterday'} you logged: `}${lines.join('; ')}. About ${Math.round(kcal / 10) * 10} kcal in total (estimate).`, sources: [D('Meal logs')], links: [{ label: 'Open meal history', to: '/log' }] };
  }

  const sym = new Map(data.symptoms.map(x => [x.date, x]));
  const wear = new Map(data.wearables.map(x => [x.date, x]));
  const lastN = (n: number, offset = 0) => Array.from({ length: n }, (_, i) => addDays(today, -1 - i - offset));

  if (/fatigue|tired|energy/.test(s) && /food|eat|associat|trigger|cause|diet|meal/.test(s)) {
    const hits = insights.filter(i => i.outcome === 'fatigue');
    const shown = hits.filter(i => i.label === 'Likely' || i.label === 'Possible');
    const text = shown.length
      ? `In your logs, ${shown.map(i => `${i.sentence.toLowerCase()} (${i.label}, probability ${i.probability.toFixed(2)})`).join('; ')}. These are associations in your own data, not proof that a food causes fatigue.`
      : `No food in your logs shows a clear association with fatigue yet. The closest checks: ${hits.slice(0, 2).map(i => `${EXPOSURES[i.exposure].short.toLowerCase()} (${i.label.toLowerCase()})`).join(' and ')}. Your fatigue tracks more closely with short sleep.`;
    return { kind: 'answer', text, sources: [D('Meal logs'), D('Daily check-ins'), D('Sleep from wearable data')], links: [{ label: 'Open Insights', to: '/insights' }] };
  }
  if (/sleep/.test(s)) {
    const a = lastN(7).map(d => wear.get(d)?.sleepMin).filter((v): v is number => v != null);
    const b = lastN(7, 7).map(d => wear.get(d)?.sleepMin).filter((v): v is number => v != null);
    const qa = mean(lastN(7).map(d => sym.get(d)?.sleepQuality).filter((v): v is number => v != null));
    const late = insights.find(i => i.exposure === 'lateDinner' && i.outcome === 'sleepMin');
    const diff = mean(a) - mean(b);
    return {
      kind: 'answer',
      text: `Last 7 days you slept ${Math.round(mean(a))} minutes a night on average, ${Math.abs(Math.round(diff))} minutes ${diff >= 0 ? 'more' : 'less'} than the week before. Your sleep-quality rating averaged ${f1(qa)} out of 10.${late && late.label !== 'No clear association' && late.label !== 'Not enough data' ? ` Across all your logs: ${late.sentence.toLowerCase()} (${late.detail.split('.')[0].toLowerCase()}).` : ''}`,
      chart: [{ label: 'Week before', value: Math.round(mean(b)), color: '#C9D3F5' }, { label: 'Last 7 days', value: Math.round(mean(a)), color: '#4B5BB5' }],
      sources: [D('Sleep from wearable data (synthetic)'), D('Daily check-ins'), D('Meal times')],
      links: [{ label: 'Open sleep trends', to: '/trends?tab=sleep' }],
    };
  }
  if (/dairy|milk|cheese|yog/.test(s)) {
    const ex = dailyExposures(data.meals);
    const days = [...ex.values()].filter(e => e.dairy).map(e => e.date).sort();
    if (!days.length) return { kind: 'answer', text: 'You have not logged any dairy foods yet.', sources: [D('Meal logs')] };
    const after = days.map(d => { const n = sym.get(addDays(d, 1)); return `${fmtDate(d)}: next-day gut discomfort ${n?.gi ?? 'not logged'}, joint pain ${n?.pain ?? 'not logged'}`; });
    const ins = insights.find(i => i.exposure === 'dairy');
    return { kind: 'answer', text: `You logged dairy on ${days.length} day${days.length > 1 ? 's' : ''}. ${after.join('. ')}. ${ins?.label === 'Not enough data' ? 'That is not enough data for an insight; the app needs dairy on at least 3 days and dairy-free on at least 3.' : ins ? `Current reading: ${ins.label.toLowerCase()}.` : ''}`, sources: [D('Meal logs'), D('Daily check-ins')] };
  }
  if (/trend|symptom|how am i doing|better|worse/.test(s)) {
    const rows = SYMPTOMS.map(x => {
      const a = mean(lastN(14).map(d => sym.get(d)?.[x.key]).filter((v): v is number => v != null));
      const b = mean(lastN(14, 14).map(d => sym.get(d)?.[x.key]).filter((v): v is number => v != null));
      const better = x.higherIsBetter ? a > b : a < b;
      return `${x.label} ${f1(b)} → ${f1(a)}${Math.abs(a - b) >= 0.3 ? (better ? ' (better)' : ' (worse)') : ' (about the same)'}`;
    });
    const r = data.rapid3.slice(-2);
    return { kind: 'answer', text: `Average over the last 14 days compared with the 14 days before: ${rows.join('; ')}.${r.length === 2 ? ` Weekly RAPID3 went from ${r[0].total} to ${r[1].total}.` : ''}`, sources: [D('Daily check-ins'), D('RAPID3 (demonstration scoring)')], links: [{ label: 'Open Trends', to: '/trends' }] };
  }
  if (/summar|overview|recent|recap|this week/.test(s)) {
    const w = lastN(7);
    const meals = data.meals.filter(m => w.includes(m.date)).length;
    const checkins = w.filter(d => sym.has(d)).length;
    const pain = mean(w.map(d => sym.get(d)?.pain).filter((v): v is number => v != null));
    const sl = mean(w.map(d => wear.get(d)?.sleepMin).filter((v): v is number => v != null));
    const r = data.rapid3[data.rapid3.length - 1];
    const lab = [...data.labs].sort((a, b) => b.date.localeCompare(a.date))[0];
    const top = insights.find(i => i.label === 'Likely' || i.label === 'Possible');
    const fo = flareOutlook(data, today);
    return {
      kind: 'answer',
      text: `Last 7 days: ${meals} meals logged, ${checkins} of 7 check-ins, average joint pain ${f1(pain)} of 10, average sleep ${Math.round(sl)} minutes.${r ? ` Latest RAPID3: ${r.total} (${fmtDate(r.date)}).` : ''}${lab ? ` Latest lab: ${lab.analyte} ${lab.value} ${lab.unit} (${fmtDate(lab.date)}).` : ''}${top ? ` Strongest pattern: ${top.sentence.toLowerCase()} (${top.label}).` : ''} Flare outlook: ${fo.level.toLowerCase()} (prototype estimate based on synthetic data).`,
      sources: [D('Meal logs'), D('Daily check-ins'), D('Wearable data (synthetic)'), D('Lab results')],
    };
  }
  if (/sugar|sweet|dessert|soda/.test(s)) {
    const ins = insights.find(i => i.exposure === 'highSugar' && i.outcome === 'pain');
    return { kind: 'answer', text: ins && ins.label !== 'Not enough data' ? `${ins.sentence}: ${ins.label.toLowerCase()} (probability ${ins.probability.toFixed(2)}). ${ins.detail} This is an association in your own data. If you want to check it, Test It sets up a structured experiment after you talk with your care team.` : 'There is not enough sugar data yet.', sources: [D('Meal logs'), D('Daily check-ins')], links: [{ label: 'Open Test It', to: '/insights/test-it' }] };
  }
  if (/vitamin d/.test(s)) {
    const lab = data.labs.filter(l => l.analyte === 'Vitamin D, 25-OH').sort((a, b) => b.date.localeCompare(a.date))[0];
    return { kind: 'answer', text: `Foods that provide vitamin D include fatty fish such as salmon, trout and sardines, fortified milk and plant milks, fortified cereals, egg yolks, and some mushrooms. Sunlight also helps the body make it.${lab ? ` Your last result was ${lab.value} ${lab.unit} on ${fmtDate(lab.date)}; your clinician can tell you what level is right for you.` : ''}`, sources: [LIBRARY.vitaminD, ...(lab ? [D('Your lab results')] : [])] };
  }
  if (/omega|fish oil|salmon/.test(s)) {
    const fishDays = new Set(data.meals.filter(m => m.items.some(i => i.tags.includes('Omega-3'))).map(m => m.date)).size;
    return { kind: 'answer', text: `Omega-3 fats are found in fatty fish such as salmon, mackerel and sardines, and in walnuts, flaxseed and chia seeds. You logged an omega-3 food on ${fishDays} days. Ask your care team before starting any supplement.`, sources: [LIBRARY.omega3, D('Meal logs')] };
  }
  if (/crp|esr|lab|calprotectin|blood test/.test(s)) {
    const latest = new Map<string, (typeof data.labs)[number]>();
    [...data.labs].sort((a, b) => a.date.localeCompare(b.date)).forEach(l => latest.set(l.analyte, l));
    return { kind: 'answer', text: `Your latest results: ${[...latest.values()].map(l => `${l.analyte} ${l.value} ${l.unit} on ${fmtDate(l.date)} (report range ${l.refRange})`).join('; ')}. Your clinician interprets these with your full history.`, sources: [D('Lab results')], links: [{ label: 'Open Labs', to: '/log/labs' }] };
  }
  if (/flare|outlook|risk/.test(s)) {
    const fo = flareOutlook(data, today);
    return { kind: 'answer', text: `Your 7-day flare outlook is ${fo.level.toLowerCase()} (${Math.round(fo.probability * 100)}%). ${fo.headline}. This is a prototype estimate based on synthetic data, not a medical prediction.`, sources: [D('Daily check-ins'), D('Wearable data (synthetic)'), D('Meal logs')], links: [{ label: 'Open Flare outlook', to: '/flare' }] };
  }
  if (/trigger|associat|food|pattern/.test(s)) {
    const shown = insights.filter(i => i.label === 'Likely' || i.label === 'Possible');
    return { kind: 'answer', text: shown.length ? `Patterns in your data: ${shown.map(i => `${i.sentence.toLowerCase()} (${i.label})`).join('; ')}. Associations only, not causes.` : 'No clear food patterns yet. Keep logging normally.', sources: [D('Meal logs'), D('Daily check-ins')], links: [{ label: 'Open Insights', to: '/insights' }] };
  }
  return { kind: 'answer', text: 'I can answer questions about your own logs (meals, symptoms, sleep, labs, flares) and share facts from approved sources. Try one of the suggested questions below.', sources: [] };
}
