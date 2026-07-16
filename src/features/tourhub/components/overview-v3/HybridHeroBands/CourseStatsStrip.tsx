/**
 * CourseStatsStrip — Upcoming · far middle band fallback (level 3).
 * Shown when neither defending champion nor field-strength data exists.
 * Per TOUR_HUB_POLISH_PATCH_BRIEF §4.4.
 */

import React from 'react';
import { MapPin } from 'lucide-react';
import { INK, GOLD, NUMERIC_STYLE, STRIP_HEIGHT } from '../HybridHero.constants';

import { SLATE_800, WHITE_ALPHA_55 } from '../../../_shared/tokens';
import { formatNumber } from '@/i18n/format';

export interface CourseStatsStripProps {
  par?: number | null;
  yardage?: number | null;
  courseRecord?: number | null;
  courseRecordHolder?: string | null;
}

function FlagIcon() {
  return (
    <div
      style={{
        width: 42,
        height: 42,
        borderRadius: '34%',
        background: `linear-gradient(135deg, ${SLATE_800} 0%, #0f172a 100%)`,
        boxShadow: '0 0 0 2px rgba(251,188,46,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M5 21V3l11 4-3 3 3 3-11 4" stroke={GOLD} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function CourseStatsStrip({
  par,
  yardage,
  courseRecord,
  courseRecordHolder,
}: CourseStatsStripProps) {
  const summaryParts: string[] = [];
  if (par) summaryParts.push(`Par ${par}`);
  if (yardage) summaryParts.push(`${yardage.toLocaleString()} yds`);
  const summary = summaryParts.join(' · ') || 'Course preview';

  return (
    <div
      style={{
        background: INK,
        padding: '10px 20px',
        minHeight: STRIP_HEIGHT,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        borderTop: '0.5px solid rgba(255,255,255,0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 50% 100% at 0% 50%, rgba(251,188,46,0.10) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />
      <FlagIcon />
      <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
        <div
          style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.18em',
            color: GOLD,
            textTransform: 'uppercase',
            marginBottom: 2,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <MapPin size={10} color={GOLD} strokeWidth={2.5} />
          COURSE
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: 'white',
            letterSpacing: '-0.01em',
            lineHeight: 1.15,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {summary}
        </div>
        {courseRecord && (
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: WHITE_ALPHA_55,
              marginTop: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Record: {courseRecord}{courseRecordHolder ? ` · ${courseRecordHolder}` : ''}
          </div>
        )}
      </div>
      {par && (
        <div style={{ textAlign: 'right', position: 'relative' }}>
          <div
            style={{
              ...NUMERIC_STYLE,
              fontSize: 22,
              fontWeight: 300,
              color: GOLD,
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}
          >
            {par}
          </div>
          <div
            style={{
              fontSize: 8,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.50)',
              letterSpacing: '0.16em',
              marginTop: 2,
            }}
          >
            PAR
          </div>
        </div>
      )}
    </div>
  );
}
