/* Reusable UI primitives (accessible by default). */
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type KeyboardEvent, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { CheckCircle2, FlaskConical, Info, Loader2, X, AlertTriangle } from 'lucide-react';

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

/* ---------- Button ---------- */
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle' | 'insight';
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-gradient-to-b from-brand to-brand-700 text-white shadow-[0_8px_18px_rgb(13_101_86/0.25)] hover:brightness-110 disabled:from-[#B8C6C3] disabled:to-[#AAB9B6] disabled:shadow-none',
  secondary: 'bg-white text-brand-700 border border-[#C7DED8] hover:bg-brand-50 disabled:text-ink-3',
  ghost: 'bg-transparent text-brand-700 hover:bg-brand-50',
  danger: 'bg-danger-50 text-danger hover:bg-[#FAD8D4]',
  subtle: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
  insight: 'bg-insight text-white hover:brightness-110',
};
const SIZES = { sm: 'min-h-10 px-3.5 text-sm rounded-xl', md: 'min-h-12 px-5 text-[15px] rounded-2xl', lg: 'min-h-14 px-6 text-base rounded-2xl' };

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: Variant; size?: keyof typeof SIZES; loading?: boolean; icon?: ReactNode; block?: boolean }
export function Button({ variant = 'primary', size = 'md', loading, icon, block, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button {...rest} disabled={disabled || loading} aria-busy={loading || undefined}
      className={cn('inline-flex items-center justify-center gap-2 font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed', VARIANTS[variant], SIZES[size], block && 'w-full', className)}>
      {loading ? <Loader2 className="size-5 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

export function ButtonLink({ to, variant = 'primary', size = 'md', className, children, icon }: { to: string; variant?: Variant; size?: keyof typeof SIZES; className?: string; children: ReactNode; icon?: ReactNode }) {
  return <Link to={to} className={cn('inline-flex items-center justify-center gap-2 font-semibold transition', VARIANTS[variant], SIZES[size], className)}>{icon}{children}</Link>;
}

/* ---------- Card ---------- */
export function Card({ className, children, as: As = 'section', ...rest }: { className?: string; children: ReactNode; as?: 'section' | 'div' | 'article' | 'li' } & Record<string, unknown>) {
  return <As className={cn('card p-5', className)} {...rest}>{children}</As>;
}
export function CardTitle({ children, action, eyebrow, id }: { children?: ReactNode; action?: ReactNode; eyebrow?: ReactNode; id?: string }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.1em] text-brand-700">{eyebrow}</p>}
        {children && <h2 id={id} className="text-lg font-bold tracking-tight">{children}</h2>}
      </div>
      {action}
    </div>
  );
}

/* ---------- Badges ---------- */
type Tone = 'teal' | 'amber' | 'gray' | 'violet' | 'indigo' | 'red' | 'mint';
const TONES: Record<Tone, string> = {
  teal: 'bg-brand-50 text-brand-700', amber: 'bg-warn-50 text-warn', gray: 'bg-[#EDF1F0] text-ink-2',
  violet: 'bg-insight-50 text-insight', indigo: 'bg-sleep-50 text-sleep', red: 'bg-danger-50 text-danger', mint: 'bg-mint/40 text-brand-700',
};
export function Badge({ tone = 'gray', children, className, icon }: { tone?: Tone; children: ReactNode; className?: string; icon?: ReactNode }) {
  return <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold', TONES[tone], className)}>{icon}{children}</span>;
}
export function DemoBadge({ className }: { className?: string }) {
  return <span className={cn('inline-block rounded-md bg-warn-50 px-2 py-1 text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-warn', className)}>Synthetic demo data</span>;
}
export function SimBadge({ children = 'Simulated', className }: { children?: ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-md bg-insight-50 px-2 py-1 text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-insight', className)}><FlaskConical className="size-3" aria-hidden />{children}</span>;
}

/* ---------- Switch ---------- */
export function Switch({ checked, onChange, label, disabled, describedBy }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean; describedBy?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} aria-describedby={describedBy} disabled={disabled} onClick={() => onChange(!checked)}
      className={cn('relative h-8 w-14 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-60', checked ? 'bg-brand' : 'bg-[#C9D4D1]')}>
      <span className={cn('absolute left-1 top-1 size-6 rounded-full bg-white shadow transition-transform', checked && 'translate-x-6')} />
    </button>
  );
}

/* ---------- Form fields ---------- */
export function Field({ label, error, hint, children, id }: { label: string; error?: string; hint?: string; children: (props: { id: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }) => ReactNode; id?: string }) {
  const auto = useId();
  const fid = id ?? auto;
  const desc = [hint && `${fid}-hint`, error && `${fid}-err`].filter(Boolean).join(' ') || undefined;
  return (
    <div className="grid gap-1.5">
      <label htmlFor={fid} className="text-sm font-semibold text-ink-2">{label}</label>
      {children({ id: fid, 'aria-invalid': error ? true : undefined, 'aria-describedby': desc })}
      {hint && !error && <p id={`${fid}-hint`} className="text-xs text-ink-3">{hint}</p>}
      {error && <p id={`${fid}-err`} className="flex items-center gap-1 text-xs font-semibold text-danger"><AlertTriangle className="size-3.5" aria-hidden />{error}</p>}
    </div>
  );
}
const inputCls = 'min-h-12 w-full rounded-xl border border-line bg-white px-3.5 text-[15px] placeholder:text-ink-3 aria-[invalid=true]:border-danger';
export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cn(inputCls, p.className)} />;
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={cn(inputCls, 'pr-8', p.className)} />;
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={cn(inputCls, 'py-3', p.className)} />;

/* ---------- 0-10 scale (radiogroup with arrow keys) ---------- */
const SCALE_COLORS = ['#14806F', '#1F8C70', '#3C9A6E', '#6AA867', '#93B661', '#B4AE52', '#C99A45', '#D6883E', '#D9733A', '#D45E36', '#C84A30'];
export function Scale({ value, onChange, labelledBy, lo, hi, reverse, max = 10 }: { value: number | null; onChange: (v: number) => void; labelledBy: string; lo: string; hi: string; reverse?: boolean; max?: number }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const n = max + 1;
  const onKey = (e: KeyboardEvent, i: number) => {
    let j = i;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') j = Math.min(max, i + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') j = Math.max(0, i - 1);
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = max;
    else return;
    e.preventDefault(); onChange(j); refs.current[j]?.focus();
  };
  return (
    <div>
      <div role="radiogroup" aria-labelledby={labelledBy} className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {Array.from({ length: n }, (_, i) => {
          const c = SCALE_COLORS[Math.round(((reverse ? max - i : i) / max) * 10)];
          const sel = value === i;
          return (
            <button key={i} ref={el => { refs.current[i] = el; }} type="button" role="radio" aria-checked={sel}
              aria-label={`${i}${i === 0 ? `, ${lo}` : i === max ? `, ${hi}` : ''}`} tabIndex={sel || (value == null && i === 0) ? 0 : -1}
              onClick={() => onChange(i)} onKeyDown={e => onKey(e, i)}
              className={cn('h-14 rounded-xl border-b-4 bg-white text-base font-extrabold shadow-[var(--shadow-soft)] transition', sel && '-translate-y-1 scale-105 text-white')}
              style={{ borderColor: c, background: sel ? c : undefined }}>{i}</button>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-xs font-medium text-ink-3"><span>{lo}</span><span>{hi}</span></div>
    </div>
  );
}

/* ---------- Tabs ---------- */
export function Tabs<T extends string>({ tabs, value, onChange, label }: { tabs: { id: T; label: string }[]; value: T; onChange: (t: T) => void; label: string }) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const onKey = (e: KeyboardEvent, i: number) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const t = tabs[(i + d + tabs.length) % tabs.length];
    onChange(t.id); refs.current[t.id]?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto rounded-2xl bg-[#E4EBE9] p-1">
      {tabs.map((t, i) => (
        <button key={t.id} ref={el => { refs.current[t.id] = el; }} role="tab" id={`tab-${t.id}`} aria-selected={value === t.id} aria-controls={`panel-${t.id}`} tabIndex={value === t.id ? 0 : -1}
          onClick={() => onChange(t.id)} onKeyDown={e => onKey(e, i)}
          className={cn('min-h-10 shrink-0 grow rounded-xl px-3 text-sm font-semibold transition', value === t.id ? 'bg-white text-ink shadow-sm' : 'text-ink-2 hover:text-ink')}>{t.label}</button>
      ))}
    </div>
  );
}

/* ---------- Modal / sheet ---------- */
export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current!;
    const focusables = () => [...el.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(x => !x.hasAttribute('disabled'));
    (focusables()[1] ?? focusables()[0])?.focus();
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
      if (e.key === 'Tab') {
        const f = focusables(); if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; prev?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0A1E1C]/50 p-0 sm:items-center sm:p-6" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId}
        className={cn('animate-pop flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-canvas sm:rounded-3xl', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}>
        <div className="flex items-center justify-between gap-3 border-b border-line bg-white px-5 py-4">
          <h2 id={titleId} className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="grid size-10 place-items-center rounded-xl hover:bg-canvas" aria-label="Close dialog"><X className="size-5" /></button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-white px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/* ---------- Misc ---------- */
export function Spinner({ label = 'Loading' }: { label?: string }) {
  return <span role="status" className="inline-flex items-center gap-2 text-sm text-ink-2"><Loader2 className="size-5 animate-spin text-brand" aria-hidden />{label}</span>;
}
export function EmptyState({ icon, title, children, action }: { icon: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="grid justify-items-center gap-2 rounded-[var(--radius-card)] border border-dashed border-line bg-white/60 px-6 py-10 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand">{icon}</div>
      <p className="text-base font-bold">{title}</p>
      {children && <div className="max-w-sm text-sm text-ink-2">{children}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
export function Notice({ tone = 'info', children, title }: { tone?: 'info' | 'warn' | 'danger' | 'sim'; children: ReactNode; title?: string }) {
  const s = { info: 'bg-brand-50 text-ink', warn: 'bg-warn-50 text-ink', danger: 'bg-danger-50 text-ink', sim: 'bg-insight-50 text-ink' }[tone];
  const Icon = tone === 'danger' || tone === 'warn' ? AlertTriangle : tone === 'sim' ? FlaskConical : Info;
  const ic = { info: 'text-brand-700', warn: 'text-warn', danger: 'text-danger', sim: 'text-insight' }[tone];
  return (
    <div role={tone === 'danger' ? 'alert' : undefined} className={cn('flex gap-3 rounded-2xl p-4 text-sm leading-relaxed', s)}>
      <Icon className={cn('mt-0.5 size-5 shrink-0', ic)} aria-hidden />
      <div>{title && <p className="font-bold">{title}</p>}{children}</div>
    </div>
  );
}
export function Stat({ label, value, sub, icon, tone = 'teal' }: { label: string; value: ReactNode; sub?: ReactNode; icon?: ReactNode; tone?: Tone }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      {icon && <div className={cn('grid size-11 shrink-0 place-items-center rounded-xl', TONES[tone])}>{icon}</div>}
      <div className="min-w-0">
        <p className="text-xs font-semibold text-ink-3">{label}</p>
        <p className="tabular truncate text-xl font-extrabold tracking-tight">{value}</p>
        {sub && <p className="text-xs text-ink-3">{sub}</p>}
      </div>
    </div>
  );
}
export function Progress({ value, color = 'var(--color-brand)', label }: { value: number; color?: string; label: string }) {
  const v = Math.max(0, Math.min(100, value));
  return <div role="progressbar" aria-label={label} aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} className="h-2.5 overflow-hidden rounded-full bg-[#E6ECEA]"><div className="h-full rounded-full transition-all" style={{ width: `${v}%`, background: color }} /></div>;
}
export function PageHeader({ title, subtitle, actions, badge = true }: { title: string; subtitle?: ReactNode; actions?: ReactNode; badge?: boolean }) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[28px] font-extrabold leading-tight tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-[15px] text-ink-2">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">{badge && <DemoBadge />}{actions}</div>
    </header>
  );
}
export function TextAlternative({ summary = 'Show data as a table', children }: { summary?: string; children: ReactNode }) {
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer font-semibold text-brand-700">{summary}</summary>
      <div className="mt-2 max-h-72 overflow-auto">{children}</div>
    </details>
  );
}
export function DataTable({ head, rows, caption }: { head: string[]; rows: (string | number)[][]; caption: string }) {
  return (
    <table className="w-full border-collapse text-left text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead><tr>{head.map(h => <th key={h} scope="col" className="border-b border-line py-1.5 pr-3 font-semibold text-ink-2">{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="tabular border-b border-line py-1.5 pr-3">{c}</td>)}</tr>)}</tbody>
    </table>
  );
}

/* ---------- Toasts ---------- */
interface ToastItem { id: number; text: string; tone: 'ok' | 'warn' }
const ToastCtx = createContext<(text: string, tone?: 'ok' | 'warn') => void>(() => {});
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((text: string, tone: 'ok' | 'warn' = 'ok') => {
    const id = Date.now() + Math.random();
    setItems(x => [...x.slice(-2), { id, text, tone }]);
    setTimeout(() => setItems(x => x.filter(t => t.id !== id)), 3800);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 top-[76px] z-[60] flex flex-col items-center gap-2 px-4 lg:inset-x-auto lg:bottom-6 lg:right-6 lg:top-auto lg:items-end">
        {items.map(t => (
          <div key={t.id} className="animate-fade-in pointer-events-auto flex max-w-md items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white shadow-xl">
            {t.tone === 'ok' ? <CheckCircle2 className="size-5 text-mint" aria-hidden /> : <AlertTriangle className="size-5 text-[#FFC27A]" aria-hidden />}{t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

/* Recharts tooltip formatter adapter: values arrive as unknown. */
export const fmtTip = <R,>(f: (v: number) => R) => ((v: unknown) => f(Number(v))) as never;
