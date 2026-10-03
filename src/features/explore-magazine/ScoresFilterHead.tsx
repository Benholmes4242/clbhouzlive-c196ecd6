import { useTranslation } from 'react-i18next';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';

import { A, SANS } from '@/components/explore-tab-new/courseled/tokens';
import {
  BOARD_LABELS,
  SCOPE_OPTIONS,
  type BoardKey,
  type ScopeKey,
} from '@/components/explore-tab-new/courseled/boardFilters';

/**
 * EXPLORE SCORES' HEAD (BRIEF_SCORES_RETIRE_THE_GEOGRAPHY_RAIL, option B).
 * Row 1: the board is the page subject, so it is the title; Filters on the right.
 * Row 2: scope as a real segmented control. The sheet no longer carries scope or
 * board for this surface, so each value has exactly one place to be set.
 */
export function ScoresFilterHead({
  board,
  scope,
  filterCount,
  onOpenBoard,
  onOpenFilters,
  onScopeChange,
}: {
  board: BoardKey;
  scope: ScopeKey;
  /** Sheet-only axes that differ from the default. Scope and board never count. */
  filterCount: number;
  onOpenBoard: () => void;
  onOpenFilters: () => void;
  onScopeChange: (next: ScopeKey) => void;
}) {
  const { t } = useTranslation('courses');

  return (
    <div style={{ padding: '0 16px', fontFamily: SANS }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <button
          type="button"
          data-scores-board-picker
          onClick={onOpenBoard}
          aria-label={t('amateur.board.openPicker', 'Choose a board')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            minWidth: 0,
            padding: 0,
            border: 'none',
            background: 'transparent',
            color: A.INK,
            fontFamily: SANS,
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}
        >
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {t(BOARD_LABELS[board].i18n, BOARD_LABELS[board].label)}
          </span>
          <ChevronDown size={16} color={A.MUTE} style={{ flexShrink: 0 }} />
        </button>

        <button
          type="button"
          onClick={onOpenFilters}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            flexShrink: 0,
            height: 32,
            padding: '0 12px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.16)',
            background: 'transparent',
            color: A.INK,
            fontFamily: SANS,
            fontSize: 12.5,
            fontWeight: 600,
          }}
        >
          <SlidersHorizontal size={14} />
          {t('discover.filterBoard.filters', 'Filters')}
          {filterCount > 0 ? (
            <span
              className="tabular-nums"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 16,
                height: 16,
                borderRadius: 999,
                background: A.AMBER,
                color: '#0A0A0C',
                fontSize: 10,
                fontWeight: 800,
              }}
            >
              {filterCount}
            </span>
          ) : null}
        </button>
      </div>

      <div
        role="radiogroup"
        aria-label={t('amateur.stream.scopes', 'Scores scope')}
        style={{
          marginTop: 12,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0,1fr))',
          gap: 3,
          padding: 3,
          borderRadius: 999,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.10)',
        }}
      >
        {SCOPE_OPTIONS.map((o) => {
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
              {/* WIDTH BUDGET: at 390pt each segment is 114px wide with 4px
                  padding each side, so a label has 106px before it ellipses.
                  Measured at 12.5px/600 in Chromium: en "Your circle" 63.7px,
                  de "Dein Kreis" 61.8px, fr "Tout le monde" 84.5px, es "Todo el
                  mundo" 88.7px (the longest shipped label), ja and ko all under
                  51px. Nothing clips today. Any new translation must be measured
                  against 106px, and en-XA pseudo-localisation will NOT catch an
                  overflow here. */}
              <span style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {t(o.i18n, o.label)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
