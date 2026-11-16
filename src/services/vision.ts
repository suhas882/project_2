/* Meal photo recognition (A1), prototype version.
   Uses MobileNet v2, an open-source ImageNet classifier that runs in the browser. It knows only ~50
   food classes and names one main item per photo, so every result is a suggestion the user must
   confirm. The planned production model is a vision-language model on Amazon Bedrock that returns all
   items and portions as strict JSON. Photos never leave the device in this prototype. */

type Model = { classify: (img: HTMLImageElement, k?: number) => Promise<{ className: string; probability: number }[]> };
let modelPromise: Promise<Model> | null = null;

export function loadFoodModel(): Promise<Model> {
  if (!modelPromise) {
    modelPromise = (async () => {
      await import('@tensorflow/tfjs');
      const mobilenet = await import('@tensorflow-models/mobilenet');
      return (await mobilenet.load({ version: 2, alpha: 1.0 })) as unknown as Model;
    })().catch(e => { modelPromise = null; throw e; });
  }
  return modelPromise;
}

/* ImageNet class (first name, lower case) -> [display name, USDA query, typical grams] */
export const FOOD_LABELS: Record<string, [string, string, number]> = {
  banana: ['Banana', 'bananas raw', 118], pizza: ['Pizza', 'pizza cheese', 107], cheeseburger: ['Cheeseburger', 'cheeseburger', 200],
  hotdog: ['Hot dog', 'frankfurter', 100], bagel: ['Bagel', 'bagels plain', 105], pretzel: ['Pretzel', 'pretzels hard', 60],
  'french loaf': ['French bread', 'bread french', 64], burrito: ['Burrito', 'burrito beans', 220], guacamole: ['Guacamole', 'guacamole', 60],
  consomme: ['Clear soup', 'soup broth', 240], 'hot pot': ['Soup or stew', 'soup vegetable', 240], trifle: ['Layered dessert', 'pudding vanilla', 150],
  'ice cream': ['Ice cream', 'ice cream vanilla', 66], 'ice lolly': ['Ice pop', 'frozen novelties fruit', 60], 'meat loaf': ['Meatloaf', 'meatloaf', 115],
  potpie: ['Pot pie', 'chicken pot pie', 200], carbonara: ['Pasta carbonara', 'spaghetti cooked', 250], 'chocolate sauce': ['Chocolate sauce', 'chocolate syrup', 38],
  dough: ['Bread', 'bread white', 50], 'mashed potato': ['Mashed potatoes', 'potatoes mashed', 210], 'head cabbage': ['Cabbage', 'cabbage raw', 90],
  broccoli: ['Broccoli', 'broccoli cooked', 90], cauliflower: ['Cauliflower', 'cauliflower cooked', 100], zucchini: ['Zucchini', 'squash zucchini raw', 120],
  'spaghetti squash': ['Spaghetti squash', 'squash spaghetti cooked', 155], 'acorn squash': ['Acorn squash', 'squash acorn baked', 205],
  'butternut squash': ['Butternut squash', 'squash butternut baked', 205], cucumber: ['Cucumber', 'cucumber raw', 100], artichoke: ['Artichoke', 'artichokes cooked', 120],
  'bell pepper': ['Bell pepper', 'peppers sweet red raw', 120], mushroom: ['Mushrooms', 'mushrooms white raw', 70], 'granny smith': ['Apple', 'apples raw with skin', 182],
  strawberry: ['Strawberries', 'strawberries raw', 150], orange: ['Orange', 'oranges raw', 140], lemon: ['Lemon', 'lemons raw', 58], fig: ['Figs', 'figs raw', 50],
  pineapple: ['Pineapple', 'pineapple raw', 165], jackfruit: ['Jackfruit', 'jackfruit raw', 165], 'custard apple': ['Custard apple', 'custard-apple raw', 100],
  pomegranate: ['Pomegranate', 'pomegranates raw', 87], corn: ['Corn', 'corn sweet yellow cooked', 150], ear: ['Corn on the cob', 'corn sweet yellow cooked', 100],
  espresso: ['Espresso', 'coffee espresso', 60], 'coffee mug': ['Coffee', 'coffee brewed', 240], eggnog: ['Eggnog', 'eggnog', 250], 'red wine': ['Red wine', 'wine table red', 150],
  'soup bowl': ['Soup', 'soup vegetable', 240],
};
const MEAL_CONTEXT = /^(plate|mixing bowl|tray|dining table|restaurant|frying pan|wok|caldron|crock pot|spatula|wooden spoon|ladle|cup)$/;

export interface Detection { name: string; query: string; grams: number; confidence: number }
export interface VisionResult { detections: Detection[]; mealContext: boolean }

export async function recognizeFoods(img: HTMLImageElement): Promise<VisionResult> {
  const model = await loadFoodModel();
  const preds = await model.classify(img, 10);
  const seen = new Set<string>();
  const detections: Detection[] = [];
  let mealContext = false;
  for (const p of preds) {
    const key = p.className.split(',')[0].trim().toLowerCase();
    if (MEAL_CONTEXT.test(key)) mealContext = true;
    const f = FOOD_LABELS[key];
    if (f && !seen.has(f[0]) && p.probability >= 0.08 && detections.length < 3) {
      seen.add(f[0]);
      detections.push({ name: f[0], query: f[1], grams: f[2], confidence: Math.round(p.probability * 100) });
    }
  }
  return { detections, mealContext };
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('We could not read that image. Try a JPG or PNG photo.'));
    img.src = src;
  });
}

export function fileToDataUrl(file: File, maxSide = 900): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onerror = () => rej(new Error('Could not read the file.'));
    r.onload = async () => {
      try {
        const img = await loadImage(String(r.result));
        const k = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', 0.85));
      } catch (e) { rej(e); }
    };
    r.readAsDataURL(file);
  });
}
