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
import { A, SANS, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { getScoreTier } from '@/utils/getScoreTier';
import { GUTTER } from '../about/AboutSection';

interface TheScoreProps {
  score: number;
  ratingCount: number;
}

export const TheScore: React.FC<TheScoreProps> = ({ score, ratingCount }) => {
  const tier = getScoreTier(score);
  const settled = ratingCount >= 5;
  const count = `${ratingCount} ${ratingCount === 1 ? 'rating' : 'ratings'}`;

  return (
    <section style={{ padding: `18px ${GUTTER}px 0`, fontFamily: SANS }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, color: A.INK, ...FIGS }}>
          {score.toFixed(1)}
        </span>
        <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', color: A.INK }}>
          {tier.label}
        </span>
      </div>
      <div style={{ fontSize: 11, color: A.DIM, marginTop: 6 }}>
        {settled ? count : `${count} — too few to be settled.`}
      </div>
    </section>
  );
};

export default TheScore;
