import React from 'react';

interface ChampionsSignatureFooterProps {
  windowLabel: string;
  heldDuration: string;
  entryCount: number;
}

const INK = '#0F1822';
const AMBER = '#F7931E';

export const ChampionsSignatureFooter: React.FC<ChampionsSignatureFooterProps> = ({
  windowLabel,
  heldDuration,
  entryCount,
}) => (
  <div
    style={{
      background: INK,
      padding: '12px 16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
      fontVariantNumeric: 'tabular-nums',
    }}
  >
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 11.5,
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: AMBER,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: AMBER,
          flexShrink: 0,
        }}
      />
      {windowLabel} · Held {heldDuration}
    </span>
    <span
      style={{
        fontSize: 11.5,
        color: 'rgba(255,255,255,0.55)',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}
    >
      {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
    </span>
  </div>
);

export default ChampionsSignatureFooter;
