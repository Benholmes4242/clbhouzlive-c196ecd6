import type React from 'react';
import { useTranslation } from 'react-i18next';
import { SlidersHorizontal } from 'lucide-react';

import { A, SANS } from '@/components/explore-tab-new/courseled/tokens';
import {
  SCOPE_OPTIONS,
  type ScopeKey,
} from '@/components/explore-tab-new/courseled/boardFilters';

/** THE FILTERS CONTROL — compact (Phase 8.2): sliders icon plus the active
    count as a figure; at zero, the icon alone. The word lives only in the
    accessible name. One shape, shared by every caller. */
export function FiltersPill({ count, onOpen }: { count: number; onOpen: () => void }) {
  const { t } = useTranslation('courses');
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t('discover.filterBoard.filters')}
      data-filters-count={count}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        flexShrink: 0,
        height: 36,
        minWidth: 36,
        padding: count > 0 ? '0 13px' : '0 10px',
        borderRadius: 999,
        border: `1px solid ${A.BORDER}`,
        background: 'transparent',
        color: A.INK,
        fontFamily: SANS,
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      <SlidersHorizontal size={15} aria-hidden />
      {count > 0 ? <span className="tabular-nums">{count}</span> : null}
    </button>
  );
}

/** THE SCOPE CONTROL — one component, shared by this head and the Leaderboards page. */
export function ScopeSegments({
  scope,
  clubApplies,
  onScopeChange,
  style,
}: {
  scope: ScopeKey;
  clubApplies: boolean;
  onScopeChange: (next: ScopeKey) => void;
  style?: React.CSSProperties;
}) {
  const { t } = useTranslation('courses');
  const options = SCOPE_OPTIONS.filter((o) => (o.key === 'club' ? clubApplies : true));
  return (
    <div
      role="radiogroup"
      aria-label={t('amateur.stream.scopes')}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${options.length}, minmax(0,1fr))`,
        gap: 3,
        padding: 3,
        borderRadius: 999,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.10)',
        ...style,
      }}
    >
      {options.map((o) => {
        const selected = scope === o.key;
        return (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => { if (!selected) onScopeChange(o.key); }}
            style={{
              height: 30,
              borderRadius: 999,
              border: 'none',
              background: selected ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: selected ? A.INK : A.MUTE,
              fontFamily: SANS,
              fontSize: 12.5,
              fontWeight: 600,
              padding: '0 4px',
              minWidth: 0,
            }}
          >
            {/* WIDTH BUDGET: at 390pt with THREE segments (a member with a
                club) each is 114px wide, 106px of label room after 4px padding
                each side. With TWO segments (no club) each is 173px, 165px of
                label room. The three-segment budget is the one that matters:
                it is the tighter case and the one a new translation must clear.
                Measured at 12.5px/600 in Chromium: en "Your circle" 63.7px,
                de "Dein Kreis" 61.8px, fr "Tout le monde" 84.5px, es "Todo el
                mundo" 88.7px (the longest shipped label), ja and ko all under
                51px. Nothing clips today. en-XA pseudo-localisation will NOT
                catch an overflow here. */}
            <span style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {t(o.i18n)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
