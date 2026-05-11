import React from 'react';

interface Props {
  gross: number | null;
  stableford: number | null;
  differential: number | null;
}

const INK = '#0F172A';
const INK_55 = 'rgba(15,23,42,0.55)';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const AMBER = '#F7931E';
const AMBER_DEEP = '#C97211';

const fmtDiff = (n: number | null) => {
  if (n === null) return '—';
  if (n > 0) return `+${n.toFixed(1)}`;
  if (n < 0) return `\u2212${Math.abs(n).toFixed(1)}`;
  return '0.0';
};

const Metric: React.FC<{
  label: string;
  value: string;
  accent: string;
  highlight?: boolean;
}> = ({ label, value, accent, highlight }) => (
  <div style={{ textAlign: 'center', position: 'relative' }}>
    <div
      style={{
        fontSize: 9,
        fontWeight: 900,
        color: INK_55,
        letterSpacing: '0.18em',
        marginBottom: 6,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 22,
        fontWeight: 800,
        color: accent,
        letterSpacing: '-0.03em',
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {value}
    </div>
    {highlight && (
      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: -18,
          left: '30%',
          right: '30%',
          height: 2,
          background: AMBER,
          borderRadius: 1,
        }}
      />
    )}
  </div>
);

export const RoundStatStrip: React.FC<Props> = ({
  gross,
  stableford,
  differential,
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      padding: '16px 14px 22px',
      borderBottom: `1px solid ${HAIRLINE}`,
    }}
  >
    <Metric label="GROSS" value={String(gross ?? '—')} accent={INK} />
    <Metric label="POINTS" value={String(stableford ?? '—')} accent={INK} />
    <Metric label="DIFF" value={fmtDiff(differential)} accent={AMBER_DEEP} highlight />
  </div>
);

export default RoundStatStrip;
