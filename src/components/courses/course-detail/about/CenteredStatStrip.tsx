import React from 'react';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { ABOUT_KICKER, aboutFig } from './AboutSection';

export interface CenteredStatItem {
  label: string;
  value: string;
  tone?: string;
}

/** Shared centred facts strip; takes its column count from its items. */
export const CenteredStatStrip: React.FC<{ items: CenteredStatItem[] }> = ({ items }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
    {items.map((item) => (
      <div key={item.label} style={{ minWidth: 0, textAlign: 'center' }}>
        <div
          className="tabular-nums lining-nums"
          style={{ ...aboutFig(21, item.tone ?? A.INK), lineHeight: 1, letterSpacing: '-0.04em' }}
        >
          {item.value}
        </div>
        <div
          style={{
            ...ABOUT_KICKER,
            marginTop: 5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.label}
        </div>
      </div>
    ))}
  </div>
);

export default CenteredStatStrip;