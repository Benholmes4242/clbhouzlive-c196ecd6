import React from 'react';
import { adminTheme as t } from '../../theme';
import { LENSES, type Lens } from './analyticsLens';

/**
 * Four-column segmented lens control, exactly as analytics_*.html. Health
 * reuses it with its own items (BRIEF_HEALTH: "identical to the Analytics lens nav").
 */
export default function AnalyticsLenses<L extends string = Lens>({ lens, onLens, items, label = 'Analytics lenses' }: {
  lens: L; onLens: (l: L) => void; items?: { id: L; label: string }[]; label?: string;
}) {
  const list = (items ?? (LENSES as unknown as { id: L; label: string }[]));
  return (
    <nav aria-label={label} style={{
      display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 4, padding: 4, borderRadius: 999, background: t.surface,
    }}>
      {list.map((l) => {
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
