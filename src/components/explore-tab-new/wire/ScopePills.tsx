import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { REGION_TABS } from '../AlmanacSections';

/**
 * ScopePills — ONE control for the whole page, replacing the four Discover
 * carried before (region scope, Recent/All-time, the Honours/Eagles/Birdies
 * tabs and the Toughest/Scoreable toggles). A wire is chronological by
 * definition, so there is no all-time lens here.
 */

interface Props {
  region: string | null;
  onChange: (slug: string | null) => void;
}

export function ScopePills({ region, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Region"
      className="scrollbar-hide"
      style={{
        position: 'sticky',
        top: 'var(--sat, 0px)',
        zIndex: 10,
        background: 'rgba(248,250,252,0.86)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${A.BORDER}`,
        padding: '12px 16px',
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
      }}
    >
      {REGION_TABS.map((tab) => {
        const active = (tab.slug ?? null) === region;
        return (
          <button
            key={tab.slug ?? '__ww__'}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.slug)}
            style={{
              flex: 'none',
              border: `1px solid ${active ? A.INK : A.BORDER}`,
              background: active ? A.INK : A.PANEL,
              color: active ? A.PANEL : A.INK,
              borderRadius: 999,
              padding: '9px 16px',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: SANS,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default ScopePills;
