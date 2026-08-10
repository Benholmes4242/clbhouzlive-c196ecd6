/**
 * Last5AgainstTarget - the member's last five rounds against the target that
 * would count towards the index.
 *
 * A LOWER differential is better, so a bar at or below the target is green
 * (CHART.DOWN). That is the documented handicap inversion, not a mistake.
 *
 * Renders NOTHING when there is no round to draw.
 */
import React from 'react';
import { CHART, CHART_FONT, LABEL_STYLE } from './tokens';

interface Props {
  /** Differentials, oldest first. Up to five. */
  values: number[];
  /** At or below this value the round counts. */
  cut: number;
  /** "Counts at {cut}" label. */
  targetLabel: string;
  /** "Your last 5 rounds - n of 5 would count" label. */
  footLabel: string;
  height?: number;
}

const PLOT_PAD_TOP = 14;

export const Last5AgainstTarget: React.FC<Props> = ({
  values,
  cut,
  targetLabel,
  footLabel,
  height = 96,
}) => {
  const clean = values.filter((v) => typeof v === 'number' && !Number.isNaN(v));
  if (clean.length === 0) return null;
  if (!(typeof cut === 'number' && !Number.isNaN(cut))) return null;

  const scaleMax = Math.max(...clean, cut) + 1;
  if (!(scaleMax > 0)) return null;

  const pct = (v: number) => Math.min(100, Math.max(0, (v / scaleMax) * 100));
  const cutPct = pct(cut);

  return (
    <div style={{ fontFamily: CHART_FONT }}>
      <div style={{ position: 'relative', height, paddingTop: PLOT_PAD_TOP }}>
        {/* target line */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: `${cutPct}%`,
            height: 1,
            background: CHART.FAINT,
          }}
        />
        <span
          style={{
            position: 'absolute',
            right: 0,
            bottom: `calc(${cutPct}% + 4px)`,
            ...LABEL_STYLE,
            fontWeight: 700,
            letterSpacing: '0.16em',
            fontSize: 8,
            color: CHART.MUTE,
          }}
        >
          {targetLabel}
        </span>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 10,
            height: '100%',
          }}
        >
          {clean.map((v, i) => {
            const counts = v <= cut;
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  height: '100%',
                }}
              >
                <span
                  aria-hidden
                  style={{
                    height: `${pct(v)}%`,
                    background: counts ? CHART.DOWN : 'rgba(255,255,255,0.16)',
                    borderRadius: '3px 3px 1px 1px',
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* values */}
      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
        {clean.map((v, i) => (
          <span
            key={i}
            style={{
              flex: 1,
              textAlign: 'center',
              fontFamily: CHART_FONT,
              fontSize: 7,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              fontVariantNumeric: 'tabular-nums',
              color: v <= cut ? CHART.DOWN : CHART.DIM,
            }}
          >
            {v.toFixed(1)}
          </span>
        ))}
      </div>

      <div
        style={{
          marginTop: 10,
          fontFamily: CHART_FONT,
          fontSize: 8,
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: CHART.DIM,
        }}
      >
        {footLabel}
      </div>
    </div>
  );
};

export default Last5AgainstTarget;
