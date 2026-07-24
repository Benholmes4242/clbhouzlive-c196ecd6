/**
 * FullCourseLeaderboardSheetDispatch — Course Details "Champions" sheet.
 *
 * Discover-language re-skin (see TierSeeAllSheet):
 *   grabber → amber eyebrow (COURSE · CATEGORY · N ENTRIES) → 22/700 title
 *   → white cards with hairline borders, champion tint on rank-1,
 *     self-row tint, power bar per row (direction-aware).
 *
 * Behaviour parity with the dark FullCourseLeaderboardSheet:
 *   pinned champion, defending "YOUR CROWN" pill, self-row jump pill.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { BottomSheet } from '@/components/ui/BottomSheet';
import {
  AMBER,
  FONT,
  GOLD_DEEP,
  GOLD_BORDER,
  INK,
  INK_MUTE,
  SLATE_50,
  TOPAR_UNDER_LIGHT,
} from '@/features/tourhub/_shared/tokens';
import { StatRow } from '@/components/explore-tab-new/StatRow';
import type { LegendCategory, LegendWindow } from '@/lib/gam/types';


interface SectionRow {
  rank: number;
  name: string;
  photoUrl: string | null;
  value: number;
  valueDisplay: string;
  attained_at: string;
  isSelf: boolean;
  rank30d?: number | null;
  delta?: number | null;
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
  yourRanks: Partial<Record<LegendCategory, number | null>>;
  /** Accepted for signature compat; this component is light-only. */
  theme?: 'light' | 'dark';
}

const SELF_TINT = 'rgba(247,147,30,0.06)';

/** Lower-value-wins categories. */
function isLowerBetter(cat: LegendCategory): boolean {
  return cat.startsWith('lowest_gross_') || cat.startsWith('best_score_diff_');
}


export const FullCourseLeaderboardSheetDispatch: React.FC<Props> = ({
  open,
  onClose,
  courseName,
  groupedRows,
  visibleCategories,
  initialCategory,
}) => {
  const category = useMemo(
    () => visibleCategories.find((c) => c.key === initialCategory) ?? null,
    [visibleCategories, initialCategory],
  );
  const entry = groupedRows.get(initialCategory);
  const rows = entry?.rows ?? [];
  const total = entry?.total ?? rows.length;

  const champion = rows[0] ?? null;
  const restRows = rows.slice(1);
  const championValue = champion?.value ?? 0;
  const selfIsChampion = !!champion?.isSelf;

  // Self-row visibility tracking for the jump pill.
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const selfRowRef = useRef<HTMLDivElement | null>(null);
  const [selfOffscreen, setSelfOffscreen] = useState<null | 'above' | 'below'>(null);
  const selfRow = rows.find((r) => r.isSelf) ?? null;

  useEffect(() => {
    if (!open || !selfRow || selfIsChampion) {
      setSelfOffscreen(null);
      return;
    }
    const root = scrollRef.current;
    const target = selfRowRef.current;
    if (!root || !target) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSelfOffscreen(null);
        } else {
          const rootRect = root.getBoundingClientRect();
          const tRect = target.getBoundingClientRect();
          setSelfOffscreen(tRect.top < rootRect.top ? 'above' : 'below');
        }
      },
      { root, threshold: 0.5 },
    );
    io.observe(target);
    return () => io.disconnect();
  }, [open, selfRow, selfIsChampion, initialCategory]);

  const scrollToSelf = () => {
    selfRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  if (!category) return null;

  const totalRows = rows.length;
  const isScoreDiff = initialCategory.startsWith('best_score_diff_');

  const renderRow = (r: SectionRow, opts: { isChampion: boolean; index: number }) => {
    const { index } = opts;
    const isLast = index === totalRows - 1;
    const underPar = isScoreDiff && r.value < 0;
    const statColor = underPar ? TOPAR_UNDER_LIGHT : undefined;

    return (
      <div
        key={`${r.rank}-${r.attained_at}-${r.name}`}
        ref={r.isSelf && r.rank !== 1 ? selfRowRef : undefined}
        style={{
          background: r.isSelf ? SELF_TINT : 'transparent',
        }}
      >
        <StatRow
          rank={r.rank}
          avatarUrl={r.photoUrl}
          name={r.isSelf ? 'You' : r.name}
          statValue={r.valueDisplay}
          statLabel={category.short}
          statColor={statColor}
          showWatermark={r.rank === 1}
          isLast={isLast}
          density="compact"
        />
      </div>
    );
  };

  void AMBER;
  void isLowerBetter;


  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="course-legends-full-sheet-title"
      variant="light"
      surfaceColor={SLATE_50}
      style={{
        height: '75dvh',
        maxHeight: '75dvh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: FONT,
        background: SLATE_50,
      }}
    >
      {/* Header */}
      <div style={{ padding: '10px 16px 12px', background: SLATE_50 }}>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: AMBER,
              marginBottom: 6,
              fontVariantNumeric: 'tabular-nums',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {courseName} {'\u00B7'} {category.short} {'\u00B7'} {total} {total === 1 ? 'ENTRY' : 'ENTRIES'}
          </div>
          <div
            id="course-legends-full-sheet-title"
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: INK,
              letterSpacing: '-0.01em',
              lineHeight: 1.1,
            }}
          >
            {category.label}
          </div>
          {selfIsChampion && (
            <div
              style={{
                marginTop: 8,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 8px',
                borderRadius: 999,
                background: 'rgba(247,147,30,0.12)',
                border: `1px solid ${GOLD_BORDER}`,
                color: GOLD_DEEP,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Your crown
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          background: SLATE_50,
          padding: '12px 0',
          position: 'relative',
        }}
      >
        {rows.length === 0 ? (
          <div style={{ padding: '28px 16px', textAlign: 'center', color: INK_MUTE, fontSize: 12, fontWeight: 600 }}>
            None yet.
          </div>
        ) : (
          <div>
            {champion && renderRow(champion, { isChampion: true, index: 0 })}
            {restRows.map((r, i) => renderRow(r, { isChampion: false, index: i + 1 }))}
          </div>
        )}
        <div style={{ height: 24 }} />
      </div>

      {/* Self-row jump pill */}
      {selfOffscreen && selfRow && (
        <button
          type="button"
          onClick={scrollToSelf}
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: 20,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 999,
            background: INK,
            color: '#fff',
            border: 'none',
            fontFamily: FONT,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.04em',
            boxShadow: '0 6px 20px rgba(15,23,42,0.28)',
            cursor: 'pointer',
            zIndex: 2,
          }}
        >
          {selfOffscreen === 'above' ? (
            <ChevronUp size={14} strokeWidth={2.5} />
          ) : (
            <ChevronDown size={14} strokeWidth={2.5} />
          )}
          Jump to you {'\u00B7'} #{selfRow.rank}
        </button>
      )}
    </BottomSheet>
  );
};

export default FullCourseLeaderboardSheetDispatch;
