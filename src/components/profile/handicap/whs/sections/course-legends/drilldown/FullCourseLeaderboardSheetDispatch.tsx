/**
 * FullCourseLeaderboardSheetDispatch — Course Details "Champions > Full List"
 * sheet. Visually 1:1 with the Tour Hub Leaders FullListSheet: light SLATE_50
 * surface, amber eyebrow, ink title, dark sub-line, gold No.1 masthead, and a
 * simple ranked ledger for ranks 2..N.
 *
 * Signature-compatible with the legacy FullCourseLeaderboardSheet so the
 * drilldown just swaps components based on theme.
 */

import React, { useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import {
  AMBER,
  FONT,
  GOLD_DEEP,
  GOLD_BORDER,
  HAIRLINE_INK_10,
  INK,
  INK_MUTE,
  SLATE_50,
} from '@/features/tourhub/_shared/tokens';
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
  courseName,
  groupedRows,
  visibleCategories,
  initialCategory,
  window: legendWindow,
}) => {
  const category = useMemo(
    () => visibleCategories.find((c) => c.key === initialCategory) ?? null,
    [visibleCategories, initialCategory],
  );
  const entry = groupedRows.get(initialCategory);
  const rows = entry?.rows ?? [];
  const total = entry?.total ?? rows.length;

  const windowLabel = legendWindow === '90d' ? '90 DAYS' : 'ALL TIME';

  if (!category) return null;

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
      <div style={{ padding: '10px 16px 12px', borderBottom: `0.5px solid ${HAIRLINE_INK_10}`, background: SLATE_50 }}>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 8.5,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: AMBER,
              marginBottom: 4,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {courseName} {'\u00B7'} {windowLabel} {'\u00B7'} {total} {total === 1 ? 'ENTRY' : 'ENTRIES'}
          </div>
          <div
            id="course-legends-full-sheet-title"
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: INK,
              letterSpacing: '-0.01em',
              lineHeight: 1.1,
            }}
          >
            {category.label}
          </div>
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          background: SLATE_50,
          padding: '12px 0',
        }}
      >
        {rows.length === 0 ? (
          <div style={{ padding: '28px 16px', textAlign: 'center', color: INK_MUTE, fontSize: 12, fontWeight: 600 }}>
            None yet.
          </div>
        ) : (
          <div style={{ padding: '0 16px' }}>
            {rows.map((r, i) => {
              const isTop = r.rank === 1;
              return (
                <div
                  key={`${r.rank}-${r.attained_at}-${i}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                    borderRadius: 12,
                    padding: '10px 12px',
                    background: isTop ? 'linear-gradient(100deg, #fff, #fff6e8)' : '#fff',
                    border: isTop
                      ? `1px solid ${GOLD_BORDER}`
                      : '1px solid rgba(15,23,42,0.07)',
                    marginBottom: 6,
                    fontFamily: FONT,
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      textAlign: 'center',
                      flexShrink: 0,
                      fontSize: 14,
                      fontWeight: 900,
                      fontVariantNumeric: 'tabular-nums',
                      color: isTop ? GOLD_DEEP : '#94A3B8',
                      lineHeight: 1,
                    }}
                  >
                    {r.rank}
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <SquircleAvatar
                      size={34}
                      srcCandidates={r.photoUrl ? [r.photoUrl] : []}
                      alt={r.name}
                      hairlineRing
                      ringColor={isTop ? GOLD_DEEP : LIGHT_HAIRLINE}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: INK,
                        lineHeight: 1.2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {r.isSelf ? 'You' : r.name}
                    </div>
                  </div>
                  <div
                    style={{
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      minWidth: 42,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 900,
                        color: INK,
                        lineHeight: 1,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {r.valueDisplay}
                    </div>
                    <div
                      style={{
                        marginTop: 2,
                        fontSize: 8,
                        fontWeight: 800,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: '#94A3B8',
                        lineHeight: 1,
                      }}
                    >
                      {category.short}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ height: 24 }} />
      </div>
    </BottomSheet>
  );
};

export default FullCourseLeaderboardSheetDispatch;
