/**
 * TourPicker — frosted dark pill on hero imagery.
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
          padding: '7px 14px',
          background: 'rgba(10,14,20,0.55)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 14,
          fontSize: 11,
          fontWeight: 800,
          color: '#FFFFFF',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        <span style={{ color: V4.amber }}>{TOUR_LABEL[tour]}</span>
        <span style={{ opacity: 0.7, fontSize: 9 }}>▾</span>
      </button>
      {open ? (
        <div
          onMouseLeave={() => setOpen(false)}
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            background: 'rgba(10,14,20,0.9)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 12,
            padding: 4,
            boxShadow: '0 10px 24px rgba(0,0,0,0.35)',
            zIndex: 20,
            minWidth: 152,
          }}
        >
          {TOURS.map((t) => (
            <button
              key={t}
              onClick={() => { onChange(t); setOpen(false); }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 10px',
                background: 'transparent',
                border: 'none',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                color: t === tour ? V4.amber : '#FFFFFF',
                letterSpacing: '0.06em',
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
