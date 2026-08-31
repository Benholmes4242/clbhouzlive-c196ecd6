/**
 * Amateur News — the category field.
 *
 * The tour lens (pga | lpga | euro | liv | pgad) means NOTHING in the amateur
 * game, so this half of the product carries its own vocabulary. A story holds
 * MANY categories on purpose: a girls' county final is both `girls` and
 * `county`, and forcing one would file it wrongly whichever was chosen.
 *
 * The values are mirrored by a CHECK constraint on public.amateur_stories —
 * add a value here and in a migration, never here alone.
 */

export const AMATEUR_CATEGORIES = [
  'mens',
  'womens',
  'boys',
  'girls',
  'seniors',
  'midam',
  'county',
  'university',
  'international',
] as const;

export type AmateurCategory = (typeof AMATEUR_CATEGORIES)[number];

/** Reader-facing labels. Upper case is applied by the caller's type, not here. */
export const AMATEUR_CATEGORY_LABEL: Record<AmateurCategory, string> = {
  mens: "Men's",
  womens: "Women's",
  boys: 'Boys',
  girls: 'Girls',
  seniors: 'Seniors',
  midam: 'Mid-am',
  county: 'County',
  university: 'University',
  international: 'International',
};

export function isAmateurCategory(v: string): v is AmateurCategory {
  return (AMATEUR_CATEGORIES as readonly string[]).includes(v);
}

export function categoryLabel(v: string): string {
  return isAmateurCategory(v) ? AMATEUR_CATEGORY_LABEL[v] : v;
}

/** The line under a headline: "GIRLS · COUNTY" — never more than three. */
export function categoriesLine(categories: string[] | null | undefined): string {
  return (categories ?? [])
    .slice(0, 3)
    .map((c) => categoryLabel(c).toUpperCase())
    .join(' \u00b7 ');
}
