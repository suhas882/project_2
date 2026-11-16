import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Sparkles, Database, BookOpen, ExternalLink, Trash2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useStore, useToday } from '@/store/store';
import { answerQuestion, SUGGESTED_QUESTIONS } from '@/services/ask';
import { Button, PageHeader, SimBadge, cn } from '@/components/ui';

export default function Ask() {
  const { data, addChat, clearChat } = useStore();
  const today = useToday();
  const [q, setQ] = useState('');
  const [typing, setTyping] = useState(false);
  const [err, setErr] = useState('');
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [data.chat.length, typing]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return setErr('Type a question first.');
    if (t.length > 500) return setErr('Keep questions under 500 characters.');
    setErr(''); setQ('');
    addChat({ role: 'user', text: t });
    setTyping(true);
    setTimeout(() => { addChat({ role: 'assistant', ...answerQuestion(t, data, today) }); setTyping(false); }, 650);
  };

  return (
    <div className="mx-auto grid max-w-3xl gap-4">
      <PageHeader title="Ask Remitra" subtitle="Answers from your own logs and approved sources. Not medical advice." actions={<SimBadge>Demo responses</SimBadge>} />
      <div className="card flex items-start gap-3 bg-gradient-to-br from-[#F3F0FD] to-[#E9F6F3] p-4 text-sm text-ink-2">
        <Sparkles className="mt-0.5 size-5 shrink-0 text-insight" aria-hidden />
        <p>This assistant is a rule-based demo, not a language model. It computes answers from your stored synthetic data, shows its sources, and does not diagnose or give medication advice.</p>
      </div>

      <section aria-label="Conversation" aria-live="polite" className="grid gap-3">
        {data.chat.length === 0 && <p className="py-4 text-center text-sm text-ink-3">Ask a question about your meals, symptoms, sleep, labs or flares, or pick a suggestion below.</p>}
        {data.chat.map(m => m.role === 'user' ? (
          <div key={m.id} className="ml-auto max-w-[85%] rounded-[20px_20px_6px_20px] bg-brand px-4 py-3 text-white">{m.text}</div>
        ) : (
          <div key={m.id} className={cn('max-w-[95%] rounded-[20px_20px_20px_6px] bg-white px-4 py-3 shadow-[var(--shadow-soft)]', m.kind === 'refusal' && 'border-l-4 border-[#E2793C]', m.kind === 'urgent' && 'border-l-4 border-danger bg-danger-50')}>
            <p className="mb-1 flex items-center gap-1.5 text-xs font-bold text-ink-3">
              {m.kind === 'urgent' ? <><AlertTriangle className="size-3.5 text-danger" aria-hidden />Safety guidance</> : m.kind === 'refusal' ? <><ShieldAlert className="size-3.5 text-[#E2793C]" aria-hidden />Outside what Remitra can advise</> : <><Sparkles className="size-3.5 text-insight" aria-hidden />Remitra · demo response</>}
            </p>
            <p className="leading-relaxed">{m.text}</p>
            {m.chart && (
              <div className="mt-3 flex h-24 items-end gap-3" role="img" aria-label={m.chart.map(c => `${c.label}: ${c.value} minutes`).join(', ')}>
                {m.chart.map(c => { const max = Math.max(...m.chart!.map(x => x.value)); return (
                  <div key={c.label} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs font-bold">{c.value} min</span>
                    <div className="w-full rounded-lg" style={{ height: `${Math.max(12, (c.value / max) * 60)}px`, background: c.color }} />
                    <span className="text-xs text-ink-3">{c.label}</span>
                  </div>); })}
              </div>
            )}
            {!!m.sources?.length && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="sr-only">Sources:</span>
                {m.sources.map(s => s.url ? (
                  <a key={s.label} href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full bg-sleep-50 px-2.5 py-1 text-xs font-semibold text-sleep hover:underline"><BookOpen className="size-3.5" aria-hidden />{s.label}<ExternalLink className="size-3" aria-label="opens in a new tab" /></a>
                ) : (
                  <span key={s.label} className="inline-flex items-center gap-1 rounded-full bg-[#EDF1F0] px-2.5 py-1 text-xs font-semibold text-ink-2"><Database className="size-3.5" aria-hidden />{s.label}</span>
                ))}
              </div>
            )}
            {m.kind === 'answer' && !m.sources?.length && <p className="mt-2 text-xs text-ink-3">No sources needed: this is help text, not health information.</p>}
            {!!m.links?.length && <div className="mt-3 flex flex-wrap gap-2">{m.links.map(l => <Link key={l.to} to={l.to} className="rounded-full bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-100">{l.label} →</Link>)}</div>}
          </div>
        ))}
        {typing && <div className="w-20 rounded-[20px_20px_20px_6px] bg-white px-4 py-3 shadow-[var(--shadow-soft)]" aria-label="Remitra is typing"><span className="inline-flex gap-1">{[0, 1, 2].map(i => <span key={i} className="size-2 animate-bounce rounded-full bg-ink-3" style={{ animationDelay: `${i * 0.15}s` }} />)}</span></div>}
        <div ref={end} />
      </section>

      <div className="sticky bottom-20 z-10 grid gap-2 rounded-3xl bg-canvas/95 pt-2 backdrop-blur lg:bottom-4">
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Suggested questions">
          {SUGGESTED_QUESTIONS.map(s => <button key={s} onClick={() => send(s)} disabled={typing} className="shrink-0 rounded-full border border-[#C7DED8] bg-white px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-50">{s}</button>)}
        </div>
        <form className="flex gap-2" onSubmit={e => { e.preventDefault(); send(q); }}>
          <label htmlFor="askq" className="sr-only">Ask about your data</label>
          <input id="askq" value={q} onChange={e => setQ(e.target.value)} placeholder="Ask about your data…" autoComplete="off" maxLength={600} aria-invalid={!!err || undefined} aria-describedby={err ? 'askerr' : undefined}
            className="min-h-14 flex-1 rounded-2xl border border-line bg-white px-4 shadow-[var(--shadow-soft)]" />
          <Button type="submit" size="lg" disabled={typing} aria-label="Send question" icon={<Send className="size-5" />} />
        </form>
        {err && <p id="askerr" className="text-sm font-semibold text-danger" role="alert">{err}</p>}
        {data.chat.length > 0 && <button onClick={clearChat} className="inline-flex items-center gap-1 justify-self-start text-sm font-semibold text-ink-3 hover:text-danger"><Trash2 className="size-4" aria-hidden />Clear conversation</button>}
      </div>
    </div>
  );
}
