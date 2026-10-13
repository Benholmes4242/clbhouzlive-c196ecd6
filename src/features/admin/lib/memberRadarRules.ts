/**
 * BRIEF_MEMBERS_RADAR spec points 4–6, as pure rules the Member and Behaviour
 * screens read. Nothing here recomputes a duration from timestamps: seconds
 * are summed only where the spec says to merge, and are the server's seconds.
 */
import type { SessionStep } from '../hooks/useMembersRadar';

/** 4 — the index shows only for a connected handicap; otherwise an em dash. */
export function memberIndexText(index: number | null | undefined, connected: boolean | null | undefined): string {
  if (!connected || index == null || !Number.isFinite(index)) return '—';
  return index.toFixed(1);
}

/** 5 — the chart line ends on today's index. When the last point is older
 *  than today and differs from profile.index, append today at profile.index. */
export function indexSeriesToToday(
  series: { date: string; index: number }[],
  profileIndex: number | null | undefined,
  today: string = new Date().toISOString().slice(0, 10),
): { date: string; index: number }[] {
  if (profileIndex == null || !Number.isFinite(profileIndex) || series.length === 0) return series;
  const last = series[series.length - 1];
  if (last.date.slice(0, 10) < today && last.index !== profileIndex) {
    return [...series, { date: today, index: profileIndex }];
  }
  return series;
}

/** 6 — consecutive screen steps with the same label merge into one, seconds
 *  summed. Events between them keep their order and do not break the merge. */
export function mergeSessionSteps(steps: SessionStep[]): SessionStep[] {
  const out: SessionStep[] = [];
  let lastScreenIdx = -1;
  for (const step of steps) {
    if (step.kind === 'screen') {
      const prev = lastScreenIdx >= 0 ? out[lastScreenIdx] : null;
      if (prev && prev.label === step.label) {
        out[lastScreenIdx] = { ...prev, seconds: (prev.seconds ?? 0) + (step.seconds ?? 0) };
        continue;
      }
      out.push({ ...step });
      lastScreenIdx = out.length - 1;
    } else {
      out.push(step);
    }
  }
  return out;
}
