import React from 'react';
import { FONT, T50 } from './_shared/tokens';
import type { RivalryDimension } from '@/lib/whs/utils/useRivalryDimension';

interface Props {
  value: RivalryDimension;
  onChange: (v: RivalryDimension) => void;
}

const OPTS: { v: RivalryDimension; label: string }[] = [
  { v: 'gross', label: 'Gross' },
  { v: 'stableford', label: 'Stbl' },
];

export const DimensionToggle: React.FC<Props> = ({ value, onChange }) => (
  <div
    role="tablist"
    aria-label="Scoring dimension"
    style={{
      display: 'inline-flex',
      padding: 2,
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 999,
      gap: 2,
      fontFamily: FONT,
    }}
  >
    {OPTS.map((o) => {
      const active = o.v === value;
      return (
        <button
          key={o.v}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onChange(o.v)}
          style={{
            padding: '3px 9px',
            borderRadius: 999,
            background: active ? '#FFFFFF' : 'transparent',
            color: active ? '#0F172A' : 'rgba(255,255,255,0.6)',
            border: 'none',
            cursor: 'pointer',
            fontSize: 9.5,
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontFamily: FONT,
            transition: 'background-color 150ms ease, color 150ms ease',
          }}
        >
          {o.label}
        </button>
      );
    })}
  </div>
);

