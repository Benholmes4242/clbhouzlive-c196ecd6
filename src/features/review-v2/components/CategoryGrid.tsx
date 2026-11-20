/** Category values remain independent and required; ScoreBar owns all five controls.
 * Score ink preserves courseSubScoreTone's all-white rule via the score theme. */
import React from 'react';
import { ScoreBar } from './ScoreBar';
import type { CategoryKey } from '../types';

export interface CategoryCopy { key: CategoryKey; label: string; hint: string; }
interface Props {
  values: Record<CategoryKey, number | null>;
  onChange: (key: CategoryKey, value: number) => void;
  cats: CategoryCopy[];
}
export function CategoryGrid({ values, onChange, cats }: Props) {
  return <div className="review-score-categories">{cats.map(category => {
    const value = values[category.key];
    return <div key={category.key} className="review-score-category" data-score-category={category.key}>
      <div className="review-score-category-head">
        <div className="review-score-category-copy"><div className="review-score-category-name">{category.label}</div><div className="review-score-category-hint">{category.hint}</div></div>
        <div className="review-score-number review-score-category-value" data-empty={value == null}>{value == null ? '–' : value.toFixed(1)}</div>
      </div>
      <ScoreBar value={value} onChange={value => onChange(category.key, value)} ariaLabel={category.label} />
    </div>;
  })}</div>;
}