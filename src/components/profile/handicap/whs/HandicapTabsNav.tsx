import React, { useEffect, useRef, useState } from 'react';
import type { HandicapSubtab } from './types';

interface Props {
  active: HandicapSubtab;
  onChange: (next: HandicapSubtab) => void;
}

interface TabDef {
  id: HandicapSubtab;
  label: string;
}

const TABS: TabDef[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'trends', label: 'Trends' },
  { id: 'friends', label: 'Friends' },
];

const AMBER = '#F7931E';
const INK = '#0F172A';
const INK_MUTE = 'rgba(15,23,42,0.55)';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const PAGE_BG = '#F8FAFC';

export const HandicapTabsNav: React.FC<Props> = ({ active, onChange }) => {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [underline, setUnderline] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });

  useEffect(() => {
    const idx = TABS.findIndex((t) => t.id === active);
    const el = tabRefs.current[idx];
    if (!el) return;
    setUnderline({ left: el.offsetLeft, width: el.offsetWidth });
  }, [active]);

  return (
    <div
      role="tablist"
      aria-label="Handicap views"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 5,
        background: PAGE_BG,
        borderBottom: `1px solid ${HAIRLINE}`,
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          gap: 24,
          paddingLeft: 20,
          paddingRight: 20,
        }}
      >
        {TABS.map((t, i) => {
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              ref={(el) => (tabRefs.current[i] = el)}
              role="tab"
              aria-selected={isActive}
              aria-controls={`handicap-panel-${t.id}`}
              id={`handicap-tab-${t.id}`}
              onClick={() => onChange(t.id)}
              style={{
                position: 'relative',
                padding: '14px 0 12px',
                fontSize: 13,
                fontWeight: 700,
                color: isActive ? INK : INK_MUTE,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                letterSpacing: '0.02em',
                transition: 'color 150ms ease',
              }}
            >
              {t.label}
            </button>
          );
        })}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: -1,
            left: underline.left,
            width: underline.width,
            height: 2,
            background: AMBER,
            transition: 'left 280ms cubic-bezier(0.22, 0.61, 0.36, 1), width 280ms cubic-bezier(0.22, 0.61, 0.36, 1)',
          }}
        />
      </div>
    </div>
  );
};

export default HandicapTabsNav;
