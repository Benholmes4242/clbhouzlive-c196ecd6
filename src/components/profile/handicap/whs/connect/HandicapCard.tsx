import React from 'react';
import { INK, MUTE, DIM, BORDER, PANEL, GOOD, BAD, LABEL, KICKER, NUM } from './designTokens';
import DrawSparkline from './DrawSparkline';

export interface CardCounters {
  rounds: number | null;
  courses: number | null;
  years: number | null;
}

interface Props {
  /** null renders the em dash placeholder, never a zero. */
  index: number | null;
  /** 12-month change. Negative = improved. null = no 12 months of history. */
  delta: number | null;
  values: number[];
  counters: CardCounters;
  kicker: string;
  kickerColor?: string;
  replayKey?: string | number;
}

const fmtIndex = (h: number | null) => {
  if (h === null || h === undefined) return '\u2014';
  return h < 0 ? `+${Math.abs(h).toFixed(1)}` : h.toFixed(1);
};

const MINUS = '\u2212';

const Counter: React.FC<{ label: string; value: number | null }> = ({ label, value }) => (
  <div style={{ flex: 1, minWidth: 0 }}>
    <div
      style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', color: INK, ...NUM }}
    >
      {value === null || value === undefined ? '\u2014' : value}
    </div>
    <div style={{ ...LABEL, marginTop: 5 }}>{label}</div>
  </div>
);

/**
 * The handicap card. Screen 1 renders it with ILLUSTRATIVE figures; screen 5
 * renders the same card with the member's real ones. Holds its shape when the
 * delta is absent (under 12 months of history), as the profile hero does.
 */
export const HandicapCard: React.FC<Props> = ({
  index,
  delta,
  values,
  counters,
  kicker,
  kickerColor,
  replayKey,
}) => {
  const improved = delta !== null && delta < 0;
  const deltaColor = delta === null ? MUTE : improved ? GOOD : BAD;
  const deltaText =
    delta === null
      ? null
      : `${improved ? MINUS : '+'}${Math.abs(delta).toFixed(1)}`;

  return (
    <div
      style={{
        background: PANEL,
        border: `1px solid ${BORDER}`,
        borderRadius: 20,
        padding: '16px 18px 15px',
        boxShadow: '0 10px 30px rgba(14,18,22,0.08)',
      }}
    >
      <div style={{ ...KICKER, color: kickerColor ?? DIM, marginBottom: 13 }}>{kicker}</div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 11, flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 46,
              fontWeight: 800,
              letterSpacing: '-0.035em',
              lineHeight: 0.92,
              color: INK,
              ...NUM,
            }}
          >
            {fmtIndex(index)}
          </div>
          {/* Delta slot is always present so the card keeps its shape. */}
          <div style={{ minWidth: 58 }}>
            {deltaText ? (
              <>
                <div style={{ fontSize: 15, fontWeight: 800, color: deltaColor, ...NUM }}>
                  {deltaText}
                </div>
                <div style={{ ...LABEL, marginTop: 4 }}>12 months</div>
              </>
            ) : null}
          </div>
        </div>
        <DrawSparkline
          values={values}
          color={improved || delta === null ? GOOD : BAD}
          replayKey={replayKey}
        />
      </div>

      <div
        style={{
          display: 'flex',
          gap: 12,
          marginTop: 16,
          paddingTop: 14,
          borderTop: `1px solid ${BORDER}`,
        }}
      >
        <Counter label="Rounds" value={counters.rounds} />
        <Counter label="Courses" value={counters.courses} />
        <Counter label="Years" value={counters.years} />
      </div>

    </div>
  );
};

export default HandicapCard;
