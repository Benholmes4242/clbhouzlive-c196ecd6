/**
 * headToHeadRules - HH3 pure rules for the Head to head sheet and the profile
 * entry row. Data in, data out: leader/dim decisions, bar shares, the entry
 * sentence and the course-by-course grouping all live here once, so the sheet,
 * the entry row and their tests cannot disagree.
 *
 * NO AMBER. Every figure is white; the leader is full white, the other dimmed.
 */
import type { SharedRoundResult } from '@/lib/whs/api';

export const HH_INK = '#F8FAFC';
export const HH_DIM = 'rgba(248,250,252,0.45)';
export const HH_BAR_OTHER = 'rgba(255,255,255,0.25)';

export type Polarity = 'high' | 'low';
export type Leader = 'me' | 'them' | 'tie' | 'none';

/** Who leads a paired figure. Missing on either side = 'none' (no bar, "–"). */
export function leaderOf(pol: Polarity, me: number | null | undefined, them: number | null | undefined): Leader {
  if (me == null || them == null || !Number.isFinite(me) || !Number.isFinite(them)) return 'none';
  if (me === them) return 'tie';
  if (pol === 'high') return me > them ? 'me' : 'them';
  return me < them ? 'me' : 'them';
}

/** The viewer's share of the two-segment bar; low-better stats use the inverse. */
export function shareOf(pol: Polarity, me: number, them: number): number {
  if (pol === 'high') {
    const tot = me + them;
    return tot > 0 ? me / tot : 0.5;
  }
  if (me <= 0 || them <= 0) return 0.5;
  const a = 1 / me;
  const b = 1 / them;
  return a / (a + b);
}

/** Figure paint: leader (or tie) full white 700; the other 45% at 500. */
export function figurePaint(side: 'me' | 'them', leader: Leader): { color: string; fontWeight: number } {
  const bright = leader === 'tie' || leader === 'none' || leader === side;
  return bright ? { color: HH_INK, fontWeight: 700 } : { color: HH_DIM, fontWeight: 500 };
}

export function fmtGap(v: number): string {
  return Math.abs(Math.round(v * 10) / 10).toFixed(1);
}

/** "{n} rounds together · you're {gap} lower|higher|level" / "Never played together · {gap} apart". */
export function entryLine(
  roundsTogether: number,
  viewerIndex: number | null | undefined,
  memberIndex: number | null | undefined,
): string {
  const hasGap = viewerIndex != null && memberIndex != null;
  const diff = hasGap ? Math.round(((viewerIndex as number) - (memberIndex as number)) * 10) / 10 : 0;
  if (roundsTogether <= 0) {
    return hasGap ? `Never played together \u00B7 ${fmtGap(diff)} apart` : 'Never played together';
  }
  const lead = `${roundsTogether} ${roundsTogether === 1 ? 'round' : 'rounds'} together`;
  if (!hasGap) return lead;
  if (diff === 0) return `${lead} \u00B7 you're level`;
  return `${lead} \u00B7 you're ${fmtGap(diff)} ${diff < 0 ? 'lower' : 'higher'}`;
}

export interface Record3 { wins: number; ties: number; losses: number }

export function recordLeadLine(r: Record3, first: string): string {
  if (r.wins > r.losses) return 'You lead';
  if (r.losses > r.wins) return `${first} leads`;
  return 'All square';
}

export interface CourseGroup {
  courseId: string;
  courseName: string;
  rounds: SharedRoundResult[]; // newest first
  gross: Record3;
  points: Record3;
}

function tally(rows: SharedRoundResult[], key: 'gross_outcome' | 'stableford_outcome'): Record3 {
  const r = { wins: 0, ties: 0, losses: 0 };
  for (const x of rows) {
    if (x[key] === 'W') r.wins++;
    else if (x[key] === 'L') r.losses++;
    else r.ties++;
  }
  return r;
}

/** Group shared rounds by course_id, busiest first (ties: most recent first). */
export function groupByCourse(rows: SharedRoundResult[]): CourseGroup[] {
  const map = new Map<string, SharedRoundResult[]>();
  for (const r of rows) {
    const id = r.course_id ?? r.course_name ?? '';
    const list = map.get(id) ?? [];
    list.push(r);
    map.set(id, list);
  }
  const groups: CourseGroup[] = [];
  for (const [courseId, list] of map) {
    const sorted = [...list].sort((a, b) => (a.play_date < b.play_date ? 1 : a.play_date > b.play_date ? -1 : 0));
    groups.push({
      courseId,
      courseName: sorted[0]?.course_name ?? '',
      rounds: sorted,
      gross: tally(sorted, 'gross_outcome'),
      points: tally(sorted, 'stableford_outcome'),
    });
  }
  return groups.sort((a, b) =>
    b.rounds.length - a.rounds.length || (a.rounds[0]?.play_date < b.rounds[0]?.play_date ? 1 : -1),
  );
}

/** "2 Nov" from an ISO date, read as a calendar date (no timezone shift). */
export function shortDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  if (!m) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${Number(m[3])} ${months[Number(m[2]) - 1] ?? ''}`;
}

export interface GamLike {
  gross_score: number | null;
  stableford_points: number | null;
  holes_played?: number | null;
  course_id?: string | null;
}

const isEighteen = (r: GamLike) => (r.holes_played ?? 18) === 18;

/** Averages over 18-hole rounds only, one decimal. */
export function averages(rows: GamLike[]): { avgGross: number | null; avgPoints: number | null } {
  const e = rows.filter(isEighteen);
  const mean = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);
  return {
    avgGross: mean(e.map((r) => r.gross_score).filter((n): n is number => n != null && Number.isFinite(n))),
    avgPoints: mean(e.map((r) => r.stableford_points).filter((n): n is number => n != null && Number.isFinite(n))),
  };
}

export type CourseBests = Record<string, { gross: number | null; points: number | null }>;

/** Lowest gross and best points per course, from that player's 18-hole rounds there. */
export function courseBests(rows: GamLike[]): CourseBests {
  const out: CourseBests = {};
  for (const r of rows.filter(isEighteen)) {
    if (!r.course_id) continue;
    const cur = out[r.course_id] ?? { gross: null, points: null };
    if (r.gross_score != null && (cur.gross == null || r.gross_score < cur.gross)) cur.gross = r.gross_score;
    if (r.stableford_points != null && (cur.points == null || r.stableford_points > cur.points)) cur.points = r.stableford_points;
    out[r.course_id] = cur;
  }
  return out;
}
