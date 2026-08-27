/**
 * FullCourseLeaderboardSheetDispatch — the Champions tab's full leaderboard.
 *
 * Analytical treatment: 75dvh, kicker + title + plain close, the shared
 * column-header row, then the SAME BoardRow the panel uses. No trophy
 * watermark, no tinted member row - the member takes amber name and value.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronUp, ChevronDown, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { A, KICKER, SANS, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { BoardHeaderRow, BoardRow, hasAnyMovement } from './_shared/boardParts';
import { formatGapFromChampion } from './_shared/helpers';
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

export const FullCourseLeaderboardSheetDispatch: React.FC<Props> = ({
  open,
  onClose,
  groupedRows,
  visibleCategories,
  initialCategory,
}) => {
  const { t } = useTranslation('courses');
  const category = useMemo(
    () => visibleCategories.find((c) => c.key === initialCategory) ?? null,
    [visibleCategories, initialCategory],
  );
  const entry = groupedRows.get(initialCategory);
  const rows = entry?.rows ?? [];
  const total = entry?.total ?? rows.length;

  const champion = rows[0] ?? null;
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

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="course-legends-full-sheet-title"
      variant="light"
      surfaceColor={A.PANEL}
      style={{
        height: 'auto',
        maxHeight: '85dvh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: SANS,
        background: A.PANEL,
        ...FIGS,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '6px 16px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              ...KICKER,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {category.label} {'\u00B7'} {t('champions.entries', { count: total })}
          </div>
          <div
            id="course-legends-full-sheet-title"
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: A.INK,
              letterSpacing: '-0.01em',
              marginTop: 3,
            }}
          >
            {t('champions.fullLeaderboard')}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('champions.close')}
          style={{
            border: 'none',
            background: 'transparent',
            color: A.MUTE,
            cursor: 'pointer',
            padding: 6,
            margin: -6,
            lineHeight: 0,
            flexShrink: 0,
          }}
        >
          <X size={20} strokeWidth={2} />
        </button>
      </div>

      {/* Body */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '0 16px 28px',
          position: 'relative',
        }}
      >
        {rows.length === 0 ? (
          <div
            style={{
              padding: '28px 0',
              textAlign: 'center',
              color: A.MUTE,
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            {t('champions.noneYet')}
          </div>
        ) : (
          <>
            <BoardHeaderRow
              rankLabel={t('champions.colRank')}
              memberLabel={t('champions.colMember')}
              movementLabel={t('champions.col30d')}
              gapLabel={t('champions.colGap')}
              showMovement={anyMovement}
              unitLabel={category.unit || category.short}
            />
            {rows.map((r, i) => (
              <BoardRow
                key={`${r.rank}-${r.attained_at}-${r.name}`}
                rule={i > 0}
                showMovement={anyMovement}
                rowRef={r.isSelf && r.rank !== 1 ? selfRowRef : undefined}
                row={{
                  rank: r.rank,
                  name: r.name,
                  photoUrl: r.photoUrl,
                  valueDisplay: r.valueDisplay,
                  isSelf: r.isSelf,
                  rank30d: r.rank30d,
                  delta: r.delta,
                  gapDisplay:
                    leaderValue != null && i > 0
                      ? formatGapFromChampion(category.key, r.value, leaderValue)
                      : null,
                }}
              />
            ))}
          </>
        )}
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
            background: A.INK,
            color: A.CANVAS,
            border: 'none',
            fontFamily: SANS,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.04em',
            cursor: 'pointer',
            zIndex: 2,
            ...FIGS,
          }}
        >
          {selfOffscreen === 'above' ? (
            <ChevronUp size={14} strokeWidth={2.5} />
          ) : (
            <ChevronDown size={14} strokeWidth={2.5} />
          )}
          {t('champions.jumpToYou', { rank: selfRow.rank })}
        </button>
      )}
    </BottomSheet>
  );
};

export default FullCourseLeaderboardSheetDispatch;
