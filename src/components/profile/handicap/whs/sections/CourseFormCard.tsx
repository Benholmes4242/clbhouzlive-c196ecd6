import React from 'react';
import { useCourseForm } from '@/lib/whs/hooks';
import SectionHeader from './SectionHeader';

interface Props {
  connectionId: string;
  currentHandicap: number | null | undefined;
}

const HAIRLINE = '1px solid rgba(15,23,42,0.10)';
const GREEN = '#059669';
const RED = '#9F1D1D';
const MAX_BAR_STROKES = 5;
const TOP_N = 5;

const SkeletonRow: React.FC = () => (
  <div
    style={{
      padding: '14px 20px',
      borderBottom: HAIRLINE,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      height: 56,
    }}
  >
    <div
      className="animate-pulse"
      style={{
        height: 14,
        flex: 1,
        maxWidth: 180,
        background: 'rgba(15,23,42,0.06)',
        borderRadius: 4,
      }}
    />
    <div
      className="animate-pulse"
      style={{
        height: 18,
        width: 48,
        background: 'rgba(15,23,42,0.06)',
        borderRadius: 4,
      }}
    />
  </div>
);

export const CourseFormCard: React.FC<Props> = ({ connectionId, currentHandicap }) => {
  const { data, isLoading } = useCourseForm(connectionId, currentHandicap);

  if (currentHandicap === null || currentHandicap === undefined) return null;

  if (isLoading) {
    return (
      <section style={{ marginBottom: 32 }}>
        <SectionHeader
          eyebrow="Course Form"
          title="How you play, course by course"
          sub="Loading..."
        />
        <div style={{ borderTop: HAIRLINE }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (!data || data.length === 0) {
    return (
      <section style={{ marginBottom: 32 }}>
        <SectionHeader
          eyebrow="Course Form"
          title="How you play, course by course"
        />
        <p
          style={{
            padding: '24px 20px',
            fontSize: 13,
            color: 'rgba(15,23,42,0.55)',
            fontStyle: 'italic',
            textAlign: 'center',
            margin: 0,
          }}
        >
          Play more rounds to see how each course suits your game.
        </p>
      </section>
    );
  }

  // Sort worst-first (largest positive delta first), then take top N
  const rows = [...data]
    .sort((a, b) => b.delta - a.delta)
    .slice(0, TOP_N);

  return (
    <section style={{ marginBottom: 32 }}>
      <SectionHeader
        eyebrow="Course Form"
        title="How you play, course by course"
        sub="Your average vs your handicap. Worst form first."
      />
      <div style={{ borderTop: HAIRLINE }}>
        {rows.map((c) => {
          const isBetter = c.delta < 0;
          const isZero = c.delta === 0;
          const color = isZero ? 'rgba(15,23,42,0.45)' : isBetter ? GREEN : RED;
          const magnitude = Math.min(Math.abs(c.delta), MAX_BAR_STROKES);
          const fillPct = (magnitude / MAX_BAR_STROKES) * 50;
          const sign = isBetter ? '−' : c.delta > 0 ? '+' : '';
          return (
            <div
              key={c.course_id}
              style={{
                padding: '14px 20px',
                borderBottom: HAIRLINE,
              }}
            >
              {/* Top row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 6,
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#0F172A',
                      letterSpacing: '-0.005em',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {c.course_name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'rgba(15,23,42,0.55)',
                      marginTop: 2,
                    }}
                  >
                    {c.rounds_played} {c.rounds_played === 1 ? 'round' : 'rounds'}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div
                    style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: 18,
                      fontWeight: 900,
                      letterSpacing: '-0.02em',
                      fontVariantNumeric: 'tabular-nums',
                      color,
                      lineHeight: 1,
                    }}
                  >
                    {sign}
                    {Math.abs(c.delta).toFixed(1)}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: 'rgba(15,23,42,0.45)',
                      letterSpacing: '0.12em',
                      marginTop: 2,
                      textTransform: 'uppercase',
                    }}
                  >
                    vs hcp
                  </div>
                </div>
              </div>

              {/* Center-anchored magnitude bar */}
              <div
                style={{
                  position: 'relative',
                  height: 4,
                  background: 'rgba(15,23,42,0.06)',
                  borderRadius: 2,
                }}
              >
                {/* Center line */}
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: 0,
                    bottom: 0,
                    width: 1,
                    background: 'rgba(15,23,42,0.25)',
                  }}
                />
                {/* Fill */}
                {!isZero && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      borderRadius: 2,
                      background: color,
                      width: `${fillPct}%`,
                      ...(isBetter
                        ? { left: `${50 - fillPct}%` }
                        : { left: '50%' }),
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default CourseFormCard;
