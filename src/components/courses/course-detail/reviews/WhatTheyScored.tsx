/**
 * BRIEF_REVIEWS_TAB_REBUILD §3.2 — WHAT THEY SCORED. Kicker, no heading.
 *
 * The four AGGREGATE category scores also render on the Course tab. They show
 * from the first rating onward; only the overall tier word is sample-gated.
 * Rendered by the shared 2×2 CategoryBarGrid (signed-off category-bars mock),
 * the same breakdown the Course tab and the business profile print.
 */
import React from 'react';
import { AboutSection } from '../about/AboutSection';
import { CategoryBarGrid } from '@/components/shared/CategoryBarGrid';
import type { CategoryScoreValues } from '../CategoryScores';

export type CategoryAggregates = CategoryScoreValues;

export const WhatTheyScored: React.FC<{ aggregates: CategoryAggregates }> = ({ aggregates }) => {
  if ([aggregates.design, aggregates.condition, aggregates.clubhouse, aggregates.facilities].every((v) => v == null)) return null;
  return (
    <AboutSection kicker="What they scored" sectionEyebrow>
      <CategoryBarGrid items={[
        { key: 'design', label: 'Design', value: aggregates.design ?? null },
        { key: 'condition', label: 'Condition', value: aggregates.condition ?? null },
        { key: 'clubhouse', label: 'Clubhouse', value: aggregates.clubhouse ?? null },
        { key: 'facilities', label: 'Facilities', value: aggregates.facilities ?? null },
      ]} />
    </AboutSection>
  );
};

export default WhatTheyScored;
