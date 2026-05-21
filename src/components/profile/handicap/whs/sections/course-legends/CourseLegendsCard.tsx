import React, { useState } from 'react';
import { ChevronRight, Crown } from 'lucide-react';
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

const CATEGORY_ORDER: LegendCategory[] = [
  'lowest_gross',
  'most_birdies_90d',
  'most_rounds_90d',
  'best_stableford_90d',
  'best_score_diff',
];

const CAT_SHORT: Record<LegendCategory, string> = {
  lowest_gross: 'GROSS',
  most_birdies_90d: 'BIRDIE',
  most_rounds_90d: 'VISITOR',
  best_stableford_90d: 'STBL',
  best_score_diff: 'SCORE',
};

interface HolderCellProps {
  category: LegendCategory;
  holder: CourseLegendHolderRow | undefined;
  span?: boolean;
  /** When parent view is friend (readOnly), "YOU" cells should still show name. */
  selfLabel: string;
}

const HolderCell: React.FC<HolderCellProps> = ({
  category,
  holder,
  span,
  selfLabel,
}) => {
  const Icon = legendCategoryIcon[category];
  const isSelf = holder?.is_self ?? false;
  const empty = !holder;

  const nameColor = empty
    ? 'var(--hcp-t-40)'
    : isSelf
      ? GOLD
      : 'var(--hcp-t-100)';
  const labelColor = empty ? 'var(--hcp-t-40)' : 'var(--hcp-t-60)';
  const valueColor = nameColor;
  const iconBg = isSelf ? 'rgba(251,188,46,0.16)' : 'rgba(255,255,255,0.05)';
  const iconColor = empty ? 'var(--hcp-t-40)' : isSelf ? GOLD : 'var(--hcp-t-60)';

  return (
    <div
      style={{
        gridColumn: span ? '1 / -1' : undefined,
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '8px 10px',
        background: isSelf ? 'rgba(251,188,46,0.06)' : 'transparent',
        border: isSelf
          ? '1px solid rgba(251,188,46,0.30)'
          : '1px solid transparent',
        borderRadius: 10,
        minWidth: 0,
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          background: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: iconColor,
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
          {empty ? 'No legend yet' : isSelf ? selfLabel : holder!.display_name}
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
        {empty ? '—' : formatLegendValueCompact(category, holder!.value)}
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
  holdersByCategory,
  onTap,
  friendName,
}) => {
  const [pressed, setPressed] = useState(false);

  const rows = Array.from(holdersByCategory.values());
  const youOwnedCount = rows.filter((r) => r.is_self).length;
  const cue = getFooterCue(holdersByCategory);
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
        padding: '14px 14px 0',
        cursor: 'pointer',
        transform: pressed ? 'scale(0.99)' : 'scale(1)',
        transition: 'transform 140ms cubic-bezier(0.22, 0.61, 0.36, 1)',
        fontFamily: FONT,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <CourseEyebrow
            type={courseType}
            region={courseRegion}
            country={courseCountry}
          />
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--hcp-t-100)',
              lineHeight: 1.3,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {courseName}
          </div>
        </div>
        {youOwnedCount > 0 && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 7px',
              borderRadius: 999,
              background: 'rgba(251,188,46,0.14)',
              border: '1px solid rgba(251,188,46,0.40)',
              color: GOLD,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.04em',
              flexShrink: 0,
            }}
          >
            <Crown size={10} strokeWidth={2.5} />
            {youOwnedCount}/5
          </div>
        )}
      </div>

      {/* Holder grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 6,
        }}
      >
        {CATEGORY_ORDER.map((cat, idx) => (
          <HolderCell
            key={cat}
            category={cat}
            holder={holdersByCategory.get(cat)}
            span={idx === 4}
            selfLabel={selfLabel}
          />
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 12,
          marginLeft: -14,
          marginRight: -14,
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
