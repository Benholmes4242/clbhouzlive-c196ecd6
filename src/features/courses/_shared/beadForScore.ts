import { SC_FILL_GOLD } from '@/features/courses/components/holes/_constants';
import { TOPAR_UNDER_LIGHT, TOPAR_OVER_LIGHT } from '@/features/tourhub/_shared/tokens';

/**
 * beadForScore — the ONE trajectory-bead rule (CORRECTION_ONE_SCORING_MARK §5).
 *
 * Shared by the sheet trajectory (scorecard/TrajectoryLine) and the Clubhouse
 * feed trajectory (PostRoundCard) so identical scores plot identically.
 *
 *   ace / albatross   solid GOLD bead, larger
 *   eagle             red bead, larger
 *   birdie            red bead
 *   par               no bead
 *   bogey             NO BEAD (deliberate — see §5b)
 *   double or worse   over-par ink bead, surface-dependent
 *
 * Concessions to a ~4px bead: an eagle is a larger red bead (not concentric
 * rings) and an ace/albatross is a solid gold bead (not a gold ring). The
 * 26px card mark keeps the ring — same grammar, adapted to the space.
 */

export const BEAD_OVER_DARK = '#F2F4F7';

export interface Bead {
  tone: string;
  radius: number;
}

export function beadForScore(
  strokes: number | null | undefined,
  par: number | null | undefined,
  surface: 'light' | 'dark' = 'light',
): Bead | null {
  if (strokes == null || par == null || strokes <= 0) return null;
  const d = strokes - par;
  if (strokes === 1 || d <= -3) return { tone: SC_FILL_GOLD, radius: 5 };
  if (d === -2) return { tone: TOPAR_UNDER_LIGHT, radius: 5 };
  if (d === -1) return { tone: TOPAR_UNDER_LIGHT, radius: 3.6 };
  if (d >= 2) {
    return { tone: surface === 'dark' ? BEAD_OVER_DARK : TOPAR_OVER_LIGHT, radius: 3.6 };
  }
  return null;
}

export default beadForScore;
