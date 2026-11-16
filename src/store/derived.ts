import { useMemo } from 'react';
import { useStore, useToday } from './store';
import { computeInsights, dailyExposures, flareOutlook } from '@/services/analytics';

export function useInsights() {
  const { data } = useStore();
  return useMemo(() => computeInsights(data), [data.meals, data.symptoms, data.wearables]); // eslint-disable-line react-hooks/exhaustive-deps
}

export function useFlare() {
  const { data } = useStore();
  const today = useToday();
  return useMemo(() => flareOutlook(data, today), [data.meals, data.symptoms, data.wearables, data.flares, today]); // eslint-disable-line react-hooks/exhaustive-deps
}

export function useExposures() {
  const { data } = useStore();
  return useMemo(() => dailyExposures(data.meals), [data.meals]);
}
