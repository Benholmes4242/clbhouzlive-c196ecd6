/** Feed-only lead copy is derived from the loaded board and schedule. Shared
 * heroRoundScore owns today's score; London calendar dates own countdowns.
 * No tournament/engagement reads or shared hero geometry belong here. */
import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import { heroRoundScore } from '@/features/tourhub/tournament-v2/sections/HeroBoardRows';
import { roundsFromSchedule } from '@/features/tourhub/components/overview-v3/HybridHero.utils';
import { countInWords } from '@/features/tourhub/components/overview-v3/overviewTokens';
import { surnameOf } from '@/features/tourhub/_shared/playerName';
import { fmtScore } from '@/features/tourhub/utils/fmtScore';
import type { SlotSelection } from './tourSlotRules';
import { effectiveCurrentRound } from '@/features/tourhub/components/overview-v3/liveStateRules';

type Translate = (key: string, opts?: Record<string, unknown>) => string;
export const slotPlayerName = (row: BoardEntry) => row.player?.full_name ?? row.team?.display_name ?? '';
export const slotPositionedRows = (board: BoardEntry[]) => board.filter(row => row.position != null).sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity));
export function slotPlayedRound(board: BoardEntry[], round: number) {
  return Math.max(round, ...board.map(row => row.round_4 != null ? 4 : row.round_3 != null ? 3 : row.round_2 != null ? 2 : 1));
}
export function slotDateLabel(date: string, long = false) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', weekday: long ? 'long' : 'short', day: 'numeric', month: 'short' }).format(new Date(`${date.slice(0, 10)}T12:00:00Z`)).replace(',', '');
}
export function slotDaysUntil(start: string, now: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (key: string) => parts.find(p => p.type === key)?.value ?? '';
  const today = Date.parse(`${part('year')}-${part('month')}-${part('day')}T00:00:00Z`);
  return Math.max(0, Math.round((Date.parse(`${start.slice(0, 10)}T00:00:00Z`) - today) / 86_400_000));
}
export interface SlotLead {
  kind: 'leader' | 'joint' | 'winner' | 'first-tee';
  avatars: BoardEntry[];
  heading: string;
  name: string;
  detail: string | null;
  score: number | null;
  figure: string;
  figureLabel: string | null;
  today: boolean;
}
export function slotLead(selection: SlotSelection, board: BoardEntry[], t: Translate, now = new Date()): SlotLead | null {
  const { tournament: event, state } = selection;
  // The provider's round capped by the loaded scores (shared overview rule).
  const round = effectiveCurrentRound(event.current_round, board);
  if (state === 'preview') {
    const days = slotDaysUntil(event.start_date, now);
    return { kind: 'first-tee', avatars: [], heading: t('slot.firstTee'), name: slotDateLabel(event.start_date, true),
      detail: t('slot.previewRounds', { rounds: roundsFromSchedule(event.start_date, event.end_date), date: slotDateLabel(event.end_date) }),
      score: null, figure: days === 0 ? t('slot.today') : String(days), figureLabel: days === 0 ? null : t(days === 1 ? 'slot.day' : 'slot.days'), today: days === 0 };
  }
  const rows = slotPositionedRows(board);
  const first = rows[0];
  if (!first) return null;
  const leaders = rows.filter(row => row.position === first.position);
  const next = rows.find(row => row.position !== first.position);
  const gap = first.score != null && next?.score != null ? next.score - first.score : null;
  const joint = leaders.length > 1;
  let heading: string;
  let detail: string | null = null;
  if (joint) {
    heading = t(state === 'result' ? 'slot.jointWinners' : 'slot.jointLeaders');
    if (gap != null && gap > 0) detail = gap === 1 ? t('slot.aShotClear') : t('slot.shotsClear', { count: countInWords(gap, t) });
  } else if (state === 'result') {
    heading = gap === 0 ? t('slot.wonPlayoff') : gap != null && gap > 0 ? t('slot.wonBy', { gap }) : t('slot.winner');
    const lastScore = [first.round_1, first.round_2, first.round_3, first.round_4].filter(score => score != null).at(-1);
    if (lastScore != null) detail = t('slot.finalRoundScore', { score: fmtScore(lastScore) });
  } else {
    heading = gap != null && gap > 0 ? t('slot.leadsBy', { gap }) : t('slot.leading');
    const today = heroRoundScore(first, round, round);
    detail = today == null ? t('slot.yetToStart', { round }) : t('slot.scoreToday', { score: fmtScore(today) });
    if (today != null && first.thru != null) {
      if (first.thru >= 1 && first.thru <= 17) detail += ` · ${t('slot.thru', { thru: first.thru })}`;
      else if (first.thru === 18) detail += ` · ${t('slot.finished')}`;
    }
  }
  return { kind: joint ? 'joint' : state === 'result' ? 'winner' : 'leader', avatars: leaders.slice(0, 3), heading,
    name: joint ? leaders.length === 2 ? leaders.map(row => surnameOf(slotPlayerName(row))).join(' & ') : t('slot.jointPlayers', { count: countInWords(leaders.length, t) }) : slotPlayerName(first),
    detail, score: first.score, figure: first.score == null ? '' : fmtScore(first.score), figureLabel: null, today: false };
}