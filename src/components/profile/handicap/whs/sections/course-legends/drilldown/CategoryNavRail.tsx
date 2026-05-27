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
      padding: '12px 12px',
      marginTop: 22,
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
              gap: 6,
              padding: '7px 12px',
              borderRadius: 9,
              background: isHeld
                ? 'linear-gradient(180deg, var(--hcp-accent-util-tint), var(--hcp-accent-util-tint-2))'
                : 'rgba(255,255,255,0.025)',
              border: isHeld
                ? '1px solid var(--hcp-accent-util-border)'
                : '1px solid rgba(255,255,255,0.04)',
              color: isHeld ? 'var(--hcp-accent-util)' : 'var(--hcp-t-80)',
              fontSize: 11,
              fontWeight: 700,
              fontFamily: FONT,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              letterSpacing: '0.01em',
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
                  letterSpacing: '-0.01em',
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
