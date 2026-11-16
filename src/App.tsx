import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useStore } from './store/store';
import { AppShell } from './components/AppShell';
import { ErrorBoundary } from './components/ErrorBoundary';
import Onboarding from './pages/Onboarding';
import Today from './pages/Today';
import Log from './pages/Log';
import MealLogger from './pages/MealLogger';
import CheckIn from './pages/CheckIn';
import Labs from './pages/Labs';
import Medications from './pages/Medications';
import Wearables from './pages/Wearables';
import Insights from './pages/Insights';
import Ask from './pages/Ask';
import TestIt from './pages/TestIt';
import Flare from './pages/Flare';
import Trends from './pages/Trends';
import CareTeam from './pages/CareTeam';
import Settings from './pages/Settings';
import Privacy from './pages/Privacy';
import NotFound from './pages/NotFound';

const TITLES: [RegExp, string][] = [
  [/^\/welcome/, 'Welcome'], [/^\/today/, 'Today'], [/^\/log\/meal/, 'Log a meal'], [/^\/log\/checkin/, 'Daily check-in'], [/^\/log\/labs/, 'Labs'],
  [/^\/log\/meds/, 'Medications and supplements'], [/^\/log/, 'Log'], [/^\/insights\/ask/, 'Ask Remitra'], [/^\/insights\/test-it/, 'Test It'],
  [/^\/insights/, 'Insights'], [/^\/trends/, 'Trends'], [/^\/care/, 'Care team'], [/^\/flare/, 'Flare outlook'], [/^\/wearables/, 'Wearables'],
  [/^\/settings/, 'Settings'], [/^\/privacy/, 'Privacy'],
];

export default function App() {
  const { data } = useStore();
  const { pathname } = useLocation();
  useEffect(() => {
    const t = TITLES.find(([re]) => re.test(pathname))?.[1];
    document.title = t ? `${t} · Remitra` : 'Remitra';
  }, [pathname]);
  useEffect(() => {
    const h = document.documentElement;
    h.classList.toggle('text-large', data.prefs.textSize === 'large');
    h.classList.toggle('text-xl', data.prefs.textSize === 'xl');
    h.classList.toggle('reduce-motion', data.prefs.reducedMotion);
    h.classList.toggle('high-contrast', data.prefs.highContrast);
  }, [data.prefs]);

  if (!data.onboarded) {
    return (
      <Routes>
        <Route path="/welcome" element={<Onboarding />} />
        <Route path="/privacy" element={<Privacy standalone />} />
        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Routes>
    );
  }
  return (
    <AppShell>
      <ErrorBoundary resetKey={pathname}>
      <Routes>
        <Route path="/" element={<Navigate to="/today" replace />} />
        <Route path="/welcome" element={<Navigate to="/today" replace />} />
        <Route path="/today" element={<Today />} />
        <Route path="/log" element={<Log />} />
        <Route path="/log/meal/:mode" element={<MealLogger />} />
        <Route path="/log/meal/edit/:id" element={<MealLogger />} />
        <Route path="/log/checkin" element={<CheckIn />} />
        <Route path="/log/labs" element={<Labs />} />
        <Route path="/log/meds" element={<Medications />} />
        <Route path="/wearables" element={<Wearables />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/insights/ask" element={<Ask />} />
        <Route path="/insights/test-it" element={<TestIt />} />
        <Route path="/flare" element={<Flare />} />
        <Route path="/trends" element={<Trends />} />
        <Route path="/care" element={<CareTeam />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </ErrorBoundary>
    </AppShell>
  );
}
