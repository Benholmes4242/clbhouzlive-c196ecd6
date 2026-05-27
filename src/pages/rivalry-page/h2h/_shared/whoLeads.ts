/**
 * whoLeads — compare a single stat between me and them.
 */
import type { H2HStatDef } from './h2hStats';

export type Winner = 'me' | 'them' | 'tie';

export function whoLeads(
  stat: H2HStatDef,
  me: unknown,
  them: unknown,
): { winner: Winner; diff: number } {
  if (stat.format === 'hot_flag') {
    if (me === 'HOT' && them !== 'HOT') return { winner: 'me', diff: 0 };
    if (them === 'HOT' && me !== 'HOT') return { winner: 'them', diff: 0 };
    return { winner: 'tie', diff: 0 };
  }

  const m = me as number | null | undefined;
  const t = them as number | null | undefined;

  if (m == null && t == null) return { winner: 'tie', diff: 0 };
  if (m == null) return { winner: 'them', diff: 0 };
  if (t == null) return { winner: 'me', diff: 0 };

  if (stat.format === 'count' || stat.format === 'high_better') {
    if (m > t) return { winner: 'me', diff: m - t };
    if (t > m) return { winner: 'them', diff: t - m };
    return { winner: 'tie', diff: 0 };
  }
  if (stat.format === 'low_better') {
    if (m < t) return { winner: 'me', diff: t - m };
    if (t < m) return { winner: 'them', diff: m - t };
    return { winner: 'tie', diff: 0 };
  }
  if (stat.format === 'delta_low_better') {
    if (m < t) return { winner: 'me', diff: Math.abs(t - m) };
    if (t < m) return { winner: 'them', diff: Math.abs(m - t) };
    return { winner: 'tie', diff: 0 };
  }
  return { winner: 'tie', diff: 0 };
}
