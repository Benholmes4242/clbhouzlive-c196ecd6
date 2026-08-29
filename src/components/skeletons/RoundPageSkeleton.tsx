/**
 * RoundPageSkeleton — /round/:whsScoreId
 *
 * MICRO_BRIEF_ROUND_LINK_FLASH S3. The route previously fell back to
 * HandicapPageSkeleton (tabs, hero stat trio, list rows) which is not the shape
 * of what lands. This is: the sheet's fixed summary header on PANEL, then the
 * scorecard block below it on CANVAS.
 *
 * EXPAND-OUTWARDS-ONLY: every block here is no taller than the real one, so
 * content grows into place rather than jumping.
 */
import React from 'react';
import { useSkeletonShown } from '@/perf/usePageReady';

const CANVAS = '#15171F';
const PANEL = '#1B1E27';

const shimmer: React.CSSProperties = {
  background: 'linear-gradient(90deg, #232734 25%, #2A2F3D 50%, #232734 75%)',
  backgroundSize: '200% 100%',
  animation: 'roundSkelWave 1.4s ease-in-out infinite',
  borderRadius: 8,
};

export const RoundPageSkeleton: React.FC = () => {
  useSkeletonShown();
  return (
    <div style={{ minHeight: '100dvh', background: CANVAS }}>
      <style>{`
        @keyframes roundSkelWave {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Fixed summary header (PANEL) — grabber, eyebrow, course, figure rail */}
      <div
        style={{
          background: PANEL,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingTop: 10,
          paddingBottom: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 14 }}>
          <div style={{ ...shimmer, width: 36, height: 4, borderRadius: 999 }} />
        </div>

        <div style={{ padding: '0 16px' }}>
          <div style={{ ...shimmer, width: 92, height: 9, borderRadius: 3, marginBottom: 10 }} />
          <div style={{ ...shimmer, width: '62%', height: 17, marginBottom: 8 }} />
          <div style={{ ...shimmer, width: '38%', height: 11, borderRadius: 4 }} />

          {/* Figure rail */}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <div style={{ ...shimmer, flex: 1, height: 56 }} />
            <div style={{ ...shimmer, flex: 1, height: 56 }} />
            <div style={{ ...shimmer, flex: 1, height: 56 }} />
          </div>
        </div>
      </div>

      {/* Scrolling body — the card, then the breakdown */}
      <div style={{ padding: '16px' }}>
        <div style={{ ...shimmer, width: '100%', height: 132, marginBottom: 16 }} />
        <div style={{ ...shimmer, width: '46%', height: 9, borderRadius: 3, marginBottom: 12 }} />
        <div style={{ ...shimmer, width: '100%', height: 96 }} />
      </div>

      <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
    </div>
  );
};

export default RoundPageSkeleton;
