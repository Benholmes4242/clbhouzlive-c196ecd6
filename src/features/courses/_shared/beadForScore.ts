import { SC_FILL_GOLD } from '@/features/courses/components/holes/_constants';

/**
 * beadForScore — the ONE trajectory-bead rule.
 *
 *   eagle or better   solid GOLD bead
 *   EVERYTHING ELSE   no bead
 *
 * BEADS MARK THE EXTRAORDINARY; COLOUR MARKS THE ORDINARY. Both curves that use
 * this are GRADED HOLE BY HOLE — gradeFor() in scorecard/TrajectoryLine and
 * courseled/RoundShape paints each hole's segment red under par, the even tone
 * at par, mute at bogey and ink at double-or-worse. A red bead on a red segment
 * and an ink bead on an ink segment were the same fact drawn twice.
 *
 * WHY GOLD SURVIVES: gradeFor returns UNDER_TONE for anything d <= -1, so an
 * ace, an albatross, an eagle and a birdie all render as the SAME red segment.
 * The stroke genuinely cannot distinguish them. Gold also is not a to-par colour
 * at all — SC_FILL_GOLD is broadcast gold, a separate family — so it does not
 * compete with the ramp the stroke is using.
 *
 * The bead follows the same par-relative band as the score mark: an ace on a
 * par three is an eagle, while an ace on a par four is an albatross.
 *
 * THE CONSUMERS ARE TWO: TrajectoryLine (which serves the scorecard sheet AND
 * the Clubhouse feed — feed/PostRoundCard renders TrajectoryLine itself, so it
 * is not a third implementation) and useRoundHoleShapes (the Discover tile).
 */

/* BEAD_OVER_DARK is GONE: it was the double-bogey bead's dark-surface tone and
   nothing else imported it. */

export interface Bead {
  tone: string;
  radius: number;
}

export function beadForScore(
  strokes: number | null | undefined,
  par: number | null | undefined,
  /** UNUSED: gold reads the same on light and dark. KEPT DELIBERATELY — both
   *  call sites pass it, and it is the seam where a dark variant would return
   *  if one is ever needed. */
  _surface: 'light' | 'dark' = 'light',
): Bead | null {
  if (strokes == null || par == null || strokes <= 0) return null;
  const d = strokes - par;
  if (d <= -2) return { tone: SC_FILL_GOLD, radius: 5 };
  return null;
}

export default beadForScore;
