import React from 'react';

interface Props {
  gross: number | null;
  stableford: number | null;
  differential: number | null;
}

const INK = '#0F172A';
const INK_MUTE = 'rgba(15,23,42,0.55)';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const GREEN = '#059669';
const FONT_DISPLAY =
  'SF Pro Display, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

const fmtDiff = (n: number | null) => {
  if (n === null) return '—';
  if (n > 0) return `+${n.toFixed(1)}`;
  if (n < 0) return `\u2212${Math.abs(n).toFixed(1)}`;
  return '0.0';
};

const Cell: React.FC<{
  label: string;
  value: string | number;
  color?: string;
  divider?: boolean;
}> = ({ label, value, color = INK, divider = false }) => (
  <div
    style={{
      textAlign: 'center',
      ...(divider
        ? { borderLeft: `1px solid ${HAIRLINE}`, borderRight: `1px solid ${HAIRLINE}` }
        : {}),
    }}
  >
    <p
      style={{
        margin: 0,
        fontSize: 9,
        fontWeight: 800,
        color: INK_MUTE,
        letterSpacing: '0.14em',
        marginBottom: 4,
      }}
    >
      {label}
    </p>
    <p
      style={{
        margin: 0,
        fontSize: 28,
        fontWeight: 800,
        color,
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1,
        fontFamily: FONT_DISPLAY,
        letterSpacing: '-0.02em',
      }}
    >
      {value}
    </p>
  </div>
);

export const RoundStatStrip: React.FC<Props> = ({ gross, stableford, differential }) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        padding: '16px 4px',
      }}
    >
      <Cell label="GROSS" value={gross ?? '—'} />
      <Cell label="STABLEFORD" value={stableford ?? '—'} divider />
      <Cell
        label="DIFF"
        value={fmtDiff(differential)}
        color={differential !== null && differential < 0 ? GREEN : INK}
      />
    </div>
  );
};

export default RoundStatStrip;
