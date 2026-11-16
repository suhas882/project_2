/* Which check-in modules are due. Shared by the Today card and the check-in flow so they always agree. */
import type { AppData } from '../types.ts';
import { addDays } from './dates.ts';

export interface CheckinPlan {
  rapid3Due: boolean;
  hbiDue: boolean;
  promisDue: boolean;
  /** plain-language list for the Today card, e.g. "weekly RAPID3 and Crohn's questions" */
  summary: string;
}

export function checkinPlan(data: Pick<AppData, 'profile' | 'rapid3' | 'hbi' | 'promis'>, today: string): CheckinPlan {
  const weekly = (last?: { date: string }) => !last || last.date <= addDays(today, -7) || last.date === today;
  const rapid3Due = data.profile.conditions.includes('ra') && weekly(data.rapid3[data.rapid3.length - 1]);
  const hbiDue = data.profile.conditions.includes('crohns') && weekly(data.hbi[data.hbi.length - 1]);
  const lastPromis = data.promis[data.promis.length - 1];
  const promisDue = !lastPromis || lastPromis.date <= addDays(today, -28);
  const parts = [
    rapid3Due && 'weekly RAPID3',
    hbiDue && "weekly Crohn's (Harvey-Bradshaw) questions",
    promisDue && 'a monthly PROMIS-29 notice',
  ].filter(Boolean) as string[];
  const summary = parts.length === 0 ? '' : parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
  return { rapid3Due, hbiDue, promisDue, summary };
}
