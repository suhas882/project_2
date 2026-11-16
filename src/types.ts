/* Shared domain types. Shapes are FHIR-friendly so they can map to FHIR R4 resources later
   (see services/fhir.ts) and be reused by a React Native app in Phase 2. */

export type ConditionId = 'ra' | 'crohns' | 'sle' | 'uc' | 'psoriasis' | 'celiac' | 'hashimotos' | 'ms' | 'at-risk';

export type DietTag =
  | 'Mediterranean' | 'Added sugar' | 'Dairy' | 'Gluten' | 'Nightshade'
  | 'Omega-3' | 'High fiber' | 'Ultra-processed' | 'Caffeine';

export interface Nutrients {
  kcal: number;
  protein: number;
  fiber: number;
  sugar: number;
  addedSugar?: number;
}

export type NutrientSource = 'USDA FoodData Central' | 'Open Food Facts' | 'Offline estimate' | 'Synthetic dataset' | 'Not found';

export interface FoodItem {
  id: string;
  name: string;
  grams: number;
  /** nutrients per 100 g, null when no match was found */
  per100: Nutrients | null;
  source: NutrientSource;
  fdcId?: number;
  match?: string;
  /** 0-100 match confidence from a recognizer, when one was used */
  confidence?: number;
  tags: DietTag[];
  barcode?: string;
  nova?: number;
}

export type MealSlot = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
export type MealMethod = 'photo' | 'voice' | 'barcode' | 'text' | 'repeat' | 'synthetic';

export interface Meal {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM 24h
  slot: MealSlot;
  items: FoodItem[];
  method: MealMethod;
  note?: string;
}

export interface SymptomEntry {
  date: string;
  fatigue: number;
  pain: number;
  gi: number;
  skin: number;
  sleepQuality: number;
  mood: number;
  stress: number;
  source: 'synthetic' | 'user';
}

export interface Rapid3Entry {
  date: string;
  fn: number;
  pain: number;
  global: number;
  total: number;
  source: 'synthetic' | 'user';
}

export interface HbiEntry {
  date: string;
  wellbeing: number; // 0-4
  abdominalPain: number; // 0-3
  liquidStools: number; // count per day
  complications: string[];
  score: number; // partial: no abdominal-mass item
  source: 'synthetic' | 'user';
}

export interface PromisPlaceholder {
  date: string;
  domains: Record<string, number>; // placeholder 0-10 ratings, not T-scores
}

export interface WearableDay {
  date: string;
  sleepMin: number;
  rhr: number;
  hrv: number;
  steps: number;
}

export type Analyte = 'CRP' | 'ESR' | 'Fecal calprotectin' | 'Vitamin D, 25-OH';

export interface LabResult {
  id: string;
  date: string;
  analyte: Analyte;
  loinc: string;
  value: number;
  unit: string;
  refRange: string;
  source: 'manual' | 'photo' | 'synthetic';
  note?: string;
}

export interface FlareEvent {
  id: string;
  date: string;
  severity: 'mild' | 'moderate' | 'severe';
  note: string;
  source: 'synthetic' | 'user';
}

export interface Consent {
  app: boolean;
  health: boolean;
  ai: boolean;
  research: boolean;
}

export interface ConsentRecord {
  version: number;
  at: string; // ISO timestamp
  consent: Consent;
  change: string;
}

export interface ExperimentPhase {
  label: string;
  kind: 'A' | 'B';
  start: string;
  end: string;
}

export interface Experiment {
  id: string;
  exposure: 'addedSugar' | 'lateDinner' | 'gluten' | 'nightshade';
  title: string;
  outcome: 'pain' | 'fatigue' | 'sleepQuality';
  phases: ExperimentPhase[];
  agreed: boolean;
  reminder: boolean;
  status: 'active' | 'stopped' | 'complete';
  createdAt: string;
  stoppedAt?: string;
}

export interface Source {
  label: string;
  kind: 'data' | 'library';
  url?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  kind?: 'answer' | 'refusal' | 'urgent';
  sources?: Source[];
  chart?: { label: string; value: number; color?: string }[];
  links?: { label: string; to: string }[];
  at: string;
}

export interface Medication {
  id: string;
  name: string;
  kind: 'medication' | 'supplement';
  schedule: string;
}

export interface ShareLink {
  id: string;
  createdAt: string;
  expiresAt: string;
  revoked: boolean;
}

export interface AccessEvent {
  at: string;
  who: string;
  action: string;
}

export interface Prefs {
  textSize: 'base' | 'large' | 'xl';
  reducedMotion: boolean;
  highContrast: boolean;
}

export interface Profile {
  name: string;
  conditions: ConditionId[];
  goals: string[];
  mode: 'guest' | 'account';
  createdAt: string;
}

export interface AppData {
  version: 1;
  onboarded: boolean;
  /** "today" when the synthetic history was generated; history ends the day before */
  anchor: string;
  profile: Profile;
  consent: Consent;
  consentLog: ConsentRecord[];
  meals: Meal[];
  symptoms: SymptomEntry[];
  rapid3: Rapid3Entry[];
  hbi: HbiEntry[];
  promis: PromisPlaceholder[];
  wearables: WearableDay[];
  labs: LabResult[];
  flares: FlareEvent[];
  medications: Medication[];
  experiments: Experiment[];
  chat: ChatMessage[];
  shares: ShareLink[];
  access: AccessEvent[];
  prefs: Prefs;
}
