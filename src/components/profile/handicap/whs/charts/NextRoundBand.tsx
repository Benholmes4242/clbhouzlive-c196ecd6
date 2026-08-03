/**
 * NextRoundBand - where the next differential has to land.
 *
 * Three zones across one track: lo..cut cuts the index (DOWN, green),
 * cut..rise holds it (TRACK), rise..hi raises it (UP, red). The inversion
 * holds: a HIGHER differential is worse, so the right-hand zone is red.
 *
 * Renders NOTHING when the range is not usable.
 */
import React from 'react';
import { CHART, CHART_FONT, LABEL_STYLE } from './tokens';

interface Props {
  /** Differential at or below which the index cuts. */
  cut: number;
  /** Differential at or above which the index rises. */
  rise: number;
  /** Scale start. */
  lo: number;
  /** Scale end. */
  hi: number;
  height?: number;
}

export const NextRoundBand: React.FC<Props> = ({ cut, rise, lo, hi, height = 14 }) => {
  if (![cut, rise, lo, hi].every((n) => typeof n === 'number' && !Number.isNaN(n))) return null;
  const span = hi - lo;
  if (!(span > 0)) return null;

  const pct = (v: number) => Math.min(100, Math.max(0, ((v - lo) / span) * 100));
  const cutPct = pct(cut);
  const risePct = pct(Math.max(rise, cut));

  return (
    <div style={{ fontFamily: CHART_FONT }}>
      <div
        style={{
          position: 'relative',
          height,
          borderRadius: height / 2,
          overflow: 'hidden',
          background: CHART.TRACK,
        }}
      >
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${cutPct}%`,
            background: CHART.DOWN,
          }}
        />
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: `${risePct}%`,
            top: 0,
            bottom: 0,
            right: 0,
            background: CHART.UP,
          }}
        />
        <Tick pct={cutPct} />
        <Tick pct={risePct} />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 8,
          ...LABEL_STYLE,
        }}
      >
        <span style={{ color: CHART.DOWN }}>Cuts at {cut.toFixed(1)} or better</span>
        <span style={{ color: CHART.UP }}>Raises at {rise.toFixed(1)}+</span>
      </div>
    </div>
  );
};

const Tick: React.FC<{ pct: number }> = ({ pct }) => (
  <span
    aria-hidden
    style={{
      position: 'absolute',
      left: `${pct}%`,
      top: 0,
      bottom: 0,
      width: 2,
      marginLeft: -1,
      background: CHART.CANVAS,
    }}
  />
);

export default NextRoundBand;
