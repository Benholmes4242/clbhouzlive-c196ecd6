import { GAM } from '../../../gam/tokens';
import React, { useEffect, useMemo, useState } from 'react';
import { type LucideIcon } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SheetHeader } from '@/components/ui/SheetHeader';
import { CompactLeaderRow } from './CompactLeaderRow';
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

  const windowLabel = legendWindow === '90d' ? '90 DAYS' : 'ALL TIME';
  const eyebrow = `LEADERBOARD · ${windowLabel}`;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="course-legends-full-sheet-title"
      style={{
        background: '#F8FAFC',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          fontFamily: GAM.FONT_GEIST,
          color: GAM.INK,
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
            gap: 6,
            overflowX: 'auto',
            padding: '12px 16px 14px',
            background: '#F8FAFC',
            borderBottom: '0.5px solid rgba(15,23,42,0.08)',
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
                  gap: 6,
                  padding: '7px 12px',
                  borderRadius: 9,
                  background: isActive ? 'rgba(15,23,42,0.06)' : 'rgba(15,23,42,0.03)',
                  border: isActive
                    ? '1px solid rgba(15,23,42,0.22)'
                    : '1px solid rgba(15,23,42,0.12)',
                  color: GAM.INK,
                  fontSize: 11,
                  fontWeight: isActive ? 800 : 700,
                  fontFamily: GAM.FONT_GEIST,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.01em',
                }}
              >
                <Icon size={11} strokeWidth={2.2} />
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
            padding: '12px 16px 24px',
            paddingBottom: 'env(safe-area-inset-bottom, 16px)',
            WebkitOverflowScrolling: 'touch',
            background: '#F8FAFC',
          }}
        >
          {activeRows.length === 0 ? (
            <div
              style={{
                padding: '40px 16px',
                textAlign: 'center',
                color: '#64748B',
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              No entries in this category yet.
            </div>
          ) : (
            <div
              style={{
                background: '#fff',
                border: '0.5px solid rgba(15,23,42,0.08)',
                borderRadius: 12,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {activeRows.map((row, i) => (
                <CompactLeaderRow
                  key={`${row.rank}-${row.attained_at}-${i}`}
                  row={row}
                  unit={activeDescriptor?.unit ?? ''}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};

export default FullCourseLeaderboardSheet;
