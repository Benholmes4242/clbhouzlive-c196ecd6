import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { LegendCategory } from '@/lib/gam/types';
import {
  legendCategoryIcon,
  formatLegendValueCompact,
} from '@/lib/gam/visuals';
import type { CourseLegendHolderRow } from '@/hooks/gam/useCourseLegendHolders';
import { CourseEyebrow } from './_shared/CourseEyebrow';
import { getFooterCue, FOOTER_INTENT_STYLE } from './footerCue';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const GOLD = '#FBBC2E';

/** Left column — achievements (rare events, ascending: ACE rarest) */
const LEFT_CATEGORIES: LegendCategory[] = [
  'most_aces_90d', 'most_aces_all_time',
  'most_eagles_90d', 'most_eagles_all_time',
  'most_birdies_90d', 'most_birdies_all_time',
];

/** Right column — scoring (round outcomes) */
const RIGHT_CATEGORIES: LegendCategory[] = [
  'lowest_gross_90d', 'lowest_gross_all_time',
  'best_stableford_90d', 'best_stableford_all_time',
  'best_score_diff_90d', 'best_score_diff_all_time',
];

/**
 * Tile palette per category. Non-self tiles take a 10-12% tint of the
 * category colour with a matching border. Self/active state overrides
 * with gold (handled in HolderCell).
 */
const CATEGORY_TILE_PALETTE: Record<LegendCategory, { bg: string; border: string; icon: string }> = {
  most_aces_90d:            { bg: 'rgba(217,70,239,0.10)', border: 'rgba(217,70,239,0.18)', icon: '#D946EF' },
  most_aces_all_time:       { bg: 'rgba(217,70,239,0.10)', border: 'rgba(217,70,239,0.18)', icon: '#D946EF' },
  most_eagles_90d:          { bg: 'rgba(5,150,105,0.14)', border: 'rgba(5,150,105,0.26)', icon: '#059669' },
  most_eagles_all_time:     { bg: 'rgba(5,150,105,0.14)', border: 'rgba(5,150,105,0.26)', icon: '#059669' },
  most_birdies_90d:         { bg: 'rgba(251,188,46,0.12)', border: 'rgba(251,188,46,0.22)', icon: '#FBBC2E' },
  most_birdies_all_time:    { bg: 'rgba(251,188,46,0.12)', border: 'rgba(251,188,46,0.22)', icon: '#FBBC2E' },
  lowest_gross_90d:         { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.08)', icon: 'var(--hcp-t-60)' },
  lowest_gross_all_time:    { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.08)', icon: 'var(--hcp-t-60)' },
  best_stableford_90d:      { bg: 'rgba(56,189,248,0.10)', border: 'rgba(56,189,248,0.18)', icon: '#38BDF8' },
  best_stableford_all_time: { bg: 'rgba(56,189,248,0.10)', border: 'rgba(56,189,248,0.18)', icon: '#38BDF8' },
  best_score_diff_90d:      { bg: 'rgba(159,29,29,0.14)', border: 'rgba(159,29,29,0.26)', icon: '#9F1D1D' },
  best_score_diff_all_time: { bg: 'rgba(159,29,29,0.14)', border: 'rgba(159,29,29,0.26)', icon: '#9F1D1D' },
};

const CAT_SHORT: Record<LegendCategory, string> = {
  lowest_gross_90d:         'GROSS',
  lowest_gross_all_time:    'GROSS',
  most_birdies_90d:         'BIRDIE',
  most_birdies_all_time:    'BIRDIE',
  best_stableford_90d:      'STBL',
  best_stableford_all_time: 'STBL',
  best_score_diff_90d:      'SCORE',
  best_score_diff_all_time: 'SCORE',
  most_eagles_90d:          'EAGLE',
  most_eagles_all_time:     'EAGLE',
  most_aces_90d:            'ACE',
  most_aces_all_time:       'ACE',
};

function isHideWhenZero(c: LegendCategory): boolean {
  return (
    c === 'most_eagles_90d' || c === 'most_eagles_all_time' ||
    c === 'most_aces_90d' || c === 'most_aces_all_time'
  );
}

interface HolderCellProps {
  category: LegendCategory;
  holder: CourseLegendHolderRow;
  selfLabel: string;
}

const HolderCell: React.FC<HolderCellProps> = ({
  category,
  holder,
  selfLabel,
}) => {
  const Icon = legendCategoryIcon[category];
  const isSelf = holder.is_self;

  const nameColor = isSelf ? GOLD : 'var(--hcp-t-100)';
  const labelColor = 'var(--hcp-t-60)';
  const valueColor = nameColor;
  const palette = CATEGORY_TILE_PALETTE[category];
  const iconBg = isSelf ? 'rgba(251,188,46,0.16)' : palette.bg;
  const iconBorder = isSelf ? 'rgba(251,188,46,0.30)' : palette.border;
  const iconColor = isSelf ? GOLD : palette.icon;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: isSelf ? '6px 8px' : '8px 10px',
        background: isSelf
          ? 'linear-gradient(180deg, rgba(251,188,46,0.10) 0%, rgba(251,188,46,0.03) 100%)'
          : 'transparent',
        border: isSelf
          ? '1px solid rgba(251,188,46,0.22)'
          : '1px solid transparent',
        borderRadius: isSelf ? 9 : 10,
        minWidth: 0,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          background: iconBg,
          border: `1px solid ${iconBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: iconColor,
          boxSizing: 'border-box',
        }}
      >
        <Icon size={13} strokeWidth={2.2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: labelColor,
            lineHeight: 1.2,
          }}
        >
          {CAT_SHORT[category]}
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 11,
            fontWeight: 700,
            color: nameColor,
            lineHeight: 1.25,
            marginTop: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {isSelf ? selfLabel : holder.display_name}
        </div>
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 13,
          fontWeight: 800,
          color: valueColor,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.01em',
          flexShrink: 0,
        }}
      >
        {formatLegendValueCompact(category, holder.value)}
      </div>
    </div>
  );
};

interface Props {
  courseId: string;
  courseName: string;
  courseRegion: string | null;
  courseCountry: string | null;
  courseType: string | null;
  /** Hero strip background image (course photo). Falls back to gradient if null. */
  courseHeaderImage?: string | null;
  /** Pre-filtered (by current window) holders map keyed by category. */
  holdersByCategory: Map<LegendCategory, CourseLegendHolderRow>;
  onTap: () => void;
  /** Friend view: show friend's name instead of "YOU" in self cells. */
  friendName?: string | null;
}

export const CourseLegendsCard: React.FC<Props> = ({
  courseName,
  courseRegion,
  courseCountry,
  courseType,
  courseHeaderImage,
  holdersByCategory,
  onTap,
  friendName,
}) => {
  const [pressed, setPressed] = useState(false);

  // Filter per column: drop Eagle/Ace cells when value is 0; only keep
  // categories with holder data. Each column collapses upward independently.
  const filterColumn = (categories: LegendCategory[]) => {
    const result: Array<{ cat: LegendCategory; row: CourseLegendHolderRow }> = [];
    for (const cat of categories) {
      const row = holdersByCategory.get(cat);
      if (!row) continue;
      if (isHideWhenZero(cat) && (row.value ?? 0) === 0) continue;
      result.push({ cat, row });
    }
    return result;
  };

  const leftColumn = filterColumn(LEFT_CATEGORIES);
  const rightColumn = filterColumn(RIGHT_CATEGORIES);

  // Combined map kept for getFooterCue + selfLabel logic that still expects it.
  const visibleHolders = new Map<LegendCategory, CourseLegendHolderRow>();
  [...leftColumn, ...rightColumn].forEach(({ cat, row }) => {
    visibleHolders.set(cat, row);
  });

  const totalCategories = visibleHolders.size;
  const youOwnedCount = Array.from(visibleHolders.values()).filter((r) => r.is_self).length;

  // Hide cards entirely when the active window has no data — no skeleton.
  if (totalCategories === 0) {
    return null;
  }
  const cue = getFooterCue(visibleHolders);
  const cueStyle = FOOTER_INTENT_STYLE[cue.intent];
  const selfLabel = friendName ? friendName : 'YOU';

  return (
    <div
      onClick={onTap}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onTouchCancel={() => setPressed(false)}
      style={{
        background: 'var(--hcp-bg-1)',
        border: '1px solid var(--hcp-line)',
        borderRadius: 14,
        overflow: 'hidden',
        cursor: 'pointer',
        transform: pressed ? 'scale(0.99)' : 'scale(1)',
        transition: 'transform 140ms cubic-bezier(0.22, 0.61, 0.36, 1)',
        fontFamily: FONT,
      }}
    >
      {/* Hero strip with photo + scrims + overlaid title */}
      <div
        style={{
          position: 'relative',
          height: 88,
          width: '100%',
          background: courseHeaderImage
            ? undefined
            : 'linear-gradient(180deg, rgba(247,147,30,0.18) 0%, var(--hcp-bg-2) 100%)',
          overflow: 'hidden',
        }}
      >
        {courseHeaderImage && (
          <img
            src={courseHeaderImage}
            alt=""
            loading="lazy"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        )}
        {/* TOP SCRIM — matches EchoInsightsCard "Suited to Your Game" exactly */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: 'linear-gradient(180deg, rgba(5,8,16,0.55) 0%, rgba(5,8,16,0) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* BOTTOM SCRIM — matches EchoInsightsCard "Suited to Your Game" exactly */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '55%',
            background: 'linear-gradient(180deg, rgba(5,8,16,0) 0%, rgba(5,8,16,0.92) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Overlaid title block */}
        <div
          style={{
            position: 'absolute',
            left: 14,
            right: 14,
            bottom: 10,
            minWidth: 0,
          }}
        >
          <CourseEyebrow
            type={courseType}
            region={courseRegion}
            country={courseCountry}
          />
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#FFFFFF',
              lineHeight: 1.3,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textShadow: '0 1px 3px rgba(0,0,0,0.55)',
              marginTop: 2,
            }}
          >
            {courseName}
          </div>
        </div>
      </div>

      {/* Holder columns — two independent flex columns so filtering in one
          doesn't shift items into the wrong column of a grid. */}
      <div style={{ padding: '12px 14px 0' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {leftColumn.map(({ cat, row }) => (
              <HolderCell
                key={cat}
                category={cat}
                holder={row}
                selfLabel={selfLabel}
              />
            ))}
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {rightColumn.map(({ cat, row }) => (
              <HolderCell
                key={cat}
                category={cat}
                holder={row}
                selfLabel={selfLabel}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 12,
          borderTop: '1px solid var(--hcp-line)',
          padding: '10px 14px 11px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: cueStyle.dotColor,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: cueStyle.color,
            letterSpacing: '0.01em',
            flex: 1,
            minWidth: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {cue.label}
        </span>
        <ChevronRight size={14} strokeWidth={2.4} color="var(--hcp-t-60)" />
      </div>
    </div>
  );
};

export default CourseLegendsCard;
