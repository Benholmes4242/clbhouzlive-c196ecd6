/**
 * Format thru/status display with fallback derivation from round scores.
 * Primary: uses thru/status from sr_leaderboards.
 * Fallback: derives from round_N fields when thru is null.
 */

export function getCurrentRound(
  r1: number | null | undefined,
  r2: number | null | undefined,
  r3: number | null | undefined,
  r4: number | null | undefined
): { number: number; isComplete: boolean } {
  if (r4 != null) return { number: 4, isComplete: true };
  if (r3 != null) return { number: 3, isComplete: true };
  if (r2 != null) return { number: 2, isComplete: true };
  if (r1 != null) return { number: 1, isComplete: true };
  return { number: 0, isComplete: false };
}

export function formatThruDisplay(
  thru: number | null | undefined,
  round1: number | null | undefined,
  round2: number | null | undefined,
  round3: number | null | undefined,
  round4: number | null | undefined,
  status: string | null | undefined
): string {
  // 1. Status-based indicators (cut/wd/dq)
  if (status === 'cut') return 'MC';
  if (status === 'wd' || status === 'WD') return 'WD';
  if (status === 'dq' || status === 'DQ') return 'DQ';
  if (status === 'mdf' || status === 'MDF') return 'MDF';

  // 2. If thru is populated, use it directly
  if (thru != null && thru >= 18) return 'F';
  if (thru != null && thru > 0) return `thru ${thru}`;

  // 3. Fallback: derive from round_N fields
  const currentRound = getCurrentRound(round1, round2, round3, round4);
  if (currentRound.isComplete) return 'F';
  if (currentRound.number > 0) return `R${currentRound.number}`;

  // 4. Nothing available
  return '';
}
