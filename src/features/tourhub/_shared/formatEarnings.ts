/**
 * formatEarnings - the single money formatter for alumni/season earnings.
 *
 * Lifted out of YearbookCard/CollegeHeroMasthead (which each declared their
 * own copy under the misleading name formatPoints). Delegates to formatPurse
 * for the K/M thresholds so this codebase keeps ONE money implementation, and
 * only adds the sub-1000 case that formatPurse does not cover.
 */
import { formatPurse } from './formatPurse';

export function formatEarnings(n: number | null | undefined): string {
  if (!n || n <= 0) return '$0';
  if (n < 1_000) return `$${Math.round(n)}`;
  return formatPurse(Math.round(n));
}
