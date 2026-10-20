import { playDateAtLocalNoon } from './discoverWhen';
import type { StandoutRound } from './hooks/useStandoutRounds';

/** Calendar-day arithmetic, independent of daylight-saving transitions. */
function calendarDay(iso: string): number {
  const date = playDateAtLocalNoon(iso);
  return date ? Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000 : NaN;
}

export function standoutSentenceParts(row: StandoutRound, locale = 'en') {
  const course = row.course_name ?? '';
  if (row.last_better == null) {
    return { key: 'amateur.standout.bestEver', defaultValue: 'Best ever at {{course}}', course };
  }
  const play = playDateAtLocalNoon(row.play_date);
  const better = playDateAtLocalNoon(row.last_better);
  if (play && better && calendarDay(row.play_date) - calendarDay(row.last_better) >= 60) {
    const month = better.toLocaleDateString(locale, {
      month: 'long',
      ...(better.getFullYear() !== play.getFullYear() ? { year: 'numeric' as const } : {}),
    });
    return { key: 'amateur.standout.bestSince', defaultValue: 'Best at {{course}} since {{month}}', course, month };
  }
  return { key: 'amateur.standout.betterAverage', defaultValue: '{{n}} shots better than average at {{course}}', course, n: Math.round(Math.abs(row.delta ?? 0)) };
}
