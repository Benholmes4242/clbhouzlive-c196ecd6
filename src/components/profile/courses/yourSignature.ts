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
  /** Mean of this member's category averages (the four, or as many as have values). */
  baseline: number;
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
  if (!categories.length) return null;
  // The baseline is the mean of this member's FOUR CATEGORY AVERAGES, not their overall rating average. The overall rating is a separate score on a separate scale, so a category can sit exactly on it by coincidence and the sentence then claims a leaning while printing a difference of zero. Like against like, and a zero difference is never printed.
  const baseline = categories.reduce((a, c) => a + c.mean, 0) / categories.length;
  let high = categories[0];
  let low = categories[0];
  for (const c of categories) {
    if (c.mean > high.mean) high = c;
    if (c.mean < low.mean) low = c;
  }
  return { categories, baseline, high, low };
}

export const SIGNATURE_LEAN_MIN = 0.2;

export type SignatureSentence =
  | { kind: 'even' }
  | { kind: 'voter'; high: string; highGap: string; low: string | null; lowGap: string | null };

/** Gaps are unsigned one-decimal strings; "above"/"below" carry direction. A gap rounding to 0.0 is never returned. */
export function signatureSentence(m: SignatureModel): SignatureSentence {
  const up = m.high.mean - m.baseline;
  const down = m.baseline - m.low.mean;
  const highGap = up.toFixed(1);
  if (up < SIGNATURE_LEAN_MIN - 1e-9 || highGap === '0.0') return { kind: 'even' };
  const lowGap = down.toFixed(1);
  const showLow = down >= SIGNATURE_LEAN_MIN - 1e-9 && lowGap !== '0.0' && m.low !== m.high;
  return { kind: 'voter', high: m.high.label.toLowerCase(), highGap, low: showLow ? m.low.label.toLowerCase() : null, lowGap: showLow ? lowGap : null };
}
