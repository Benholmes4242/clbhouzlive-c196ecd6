import { GAM } from '../../../gam/tokens';
import React from 'react';
import { type LucideIcon } from 'lucide-react';
import type { LegendCategory } from '@/lib/gam/types';

interface NavCategory {
  key: LegendCategory;
  short: string;
  icon: LucideIcon;
  yourRank: number | null;
}

interface Props {
  categories: NavCategory[];
  onSelect: (key: LegendCategory) => void;
}


export const CategoryNavRail: React.FC<Props> = ({ categories, onSelect }) => (
  <div
    style={{
      position: 'sticky',
      top: 'var(--chrome-total-h, 0px)',
      zIndex: 10,
      background: 'var(--hcp-bg-0)',
      borderTop: '1px solid var(--hcp-line)',
      borderBottom: '1px solid var(--hcp-line)',
      padding: '12px 14px',
      marginTop: 22,
    }}
  >
    <div style={{ display: 'flex', gap: 7, overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
      {categories.map((cat) => {
        const CatIcon = cat.icon;
        const r = cat.yourRank;
        const held = r === 1;

        return (
          <button
            key={cat.key}
            onClick={() => onSelect(cat.key)}
            style={{
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '6px 7px 6px 11px',
              borderRadius: 999,
              background: 'rgba(15,23,42,0.03)',
              border: '1px solid rgba(15,23,42,0.12)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#0F172A',
                fontFamily: GAM.FONT_GEIST,
                letterSpacing: '0.01em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <CatIcon size={11} strokeWidth={2.4} />
              {cat.short}
            </span>
            {r != null && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 20,
                  height: 20,
                  padding: '0 5px',
                  borderRadius: 999,
                  background: held ? 'var(--hcp-pill-rank-held-bg, #0F172A)' : 'var(--hcp-pill-rank-bg, rgba(15,23,42,0.05))',
                  color: held ? '#fff' : 'var(--hcp-t-60, #5a6573)',
                  fontSize: 11,
                  fontWeight: 800,
                  fontFamily: GAM.FONT_GEIST,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.02em',
                }}
              >
                {r}
              </span>
            )}
          </button>
        );
      })}
    </div>
  </div>
);

export default CategoryNavRail;
