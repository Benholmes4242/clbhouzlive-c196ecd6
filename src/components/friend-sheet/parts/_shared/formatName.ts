/**
 * Format a friend name for display.
 *
 * Source data sometimes comes in as "Lastname, Firstname" (England Golf WHS feed
 * often stores members alphabetically). Detect the comma format and reverse it.
 * Names already in "Firstname Lastname" format pass through unchanged.
 */
export function formatFriendName(raw: string | null | undefined): string {
  if (!raw) return 'Unknown';
  const trimmed = raw.trim();
  if (!trimmed) return 'Unknown';

  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length === 2) {
      return `${parts[1]} ${parts[0]}`;
    }
    return trimmed;
  }

  return trimmed;
}

/**
 * Extract the first name from a friend name, regardless of source format.
 */
export function getFirstName(raw: string | null | undefined): string {
  if (!raw) return '';
  const formatted = formatFriendName(raw);
  if (formatted === 'Unknown') return '';
  const firstSpaceIdx = formatted.indexOf(' ');
  return firstSpaceIdx === -1 ? formatted : formatted.slice(0, firstSpaceIdx);
}
