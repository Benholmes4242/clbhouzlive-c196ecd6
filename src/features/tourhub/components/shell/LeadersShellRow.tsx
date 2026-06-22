import { memo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

import { INK_TINT_06, INK_TINT_07 } from '../../_shared/tokens';
import { LEADER_CATEGORIES } from '../leaders/constants';

const CHIPS = LEADER_CATEGORIES.map((c) => ({
  id: c.key,
  label: c.shortLabel,
  categoryKey: c.key,
}));

const DEFAULT_CATEGORY = 'earnings';

/**
 * Row 2 of the Tour Hub shell on /tourhub?tab=leaderboards.
 * Horizontally scrolling pill row with all 13 leader categories.
 */
function LeadersShellRowInner() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryKey = searchParams.get('category') || DEFAULT_CATEGORY;
  const activeRef = useRef<HTMLButtonElement | null>(null);

  const setCategory = (key: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', 'leaderboards');
    params.set('category', key);
    setSearchParams(params, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      inline: 'center',
      block: 'nearest',
      behavior: 'smooth',
    });
  }, [categoryKey]);

  return (
    <div
      className="relative"
      style={{
        background: '#F8FAFC',
      }}
    >
      <div
        role="tablist"
        aria-label="Stat category"
        className="flex gap-1.5 overflow-x-auto"
        style={{
          padding: '7px 16px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {CHIPS.map((c) => {
          const isActive = categoryKey === c.categoryKey;
          return (
            <button
              key={c.id}
              ref={isActive ? activeRef : undefined}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setCategory(c.categoryKey)}
              className="shrink-0 transition-colors active:scale-[0.97] flex items-center"
              style={{
                height: 30,
                padding: '0 11px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 15,
                background: isActive ? INK_TINT_06 : 'transparent',
                border: `1px solid ${isActive ? 'rgba(15,23,42,0.20)' : INK_TINT_07}`,
                color: isActive ? '#0A0E14' : '#64748B',
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
              }}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const LeadersShellRow = memo(LeadersShellRowInner);
export default LeadersShellRow;
