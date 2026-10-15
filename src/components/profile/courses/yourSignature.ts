/**
 * YOUR SIGNATURE — pure model. Each category divides by its OWN non-null
 * count: members routinely rate overall without filling the four, so the
 * total review count is never the denominator.
 *
 * Order is fixed Design, Condition, Clubhouse, Facilities — the same order
 * courseRatingConsistency asserts for other surfaces.
 */
export type SignatureRow = {
  rating: number | null;
  design_score: number | null;
  condition_score: number | null;
  clubhouse_score: number | null;
  facilities_score: number | null;
};

export const SIGNATURE_FLOOR = 5;

const CATS = [
  { key: 'design_score', label: 'Design' },
  { key: 'condition_score', label: 'Condition' },
  { key: 'clubhouse_score', label: 'Clubhouse' },
  { key: 'facilities_score', label: 'Facilities' },
] as const;

export type SignatureCategory = { label: string; mean: number; n: number };
export type SignatureModel = {
  categories: SignatureCategory[];
  overall: number;
  high: SignatureCategory;
  low: SignatureCategory;
};

const num = (v: number | null | undefined): v is number => typeof v === 'number' && Number.isFinite(v);

export function buildSignature(rows: SignatureRow[]): SignatureModel | null {
  const withAny = rows.filter((r) => CATS.some((c) => num(r[c.key])));
  if (withAny.length < SIGNATURE_FLOOR) return null;
  const categories: SignatureCategory[] = [];
  for (const c of CATS) {
    const vals = rows.map((r) => r[c.key]).filter(num);
    if (vals.length) categories.push({ label: c.label, mean: vals.reduce((a, b) => a + b, 0) / vals.length, n: vals.length });
  }
  const overalls = rows.map((r) => r.rating).filter((v): v is number => num(v) && v > 0);
  if (!categories.length || !overalls.length) return null;
  const overall = overalls.reduce((a, b) => a + b, 0) / overalls.length;
  let high = categories[0];
  let low = categories[0];
  for (const c of categories) {
    if (c.mean > high.mean) high = c;
    if (c.mean < low.mean) low = c;
  }
  return { categories, overall, high, low };
}
