/**
 * ThirdsChart - shots dropped per third of the round.
 *
 * The LARGEST bar is UP (red) because more shots dropped is worse; the
 * others sit at white 0.22. Renders NOTHING with no thirds or all zeroes.
 */
import React from 'react';
import { CHART, CHART_FONT, LABEL_STYLE } from './tokens';

export interface Third {
  l: string;
  v: number;
}

interface Props {
  thirds: Third[];
  height?: number;
  digits?: number;
}

export const ThirdsChart: React.FC<Props> = ({ thirds, height = 88, digits = 1 }) => {
  if (!thirds || thirds.length === 0) return null;
  const values = thirds.map((t) => (typeof t.v === 'number' && !Number.isNaN(t.v) ? t.v : 0));
  const max = Math.max(...values);
  if (!(max > 0)) return null;

  const worst = values.indexOf(max);

  return (
    <div style={{ display: 'flex', gap: 10, fontFamily: CHART_FONT }}>
      {thirds.map((t, i) => (
        <div key={t.l} style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: i === worst ? CHART.UP : CHART.INK,
              fontVariantNumeric: 'tabular-nums lining-nums',
              marginBottom: 6,
              textAlign: 'center',
            }}
          >
            {values[i].toFixed(digits)}
          </div>
          <div
            style={{
              height,
              display: 'flex',
              alignItems: 'flex-end',
            }}
          >
            <span
              aria-hidden
              style={{
                display: 'block',
                width: '100%',
                height: `${Math.max(2, (values[i] / max) * height)}px`,
                background: i === worst ? CHART.UP : CHART.FAINT,
                borderRadius: 3,
              }}
            />
          </div>
          <div style={{ ...LABEL_STYLE, marginTop: 8, textAlign: 'center' }}>{t.l}</div>
        </div>
      ))}
    </div>
  );
};

export default ThirdsChart;
