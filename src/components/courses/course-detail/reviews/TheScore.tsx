/**
 * BRIEF_REVIEWS_HEADER_PAIR_AND_DISTRIBUTION — THE SCORE. No heading, directly
 * under the tab strip.
 *
 * COMMUNITY AND YOU, RULED. Left: the community score. Right (only when the
 * viewer has rated): the viewer's score in amber and its signed difference
 * from the community, in DELTA_TONE. Inside |delta| < 0.05 it reads "Level"
 * with a muted dash (same dead zone as HcpTrendChart). With no viewer rating
 * the right column and rule do not render and the left column does not move.
 *
 * THE FIVE-BAND HISTOGRAM IS RESTORED beneath the pair. With nine ratings as
 * the maximum on any course most bands are sparse or empty; that emptiness is
 * accepted as the honest picture. Empty bands render, never hide.
 *
 * THE "/10" IS DROPPED. The tier word already fixes the scale.
 */
import React from 'react';
import { A, SANS, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { getRatingTierLabel } from '@/lib/ratingTier';
import { DELTA_TONE } from '@/lib/tokens/indexDelta';
import { GUTTER } from '../about/AboutSection';
import {
  RatingTierDistribution,
  type RatingTierDistributionData,
} from '@/components/courses/review/RatingTierDistribution';

interface TheScoreProps {
  score: number;
  ratingCount: number;
  /** The viewer's own overall rating, or null when they have not rated. */
  viewerScore?: number | null;
  /** Five-band counts; omitted when they cannot be shown to agree with ratingCount. */
  distribution?: RatingTierDistributionData | null;
}

const EYEBROW: React.CSSProperties = {
  fontSize: 9.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', lineHeight: 1,
};
const FIGURE: React.CSSProperties = {
  ...FIGS, fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, marginTop: 8,
};
const SUPPORT: React.CSSProperties = { fontSize: 11.5, color: A.MUTE, marginTop: 6, lineHeight: 1.3 };

const Triangle: React.FC<{ up: boolean }> = ({ up }) => (
  <span
    aria-hidden
    style={{
      display: 'inline-block', width: 0, height: 0,
      borderLeft: '4px solid transparent', borderRight: '4px solid transparent',
      ...(up ? { borderBottom: '6px solid currentColor' } : { borderTop: '6px solid currentColor' }),
    }}
  />
);

const DeltaLine: React.FC<{ delta: number }> = ({ delta }) => {
  if (Math.abs(delta) < 0.05) {
    return (
      <div style={{ ...SUPPORT, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span aria-hidden style={{ display: 'inline-block', width: 8, height: 1.5, background: A.MUTE }} />
        Level
      </div>
    );
  }
  const up = delta > 0;
  return (
    <div style={{ ...SUPPORT, display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ ...FIGS, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: up ? DELTA_TONE.dark.up : DELTA_TONE.dark.down }}>
        <Triangle up={up} />
        {Math.abs(delta).toFixed(1)}
      </span>
      {up ? 'above' : 'below'}
    </div>
  );
};

export const TheScore: React.FC<TheScoreProps> = ({ score, ratingCount, viewerScore, distribution }) => {
  const hasYou = viewerScore != null;
  return (
    <section style={{ padding: `0 ${GUTTER}px`, fontFamily: SANS }}>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...EYEBROW, color: A.DIM }}>Community</div>
          <div style={{ ...FIGURE, color: A.INK }}>{score.toFixed(1)}</div>
          <div style={SUPPORT}>
            {ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'}
            {` · ${getRatingTierLabel(score)}`}
          </div>
        </div>
        {hasYou && (
          <>
            <div aria-hidden style={{ width: 1, background: A.HAIRLINE, margin: '0 20px' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ ...EYEBROW, color: A.AMBER }}>You</div>
              <div style={{ ...FIGURE, color: A.AMBER }}>{viewerScore!.toFixed(1)}</div>
              <DeltaLine delta={Math.round((viewerScore! - score) * 10) / 10} />
            </div>
          </>
        )}
      </div>
      {distribution && (
        <div style={{ marginTop: 20 }}>
          <RatingTierDistribution distribution={distribution} />
        </div>
      )}
    </section>
  );
};

export default TheScore;
