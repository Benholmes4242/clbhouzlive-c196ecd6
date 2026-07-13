import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useLegendPulse, type LegendPulseRow } from '@/hooks/gam/useLegendPulse';
import {
  legendCategoryLabel,
  legendCategoryIcon,
  formatLegendGap,
} from '@/lib/gam/visuals';
import { GAM } from '../../gam/tokens';
import { DarkSectionHeader } from '../_shared/darkAtoms';
import type { LegendWindow } from '@/lib/gam/types';
import type { CourseSelection } from './types';

interface Props {
  userId: string;
  onSelectCourse: (c: CourseSelection) => void;
  days?: number;
  /** Retained for parent compatibility. */
  window?: LegendWindow;
}

const AMBER = '#F7931E';

function buildChaseHeadline(row: LegendPulseRow): { title: string; sub: string } {
  const catLabel = legendCategoryLabel[row.category];
  const gapStr = formatLegendGap(row.category, row.gap_to_first ?? 0);
  return {
    title: `${gapStr} from #1`,
    sub: `Leading ${catLabel} at ${row.course_name}`,
  };
}

const ChaseCard: React.FC<{ row: LegendPulseRow; onClick: () => void }> = ({ row, onClick }) => {
  const CategoryIcon = legendCategoryIcon[row.category];
  const { title, sub } = buildChaseHeadline(row);

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: '0 0 auto',
        scrollSnapAlign: 'start',
        width: 300,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        background: 'var(--hcp-bg-1)',
        border: '1px solid var(--hcp-line)',
        borderLeft: `3px solid ${AMBER}`,
        borderRadius: 14,
        padding: '12px 14px',
        textAlign: 'left',
        cursor: 'pointer',
        fontFamily: GAM.FONT_GEIST,
        color: 'var(--hcp-t-100)',
      }}
    >
      {/* Icon chip */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'rgba(247,147,30,0.10)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {CategoryIcon && <CategoryIcon size={18} strokeWidth={2} color={AMBER} />}
      </div>

      {/* Text column */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontSize: 8.5, fontWeight: 800, letterSpacing: '0.12em', color: AMBER,
        }}>
          CHASE
        </div>
        <div style={{
          fontSize: 14.5, fontWeight: 800, color: 'var(--hcp-t-100)',
          marginTop: 3, letterSpacing: '-0.01em',
          ...GAM.TABULAR,
        }}>
          {title}
        </div>
        <div style={{
          fontSize: 11.5, color: 'var(--hcp-t-40)', marginTop: 2,
          lineHeight: 1.3,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {sub}
        </div>
      </div>

      <ChevronRight size={15} color="var(--hcp-t-40)" style={{ flexShrink: 0, marginTop: 4 }} />
    </button>
  );
};

export const LegendPulseTicker: React.FC<Props> = ({
  userId,
  onSelectCourse,
  days = 14,
}) => {
  const { data } = useLegendPulse(userId, days);
  const rows = (data ?? []).filter((r) => r.kind === 'chase');

  if (rows.length === 0) return null;

  return (
    <div style={{ marginTop: 16, marginBottom: 16 }}>
      <DarkSectionHeader
        eyebrow={`THE CHASE · ${rows.length} LIVE`}
        right={
          <span style={{
            fontSize: 8.5, fontWeight: 800, letterSpacing: '0.12em',
            color: 'var(--hcp-t-40)', textTransform: 'uppercase',
            fontFamily: GAM.FONT_GEIST,
          }}>
            ALL ›
          </span>
        }
      />

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
          <ChaseCard
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
