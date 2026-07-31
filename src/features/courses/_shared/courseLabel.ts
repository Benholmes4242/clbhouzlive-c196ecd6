/**
 * Shared course-label helpers.
 *
 * shortCourseName exists so the COURSE STATS block can name the card it belongs
 * to without wrapping. It strips the generic club suffix but ALWAYS keeps a
 * parenthetical: "(East Course)" / "(West Course)" are the only thing that
 * distinguishes two courses at one club, so dropping them would produce two
 * identical headers on the same list — the exact ambiguity the header fixes.
 */

const CLUB_SUFFIX =
  /\s+(golf\s+club|golf\s+course|golf\s+links|country\s+club|club)\s*$/i;

export function shortCourseName(name: string, max = 26): string {
  if (!name) return '';

  const collapsed = name.replace(/\s+/g, ' ').trim();

  // Split off a trailing parenthetical so the suffix strip can reach the stem.
  const m = collapsed.match(/^(.*?)\s*(\([^()]*\))\s*$/);
  const stem = (m ? m[1] : collapsed).trim();
  const paren = m ? m[2] : '';

  const trimmedStem = stem.replace(CLUB_SUFFIX, '').trim() || stem;
  const out = (paren ? `${trimmedStem} ${paren}` : trimmedStem).trim();

  if (out.length <= max) return out;
  return `${out.slice(0, Math.max(0, max - 1)).trimEnd()}\u2026`;
}
