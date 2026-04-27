/**
 * captainAnchor — shared rendering helpers for the College Franchise
 * captain context line and hero captain pill.
 *
 * The captain (top-earning alumnus) is the franchise's elevator pitch.
 * Per the College Franchise brief, the captain line is suppressed when
 * no single captain dominates by >20% margin over the runner-up — in
 * that case the row falls back to the {N} alumni subline and the hero
 * pill is omitted.
 *
 * Edge cases handled:
 * - runnerUpEarnings === null  → only one alumnus, treat as full
 *   dominance, render the captain.
 * - earnings <= 0              → divide-by-zero guard, suppress.
 * - runnerUpEarnings <= 0      → captain is the only earner, treat as
 *   full dominance, render.
 */

import type { FranchiseCaptain } from '../hooks/useFranchiseCaptains';

const MARGIN_THRESHOLD = 0.20;

/** Returns true when the captain dominates by strictly more than 20%. */
export function captainDominates(captain: FranchiseCaptain | undefined): boolean {
  if (!captain) return false;
  if (captain.earnings <= 0) return false;              // divide-by-zero + nothing to anchor
  if (captain.runnerUpEarnings === null) return true;   // sole alumnus
  if (captain.runnerUpEarnings <= 0) return true;       // captain is sole earner
  const margin = (captain.earnings - captain.runnerUpEarnings) / captain.earnings;
  return margin > MARGIN_THRESHOLD;
}

/** Compact USD: $1.2M / $850K / $1,200. Mirrors FranchiseCard.formatCompact. */
export function formatCaptainEarnings(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

/** Last-name shortener for tight pill copy ("Scottie Scheffler" → "Scheffler"). */
export function captainShortName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts.length >= 2 ? parts[parts.length - 1] : fullName;
}
