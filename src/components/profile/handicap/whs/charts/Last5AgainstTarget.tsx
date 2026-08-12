/**
 * Last5AgainstTarget - the member's last five differentials, oldest left.
 *
 * ZERO is the only horizontal line, and it is drawn ONLY when at least one
 * value is negative. Positive bars grow up from zero, negative bars grow down.
 *
 * A LOWER differential is better, so a bar that BEATS the target (strictly
 * below it) is green (CHART.DOWN). That is the documented handicap inversion,
 * not a mistake. Equal to the target is NOT a beat.
 *
 * No target line, no shaded band.
 *
 * Renders NOTHING when there is no round to draw.
 */
import React from 'react';
import { CHART, CHART_FONT } from './tokens';

interface Props {
  /** Differentials, oldest first. Up to five. */
  values: number[];
  /** Beat this value (strictly) and the round counts towards the index. */
  cut: number;
  /** "{n} of your last 5 beat {cut}" label. */
  footLabel: string;
  height?: number;
}

const VALUE_STYLE = {
  fontFamily: CHART_FONT,
  fontSize: 7,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase' as const,
  fontVariantNumeric: 'tabular-nums lining-nums' as const,
};

export const Last5AgainstTarget: React.FC<Props> = ({
  values,
  cut,
  footLabel,
  height = 96,
}) => {
  const clean = values.filter((v) => typeof v === 'number' && !Number.isNaN(v));
  if (clean.length === 0) return null;
  if (!(typeof cut === 'number' && !Number.isNaN(cut))) return null;

  const maxPos = Math.max(0, ...clean);
  const minNeg = Math.min(0, ...clean);
  const hasNeg = minNeg < 0;
  const span = maxPos - minNeg;
  if (!(span > 0)) return null;

  // Share of the plot height given to the area above zero.
  const upShare = maxPos / span;
  const upPx = Math.round(height * upShare);
  const downPx = height - upPx;

  return (
    <div style={{ fontFamily: CHART_FONT }}>
      <div style={{ position: 'relative', height }}>
        {hasNeg && (
          <span
            aria-hidden
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: upPx,
              height: 1,
              background: CHART.FAINT,
            }}
          />
        )}

        <div style={{ display: 'flex', gap: 10, height: '100%' }}>
          {clean.map((v, i) => {
            const beats = v < cut;
            const up = v >= 0;
            const px = up
              ? maxPos > 0
                ? Math.max(2, Math.round((v / maxPos) * upPx))
                : 0
              : Math.max(2, Math.round((Math.abs(v) / Math.abs(minNeg)) * downPx));
            return (
              <div key={i} style={{ flex: 1, height: '100%', position: 'relative' }}>
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    ...(up
                      ? { top: upPx - px, height: px, borderRadius: '3px 3px 1px 1px' }
                      : { top: upPx, height: px, borderRadius: '1px 1px 3px 3px' }),
                    background: beats ? CHART.DOWN : 'rgba(255,255,255,0.18)',
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
              ...VALUE_STYLE,
              color: v < cut ? CHART.DOWN : CHART.DIM,
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
