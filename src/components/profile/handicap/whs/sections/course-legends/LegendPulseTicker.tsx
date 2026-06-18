import React from 'react';
import { useLegendPulse, type LegendPulseRow } from '@/hooks/gam/useLegendPulse';
import {
  legendCategoryLabel,
  legendCategoryIcon,
  formatLegendValueCompact,
  formatLegendGap,
} from '@/lib/gam/visuals';
import { PULSE_DARK, type PulseKind } from '../../gam/pulseTokens';
import { GAM } from '../../gam/tokens';
import type { LegendWindow } from '@/lib/gam/types';
import type { CourseSelection } from './types';

interface Props {
  userId: string;
  onSelectCourse: (c: CourseSelection) => void;
  days?: number;
  /** Current section window — drives the indicator text. */
  window?: LegendWindow;
}

function buildHeadline(row: LegendPulseRow): {
  title: string;
  sub: string;
  cta: string;
} {
  const catLabel = legendCategoryLabel[row.category];
  const courseShort = row.course_name.split(' ').slice(0, 3).join(' ');

  switch (row.kind) {
    case 'threat':
      return {
        title: `${catLabel} lost`,
        sub: `${row.counterparty_name ?? 'Someone'} beat you at ${courseShort}`,
        cta: 'Defend',
      };
    case 'chase': {
      const gapStr = formatLegendGap(row.category, row.gap_to_first ?? 0);
      return {
        title: `${gapStr} from #1`,
        sub: `${catLabel} at ${courseShort}`,
        cta: 'Chase',
      };
    }
    case 'win':
      return {
        title: `${catLabel} claimed`,
        sub: `${courseShort} · ${formatLegendValueCompact(
          row.category,
          row.category_value ?? 0,
        )}`,
        cta: 'View',
      };
  }
}

const PulseCard: React.FC<{
  row: LegendPulseRow;
  onClick: () => void;
}> = ({ row, onClick }) => {
  const kind = row.kind as PulseKind;
  const tokens = PULSE_DARK[kind];
  // Category-specific icon (Eagle → Award, Stableford → Target, Gross → Trophy, etc.)
  const CategoryIcon = legendCategoryIcon[row.category] ?? tokens.Icon;
  const { title, sub, cta } = buildHeadline(row);

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: '0 0 auto',
        scrollSnapAlign: 'start',
        width: 280,
        minHeight: 88,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 14,
        border: `1px solid ${tokens.cardBorder}`,
        background: tokens.cardSweep,
        boxShadow: tokens.outerGlow ?? '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.06)',
        padding: '8px 14px',

        textAlign: 'left',
        cursor: 'pointer',
        fontFamily: GAM.FONT_GEIST,
        color: 'var(--hcp-t-100)',
        display: 'block',
      }}
    >
      {/* Watermark icon */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          right: -18,
          bottom: -22,
          opacity: 0.07,
          transform: 'rotate(-18deg)',
          pointerEvents: 'none',
        }}
      >
        <CategoryIcon size={120} strokeWidth={1.5} color={tokens.labelFg} />
      </div>

      {/* Eyebrow chip */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '2px 7px',
          borderRadius: 999,
          background: tokens.labelBg,
          border: `1px solid ${tokens.pillBorder}`,
          color: tokens.labelFg,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <span
          style={{
            width: 4,
            height: 4,
            borderRadius: 999,
            background: tokens.labelFg,
            display: 'inline-block',
          }}
        />
        {tokens.label}
      </div>

      {/* Headline + sub */}
      <div
        style={{
          marginTop: 6,
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        {/* Icon squircle — category-specific */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: tokens.iconBg,
            border: `1px solid ${tokens.iconRing}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: '0 0 auto',
          }}
        >
          <CategoryIcon size={18} strokeWidth={2} color={tokens.labelFg} />
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              lineHeight: 1.15,
              color: 'var(--hcp-t-100)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              ...GAM.TABULAR,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--hcp-t-60)',
              marginTop: 2,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: 1.3,
            }}
          >
            {sub}
          </div>
        </div>

      </div>
    </button>
  );
};

export const LegendPulseTicker: React.FC<Props> = ({
  userId,
  onSelectCourse,
  days = 14,
  window = '90d',
}) => {
  const { data } = useLegendPulse(userId, days);
  const rows = data ?? [];

  if (rows.length === 0) return null;

  const indicator = window === 'all_time' ? 'ALL' : `${days}D`;

  return (
    <div style={{ marginTop: 20, marginBottom: 20 }}>
      {/* Eyebrow */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--hcp-t-40)',
            fontFamily: GAM.FONT_GEIST,
          }}
        >
          Live Pulse
        </span>
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '0.16em',
            color: 'var(--hcp-t-40)',
            fontFamily: GAM.FONT_GEIST,
            ...GAM.TABULAR,
          }}
        >
          {indicator}
        </span>
      </div>

      {/* Rail */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'x mandatory',
          scrollPaddingLeft: 16,
          scrollPaddingRight: 16,
          padding: '4px 16px',
          willChange: 'transform',
        }}
      >
        {rows.map((row) => (
          <PulseCard
            key={row.pulse_id}
            row={row}
            onClick={() =>
              onSelectCourse({
                courseId: row.course_id,
                courseName: row.course_name,
                courseRegion: null,
                courseCountry: null,
                courseType: null,
              })
            }
          />
        ))}
      </div>
    </div>
  );
};

export default LegendPulseTicker;
