import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Mic, Plus, Search, Trash2, X, Minus, Sparkles, Square, Info } from 'lucide-react';
import type { FoodItem, Meal, MealMethod, MealSlot } from '@/types';
import { useStore, useToday } from '@/store/store';
import { mealTotals, tagsForName } from '@/data/foods';
import { parseFoods } from '@/lib/parse';
import { nowHHMM, fmtDate } from '@/lib/dates';
import { itemFromHit, itemFromName, itemFromProduct, lookupBarcode, newItemId, searchFoods, LookupError, type FoodHit } from '@/services/nutrition';
import { loadFoodModel, loadImage, recognizeFoods } from '@/services/vision';
import { Badge, Button, Card, Field, Input, Modal, Notice, Select, Spinner, Textarea, useToast, cn } from '@/components/ui';
import { BarcodeScanner, CameraCapture, SpeechNotice, useSpeech } from '@/components/capture';
import { tagTone } from '@/components/health';

type Stage = 'capture' | 'processing' | 'review';
const MODES: Record<string, string> = { photo: 'Photo', voice: 'Voice', barcode: 'Barcode', text: 'Type it', repeat: 'Repeat a meal' };
const slotFor = (hhmm: string): MealSlot => (hhmm < '10:30' ? 'Breakfast' : hhmm < '15:00' ? 'Lunch' : hhmm < '17:00' ? 'Snack' : 'Dinner');

export default function MealLogger() {
  const { mode: modeParam, id } = useParams();
  const [sp] = useSearchParams();
  const { data, addMeal, updateMeal, deleteMeal } = useStore();
  const today = useToday();
  const nav = useNavigate();
  const toast = useToast();
  const editing = id ? data.meals.find(m => m.id === id) : undefined;
  const mode = (editing ? 'edit' : modeParam ?? 'text') as string;

  const [stage, setStage] = useState<Stage>(editing || mode === 'repeat' ? 'review' : 'capture');
  const [items, setItems] = useState<FoodItem[]>(() => editing ? editing.items.map(i => ({ ...i })) : []);
  const [slot, setSlot] = useState<MealSlot>(editing?.slot ?? slotFor(nowHHMM()));
  const [date, setDate] = useState(editing?.date ?? today);
  const [time, setTime] = useState(editing?.time ?? nowHHMM());
  const [msg, setMsg] = useState('');
  const [busyText, setBusyText] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [dets, setDets] = useState<{ name: string; confidence: number }[]>([]);
  const [text, setText] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [unmatchedOpen, setUnmatchedOpen] = useState(false);
  // what the person is typing in each grams box; only valid whole numbers 1-3000 reach the item
  const [gramsText, setGramsText] = useState<Record<string, string>>({});
  const speech = useSpeech();

  useEffect(() => {
    if (mode === 'repeat') {
      const src = data.meals.find(m => m.id === sp.get('from')) ?? [...data.meals].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))[0];
      if (src) { setItems(src.items.map(i => ({ ...i, id: newItemId() }))); setSlot(src.slot); setMsg(`Copied from ${src.slot.toLowerCase()} on ${fmtDate(src.date)}. Adjust anything that changed.`); }
    }
    if (mode === 'photo' && data.consent.ai) loadFoodModel().catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onBarcode = useCallback(async (code: string) => {
    setStage('processing'); setBusyText(`Looking up barcode ${code} in Open Food Facts…`);
    try {
      const p = await lookupBarcode(code);
      if (!p) { setItems([]); setMsg(`Barcode ${code} was not found in Open Food Facts. Add the food with Add item.`); }
      else { setItems([itemFromProduct(p)]); setMsg(p.per100 ? '' : 'This product has no nutrition data in Open Food Facts.'); }
    } catch (e) { setItems([]); setMsg(e instanceof LookupError ? `${e.message} Add the food with Add item.` : 'Lookup failed. Add the food with Add item.'); }
    setStage('review');
  }, []);

  if (id && !editing) {
    return <Card><p className="font-semibold">That meal no longer exists.</p><Link to="/log" className="mt-3 inline-block font-semibold text-brand-700 underline">Back to Log</Link></Card>;
  }
  if (mode === 'photo' && !data.consent.ai && stage === 'capture') {
    return (
      <div className="mx-auto grid max-w-2xl gap-4">
        <BackHeader title="Photo" />
        <Notice tone="warn" title="AI photo reading is off">You turned off "AI reads meal and lab photos" in your consents. Turn it on in Settings, or log the meal another way.</Notice>
        <div className="flex flex-wrap gap-3"><Button onClick={() => nav('/settings#consent')}>Open consent settings</Button><Button variant="secondary" onClick={() => nav('/log/meal/text')}>Type the meal instead</Button></div>
      </div>
    );
  }

  const handlePhoto = async (url: string) => {
    setPhoto(url); setStage('processing'); setBusyText('Loading the on-device food model (first time only, about 15 MB)…');
    try {
      const img = await loadImage(url);
      await loadFoodModel();
      setBusyText('Finding foods…');
      const r = await recognizeFoods(img);
      setDets(r.detections.map(d => ({ name: d.name, confidence: d.confidence })));
      setBusyText('Looking up nutrients in USDA FoodData Central…');
      const found = await Promise.all(r.detections.map(d => itemFromName(d.name, { query: d.query, grams: d.grams, confidence: d.confidence })));
      setItems(found);
      setMsg(r.detections.length ? (r.detections.some(d => d.confidence < 50) ? 'Low-confidence match. Check each item and add anything we missed.' : 'Check each item and add anything the model missed.')
        : r.mealContext ? 'We can see a meal but could not name the foods. Add them with Add item.' : 'We could not find food in this photo. Retake it, or add the foods with Add item.');
    } catch (e) {
      setItems([]); setMsg(e instanceof Error && /read that image/.test(e.message) ? e.message : 'The food model could not load (are you offline?). Add the foods by name with Add item.');
    }
    setStage('review');
  };

  const resolveText = async (t: string) => {
    const list = parseFoods(t);
    if (!list.length) { setMsg('Type at least one food, for example "2 eggs and toast".'); return; }
    setStage('processing'); setBusyText('Looking up nutrients in USDA FoodData Central…'); setMsg('');
    const found = await Promise.all(list.map(x => itemFromName(x.name, { count: x.count, explicitCount: x.explicit })));
    setItems(found);
    if (found.some(i => !i.per100)) setMsg('Some foods were not found. Edit their names, search with Add item, or remove them.');
    else if (found.some(i => i.source === 'Offline estimate')) setMsg('USDA lookup is unavailable right now, so some nutrients are offline estimates.');
    setStage('review');
  };


  const totals = mealTotals(items);
  const tags = [...new Set(items.flatMap(i => i.tags))];
  const setItem = (i: number, patch: Partial<FoodItem>) => setItems(xs => xs.map((x, j) => {
    if (j !== i) return x;
    const n = { ...x, ...patch };
    return { ...n, tags: tagsForName(n.name, n.per100, n.grams, { nova: n.nova }) };
  }));
  const gramsError = (it: FoodItem) => {
    const t = gramsText[it.id];
    if (t == null) return '';
    return /^\d+$/.test(t.trim()) && Number(t) >= 1 && Number(t) <= 3000 ? '' : 'Enter a whole number of grams from 1 to 3000.';
  };
  const invalid = items.some(i => !i.name.trim() || !!gramsError(i));
  const unmatched = items.filter(i => !i.per100);
  const setGrams = (i: number, it: FoodItem, g: number) => { setGramsText(t => { const n = { ...t }; delete n[it.id]; return n; }); setItem(i, { grams: g }); };
  const save = (acceptUnmatched = false) => {
    if (!items.length) return;
    if (invalid) { setMsg('Fix the highlighted items first: every item needs a name and 1 to 3000 grams.'); return; }
    if (unmatched.length && !acceptUnmatched) { setUnmatchedOpen(true); return; }
    setUnmatchedOpen(false);
    const meal: Omit<Meal, 'id'> = { date, time, slot, items, method: (editing?.method ?? (mode === 'edit' ? 'text' : mode)) as MealMethod };
    if (editing) { updateMeal({ ...meal, id: editing.id }); toast('Meal updated.'); }
    else { addMeal(meal); toast(mode === 'photo' ? 'Meal saved. The photo was discarded.' : 'Meal saved.'); }
    nav(date === today ? '/today' : '/log');
  };

  return (
    <div className="mx-auto grid max-w-3xl gap-4">
      <BackHeader title={editing ? 'Edit meal' : MODES[mode] ?? 'Log a meal'} badge={mode === 'photo' ? <Badge tone="violet">On-device demo model</Badge> : mode === 'voice' ? <Badge tone="violet">Browser speech</Badge> : mode === 'barcode' ? <Badge tone="teal">Open Food Facts</Badge> : undefined} />

      {stage === 'capture' && mode === 'photo' && (
        <Card className="grid gap-3">
          <p className="text-ink-2">Take a photo of your plate, or upload one. The photo stays in your browser.</p>
          <CameraCapture onPhoto={handlePhoto} />
        </Card>
      )}
      {stage === 'capture' && mode === 'voice' && (
        <Card className="grid gap-4">
          <div className="grid justify-items-center gap-3 py-4 text-center">
            <button onClick={speech.listening ? speech.stop : speech.start} aria-pressed={speech.listening} disabled={!speech.supported}
              className={cn('grid size-24 place-items-center rounded-full transition disabled:opacity-50', speech.listening ? 'animate-pulse bg-insight text-white shadow-[0_0_0_12px_rgb(106_79_208/0.15)]' : 'bg-insight-50 text-insight hover:bg-[#E2DBF8]')}
              aria-label={speech.listening ? 'Stop listening' : 'Start listening'}>
              {speech.listening ? <Square className="size-9" /> : <Mic className="size-10" />}
            </button>
            <p className="font-bold" role="status">{!speech.supported ? 'Voice input is not supported in this browser' : speech.listening ? 'Listening… tap to stop' : speech.transcript ? 'Check what we heard' : 'Tap the microphone and say what you ate'}</p>
            <p className="text-sm text-ink-3">Example: "a bowl of oatmeal with blueberries and a coffee"</p>
          </div>
          {speech.error && <Notice tone="warn">{speech.error}</Notice>}
          <Field label="What we heard (edit if needed)">{p => <Textarea {...p} rows={3} value={speech.transcript} onChange={e => speech.setTranscript(e.target.value)} placeholder="Your words appear here. You can also type." />}</Field>
          <Button onClick={() => resolveText(speech.transcript)} disabled={!speech.transcript.trim() || speech.listening}>Find foods</Button>
          <SpeechNotice />
        </Card>
      )}
      {stage === 'capture' && mode === 'barcode' && <Card><BarcodeScanner onCode={onBarcode} /></Card>}
      {stage === 'capture' && mode === 'text' && (
        <Card className="grid gap-3">
          <Field label="What did you eat?" hint='Separate foods with commas or "and". Example: 2 eggs, toast with butter and a coffee' error={msg || undefined}>
            {p => <Textarea {...p} rows={3} value={text} onChange={e => setText(e.target.value)} autoFocus />}
          </Field>
          <Button onClick={() => resolveText(text)} icon={<Search className="size-5" />}>Find foods</Button>
        </Card>
      )}

      {stage === 'processing' && (
        <Card className="grid justify-items-center gap-4 py-10 text-center">
          {photo && <img src={photo} alt="Your meal photo" className="max-h-64 rounded-2xl object-cover" />}
          <Spinner label={busyText} />
        </Card>
      )}

      {stage === 'review' && (
        <>
          {photo && (
            <div className="relative overflow-hidden rounded-[var(--radius-card)]">
              <img src={photo} alt="Your meal photo" className="max-h-80 w-full object-cover" />
              <div className="absolute inset-x-3 bottom-3 flex flex-wrap gap-2">
                {dets.map(d => <span key={d.name} className="rounded-lg bg-mint px-2.5 py-1 text-xs font-extrabold text-[#063B33]">{d.name} {d.confidence}%</span>)}
              </div>
            </div>
          )}
          {msg && <Notice tone={items.length ? 'info' : 'warn'}>{msg}</Notice>}
          <Card>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-xl font-bold">{items.length ? `${items.length} item${items.length > 1 ? 's' : ''}` : 'No foods yet'}</h2>
              <Button variant="secondary" size="sm" icon={<Plus className="size-4" />} onClick={() => setSearchOpen(true)}>Add item</Button>
            </div>
            {items.length > 0 && (
              <ul className="divide-y divide-line">
                {items.map((it, i) => (
                  <li key={it.id} className="grid gap-2 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div className="min-w-0">
                      <label className="sr-only" htmlFor={`nm-${it.id}`}>Food name, item {i + 1}</label>
                      <input id={`nm-${it.id}`} aria-label={`Food name, item ${i + 1}`} aria-invalid={!it.name.trim() || undefined} value={it.name} onChange={e => setItem(i, { name: e.target.value })} className="w-full rounded-lg border border-transparent px-1 py-0.5 font-semibold hover:border-line focus:border-line" />
                      <p className="px-1 text-sm text-ink-3">
                        {it.per100 ? `${Math.round((it.per100.kcal * it.grams) / 100)} kcal` : <span className="font-semibold text-warn">No nutrient match</span>}
                        {it.confidence != null && <> · <span className={it.confidence < 50 ? 'font-semibold text-warn' : ''}>{it.confidence}% match</span></>}
                        {' · '}{it.source}{it.match ? ` · ${it.match}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700" onClick={() => setGrams(i, it, Math.max(5, it.grams - (it.grams > 60 ? 25 : 10)))} aria-label={`Less ${it.name}`}><Minus className="size-4" /></button>
                      <label className="sr-only" htmlFor={`g-${it.id}`}>Grams of {it.name || `item ${i + 1}`}</label>
                      <input id={`g-${it.id}`} aria-label={`Grams of ${it.name || `item ${i + 1}`}`} type="number" inputMode="numeric" min={1} max={3000} step={1}
                        value={gramsText[it.id] ?? String(it.grams)} aria-invalid={!!gramsError(it) || undefined} aria-describedby={gramsError(it) ? `ge-${it.id}` : undefined}
                        onChange={e => { const t = e.target.value; setGramsText(m => ({ ...m, [it.id]: t })); if (/^\d+$/.test(t.trim()) && Number(t) >= 1 && Number(t) <= 3000) setItem(i, { grams: Number(t) }); }}
                        className="tabular h-10 w-20 rounded-xl border border-line px-2 text-center font-semibold aria-[invalid=true]:border-danger" />
                      <span className="text-sm text-ink-3">g</span>
                      <button className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700" onClick={() => setGrams(i, it, Math.min(3000, it.grams + (it.grams >= 60 ? 25 : 10)))} aria-label={`More ${it.name}`}><Plus className="size-4" /></button>
                      <button className="grid size-10 place-items-center rounded-xl text-ink-3 hover:bg-danger-50 hover:text-danger" onClick={() => setItems(xs => xs.filter((_, j) => j !== i))} aria-label={`Remove ${it.name}`}><X className="size-4" /></button>
                    </div>
                    {gramsError(it) && <p id={`ge-${it.id}`} className="text-sm font-semibold text-danger sm:col-span-2" role="alert">{gramsError(it)}</p>}
                  </li>
                ))}
              </ul>
            )}
            {tags.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{tags.map(t => <Badge key={t} tone={tagTone(t)}>{t}</Badge>)}</div>}
            {items.length > 0 && <p className="mt-3 text-sm text-ink-2"><b className="text-ink">About {Math.round(totals.kcal / 10) * 10} kcal</b> · {Math.round(totals.protein)} g protein · {Math.round(totals.fiber)} g fiber · {Math.round(totals.addedSugar)} g added sugar (estimate)</p>}
          </Card>
          <Card className="grid gap-3 sm:grid-cols-3">
            <Field label="Meal">{p => <Select {...p} value={slot} onChange={e => setSlot(e.target.value as MealSlot)}>{(['Breakfast', 'Lunch', 'Dinner', 'Snack'] as MealSlot[]).map(s => <option key={s}>{s}</option>)}</Select>}</Field>
            <Field label="Date">{p => <Input {...p} type="date" value={date} max={today} onChange={e => setDate(e.target.value || today)} />}</Field>
            <Field label="Time">{p => <Input {...p} type="time" value={time} onChange={e => setTime(e.target.value || '12:00')} />}</Field>
          </Card>
          <div className="flex flex-wrap gap-3">
            {editing && <Button variant="danger" icon={<Trash2 className="size-5" />} onClick={() => setConfirmDelete(true)}>Delete</Button>}
            {!editing && mode !== 'repeat' && <Button variant="secondary" onClick={() => { setStage('capture'); setPhoto(null); setItems([]); setMsg(''); setDets([]); }}>Start over</Button>}
            <Button className="flex-1" size="lg" icon={<Check className="size-5" />} disabled={!items.length || invalid} onClick={() => save()}>{editing ? 'Save changes' : 'Confirm meal'}</Button>
          </div>
          <p className="flex items-start gap-2 text-sm text-ink-3"><Info className="mt-0.5 size-4 shrink-0" aria-hidden />Nothing is saved until you confirm.{mode === 'photo' && ' Recognition uses MobileNet, a general open-source image model that knows a limited set of foods and names one main item. The production app plans a vision-language model that lists every item and portion.'}</p>
        </>
      )}

      <FoodSearch open={searchOpen} onClose={() => setSearchOpen(false)} onAdd={it => { setItems(xs => [...xs, it]); setSearchOpen(false); if (msg && !items.length) setMsg(''); }} />
      <Modal open={unmatchedOpen} onClose={() => setUnmatchedOpen(false)} title="Save foods without nutrients?"
        footer={<><Button variant="secondary" onClick={() => setUnmatchedOpen(false)}>Go back and fix</Button><Button onClick={() => save(true)}>Save anyway</Button></>}>
        <div className="grid gap-2 text-ink-2">
          <p>{unmatched.map(u => `"${u.name}"`).join(', ')} {unmatched.length === 1 ? 'has' : 'have'} no nutrient match. {unmatched.length === 1 ? 'It' : 'They'} will be saved with 0 kcal and left out of calorie, sugar and fiber totals and food-pattern insights.</p>
          <p>To fix it, edit the name or remove the item and use Add item to search USDA FoodData Central.</p>
        </div>
      </Modal>
      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete this meal?"
        footer={<><Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button><Button variant="danger" onClick={() => { if (editing) { deleteMeal(editing.id); toast('Meal deleted.'); nav('/log'); } }}>Delete meal</Button></>}>
        <p className="text-ink-2">This removes the meal from your log, insights and reports. This demo cannot undo it.</p>
      </Modal>
    </div>
  );
}

function BackHeader({ title, badge }: { title: string; badge?: React.ReactNode }) {
  const nav = useNavigate();
  return (
    <header className="flex flex-wrap items-center gap-3">
      <button onClick={() => nav(-1)} className="grid size-11 place-items-center rounded-xl hover:bg-white" aria-label="Go back"><ArrowLeft className="size-5" /></button>
      <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
      {badge}
    </header>
  );
}

function FoodSearch({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (it: FoodItem) => void }) {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<FoodHit[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => { if (open) { setQ(''); setHits(null); setErr(''); } }, [open]);
  const run = async () => {
    if (!q.trim()) return setErr('Type a food to search.');
    setBusy(true); setErr('');
    try { const h = await searchFoods(q, 12); setHits(h); if (!h.length) setErr('No USDA match. You can add it without nutrients.'); }
    catch (e) { setHits([]); setErr(e instanceof LookupError && e.limit ? 'USDA lookup limit reached for the shared demo key. Add a free key in .env (see README), or add without nutrients.' : 'Could not reach USDA FoodData Central. You can add it without nutrients.'); }
    setBusy(false);
  };
  const plain = useMemo(() => q.trim(), [q]);
  return (
    <Modal open={open} onClose={onClose} title="Add an item">
      <form className="flex gap-2" onSubmit={e => { e.preventDefault(); run(); }}>
        <label htmlFor="fs" className="sr-only">Search foods</label>
        <Input id="fs" value={q} onChange={e => setQ(e.target.value)} placeholder="Search foods, e.g. brown rice" autoComplete="off" />
        <Button type="submit" loading={busy} icon={<Search className="size-4" />}>Search</Button>
      </form>
      {err && <p className="mt-3 text-sm font-semibold text-warn" role="alert">{err}</p>}
      {hits && hits.length > 0 && (
        <ul className="mt-3 divide-y divide-line rounded-2xl bg-white">
          {hits.map(h => (
            <li key={h.fdcId}><button className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-canvas" onClick={() => onAdd(itemFromHit(h))}>
              <span className="flex-1"><span className="block font-semibold">{h.description}</span><span className="text-sm text-ink-3">{Math.round(h.per100.kcal)} kcal per 100 g · FDC {h.fdcId}</span></span><Plus className="size-5 text-brand" aria-hidden />
            </button></li>
          ))}
        </ul>
      )}
      {plain && hits && <Button variant="ghost" className="mt-3" icon={<Sparkles className="size-4" />} onClick={() => onAdd({ id: newItemId(), name: plain, grams: 100, per100: null, source: 'Not found', tags: tagsForName(plain, null, 100) })}>Add "{plain}" without nutrients</Button>}
      <p className="mt-3 text-xs text-ink-3">Nutrient data: USDA FoodData Central (public domain).</p>
    </Modal>
  );
}
