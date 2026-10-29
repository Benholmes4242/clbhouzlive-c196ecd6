/** Step 2 category rows follow courseSubScoreTone's white rule, never overall-derived scores. */
import React from 'react';
import { useScoreRuler } from '../hooks/useScoreRuler';
import { scorePercent } from '../lib/scoreStepRules';
import type { CategoryKey } from '../types';

export interface CategoryCopy { key: CategoryKey; label: string; hint: string; }
interface Props {
  values: Record<CategoryKey, number | null>;
  onChange: (key: CategoryKey, value: number) => void;
  cats: CategoryCopy[];
  flagged?: CategoryKey[];
  tapToScore?: string;
  stillToScore?: string;
}
function CategoryRow({ category, value, onChange, flagged, tapToScore, stillToScore }: {
  category: CategoryCopy; value: number | null; onChange: (value: number) => void;
  flagged: boolean; tapToScore: string; stillToScore: string;
}) {
  const ruler = useScoreRuler(value, onChange);
  const scored = value != null;
  const pct = scored ? scorePercent(value) : 0;
  return <div className="review-score-category" data-score-category={category.key} data-flagged={flagged && !scored} data-dragging={ruler.dragging}>
    <div className="review-score-category-head">
      <span aria-hidden className="review-score-check" data-scored={scored}>{scored && <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}</span>
      <div className="review-score-category-copy"><div className="review-score-category-name">{category.label}</div><div className="review-score-category-hint">{category.hint}</div></div>
      {scored ? <div className="review-score-number review-score-category-value">{value.toFixed(1)}</div> : <div className="review-score-category-prompt">{flagged ? stillToScore : tapToScore}</div>}
    </div>
    <div ref={ruler.ref} role="slider" tabIndex={0} aria-valuemin={1} aria-valuemax={10} aria-valuenow={value ?? undefined}
      aria-valuetext={scored ? undefined : 'Not scored'} aria-label={category.label}
      onPointerDown={ruler.onPointerDown} onKeyDown={ruler.onKeyDown} className="review-score-ruler">
      <div className="review-score-track" data-dashed={!scored} />
      {scored && <><div className="review-score-fill" style={{ width: `${pct}%` }} /><div aria-hidden data-score-thumb className="review-score-thumb" style={{ left: `${pct}%` }} /></>}
    </div>
  </div>;
}
export function CategoryGrid({ values, onChange, cats, flagged = [], tapToScore = '', stillToScore = '' }: Props) {
  return <div className="review-score-categories">{cats.map(category => <CategoryRow key={category.key} category={category}
    value={values[category.key]} onChange={value => onChange(category.key, value)} flagged={flagged.includes(category.key)} tapToScore={tapToScore} stillToScore={stillToScore} />)}</div>;
}
