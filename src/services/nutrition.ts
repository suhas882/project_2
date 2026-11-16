/* Nutrient lookup.
   1) Our API server (/api/foods/search) proxies USDA FoodData Central so a personal key stays server-side.
   2) If the server isn't running, the browser calls USDA directly with the shared DEMO_KEY (rate-limited).
   3) If both fail, a small offline table gives clearly labeled estimates. */
import type { FoodItem, Nutrients } from '@/types';
import { tagsForName } from '@/data/foods';

export interface FoodHit { fdcId: number; description: string; per100: Nutrients }
export class LookupError extends Error { constructor(msg: string, public limit = false) { super(msg); } }

const CACHE_KEY = 'remitra:nutrient-cache';
let cache: Record<string, FoodHit[]> = {};
try { cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { /* storage unavailable */ }
const persist = () => { try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch { /* ignore */ } };

interface UsdaFood { fdcId: number; description: string; foodNutrients?: { nutrientId: number; value: number }[] }
export function parseUsda(foods: UsdaFood[]): FoodHit[] {
  return foods.map(f => {
    const g = (id: number) => f.foodNutrients?.find(n => n.nutrientId === id)?.value;
    return { fdcId: f.fdcId, description: f.description, per100: { kcal: g(1008) ?? g(2047) ?? g(2048) ?? 0, protein: g(1003) ?? 0, fiber: g(1079) ?? 0, sugar: g(2000) ?? 0 } };
  });
}

export async function searchFoods(query: string, pageSize = 10): Promise<FoodHit[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const key = `${q}|${pageSize}`;
  if (cache[key]) return cache[key];
  let hits: FoodHit[] | null = null;
  let limited = false;
  try {
    const r = await fetch(`/api/foods/search?q=${encodeURIComponent(q)}&pageSize=${pageSize}`);
    if (r.ok && (r.headers.get('content-type') || '').includes('json')) hits = (await r.json()).foods;
    else if (r.status === 429) limited = true;
  } catch { /* server not running */ }
  if (!hits && !limited) {
    try {
      const r = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=DEMO_KEY&pageSize=${pageSize}&dataType=Foundation,SR%20Legacy&query=${encodeURIComponent(q)}`);
      if (r.status === 429) limited = true;
      else if (r.ok) hits = parseUsda((await r.json()).foods || []);
    } catch { /* offline */ }
  }
  if (!hits) throw new LookupError(limited ? 'USDA lookup limit reached for the shared demo key.' : 'Could not reach USDA FoodData Central.', limited);
  cache[key] = hits; persist();
  return hits;
}

/* Rank USDA results for a spoken or typed food name. */
export function bestMatch(query: string, hits: FoodHit[]): FoodHit | undefined {
  const q = query.toLowerCase();
  const words = q.split(/\s+/).filter(w => w.length > 1);
  return hits.map(h => {
    const d = h.description.toLowerCase();
    let s = words.filter(w => d.includes(w.replace(/s$/, ''))).length * 10 - d.length / 15;
    if (words[0] && d.startsWith(words[0].replace(/s$/, ''))) s += 4;
    if (/\b(raw|cooked|plain|brewed|baked|boiled|roasted)\b/.test(d)) s += 3;
    if (/\bwhole\b/.test(d)) s += 2;
    if (/dehydrated|powder|infant|baby food|formula/.test(d)) s -= 10;
    for (const w of ['yolk', 'white', 'dried', 'frozen', 'canned', 'imitation', 'substitute']) if (d.includes(w) && !q.includes(w)) s -= 6;
    return [s, h] as const;
  }).sort((a, b) => b[0] - a[0])[0]?.[1];
}

const SYNONYMS: [RegExp, string][] = [
  [/^eggs?$/, 'egg whole cooked hard-boiled'], [/^toast$/, 'bread white toasted'], [/^rice$/, 'rice white cooked'], [/^brown rice$/, 'rice brown cooked'],
  [/^(pasta|spaghetti|noodles)$/, 'pasta cooked'], [/^chicken$/, 'chicken breast roasted'], [/^(oatmeal|porridge|oats)$/, 'oats cooked water'],
  [/^salad$/, 'lettuce green leaf raw'], [/^coffee$/, 'coffee brewed'], [/^tea$/, 'tea black brewed'], [/^milk$/, 'milk whole'],
  [/^yogh?urt$/, 'yogurt plain whole milk'], [/^potato(es)?$/, 'potatoes baked flesh and skin'], [/^beans$/, 'beans black cooked'],
  [/^steak$/, 'beef steak grilled'], [/^fish$/, 'fish cod cooked'], [/^salmon$/, 'salmon cooked'], [/^banana$/, 'bananas raw'], [/^apple$/, 'apples raw with skin'],
];

const PORTIONS: [RegExp, number][] = [[/coffee|tea|milk|juice|latte|smoothie/, 240], [/soda|cola|beer/, 355], [/rice/, 158], [/pasta|noodle|spaghetti/, 140],
  [/eggs/, 100], [/egg/, 50], [/toast|bread/, 30], [/sandwich|wrap/, 150], [/apple/, 182], [/banana/, 118], [/orange/, 140], [/salad/, 150],
  [/soup|stew|curry|dal/, 240], [/chicken|salmon|fish|tuna|turkey|pork|beef|steak|tofu/, 120], [/yogurt|yoghurt/, 170], [/oat|porridge/, 234],
  [/cereal|granola/, 40], [/cheese/, 28], [/nut|almond|walnut|cashew/, 28], [/cookie|biscuit/, 30], [/cake|muffin|donut/, 80], [/pizza/, 107],
  [/burger/, 200], [/fries|chips/, 117], [/potato/, 170], [/avocado/, 150], [/berr/, 150], [/oil|butter/, 14]];
export const defaultGrams = (name: string) => (PORTIONS.find(([re]) => re.test(name.toLowerCase())) ?? [0, 100])[1];

const OFFLINE: Record<string, [number, number, number, number]> = {
  banana: [89, 1.1, 2.6, 12], apple: [52, .3, 2.4, 10], orange: [47, .9, 2.4, 9], berr: [57, .7, 2.4, 10], rice: [130, 2.7, .4, 0], pasta: [158, 5.8, 1.8, .6],
  toast: [293, 9, 2.6, 5], bread: [265, 9, 2.7, 5], egg: [155, 12.6, 0, 1.1], milk: [61, 3.2, 0, 5], cheese: [403, 23, 0, .5], butter: [717, .9, 0, .1],
  yog: [61, 3.5, 0, 4.7], coffee: [1, .1, 0, 0], tea: [1, 0, 0, 0], juice: [45, .7, .2, 8.4], soda: [41, 0, 0, 10], chicken: [165, 31, 0, 0],
  salmon: [206, 22, 0, 0], fish: [105, 23, 0, 0], beef: [250, 26, 0, 0], tofu: [76, 8, .3, .6], bean: [132, 8.9, 8.7, .3], oat: [71, 2.5, 1.7, .3],
  potato: [93, 2.5, 2.2, 1.2], salad: [15, 1.3, 1.5, 1.5], broccoli: [35, 2.4, 3.3, 1.4], spinach: [23, 2.9, 2.2, .4], tomato: [18, .9, 1.2, 2.6],
  avocado: [160, 2, 6.7, .7], almond: [579, 21, 12.5, 4.4], walnut: [654, 15, 6.7, 2.6], pizza: [266, 11, 2.3, 3.6], burger: [254, 13, 1.1, 4],
  sandwich: [250, 11, 2, 4], cookie: [488, 5, 2, 30], cake: [371, 4, 1, 35],
};

let idSeq = 0;
export const newItemId = () => `i${Date.now().toString(36)}${(++idSeq).toString(36)}`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* Build a FoodItem from a name: USDA if reachable, otherwise an offline estimate, otherwise no nutrients. */
export async function itemFromName(name: string, opts: { query?: string; grams?: number; count?: number; confidence?: number } = {}): Promise<FoodItem> {
  const raw = (opts.query || name).toLowerCase().trim();
  const q = (SYNONYMS.find(([re]) => re.test(raw)) ?? [0, raw])[1];
  const grams = Math.round((opts.grams ?? defaultGrams(name)) * (opts.count ?? 1));
  let per100: Nutrients | null = null;
  let source: FoodItem['source'] = 'Not found';
  let fdcId: number | undefined, match: string | undefined;
  try {
    const hit = bestMatch(q, await searchFoods(q, 8));
    if (hit) { per100 = hit.per100; source = 'USDA FoodData Central'; fdcId = hit.fdcId; match = hit.description; }
  } catch {
    const k = Object.keys(OFFLINE).find(k => raw.includes(k));
    if (k) { const [kcal, protein, fiber, sugar] = OFFLINE[k]; per100 = { kcal, protein, fiber, sugar }; source = 'Offline estimate'; }
  }
  return { id: newItemId(), name: cap(name), grams, per100, source, fdcId, match, confidence: opts.confidence, tags: tagsForName(name, per100, grams) };
}

export function itemFromHit(hit: FoodHit): FoodItem {
  const name = hit.description.split(',').slice(0, 2).join(',');
  const grams = defaultGrams(hit.description);
  return { id: newItemId(), name, grams, per100: hit.per100, source: 'USDA FoodData Central', fdcId: hit.fdcId, match: hit.description, tags: tagsForName(hit.description, hit.per100, grams) };
}

/* Open Food Facts product lookup by barcode (server proxy first, then direct). */
export interface Product { code: string; name: string; per100: Nutrients | null; servingGrams: number; nova?: number; allergens: string[]; quantity?: string }
export async function lookupBarcode(code: string): Promise<Product | null> {
  const clean = code.replace(/\D/g, '');
  if (clean.length < 8 || clean.length > 14) throw new LookupError('Barcodes are 8 to 14 digits.');
  const fields = 'product_name,brands,nutriments,serving_quantity,nova_group,allergens_tags,quantity';
  let j: { status?: number; product?: Record<string, unknown> } | null = null;
  try { const r = await fetch(`/api/products/${clean}`); if (r.ok && (r.headers.get('content-type') || '').includes('json')) j = await r.json(); } catch { /* no server */ }
  if (!j) {
    try { j = await (await fetch(`https://world.openfoodfacts.org/api/v2/product/${clean}.json?fields=${fields}`)).json(); }
    catch { throw new LookupError('Could not reach Open Food Facts.'); }
  }
  if (!j || j.status !== 1 || !j.product) return null;
  const p = j.product as { product_name?: string; brands?: string; nutriments?: Record<string, number>; serving_quantity?: number | string; nova_group?: number; allergens_tags?: string[]; quantity?: string };
  if (!p.product_name) return null;
  const n = p.nutriments || {};
  const brand = p.brands ? ` (${p.brands.split(',')[0].trim()})` : '';
  return {
    code: clean, name: p.product_name + brand,
    per100: n['energy-kcal_100g'] == null ? null : { kcal: +n['energy-kcal_100g'] || 0, protein: +n.proteins_100g || 0, fiber: +n.fiber_100g || 0, sugar: +n.sugars_100g || 0 },
    servingGrams: Math.round(+(p.serving_quantity ?? 0) || 100), nova: p.nova_group, allergens: p.allergens_tags || [], quantity: p.quantity,
  };
}

export function itemFromProduct(p: Product): FoodItem {
  return { id: newItemId(), name: p.name, grams: p.servingGrams, per100: p.per100, source: 'Open Food Facts', barcode: p.code, nova: p.nova,
    match: `Barcode ${p.code}${p.quantity ? ` · ${p.quantity}` : ''}`, tags: tagsForName(p.name, p.per100, p.servingGrams, { nova: p.nova, allergens: p.allergens }) };
}
