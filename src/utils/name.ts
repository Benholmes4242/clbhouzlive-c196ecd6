export function splitName(displayName: string) {
  const parts = (displayName || '').trim().split(/\s+/);
  const first = parts.shift() || '';
  const last = parts.length ? parts.join(' ') : '\u00A0'; // non-breaking space for second line
  return { first, last };
}