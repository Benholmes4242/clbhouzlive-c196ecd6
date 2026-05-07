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
  border?: boolean;
  sub?: string | null;
}> = ({ label, value, color = INK, border = false, sub = null }) => (
  <div
    style={{
      paddingLeft: border ? 14 : 0,
      borderLeft: border ? `0.5px solid ${HAIRLINE}` : 'none',
      textAlign: 'left',
    }}
  >
    <p
      style={{
        margin: 0,
        fontSize: 9,
        fontWeight: 800,
        color: INK_MUTE,
        letterSpacing: '0.14em',
        marginBottom: 5,
      }}
    >
      {label}
    </p>
    <p
      style={{
        margin: 0,
        fontSize: 32,
        fontWeight: 800,
        color,
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1,
        fontFamily: FONT_DISPLAY,
        letterSpacing: '-0.04em',
      }}
    >
      {value}
    </p>
    {sub && (
      <p
        style={{
          margin: '4px 0 0',
          fontSize: 10.5,
          color: 'rgba(15,23,42,0.40)',
          fontWeight: 500,
        }}
      >
        {sub}
      </p>
    )}
  </div>
);

export const RoundStatStrip: React.FC<Props> = ({ gross, stableford, differential }) => {
  return (
    <div
      style={{
        margin: '-44px 16px 0',
        position: 'relative',
        zIndex: 2,
        background: '#fff',
        borderRadius: 18,
        padding: '20px 18px',
        boxShadow:
          '0 8px 32px rgba(15,23,42,0.12), 0 1px 2px rgba(15,23,42,0.04)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
      }}
    >
      <Cell label="GROSS" value={gross ?? '—'} sub={null} />
      <Cell label="STABLEFORD" value={stableford ?? '—'} sub="points" border />
      <Cell
        label="DIFFERENTIAL"
        value={fmtDiff(differential)}
        sub="vs course"
        border
        color={differential !== null && differential < 0 ? GREEN : INK}
      />
    </div>
  );
};

export default RoundStatStrip;
