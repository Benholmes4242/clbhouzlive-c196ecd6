/**
 * BRIEF_TOP_TEN_SHARE_CARD_V2 §2 — course naming for the Top 10 share card.
 *
 * variant = text inside trailing brackets ("Royal Portrush Golf Club (Dunluce)"
 *   -> "Dunluce"), else the text after a final " - " ("Trump Turnberry Resort
 *   - Ailsa" -> "Ailsa"), else null.
 * short = the name with the variant removed, then ONE trailing suffix stripped
 *   (longest first, case-insensitive): " Golf and Country Club",
 *   " Golf & Country Club", " Golf Club", " Golf Links", " Golf Resort",
 *   " Resort", " Country Club". Never strips to empty: a strip that would leave
 *   nothing keeps the variant-less name.
 */
export interface ShareCourseName {
  short: string;
  variant: string | null;
}

const TRAILING_SUFFIXES = [
  'golf and country club',
  'golf & country club',
  'golf club',
  'golf links',
  'golf resort',
  'resort',
  'country club',
];

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function shareCourseName(rawName: string | null | undefined): ShareCourseName {
  const original = (rawName ?? '').trim();
  let base = original;
  let variant: string | null = null;

  const paren = original.match(/\(([^()]*)\)\s*$/);
  if (paren && paren[1].trim()) {
    variant = paren[1].trim();
    base = original.slice(0, paren.index).trim();
  } else {
    const dash = original.match(/^(.*?)\s+-\s+([^-]+)$/);
    if (dash && dash[2].trim()) {
      variant = dash[2].trim();
      base = dash[1].trim();
    }
  }

  let short = base;
  for (const suffix of TRAILING_SUFFIXES) {
    const re = new RegExp(`\\s+${escapeRe(suffix)}$`, 'i');
    if (re.test(short)) {
      const next = short.replace(re, '').trim();
      if (next) {
        short = next;
        break;
      }
    }
  }
  if (!short) short = base || original;

  return { short, variant };
}
