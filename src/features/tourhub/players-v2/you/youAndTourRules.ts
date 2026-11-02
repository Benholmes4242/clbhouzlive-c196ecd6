/**
 * youAndTourRules — pure arithmetic for the "You and the tour" card (Players build 3).
 * The member's own hole mix weights both sides; negative gaps clamp to zero.
 * Visibility: signed in, at least MIN_ROUNDS member rounds, tour averages with players > 0.
 */
export type HoleType = 'p3' | 'p4' | 'p5';
export const HOLE_TYPES: HoleType[] = ['p3', 'p4', 'p5'];
export const HOLE_NAME: Record<HoleType, string> = { p3: 'Par 3s', p4: 'Par 4s', p5: 'Par 5s' };
export const MIN_ROUNDS = 5;
export const LEADER_MIN_ROUNDS = 30;

export interface MyScoring { rounds: number; holes_par3: number; holes_par4: number; holes_par5: number; par3: number; par4: number; par5: number; bogey_rate: number }
export interface TourAverages { players: number; par3: number; par4: number; par5: number; bogey_rate: number }

export const mine = (m: MyScoring, k: HoleType) => (k === 'p3' ? m.par3 : k === 'p4' ? m.par4 : m.par5);
export const tours = (t: TourAverages, k: HoleType) => (k === 'p3' ? t.par3 : k === 'p4' ? t.par4 : t.par5);

export function holesPerRound(m: MyScoring, k: HoleType): number {
  if (!m.rounds) return 0;
  const h = k === 'p3' ? m.holes_par3 : k === 'p4' ? m.holes_par4 : m.holes_par5;
  return h / m.rounds;
}

export function shotsLost(m: MyScoring, t: TourAverages, k: HoleType): number {
  return Math.max(0, (mine(m, k) - tours(t, k)) * holesPerRound(m, k));
}

export interface Breakdown { lost: Record<HoleType, number>; total: number; costliest: HoleType }

export function breakdown(m: MyScoring, t: TourAverages): Breakdown {
  const lost = { p3: shotsLost(m, t, 'p3'), p4: shotsLost(m, t, 'p4'), p5: shotsLost(m, t, 'p5') };
  const costliest = HOLE_TYPES.reduce((a, b) => (lost[b] > lost[a] ? b : a), 'p3' as HoleType);
  return { lost, total: lost.p3 + lost.p4 + lost.p5, costliest };
}

export const AMBER_SEG = '#F7931E';
export const SEG_SMALL = 'rgba(248,250,252,0.45)';
export const SEG_LARGE = 'rgba(248,250,252,0.75)';

/** Costliest amber; of the other two the smaller 0.45, the larger 0.75. */
export function segmentColours(lost: Record<HoleType, number>, costliest: HoleType): Record<HoleType, string> {
  const [a, b] = HOLE_TYPES.filter((k) => k !== costliest);
  const smaller = lost[a] <= lost[b] ? a : b;
  const larger = smaller === a ? b : a;
  return { [costliest]: AMBER_SEG, [smaller]: SEG_SMALL, [larger]: SEG_LARGE } as Record<HoleType, string>;
}

/** "1 hole in x" below 0.5, "z in 10" from 0.5. */
export function dropRate(r: number): string {
  if (r < 0.5) return `1 hole in ${Math.round(1 / r)}`;
  return `${Math.round(r * 10)} in 10`;
}

/** "1 in y" for the tour clause (the mock drops "hole" after the first sentence). */
export function oneIn(r: number): string {
  return `1 in ${Math.round(1 / r)}`;
}

/** "+0.82", "−0.06" (true minus), "0.00" when |x| < 0.005. */
export function signed(x: number): string {
  if (Math.abs(x) < 0.005) return '0.00';
  return `${x > 0 ? '+' : '\u2212'}${Math.abs(x).toFixed(2)}`;
}

export function isVisible(args: { signedIn: boolean; mine?: MyScoring | null; tour?: TourAverages | null }): boolean {
  return !!(args.signedIn && args.mine && args.mine.rounds >= MIN_ROUNDS && args.tour && args.tour.players > 0);
}

export type Seg = { text: string; bold?: boolean };

/** The foot. Leader sentence only when the leader has LEADER_MIN_ROUNDS or more rounds with a bogey rate. */
export function footLine(args: { leaderName?: string | null; leaderBogey?: number | null; leaderRounds?: number | null; tourBogey: number; myBogey: number }, surname: (n: string) => string): Seg[] {
  const tail: Seg[] = [{ text: '. You, ' }, { text: dropRate(args.myBogey), bold: true }, { text: '. Tour courses play longer than yours, so the real gap is bigger.' }];
  const hasLeader = !!args.leaderName && args.leaderBogey != null && args.leaderBogey > 0 && (args.leaderRounds ?? 0) >= LEADER_MIN_ROUNDS;
  if (hasLeader) {
    return [
      { text: `${surname(args.leaderName!)} drops a shot on ` }, { text: dropRate(args.leaderBogey!), bold: true },
      { text: '. The tour, ' }, { text: oneIn(args.tourBogey), bold: true }, ...tail,
    ];
  }
  return [{ text: 'The tour drops a shot on ' }, { text: dropRate(args.tourBogey), bold: true }, ...tail];
}
