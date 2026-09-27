/**
 * BRIEF_REVIEWS_TAB_REBUILD §3.1 — THE SCORE. No heading, directly under the
 * tab strip.
 *
 * THE FIVE-BAR TIER HISTOGRAM IS GONE. With nine ratings as the absolute
 * maximum on any course it could only ever show one or two populated bars and
 * three or four empty ones. `RatingTierDistribution` is retired from this tab
 * (the file stays on disk and keeps its other importers).
 *
 * THE "/10" IS DROPPED. At 40px with the tier word set beside it, "8.2
 * Excellent" cannot be read as a score out of 100 — the tier word already
 * fixes the scale, and a second glyph beside the figure only competes with it.
 */
import React from 'react';
import { OverallScoreLine } from '../CategoryScores';
import { GUTTER } from '../about/AboutSection';

interface TheScoreProps {
  score: number;
  ratingCount: number;
}

/** BRIEF_ONE_CATEGORY_SCORE_BLOCK §3 — same overall line as the Course tab. */
export const TheScore: React.FC<TheScoreProps> = ({ score, ratingCount }) => (
  <section style={{ padding: `0 ${GUTTER}px` }}>
    <OverallScoreLine score={score} ratingCount={ratingCount} />
  </section>
);

export default TheScore;
