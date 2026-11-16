/* Date helpers working in local calendar days (YYYY-MM-DD). */

export const pad = (n: number) => String(n).padStart(2, '0');

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(s: string, n: number): string {
  const d = fromISODate(s);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((fromISODate(b).getTime() - fromISODate(a).getTime()) / 86400000);
}

export const todayISO = () => toISODate(new Date());

export function fmtDate(s: string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }): string {
  return fromISODate(s).toLocaleDateString('en-US', opts);
}

export const fmtLong = (s: string) => fmtDate(s, { weekday: 'long', month: 'long', day: 'numeric' });

export function fmtTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${pad(m)} ${ap}`;
}

export function nowHHMM(): string {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fmtMinutes(min: number): string {
  const h = Math.floor(min / 60);
  return `${h} h ${pad(Math.round(min - h * 60))} m`;
}

export function range(start: string, end: string): string[] {
  const out: string[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
}
