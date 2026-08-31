/**
 * Amateur News — the category vocabulary.
 *
 * TEN values, in ONE order, mirrored by the CHECK constraint on
 * public.amateur_stories.categories. Adding a value here alone is a bug: it
 * needs the migration too, or the write fails.
 *
 * `club` is in from the start deliberately — club golf is the highest-volume
 * part of this beat and the part that matches the membership.
 *
 * TWO AXES. A story is a DIVISION (who played) and an ARENA (what level), and
 * a girls county final is both. Nothing reads `axis` yet; it exists so the
 * filter row can split into two rows later without a migration. Do not delete
 * it as unused.
 *
 * ORDER IS MEANINGFUL: categories[0] is the primary, chosen by the author.
 * Never sort the array on read or on write.
 */

export type AmateurAxis = 'division' | 'arena';

export interface AmateurCategoryDef {
  value: string;
  /** English default. The UI resolves a translated label over the top. */
  label: string;
  axis: AmateurAxis;
}

export const AMATEUR_CATEGORIES: ReadonlyArray<AmateurCategoryDef> = [
  { value: 'mens', label: "Men's", axis: 'division' },
  { value: 'womens', label: "Women's", axis: 'division' },
  { value: 'boys', label: 'Boys', axis: 'division' },
  { value: 'girls', label: 'Girls', axis: 'division' },
  { value: 'seniors', label: 'Seniors', axis: 'division' },
  { value: 'midam', label: 'Mid-Am', axis: 'division' },
  { value: 'club', label: 'Club', axis: 'arena' },
  { value: 'county', label: 'County', axis: 'arena' },
  { value: 'university', label: 'University', axis: 'arena' },
  { value: 'international', label: 'International', axis: 'arena' },
];

/** The ordered value list, for iteration and for multi-select UIs. */
export const AMATEUR_CATEGORY_VALUES: ReadonlyArray<string> =
  AMATEUR_CATEGORIES.map((c) => c.value);

export const AMATEUR_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  AMATEUR_CATEGORIES.map((c) => [c.value, c.label]),
);

export const AMATEUR_CATEGORY_AXIS: Record<string, AmateurAxis> = Object.fromEntries(
  AMATEUR_CATEGORIES.map((c) => [c.value, c.axis]),
);

export function isAmateurCategory(v: unknown): boolean {
  return typeof v === 'string' && AMATEUR_CATEGORY_VALUES.includes(v);
}

/** The label, falling back to the raw value so an unknown tag still reads. */
export function categoryLabel(v: string, resolve?: (value: string, fallback: string) => string): string {
  const fallback = AMATEUR_CATEGORY_LABELS[v] ?? v;
  return resolve ? resolve(v, fallback) : fallback;
}

/**
 * The tag line beside a timestamp: the first THREE labels, uppercased, joined
 * with a middle dot. Three is the cap because a fourth pushes the timestamp off
 * a 320px row.
 */
export function categoriesLine(
  categories: string[] | null | undefined,
  resolve?: (value: string, fallback: string) => string,
): string | null {
  const parts = (categories ?? [])
    .slice(0, 3)
    .map((c) => categoryLabel(c, resolve).toUpperCase())
    .filter(Boolean);
  return parts.length > 0 ? parts.join(' \u00b7 ') : null;
}
