/** Clubhouse owns one visit object per mount, not per virtualized item. This
 * resolver owns eligibility only; storage and selection ordering are explicit
 * inputs outside it. No feed ranking or tournament status is rewritten. */
import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import type { CachedTournament } from '@/hooks/useTournamentsCache';
import type { PickRecord } from '@/features/tourhub/hooks/usePickInsights';
import { surnameOf } from '@/features/tourhub/_shared/playerName';
import { countInWords } from '@/features/tourhub/components/overview-v3/overviewTokens';

export const TOUR_DISPLAY = { pga: 'PGA Tour', lpga: 'LPGA Tour', euro: 'DP World Tour', champ: 'Champions Tour', pgad: 'Korn Ferry Tour' } as const;
export type SlotTour = keyof typeof TOUR_DISPLAY;
export type SlotState = 'preview' | 'live' | 'result';
export interface SlotTournament extends CachedTournament { locksAt: string | null }
export interface SlotPick { rank: number; playerId: string; playerName: string }
export interface SlotSelection { tournament: SlotTournament; tour: SlotTour; state: SlotState }
export type SlotPredictions = ReadonlyMap<string, readonly SlotPick[]>;
export type SlotBoards = ReadonlyMap<string, BoardEntry[]>;
const TOUR_ORDER: SlotTour[] = ['pga', 'lpga', 'euro', 'champ', 'pgad'];
const STATE_ORDER: SlotState[] = ['live', 'result', 'preview'];
export const CURSOR_KEY = 'clubhouse-tour-slot:cursor';
export function tourSlotPlacement(index: number, count: number) { return index === 12 && count > 12; }

/** Compare calendar days in London: midnight Wednesday is excluded, including BST. */
export function resultHeld(endDate: string, now: Date): boolean {
  const end = new Date(`${endDate.slice(0, 10)}T12:00:00Z`);
  if (!Number.isFinite(end.getTime())) return false;
  const untilTuesday = (2 - end.getUTCDay() + 7) % 7 || 7;
  end.setUTCDate(end.getUTCDate() + untilTuesday);
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (key: string) => parts.find(p => p.type === key)?.value ?? '';
  const today = `${part('year')}-${part('month')}-${part('day')}`;
  return today >= endDate.slice(0, 10) && today <= end.toISOString().slice(0, 10);
}
export function resolveTourSlot(tournaments: readonly SlotTournament[], predictions: SlotPredictions, leaderboards: SlotBoards, now: Date): SlotSelection[] {
  return tournaments.flatMap(tournament => {
    const tour = tournament.season.tour_name.toLowerCase();
    if (!TOUR_ORDER.includes(tour as SlotTour)) return [];
    const enough = (leaderboards.get(tournament.id) ?? []).filter(row => row.position != null).length >= 3;
    let state: SlotState | null = null;
    if ((tournament.status === 'closed' || tournament.status === 'complete') && resultHeld(tournament.end_date, now)) state = 'result';
    else if (tournament.status === 'inprogress' && enough) state = 'live';
    else if (predictions.has(tournament.id) &&
      ((tournament.status === 'scheduled' && (tournament.locksAt != null && now.getTime() < Date.parse(tournament.locksAt) || !enough)) ||
        (tournament.status === 'inprogress' && !enough))) state = 'preview';
    return state ? [{ tournament, tour: tour as SlotTour, state }] : [];
  });
}
export function orderTourSlots(list: SlotSelection[], selectedTour: string | null): SlotSelection[] {
  const order = TOUR_ORDER.includes(selectedTour as SlotTour) ? [selectedTour, ...TOUR_ORDER.filter(t => t !== selectedTour)] : TOUR_ORDER;
  return [...list].sort((a, b) => order.indexOf(a.tour) - order.indexOf(b.tour) || STATE_ORDER.indexOf(a.state) - STATE_ORDER.indexOf(b.state));
}
export function advanceTourSlotCursor(storage: Pick<Storage, 'getItem' | 'setItem'>): number {
  try {
    const raw = Number(storage.getItem(CURSOR_KEY) ?? 0);
    const cursor = Number.isSafeInteger(raw) && raw >= 0 ? raw : 0;
    storage.setItem(CURSOR_KEY, String(cursor + 1));
    return cursor;
  } catch { return 0; }
}
export function slotPosition(row: BoardEntry | undefined): string {
  if (!row) return '';
  const status = row.status?.toLowerCase();
  if (status === 'wd' || status === 'withdrawn') return 'WD';
  if (status === 'mc' || status === 'cut' || status === 'missed_cut') return 'MC';
  if (row.position == null) return '';
  if (row.position_tied) return `T${row.position}`;
  const n = row.position;
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] ?? 'th');
  return `${n}${suffix}`;
}
export function pickScore(row: BoardEntry | undefined): number | null {
  return slotPosition(row) === 'WD' ? null : row?.score ?? null;
}
export function chaserSentence(rows: BoardEntry[], t: (key: string, opts?: Record<string, unknown>) => string): string | null {
  const board = rows.filter(r => r.position != null).sort((a,b) => (a.position ?? 0) - (b.position ?? 0));
  const leader = board[0];
  if (!leader || leader.score == null || board.filter(r => r.position === leader.position).length !== 1) return null;
  const next = board.find(r => r.position !== leader.position);
  if (!next || next.score == null) return null;
  const gap = next.score - leader.score;
  if (gap <= 0) return null;
  const chasers = board.filter(r => r.position === next.position);
  const names = chasers.map(r => surnameOf(r.player?.full_name ?? r.team?.display_name ?? ''));
  const subject = chasers.length === 1 ? `${names[0]} is` : chasers.length === 2 ? `${names[0]} and ${names[1]} are` : `${chasers.length} players are`;
  return `${subject} ${gap === 1 ? 'a shot' : `${countInWords(gap, t).toLowerCase()} shots`} back.`;
}
/** ONE FIGURE OWNER: the slot's record line reads the same three fields the
 * Tour page's picks block reads (record.won, record.top10, record.event_count),
 * never record.best — that is the single best event, not the season. With no
 * event count the clause is omitted rather than invented. */
export function recordLine(tour: SlotTour, record: PickRecord | null | undefined): string | null {
  if (!record) return null;
  const base = `Our record on the ${TOUR_DISPLAY[tour]}: ${record.won} ${record.won === 1 ? 'win' : 'wins'}, ${record.top10} top 10s`;
  return record.event_count == null ? `${base}.` : `${base} from ${record.event_count} events.`;
}
export function bestOfThree(picks: readonly SlotPick[], board: BoardEntry[]): string | null {
  const ranked = picks.map(pick => ({ pick, row: board.find(row => row.player?.id === pick.playerId) }))
    .filter((p): p is { pick: SlotPick; row: BoardEntry } => !!p.row && p.row.position != null && !['WD','MC'].includes(slotPosition(p.row)))
    .sort((a,b) => (a.row.position ?? Infinity) - (b.row.position ?? Infinity));
  const best = ranked[0];
  if (!best) return null;
  const name = surnameOf(best.pick.playerName);
  return best.row.position === 1 ? `We picked the winner: ${name}.` : `Best of our three: ${name}, ${slotPosition(best.row)}.`;
}