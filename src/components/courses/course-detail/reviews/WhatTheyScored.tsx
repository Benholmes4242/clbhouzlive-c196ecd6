/**
 * BRIEF_REVIEWS_TAB_REBUILD §3.2 — WHAT THEY SCORED. Kicker, no heading.
 *
 * The four AGGREGATE category scores also render on the Course tab. They show
 * from the first rating onward; only the overall tier word is sample-gated.
 * Rendered by the one CategoryScores block shared with the Course tab and list card.
 */
import React from 'react';
import { AboutSection } from '../about/AboutSection';
import { CategoryScores, type CategoryScoreValues } from '../CategoryScores';

export type CategoryAggregates = CategoryScoreValues;

export const WhatTheyScored: React.FC<{ aggregates: CategoryAggregates }> = ({ aggregates }) => {
  if ([aggregates.design, aggregates.condition, aggregates.clubhouse, aggregates.facilities].every((v) => v == null)) return null;
  return (
    <AboutSection kicker="What they scored">
      <CategoryScores scores={aggregates} />
    </AboutSection>
  );
};

export default WhatTheyScored;
