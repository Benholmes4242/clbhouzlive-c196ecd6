import React from 'react';
import { adminTheme as t } from '../../theme';
import { LENSES, type Lens } from './analyticsLens';

/** Four-column segmented lens control, exactly as analytics_*.html. */
export default function AnalyticsLenses({ lens, onLens }: { lens: Lens; onLens: (l: Lens) => void }) {
  return (
    <nav aria-label="Analytics lenses" style={{
      display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 4, padding: 4, borderRadius: 999, background: t.surface,
    }}>
      {LENSES.map((l) => {
        const on = l.id === lens;
        return (
          <button key={l.id} type="button" aria-current={on ? 'page' : undefined} onClick={() => onLens(l.id)} style={{
            height: 34, borderRadius: 999, border: 0, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700,
            background: on ? t.ink : 'transparent', color: on ? t.canvas : t.inkMuted, cursor: 'pointer', fontFamily: 'inherit',
          }}>{l.label}</button>
        );
      })}
    </nav>
  );
}
