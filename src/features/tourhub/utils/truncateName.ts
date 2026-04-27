/**
 * truncateName — clip a string at a max length with a trailing ellipsis,
 * preferring a word boundary when one exists in the last 8 chars.
 *
 * Used by the player hero Live pill to keep tournament names readable
 * inside the pill chrome (e.g. "Cadillac Championship" → "Cadillac…").
 */
export function truncateName(name: string, maxChars: number): string {
  if (!name) return '';
  if (name.length <= maxChars) return name;

  const hardCut = name.slice(0, maxChars);
  // Prefer cutting at the last space within the final 8 chars of the hard cut.
  const lastSpace = hardCut.lastIndexOf(' ');
  const cut = lastSpace > maxChars - 8 ? hardCut.slice(0, lastSpace) : hardCut;
  return `${cut.trimEnd()}…`;
}
