import React from 'react';

interface Props {
  thumbnailUrl: string | null;
  altText: string;
  children?: React.ReactNode;
}

const GOLDEN_HOUR_FALLBACK =
  'linear-gradient(140deg, #2d3a2d 0%, #4a5d4a 25%, #6b7a5a 50%, #8a9670 72%, #c4a574 88%, #d4956b 100%)';

/**
 * 124x124 photo block with golden-hour fallback gradient + atmospheric and
 * legibility scrims. Children are absolutely positioned overlays
 * (mini-glass tile, course-best pill, etc).
 */
export const MiniMedia: React.FC<Props> = ({ thumbnailUrl, altText, children }) => {
  return (
    <div
      style={{
        position: 'relative',
        width: 124,
        height: 124,
        flexShrink: 0,
        background: GOLDEN_HOUR_FALLBACK,
        overflow: 'hidden',
      }}
    >
      {thumbnailUrl && (
        <img
          src={thumbnailUrl}
          alt={altText}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      )}
      {/* Atmospheric scrim — softens raw photos */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 80% 60% at 50% 90%, rgba(0,0,0,0.55) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 70% 25%, rgba(255,200,140,0.18) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />
      {/* Legibility scrim — bottom-up */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.65) 100%)',
          pointerEvents: 'none',
        }}
      />
      {children}
    </div>
  );
};

export default MiniMedia;
