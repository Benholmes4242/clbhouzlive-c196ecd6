import { GAM } from '../../../gam/tokens';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { type LucideIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SheetHeader } from '@/components/ui/SheetHeader';
import { ChampionsListRow } from './ChampionsListRow';
import { formatGapFromChampion, formatHeldFor, daysSince, NEW_BADGE_DAYS } from './_shared/helpers';
import type { LegendCategory, LegendWindow } from '@/lib/gam/types';

interface SectionRow {
  rank: number;
  name: string;
  photoUrl: string | null;
  value: number;
  valueDisplay: string;
  attained_at: string;
  isSelf: boolean;
}

interface CategoryDescriptor {
  key: LegendCategory;
  label: string;
  short: string;
  icon: LucideIcon;
  unit: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  courseName: string;
  groupedRows: Map<LegendCategory, { rows: SectionRow[]; total: number }>;
  visibleCategories: CategoryDescriptor[];
  initialCategory: LegendCategory;
  window: LegendWindow;
}


export const FullCourseLeaderboardSheet: React.FC<Props> = ({
  open,
  onClose,
  courseName,
  groupedRows,
  visibleCategories,
  initialCategory,
  window: legendWindow,
}) => {
  const [activeCategory, setActiveCategory] = useState<LegendCategory>(initialCategory);

  useEffect(() => {
    if (open) setActiveCategory(initialCategory);
  }, [open, initialCategory]);

  const tabsToShow = useMemo(
    () =>
      visibleCategories.filter(
        (cat) => (groupedRows.get(cat.key)?.rows.length ?? 0) > 0,
      ),
    [visibleCategories, groupedRows],
  );

  const activeEntry = groupedRows.get(activeCategory);
  const activeRows = activeEntry?.rows ?? [];
  const activeDescriptor = tabsToShow.find((c) => c.key === activeCategory);
  const totalForActive = activeEntry?.total ?? 0;

  const listRef = useRef<HTMLDivElement>(null);
  const selfRowRef = useRef<HTMLDivElement>(null);
  const [selfOffscreen, setSelfOffscreen] = useState<null | 'above' | 'below'>(null);
  const selfIndex = activeRows.findIndex((r) => r.isSelf);
  const selfRank = selfIndex >= 0 ? activeRows[selfIndex].rank : null;

  useEffect(() => {
    setSelfOffscreen(null);
    const rowEl = selfRowRef.current;
    const rootEl = listRef.current;
    if (!rowEl || !rootEl || !open) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSelfOffscreen(null);
        } else {
          const rowTop = entry.boundingClientRect.top;
          const rootTop = entry.rootBounds?.top ?? 0;
          setSelfOffscreen(rowTop < rootTop ? 'above' : 'below');
        }
      },
      { root: rootEl, threshold: 0.4 },
    );
    obs.observe(rowEl);
    return () => obs.disconnect();
  }, [activeCategory, activeRows, open]);

  const jumpToSelf = () => {
    selfRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const windowLabel = legendWindow === '90d' ? '90 DAYS' : 'ALL TIME';
  const eyebrow = `LEADERBOARD · ${windowLabel}`;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="course-legends-full-sheet-title"
      style={{
        background: '#F8FAFC',
        maxHeight: '80dvh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        className="hcp-light"
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          position: 'relative',
          fontFamily: GAM.FONT_GEIST,
          color: 'var(--hcp-t-100)',
          background: 'var(--hcp-bg-0)',
        }}
      >
        <SheetHeader
          eyebrow={eyebrow}
          title={<span id="course-legends-full-sheet-title">{courseName}</span>}
          sub={
            activeDescriptor
              ? `${activeDescriptor.label} · ${totalForActive} ${totalForActive === 1 ? 'entry' : 'entries'}`
              : undefined
          }
          onClose={onClose}
        />

        <div
          style={{
            display: 'flex',
            gap: 7,
            overflowX: 'auto',
            padding: '12px 16px 14px',
            background: 'var(--hcp-bg-0)',
            borderBottom: '0.5px solid var(--hcp-line)',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
            flexShrink: 0,
          }}
          className="hcp-full-lb-tabs"
        >
          <style>{`.hcp-full-lb-tabs::-webkit-scrollbar { display: none; }`}</style>
          {tabsToShow.map((cat) => {
            const Icon = cat.icon;
            const isActive = cat.key === activeCategory;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                style={{
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '6px 7px 6px 11px',
                  borderRadius: 999,
                  background: isActive ? '#0F172A' : 'var(--hcp-bg-1)',
                  border: isActive ? '1px solid #0F172A' : '1px solid var(--hcp-line)',
                  color: isActive ? '#FFFFFF' : 'var(--hcp-t-100)',
                  fontSize: 11,
                  fontWeight: isActive ? 800 : 700,
                  fontFamily: GAM.FONT_GEIST,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.01em',
                }}
              >
                <Icon size={11} strokeWidth={2.4} />
                {cat.short}
              </button>
            );
          })}
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: '8px 0 24px',
            paddingBottom: 'env(safe-area-inset-bottom, 16px)',
            WebkitOverflowScrolling: 'touch',
            background: 'var(--hcp-bg-0)',
          }}
        >
          {activeRows.length === 0 ? (
            <div
              style={{
                padding: '40px 16px',
                textAlign: 'center',
                color: 'var(--hcp-t-60)',
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              No entries in this category yet.
            </div>
          ) : (
            activeRows.map((row, i) => {
              const champion = activeRows[0];
              const isChampion = i === 0;
              return (
                <ChampionsListRow
                  key={`${row.rank}-${row.attained_at}-${i}`}
                  rank={row.rank}
                  name={row.isSelf ? 'You' : row.name}
                  photoUrl={row.photoUrl}
                  valueDisplay={row.valueDisplay}
                  unitLabel={activeDescriptor?.unit ?? ''}
                  isSelf={row.isSelf}
                  isChampion={isChampion}
                  gapToChampion={
                    isChampion
                      ? null
                      : formatGapFromChampion(activeCategory, row.value, champion.value)
                  }
                  holdDuration={isChampion ? formatHeldFor(daysSince(champion.attained_at)) : null}
                  isNew={daysSince(row.attained_at) < NEW_BADGE_DAYS}
                />
              );
            })
          )}
        </div>
      </div>
    </BottomSheet>
  );
};

export default FullCourseLeaderboardSheet;
