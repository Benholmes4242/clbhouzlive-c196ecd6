import React from 'react';

interface MyRatingsRingProps {
  /** Score 0-10. When `isGhost` is true, this is ignored. */
  score: number;
  label: string;
  isGhost?: boolean;
}

const SIZE = 34;
const STROKE = 2.25;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Donut ring used in MyRatingsCourseCard to surface the four breakdown
 * scores at-a-glance. Amber fill matches the existing course-detail UI.
 */
export const MyRatingsRing: React.FC<MyRatingsRingProps> = ({
  score,
  label,
  isGhost = false,
}) => {
  const filled = isGhost ? 0 : (Math.max(0, Math.min(10, score)) / 10) * CIRCUMFERENCE;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        minWidth: 0,
      }}
    >
      <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={STROKE}
          />
          {!isGhost && (
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="#F7931E"
              strokeWidth={STROKE}
              strokeDasharray={`${filled} ${CIRCUMFERENCE}`}
              strokeLinecap="round"
            />
          )}
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '"Geist", sans-serif',
            fontSize: 10,
            fontWeight: 700,
            color: isGhost ? '#94A3B8' : '#0F172A',
            letterSpacing: '-0.01em',
          }}
        >
          {isGhost ? '—' : score.toFixed(1)}
        </div>
      </div>
      <div
        style={{
          fontFamily: '"Geist", sans-serif',
          fontSize: 8,
          fontWeight: 600,
          color: '#64748B',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </div>
    </div>
  );
};

export default MyRatingsRing;
