import React from 'react';

interface Props {
  gross: number | null;
  stableford: number | null;
  differential: number | null;
  handicapDelta: number | null;
}

const INK = '#0F172A';
const INK_55 = 'rgba(15,23,42,0.55)';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const AMBER_DEEP = '#C97211';
const GREEN_BRIGHT = '#10B981';
const RED_BRIGHT = '#E11D48';

const fmtDiff = (n: number | null) => {
  if (n === null) return '—';
  if (n > 0) return `+${n.toFixed(1)}`;
  if (n < 0) return `\u2212${Math.abs(n).toFixed(1)}`;
  return '0.0';
};

const fmtHcp = (delta: number | null): { value: string; accent: string } => {
  if (delta === null) return { value: '—', accent: INK };
  if (Math.abs(delta) < 0.05) return { value: 'FLAT', accent: INK_55 };
  if (delta < 0) return { value: `\u2193 ${Math.abs(delta).toFixed(1)}`, accent: GREEN_BRIGHT };
  return { value: `\u2191 ${delta.toFixed(1)}`, accent: RED_BRIGHT };
};

const Metric: React.FC<{ label: string; value: string; accent: string }> = ({
  label,
  value,
  accent,
}) => (
  <div style={{ textAlign: 'center' }}>
    <div
      style={{
        fontSize: 9,
        fontWeight: 800,
        color: INK_55,
        letterSpacing: '0.16em',
        marginBottom: 4,
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
  </div>
);

export const RoundStatStrip: React.FC<Props> = ({
  gross,
  stableford,
  differential,
  handicapDelta,
}) => {
  const hcp = fmtHcp(handicapDelta);
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        padding: '14px 12px',
        borderBottom: `1px solid ${HAIRLINE}`,
      }}
    >
      <Metric label="GROSS" value={String(gross ?? '—')} accent={INK} />
      <Metric label="POINTS" value={String(stableford ?? '—')} accent={INK} />
      <Metric label="DIFF" value={fmtDiff(differential)} accent={AMBER_DEEP} />
      <Metric label="HCP" value={hcp.value} accent={hcp.accent} />
    </div>
  );
};

export default RoundStatStrip;
