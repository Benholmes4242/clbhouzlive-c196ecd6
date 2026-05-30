/**
 * Pure headline engine for the Rival Fight Card.
 *
 * Pick the headline for a rival card. Priority order:
 *
 *  1. CROWN SUPREMACY — if you hold any crown with dominance ≥ 0.8,
 *     it becomes the headline. (e.g. 11-0 eagles trumps everything.)
 *
 *  2. STREAK NARRATIVE — when no crown is dominant:
 *     - Win streak ≥ 10  → "TOTAL DOMINANCE"
 *     - Win streak ≥ 5   → "ON A TEAR"
 *
 *  3. UNDERDOG RESCUE — when you're on a 5+ loss streak BUT you hold
 *     any crown with dominance ≥ 0.3, celebrate the crown instead of
 *     "TIME TO STRIKE BACK". This stops the card punching down on the
 *     user when they have something genuine to feel good about.
 *
 *  4. RELATIONSHIP NARRATIVE — fallback: "YOU OWN HIM" (>70% W/L),
 *     "HE OWNS YOU" (<30%), or "A REAL RIVALRY" in between.
 */

export interface RivalCrowns {
  rival_key: string;
  lowest_gross_you: number | null;
  lowest_gross_them: number | null;
  birdies_you: number;
  birdies_them: number;
  eagles_you: number;
  eagles_them: number;
  aces_you: number;
  aces_them: number;
}

export const emptyCrowns = (rivalKey = ''): RivalCrowns => ({
  rival_key: rivalKey,
  lowest_gross_you: null,
  lowest_gross_them: null,
  birdies_you: 0,
  birdies_them: 0,
  eagles_you: 0,
  eagles_them: 0,
  aces_you: 0,
  aces_them: 0,
});

export type CrownKey = 'gross' | 'birdies' | 'eagles' | 'aces';

// Tunable thresholds — adjust here as real-world data evolves.
const SUPREMACY_THRESHOLD = 0.8;
const RESCUE_THRESHOLD = 0.3;

export function dominance(
  you: number | null | undefined,
  them: number | null | undefined,
  compareKind: 'higher' | 'lower',
): number {
  if (compareKind === 'lower') {
    if (you == null || them == null || them === 0) return 0;
    if (you >= them) return 0;
    return Math.max(0, Math.min(1, (them - you) / them));
  }
  const y = you ?? 0;
  const t = them ?? 0;
  if (y === 0 && t === 0) return 0;
  if (y <= t) return 0;
  const total = y + t;
  return Math.max(0, Math.min(1, (y - t) / total));
}

export interface CrownInfo {
  key: CrownKey;
  label: string;        // "GROSS", "BIRDIES", "EAGLES", "ACES"
  holder: 'you' | 'them' | 'even';
  you: number | null;
  them: number | null;
  /** Holder's dominance score in [0,1]. 0 when even. */
  dominance: number;
  /** Whether smaller is better (gross) or larger is better (sums). */
  compareKind: 'higher' | 'lower';
}

export function computeCrowns(c: RivalCrowns): CrownInfo[] {
  const make = (
    key: CrownKey,
    label: string,
    you: number | null,
    them: number | null,
    compareKind: 'higher' | 'lower',
  ): CrownInfo => {
    let holder: 'you' | 'them' | 'even' = 'even';
    let dom = 0;
    if (compareKind === 'lower') {
      if (you != null && them != null) {
        if (you < them) {
          holder = 'you';
          dom = dominance(you, them, 'lower');
        } else if (them < you) {
          holder = 'them';
          dom = dominance(them, you, 'lower');
        }
      } else if (you != null && them == null) {
        holder = 'you';
        dom = 0.5;
      } else if (them != null && you == null) {
        holder = 'them';
        dom = 0.5;
      }
    } else {
      const y = you ?? 0;
      const t = them ?? 0;
      if (y === 0 && t === 0) {
        holder = 'even';
      } else if (y > t) {
        holder = 'you';
        dom = dominance(y, t, 'higher');
      } else if (t > y) {
        holder = 'them';
        dom = dominance(t, y, 'higher');
      }
    }
    return { key, label, holder, you, them, dominance: dom, compareKind };
  };

  return [
    make('gross',   'GROSS',   c.lowest_gross_you, c.lowest_gross_them, 'lower'),
    make('birdies', 'BIRDIES', c.birdies_you,      c.birdies_them,      'higher'),
    make('eagles',  'EAGLES',  c.eagles_you,       c.eagles_them,       'higher'),
    make('aces',    'ACES',    c.aces_you,         c.aces_them,         'higher'),
  ];
}

export type HeadlineKind =
  | 'crown_supremacy'
  | 'total_dominance'
  | 'on_a_tear'
  | 'underdog_rescue'
  | 'you_own_him'
  | 'he_owns_you'
  | 'real_rivalry'
  | 'strike_back'
  | 'getting_started';

export interface Headline {
  kind: HeadlineKind;
  title: string;
  sub?: string;
  /** When supremacy/rescue picked a crown, this is it (useful for accent styling). */
  crown?: CrownInfo;
}

export interface HeadlineInputs {
  crowns: RivalCrowns;
  wins: number;
  losses: number;
  /** Current win streak length from your POV; positive = you, negative = them. 0 = no streak. */
  streak: number;
}

function crownTitle(c: CrownInfo): string {
  switch (c.key) {
    case 'gross':   return 'KING OF GROSS';
    case 'birdies': return 'KING OF BIRDIES';
    case 'eagles':  return 'KING OF EAGLES';
    case 'aces':    return 'KING OF ACES';
  }
}

function crownSub(c: CrownInfo): string {
  if (c.compareKind === 'lower') {
    return `${c.you ?? '—'} vs ${c.them ?? '—'}`;
  }
  return `${c.you ?? 0} to ${c.them ?? 0}`;
}

export function pickHeadline({ crowns, wins, losses, streak }: HeadlineInputs): Headline {
  const all = computeCrowns(crowns);
  const yours = all.filter((c) => c.holder === 'you');
  const topYours = [...yours].sort((a, b) => b.dominance - a.dominance)[0];

  // 1. CROWN SUPREMACY
  if (topYours && topYours.dominance >= SUPREMACY_THRESHOLD) {
    return {
      kind: 'crown_supremacy',
      title: crownTitle(topYours),
      sub: crownSub(topYours),
      crown: topYours,
    };
  }

  // 2. STREAK NARRATIVE (win streaks)
  if (streak >= 10) {
    return { kind: 'total_dominance', title: 'TOTAL DOMINANCE', sub: `${streak} in a row` };
  }
  if (streak >= 5) {
    return { kind: 'on_a_tear', title: 'ON A TEAR', sub: `${streak}-round win streak` };
  }

  // 3. UNDERDOG RESCUE — on a 5+ loss streak but holds a meaningful crown
  if (streak <= -5 && topYours && topYours.dominance >= RESCUE_THRESHOLD) {
    return {
      kind: 'underdog_rescue',
      title: crownTitle(topYours),
      sub: crownSub(topYours),
      crown: topYours,
    };
  }

  // Otherwise, the loss streak narrative if it's bad
  if (streak <= -5) {
    return { kind: 'strike_back', title: 'TIME TO STRIKE BACK', sub: `${-streak}-round skid` };
  }

  // 4. RELATIONSHIP NARRATIVE
  const total = wins + losses;
  if (total === 0) {
    return { kind: 'getting_started', title: 'GETTING STARTED', sub: 'No rounds yet' };
  }
  const winRate = wins / total;
  if (winRate > 0.7) {
    return { kind: 'you_own_him', title: 'YOU OWN HIM', sub: `${wins}–${losses} all-time` };
  }
  if (winRate < 0.3) {
    return { kind: 'he_owns_you', title: 'HE OWNS YOU', sub: `${wins}–${losses} all-time` };
  }
  return { kind: 'real_rivalry', title: 'A REAL RIVALRY', sub: `${wins}–${losses} all-time` };
}
