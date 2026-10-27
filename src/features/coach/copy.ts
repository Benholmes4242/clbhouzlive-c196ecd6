import { formatHcp } from '@/lib/formatHcp';
import { coachWhen, type MyCoach } from './contracts';
type T = (key: string, options?: Record<string, unknown>) => string;
export function coachSentences(coach: MyCoach, name: string, t: T, now = new Date()) {
  const when = coachWhen(coach.started_at, now);
  const first = t('coach.you', { name, when: t(`coach.when.${when.key}`, when) });
  let second = t('coach.nextRound');
  if (coach.measured && coach.change != null) {
    const values = { change: Math.abs(coach.change).toFixed(1), start: formatHcp(coach.start_index), current: formatHcp(coach.current_index) };
    second = t(coach.change <= -0.1 ? 'coach.downSince' : coach.change >= 0.1 ? 'coach.upSince' : 'coach.levelSince', values);
  }
  return { first, second };
}
export function coachProgress(change: number | null, t: T) {
  return t(change == null ? 'coach.progressNext' : change <= -0.1 ? 'coach.progressDown' : change >= 0.1 ? 'coach.progressUp' : 'coach.progressLevel', { change: change == null ? '' : Math.abs(change).toFixed(1) });
}
