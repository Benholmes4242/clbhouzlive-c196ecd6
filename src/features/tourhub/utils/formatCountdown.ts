/**
 * formatCountdown — short relative-time helper for nav teasers.
 *
 * Produces strings like:
 *   "3d 17h"   (≥ 1 day)
 *   "2h 14m"   (≥ 1 hour, < 1 day)
 *   "47m"      (≥ 1 minute, < 1 hour)
 *   "now"      (≤ 0 / past)
 *
 * Date-only ISO inputs ("YYYY-MM-DD") are interpreted as UTC midnight
 * — same convention as `useCountdown` to avoid timezone drift.
 *
 * NOTE: This is a pure formatter, not a hook. Use it for one-shot display
 * in surfaces like the nav menu where a live-ticking countdown isn't needed.
 * For live-ticking displays, use `useCountdown` from `@/hooks/useCountdown`.
 */
export function formatCountdown(startDate: Date | string | null | undefined): string | null {
  if (!startDate) return null;

  let target: Date;
  if (startDate instanceof Date) {
    target = startDate;
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    target = new Date(`${startDate}T00:00:00.000Z`);
  } else {
    target = new Date(startDate);
  }

  const diffMs = target.getTime() - Date.now();
  if (!isFinite(diffMs) || diffMs <= 0) return 'now';

  const totalMinutes = Math.floor(diffMs / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days >= 1) return `${days}d ${hours}h`;
  if (hours >= 1) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
