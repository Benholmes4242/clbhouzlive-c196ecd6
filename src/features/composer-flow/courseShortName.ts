/**
 * THE ONE SHORT-NAME HELPER for the unified composer.
 *
 * Course names in the catalogue carry a parenthesised qualifier that identifies
 * the layout for a ranking table and reads as clutter in a sentence: "The
 * Berkshire (Blue)" belongs on a leaderboard, "your day at The Berkshire" is
 * what a member is told. Every composer sentence that names a course uses this,
 * so no two screens disagree about what the course is called.
 *
 * It strips ONLY a trailing parenthesised suffix, and only when something is
 * left over — a name that is nothing but a parenthesis is returned untouched
 * rather than emptied.
 */
export function courseShortName(name: string | null | undefined): string {
  const raw = (name ?? '').trim();
  if (!raw) return '';
  const stripped = raw.replace(/\s*\([^()]*\)\s*$/, '').trim();
  return stripped.length > 0 ? stripped : raw;
}
