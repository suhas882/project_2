import { useEffect, useId, type ReactNode } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Home, PlusCircle, Sparkles, LineChart, Users, MessageCircle, FlaskConical, Activity, Watch, TestTube2, Settings, ShieldCheck, Gauge } from 'lucide-react';
import { useStore } from '@/store/store';
import { cn } from './ui';

export const MAIN_NAV = [
  { to: '/today', label: 'Today', icon: Home },
  { to: '/log', label: 'Log', icon: PlusCircle },
  { to: '/insights', label: 'Insights', icon: Sparkles },
  { to: '/trends', label: 'Trends', icon: LineChart },
  { to: '/care', label: 'Care team', icon: Users },
];
const MORE_NAV = [
  { to: '/insights/ask', label: 'Ask Remitra', icon: MessageCircle },
  { to: '/insights/test-it', label: 'Test It', icon: FlaskConical },
  { to: '/flare', label: 'Flare outlook', icon: Gauge },
  { to: '/log/checkin', label: 'Daily check-in', icon: Activity },
  { to: '/log/labs', label: 'Labs', icon: TestTube2 },
  { to: '/wearables', label: 'Wearables', icon: Watch },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/privacy', label: 'Privacy', icon: ShieldCheck },
];

export function Logo({ className }: { className?: string }) {
  const gid = useId().replace(/:/g, '');
  return (
    <Link to="/today" className={cn('flex items-center gap-2.5', className)} aria-label="Remitra home">
      <svg viewBox="0 0 64 64" className="size-9" aria-hidden><defs><linearGradient id={gid} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#14806F" /><stop offset="1" stopColor="#0D6556" /></linearGradient></defs><rect width="64" height="64" rx="16" fill={`url(#${gid})`} /><path d="M32 14l4.5 11.5L48 30l-11.5 4.5L32 46l-4.5-11.5L16 30l11.5-4.5z" fill="#7FF0D0" /></svg>
      <span className="text-xl font-extrabold tracking-tight">Remitra</span>
    </Link>
  );
}

function isActive(path: string, to: string) {
  if (to === '/insights') return path === '/insights';
  if (to === '/log') return path === '/log' || path.startsWith('/log/meal');
  return path === to || path.startsWith(to + '/');
}

export function AppShell({ children }: { children: ReactNode }) {
  const { data } = useStore();
  const { pathname } = useLocation();
  useEffect(() => { document.getElementById('main')?.focus({ preventScroll: true }); window.scrollTo(0, 0); }, [pathname]);
  const initial = (data.profile.name || 'M').charAt(0).toUpperCase();
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[264px_1fr]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-xl focus:bg-white focus:px-4 focus:py-3 focus:font-semibold focus:shadow-lg">Skip to content</a>

      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 overflow-y-auto border-r border-line bg-white px-4 py-6 lg:flex" aria-label="Sidebar">
        <Logo className="px-2" />
        <nav aria-label="Main" className="grid gap-1">
          {MAIN_NAV.map(n => (
            <NavLink key={n.to} to={n.to} aria-current={isActive(pathname, n.to) ? 'page' : undefined}
              className={cn('flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold transition', isActive(pathname, n.to) ? 'bg-brand-50 text-brand-700' : 'text-ink-2 hover:bg-canvas')}>
              <n.icon className="size-5" aria-hidden />{n.label}
            </NavLink>
          ))}
        </nav>
        <div>
          <p className="mb-1 px-3 text-xs font-bold uppercase tracking-[0.1em] text-ink-3">More</p>
          <nav aria-label="More" className="grid gap-0.5">
            {MORE_NAV.map(n => (
              <NavLink key={n.to} to={n.to} aria-current={isActive(pathname, n.to) ? 'page' : undefined}
                className={cn('flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition', isActive(pathname, n.to) ? 'bg-brand-50 text-brand-700' : 'text-ink-2 hover:bg-canvas')}>
                <n.icon className="size-[18px]" aria-hidden />{n.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <Link to="/settings" className="mt-auto flex items-center gap-3 rounded-2xl bg-canvas p-3 hover:bg-brand-50">
          <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-[#F6B48A] to-[#E27B52] font-extrabold text-white" aria-hidden>{initial}</span>
          <span className="min-w-0"><span className="block truncate text-sm font-bold">{data.profile.name}</span><span className="block text-xs text-ink-3">{data.profile.mode === 'guest' ? 'Guest demo' : 'Demo account'} · Settings</span></span>
        </Link>
      </aside>

      <div className="flex min-h-dvh flex-col">
        {/* mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <Logo />
          <div className="flex items-center gap-2">
            <Link to="/insights/ask" className="grid size-11 place-items-center rounded-full bg-insight-50 text-insight" aria-label="Ask Remitra"><MessageCircle className="size-5" /></Link>
            <Link to="/settings" className="grid size-11 place-items-center rounded-full bg-gradient-to-br from-[#F6B48A] to-[#E27B52] font-extrabold text-white" aria-label="Profile and settings">{initial}</Link>
          </div>
        </header>
        <div className="border-b border-[#F3D9B5] bg-warn-50 px-4 py-2 text-center text-xs font-semibold text-warn" role="note">
          Prototype with synthetic demonstration data. Not medical advice. Some features are simulated and labeled.
        </div>
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 outline-none sm:px-6 lg:px-10 lg:pb-12">
          <div className="animate-fade-in" key={pathname}>{children}</div>
        </main>
        {/* mobile bottom tabs */}
        <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
          {MAIN_NAV.map(n => {
            const on = isActive(pathname, n.to);
            return (
              <NavLink key={n.to} to={n.to} aria-current={on ? 'page' : undefined} className={cn('grid min-h-16 justify-items-center content-center gap-1 text-[11.5px] font-semibold', on ? 'text-brand' : 'text-ink-3')}>
                <n.icon className="size-6" strokeWidth={on ? 2.3 : 1.8} aria-hidden />{n.label}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
