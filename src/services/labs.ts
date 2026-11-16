/* Lab results (F4 / A2).
   Report photos are read with Tesseract.js (open-source OCR, runs in the browser; the English language
   data is downloaded on first use). A simple parser then looks for known analytes. Anything unclear is
   flagged for the user, never guessed. Production plan: Bedrock extraction with LOINC mapping. */
import type { Analyte } from '../types.ts';

export const ANALYTES: Record<Analyte, { loinc: string; units: string[]; defaultRange: Record<string, string>; patterns: RegExp[]; plausible: [number, number] }> = {
  CRP: { loinc: '1988-5', units: ['mg/L', 'mg/dL'], defaultRange: { 'mg/L': 'under 10 mg/L', 'mg/dL': 'under 1.0 mg/dL' }, patterns: [/c[\s-]*reactive\s*protein/i, /\bcrp\b/i], plausible: [0, 400] },
  ESR: { loinc: '4537-7', units: ['mm/h'], defaultRange: { 'mm/h': '0 to 20 mm/h' }, patterns: [/sed(imentation)?\s*rate/i, /\besr\b/i], plausible: [0, 150] },
  'Fecal calprotectin': { loinc: '38445-3', units: ['µg/g'], defaultRange: { 'µg/g': 'under 50 µg/g' }, patterns: [/calprotectin/i], plausible: [0, 3000] },
  'Vitamin D, 25-OH': { loinc: '62292-8', units: ['ng/mL', 'nmol/L'], defaultRange: { 'ng/mL': '30 to 100 ng/mL', 'nmol/L': '75 to 250 nmol/L' }, patterns: [/vitamin\s*d/i, /25[\s-]*(oh|hydroxy)/i], plausible: [0, 250] },
};

export interface ExtractedValue {
  analyte: Analyte;
  value: number | null;
  unit: string | null;
  refRange: string;
  issues: string[];
  line: string;
  confirmed: boolean;
}

const UNIT_RE = /(mg\s*\/\s*l|mg\s*\/\s*dl|mm\s*\/\s*h(r)?|(µ|u|mc)g\s*\/\s*g|ng\s*\/\s*ml|nmol\s*\/\s*l)/i;
const normUnit = (u: string) => {
  const s = u.toLowerCase().replace(/\s/g, '');
  if (s === 'mg/l') return 'mg/L';
  if (s === 'mg/dl') return 'mg/dL';
  if (s.startsWith('mm/h')) return 'mm/h';
  if (/g\/g$/.test(s)) return 'µg/g';
  if (s === 'ng/ml') return 'ng/mL';
  if (s === 'nmol/l') return 'nmol/L';
  return u;
};

export function parseLabText(text: string): ExtractedValue[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const out: ExtractedValue[] = [];
  for (const [analyte, def] of Object.entries(ANALYTES) as [Analyte, (typeof ANALYTES)[Analyte]][]) {
    const idx = lines.findIndex(l => def.patterns.some(p => p.test(l)));
    if (idx < 0) continue;
    const line = lines[idx] + (lines[idx + 1] && !/[a-z]{4,}/i.test(lines[idx + 1]) ? ' ' + lines[idx + 1] : '');
    // strip every name pattern (e.g. both "Vitamin D" and "25-OH") so digits in the test name are not read as the value
    const afterName = def.patterns.reduce((acc, p) => acc.replace(new RegExp(p.source, 'gi'), ' '), line);
    const num = afterName.match(/(?<![\d.])(\d{1,4}(?:[.,]\d{1,2})?)(?![\d.])/);
    const unitM = afterName.match(UNIT_RE);
    const issues: string[] = [];
    let value: number | null = num ? parseFloat(num[1].replace(',', '.')) : null;
    let unit: string | null = unitM ? normUnit(unitM[0]) : null;
    if (value == null) issues.push('Value not readable');
    if (!unit) issues.push('Unit unclear');
    else if (!def.units.includes(unit)) { issues.push(`Unexpected unit "${unit}"`); unit = null; }
    if (value != null && (value < def.plausible[0] || value > def.plausible[1])) { issues.push('Value outside the expected range, check it'); }
    const rangeM = line.match(/(ref(erence)?\.?\s*(range)?:?\s*)?((<|under|less than)\s*\d+(\.\d+)?|\d+(\.\d+)?\s*(-|to|–)\s*\d+(\.\d+)?)/i);
    const refRange = rangeM && rangeM[4] !== num?.[1] ? rangeM[4].replace(/^</, 'under ').replace('–', ' to ').replace(/\s*-\s*/, ' to ') + (unit ? ` ${unit}` : '') : unit ? def.defaultRange[unit] ?? '' : '';
    if (value == null) value = null;
    out.push({ analyte, value, unit, refRange, issues, line: lines[idx], confirmed: false });
  }
  return out;
}

export async function ocrImage(dataUrl: string, onProgress?: (p: number, status: string) => void): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng', 1, {
    logger: (m: { status: string; progress: number }) => onProgress?.(m.progress, m.status),
  });
  try {
    const { data } = await worker.recognize(dataUrl);
    return data.text;
  } finally {
    await worker.terminate();
  }
}

/* Simulated extraction for the "sample report" button. Clearly labeled as simulated in the UI.
   The vitamin D unit is deliberately missing to show the "flag, never guess" behavior. */
export const SAMPLE_REPORT_TEXT = `RIVERSIDE CLINICAL LAB (SAMPLE, SYNTHETIC)
Patient: DEMO PERSONA   Collected: see app date
C-Reactive Protein (CRP)    7     mg/L     <10
Sed Rate (ESR, Westergren)  18    mm/h     0-20
Vitamin D, 25-OH            32             30-100`;
