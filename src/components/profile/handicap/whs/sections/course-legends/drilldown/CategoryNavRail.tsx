import React from 'react';
import { type LucideIcon } from 'lucide-react';
import { rankTier } from './_shared/helpers';
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

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

export const CategoryNavRail: React.FC<Props> = ({ categories, onSelect }) => (
  <div
    style={{
      position: 'sticky',
      top: 0,
      zIndex: 10,
      background: 'var(--hcp-bg-0)',
      borderTop: '1px solid var(--hcp-line)',
      borderBottom: '1px solid var(--hcp-line)',
      padding: '10px 12px',
      marginTop: 18,
    }}
  >
    <div
      style={{
        display: 'flex',
        gap: 6,
        overflowX: 'auto',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {categories.map((cat) => {
        const CatIcon = cat.icon;
        const r = cat.yourRank;
        const isHeld = r === 1;
        const tier = r != null ? rankTier(r) : null;

        return (
          <button
            key={cat.key}
            onClick={() => onSelect(cat.key)}
            style={{
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 10px',
              borderRadius: 8,
              background: 'var(--hcp-bg-1)',
              border: '1px solid var(--hcp-line)',
              color: isHeld ? '#FBBC2E' : 'var(--hcp-t-80)',
              fontSize: 11,
              fontWeight: 700,
              fontFamily: FONT,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <CatIcon size={11} strokeWidth={2.4} />
            {cat.short}
            {r != null && (
              <span
                style={{
                  marginLeft: 1,
                  fontWeight: 800,
                  color: isHeld ? '#FBBC2E' : tier?.color ?? 'var(--hcp-t-60)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                #{r}
              </span>
            )}
          </button>
        );
      })}
    </div>
  </div>
);
