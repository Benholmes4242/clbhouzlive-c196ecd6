import React from 'react';
import { CrownIcon } from './CrownIcon';
import type { CrownInfo } from '../headlineEngine';

const GOLD = '#FBBC2E';
const DIM  = 'rgba(255,255,255,0.32)';
const EVEN = 'rgba(255,255,255,0.50)';

const FONT_GEIST =
  'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

interface Props {
  crowns: CrownInfo[];
}

export const CrownStrip: React.FC<Props> = ({ crowns }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${crowns.length}, 1fr)`,
      gap: 1,
      padding: '10px 14px',
      background: 'rgba(255,255,255,0.04)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      fontFamily: FONT_GEIST,
    }}
  >
    {crowns.map((c) => (
      <CrownCell key={c.key} crown={c} />
    ))}
  </div>
);

const CrownCell: React.FC<{ crown: CrownInfo }> = ({ crown }) => {
  const { holder, label, you, them, compareKind } = crown;
  const isEven = holder === 'even';
  const color  = isEven ? EVEN : GOLD;

  let valueText: string;
  if (holder === 'even') {
    const a = you ?? 0;
    const b = them ?? 0;
    valueText = a === 0 && b === 0 ? 'EVEN' : `${a}–${b}`;
  } else if (compareKind === 'lower') {
    valueText = `${you ?? '—'}–${them ?? '—'}`;
  } else {
    valueText = `${you ?? 0}–${them ?? 0}`;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        padding: '4px 2px',
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3,
          fontSize: 8.5,
          fontWeight: 800,
          letterSpacing: '0.14em',
          color,
        }}
      >
        {!isEven && <CrownIcon size={9} color={GOLD} />}
        <span>{label}</span>
      </div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color,
          fontVariantNumeric: 'tabular-nums',
          fontFeatureSettings: '"kern" 1, "liga" 1',
          letterSpacing: '-0.01em',
        }}
      >
        {valueText}
      </div>
    </div>
  );
};

export default CrownStrip;
