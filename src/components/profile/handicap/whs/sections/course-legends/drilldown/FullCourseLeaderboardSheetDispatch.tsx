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
  const top = rows[0];
  const rest = rows.slice(1);

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
      }}
    >
      {/* Header */}
      <div style={{ padding: '10px 16px 12px', borderBottom: `0.5px solid ${HAIRLINE_INK_10}`, background: SLATE_50 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
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

        {/* No.1 masthead */}
        {top && (
          <div
            style={{
              marginTop: 12,
              padding: '12px 14px',
              background: SLATE_50,
              border: `1px solid ${GOLD_BORDER}`,
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 1px 3px rgba(255,184,0,0.10)',
            }}
          >
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <SquircleAvatar
                size={52}
                srcCandidates={top.photoUrl ? [top.photoUrl] : []}
                alt={top.name}
                hairlineRing
                ringColor={GOLD_DEEP}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 7.5,
                  fontWeight: 800,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: GOLD_DEEP,
                  marginBottom: 3,
                }}
              >
                No.1 {'\u00B7'} {category.short}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: INK,
                    letterSpacing: '-0.01em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {top.isSelf ? 'You' : top.name}
                </span>
              </div>
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 200,
                color: GOLD_DEEP,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.02em',
                flexShrink: 0,
              }}
            >
              {top.valueDisplay}
            </div>
          </div>
        )}
      </div>

      {/* Ledger 2..N */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: SLATE_50 }}>
        {rest.length === 0 ? (
          <div style={{ padding: '28px 16px', textAlign: 'center', color: INK_MUTE, fontSize: 12, fontWeight: 600 }}>
            The champion stands alone. Be the first to challenge.
          </div>
        ) : (
          rest.map((r, i) => (
            <div
              key={`${r.rank}-${r.attained_at}-${i}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '12px 16px',
                borderBottom: `0.5px solid ${HAIRLINE_INK_10}`,
                background: 'transparent',
              }}
            >
              <div
                style={{
                  width: 28,
                  fontSize: 15,
                  fontWeight: 200,
                  color: INK,
                  fontVariantNumeric: 'tabular-nums',
                  textAlign: 'right',
                }}
              >
                {r.rank}
              </div>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <SquircleAvatar
                  size={34}
                  srcCandidates={r.photoUrl ? [r.photoUrl] : []}
                  alt={r.name}
                  hairlineRing
                  ringColor={LIGHT_HAIRLINE}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: INK,
                    letterSpacing: '-0.01em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                  }}
                >
                  {r.isSelf ? 'You' : r.name}
                </span>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 200,
                    color: INK,
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1,
                  }}
                >
                  {r.valueDisplay}
                </div>
              </div>
            </div>
          ))
        )}
        <div style={{ height: 24 }} />
      </div>
    </BottomSheet>
  );
};

export default FullCourseLeaderboardSheetDispatch;
