/**
 * Convert England Golf "Surname, Given" name format to display order
 * "Given Surname". Returns the original string if there's no comma.
 *
 *   "Hill, Lennon" → "Lennon Hill"
 *   "Tom Rashbrook" → "Tom Rashbrook"
 */
export function reformatFriendName(name: string | null | undefined): string {
  if (!name) return 'Unknown';
  const trimmed = name.trim();
  if (trimmed.includes(',')) {
    const [last, first] = trimmed.split(',').map((s) => s.trim());
    return [first, last].filter(Boolean).join(' ');
  }
  return trimmed;
}

/**
 * Format a date as a short relative string.
 *
 * compact=true (default): caps at "Nw ago" with no month/year suffix.
 *   today → "Today", 1 → "Yesterday", <7 → "Nd ago", else → "Nw ago"
 *
 * compact=false: extends to month/year-style suffixes for older dates.
 *   <30 → "Nd ago", <30w → "Nw ago", else → "Nmo ago"
 */
export function fmtRelative(
  iso: string | null | undefined,
  opts: { compact?: boolean } = {},
): string {
  if (!iso) return '';
  const compact = opts.compact ?? true;
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days <= 0) {
    if (compact) return 'Today';
    const hours = Math.floor(ms / 3_600_000);
    if (hours < 1) return 'just now';
    return `${hours}h ago`;
  }
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (compact) {
    if (days < 14) return '1w ago';
    return `${Math.floor(days / 7)}w ago`;
  }
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
