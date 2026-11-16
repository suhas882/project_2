import type { DietTag, FoodItem, Nutrients } from '../types.ts';

/* Approximate per-100 g values (rounded from USDA SR Legacy entries) used only to build the
   synthetic 70-day history. Live logging looks foods up in USDA FoodData Central instead. */
interface FoodDef { name: string; per100: Nutrients; grams: number; tags: DietTag[] }

const F = (name: string, kcal: number, protein: number, fiber: number, sugar: number, addedSugar: number, grams: number, tags: DietTag[] = []): FoodDef =>
  ({ name, per100: { kcal, protein, fiber, sugar, addedSugar }, grams, tags });

export const FOOD_DB = {
  oatmeal: F('Oatmeal, cooked with water', 71, 2.5, 1.7, 0.3, 0, 234, ['High fiber']),
  blueberries: F('Blueberries', 57, 0.7, 2.4, 10, 0, 75),
  walnuts: F('Walnuts', 654, 15, 6.7, 2.6, 0, 15, ['Omega-3', 'Mediterranean']),
  oatMilkCoffee: F('Coffee with oat milk', 18, 0.3, 0.2, 1.6, 0.8, 300, ['Caffeine']),
  latte: F('Caffe latte, whole milk', 54, 3, 0, 4.6, 0, 360, ['Dairy', 'Caffeine']),
  greekYogurt: F('Greek yogurt, plain', 97, 9, 0, 3.6, 0, 170, ['Dairy']),
  granola: F('Granola', 471, 10, 7, 20, 15, 45, ['Gluten', 'Ultra-processed']),
  toast: F('Whole-wheat toast', 293, 13, 7, 6, 3, 60, ['Gluten']),
  eggs: F('Eggs, scrambled', 149, 10, 0, 1.4, 0, 120),
  avocado: F('Avocado', 160, 2, 6.7, 0.7, 0, 70, ['Mediterranean']),
  pastry: F('Danish pastry', 374, 5.4, 1.3, 20, 18, 90, ['Gluten', 'Added sugar', 'Ultra-processed']),
  salmon: F('Salmon, grilled', 206, 22, 0, 0, 0, 120, ['Omega-3', 'Mediterranean']),
  quinoa: F('Quinoa, cooked', 120, 4.4, 2.8, 0.9, 0, 185, ['Mediterranean']),
  tomatoes: F('Tomatoes, roasted', 32, 1.2, 1.8, 3, 0, 90, ['Nightshade', 'Mediterranean']),
  oliveOil: F('Olive oil', 884, 0, 0, 0, 0, 14, ['Mediterranean']),
  lentilSoup: F('Lentil soup', 56, 3.7, 3.5, 1.1, 0, 360, ['Mediterranean', 'High fiber']),
  sourdough: F('Sourdough bread', 274, 11, 2.4, 2.5, 1, 50, ['Gluten']),
  turkeyWrap: F('Turkey and veggie wrap', 190, 12, 2.5, 2.4, 1, 220, ['Gluten']),
  chickenBowl: F('Chicken and brown rice bowl', 140, 10, 1.8, 1, 0, 350),
  greens: F('Mixed green salad', 20, 1.5, 1.8, 1.2, 0, 120, ['Mediterranean']),
  chickpeas: F('Chickpeas', 164, 8.9, 7.6, 4.8, 0, 120, ['Mediterranean', 'High fiber']),
  pasta: F('Pasta with tomato sauce', 132, 4.5, 2, 3.5, 1.5, 300, ['Gluten', 'Nightshade']),
  stirFry: F('Tofu vegetable stir-fry', 95, 6.5, 2.2, 3, 1, 330),
  sweetPotato: F('Sweet potato, baked', 90, 2, 3.3, 6.5, 0, 150, ['High fiber']),
  roastChicken: F('Roast chicken breast', 165, 31, 0, 0, 0, 130),
  broccoli: F('Broccoli, steamed', 35, 2.4, 3.3, 1.4, 0, 90, ['Mediterranean']),
  pizza: F('Veggie pizza (dairy-free cheese)', 240, 8, 2.2, 3.5, 2, 220, ['Gluten', 'Nightshade', 'Ultra-processed']),
  takeoutCurry: F('Takeout chicken curry with rice', 150, 8, 1.2, 3.5, 2.5, 420, ['Nightshade', 'Ultra-processed']),
  apple: F('Apple', 52, 0.3, 2.4, 10, 0, 182),
  almonds: F('Almonds', 579, 21, 12.5, 4.4, 0, 28, ['Mediterranean']),
  hummusCarrots: F('Hummus with carrots', 120, 4.5, 4.5, 3, 0, 150, ['Mediterranean', 'High fiber']),
  cookies: F('Chocolate chip cookies', 488, 5, 2, 32, 30, 60, ['Gluten', 'Added sugar', 'Ultra-processed']),
  soda: F('Cola', 41, 0, 0, 10.6, 10.6, 355, ['Added sugar', 'Ultra-processed', 'Caffeine']),
  candyBar: F('Chocolate candy bar', 535, 7.6, 3.4, 52, 48, 50, ['Added sugar', 'Ultra-processed']),
  iceCreamDf: F('Dairy-free frozen dessert', 210, 2, 1, 22, 20, 130, ['Added sugar', 'Ultra-processed']),
  darkChocolate: F('Dark chocolate, 70%', 598, 7.8, 10.9, 24, 22, 20, ['Added sugar']),
} satisfies Record<string, FoodDef>;

export type FoodKey = keyof typeof FOOD_DB;

let seq = 0;
export function itemFromDb(key: FoodKey, scale = 1): FoodItem {
  const f = FOOD_DB[key];
  return {
    id: `f${++seq}-${key}`,
    name: f.name,
    grams: Math.round(f.grams * scale),
    per100: { ...f.per100 },
    source: 'Synthetic dataset',
    tags: [...f.tags],
  };
}

/* ---------------- tagging for live-logged foods ---------------- */
export function tagsForName(name: string, per100: Nutrients | null, grams: number, extra: { nova?: number; allergens?: string[] } = {}): DietTag[] {
  const n = name.toLowerCase();
  const t = new Set<DietTag>();
  const allergens = extra.allergens || [];
  if (/salmon|sardine|mackerel|trout|tuna|herring|walnut|chia|flax/.test(n)) t.add('Omega-3');
  if (/olive|salmon|\bfish\b|lentil|\bbeans?\b|chickpea|hummus|quinoa|tomato|spinach|broccoli|salad|\bnuts?\b|almond|walnut|avocado/.test(n)) t.add('Mediterranean');
  if (/tomato|\bpotato|pepper|eggplant|aubergine|chil[ei]|paprika/.test(n) && !/sweet potato|black pepper/.test(n)) t.add('Nightshade');
  if (/bread|wheat|pasta|spaghetti|pizza|bagel|pretzel|sandwich|cereal|cookie|cake|burger|burrito|noodle|toast|muffin|croissant|pastry|wrap|cracker|granola|barley|rye/.test(n) || allergens.includes('en:gluten')) t.add('Gluten');
  if ((/milk|cheese|yog|butter|cream|latte|whey|kefir/.test(n) && !/oat milk|almond milk|soy milk|coconut milk|rice milk|dairy-free|peanut butter|almond butter/.test(n)) || allergens.includes('en:milk')) t.add('Dairy');
  if (/coffee|espresso|\btea\b|cola|latte|energy drink|matcha/.test(n)) t.add('Caffeine');
  const portionAdded = per100 ? ((per100.addedSugar ?? (/(cookie|cake|candy|soda|cola|chocolate|ice cream|syrup|donut|pastry|jam)/.test(n) ? per100.sugar : 0)) * grams) / 100 : 0;
  if (portionAdded >= 10 || /ice cream|candy|soda|cookie|donut|syrup|sweetened/.test(n)) t.add('Added sugar');
  if (per100 && (per100.fiber * grams) / 100 >= 5) t.add('High fiber');
  if (extra.nova === 4) t.add('Ultra-processed');
  return [...t];
}

export const itemNutrients = (it: FoodItem) => {
  const k = it.grams / 100;
  const p = it.per100;
  return p
    ? { kcal: p.kcal * k, protein: p.protein * k, fiber: p.fiber * k, sugar: p.sugar * k, addedSugar: (p.addedSugar ?? (it.tags.includes('Added sugar') ? p.sugar : 0)) * k }
    : { kcal: 0, protein: 0, fiber: 0, sugar: 0, addedSugar: 0 };
};

export function mealTotals(items: FoodItem[]) {
  return items.reduce(
    (t, it) => { const n = itemNutrients(it); t.kcal += n.kcal; t.protein += n.protein; t.fiber += n.fiber; t.sugar += n.sugar; t.addedSugar += n.addedSugar; return t; },
    { kcal: 0, protein: 0, fiber: 0, sugar: 0, addedSugar: 0 },
  );
}
