/**
 * TourPicker — top-right tour switcher on HeroV4. Independent of the
 * WorldRankings board chips.
 */

import { useState } from 'react';
import { V4 } from '../tokens';
import { TOUR_LABEL } from '../../_shared/tourOrder';
import type { TourId } from '../../hooks/useOverviewData';

const TOURS: TourId[] = ['pga', 'lpga', 'euro', 'liv', 'pgad', 'champ'];

export function TourPicker({ tour, onChange }: { tour: TourId; onChange: (t: TourId) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          background: 'rgba(255,255,255,0.92)',
          border: `0.5px solid ${V4.hairline}`,
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 800,
          color: V4.ink,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {TOUR_LABEL[tour]}
        <span style={{ opacity: 0.55, fontSize: 9 }}>▾</span>
      </button>
      {open ? (
        <div
          onMouseLeave={() => setOpen(false)}
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            background: V4.surface,
            border: `0.5px solid ${V4.hairline}`,
            borderRadius: 12,
            padding: 4,
            boxShadow: '0 8px 20px rgba(15,23,42,0.12)',
            zIndex: 20,
            minWidth: 140,
          }}
        >
          {TOURS.map((t) => (
            <button
              key={t}
              onClick={() => {
                onChange(t);
                setOpen(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 10px',
                background: t === tour ? V4.amberSoft : 'transparent',
                border: 'none',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                color: V4.ink,
              }}
            >
              {TOUR_LABEL[t]}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
