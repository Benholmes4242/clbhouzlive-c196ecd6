/**
 * LegendImmersive
 *
 * Course-scoped legend view. Renders one card per course, listing
 * every #1 record the user holds at that course.
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { Share2, Crown } from 'lucide-react';
import { format } from 'date-fns';
import { GAM } from '../../tokens';
import type { TrophyItem } from '../_shared/normalizeTrophyItem';

type LegendItem = Extract<TrophyItem, { kind: 'legend' }>;

interface Props {
  records: LegendItem[];
  onClose: () => void;
  onShare: () => void;
}

const LEGEND_COLOR = GAM.AMBER;

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return '247,147,30';
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

function fmtDate(iso: string): string {
  try {
    return format(new Date(iso), 'MMM d, yyyy');
  } catch {
    return '';
  }
}

export const LegendImmersive: React.FC<Props> = ({ records, onClose, onShare }) => {
  if (!records || records.length === 0) return null;
  const first = records[0];
  const courseName = first.courseName;
  const count = records.length;
  const rgb = hexToRgb(LEGEND_COLOR);

  const overlay = (
    <div
      role="dialog"
      aria-label={`${courseName} legends`}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 12500,
        background: `radial-gradient(ellipse 120% 90% at 50% 16%, rgba(${rgb},0.14) 0%, rgba(${rgb},0.05) 32%, #0A0B0D 62%), #0A0B0D`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        fontFamily: GAM.FONT_GEIST,
        color: 'rgba(255,255,255,0.96)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '72px 24px 60px',
        overflowY: 'auto',
      }}
    >
      <button
        type="button"
        aria-label="Share"
        onClick={(e) => {
          e.stopPropagation();
          onShare();
        }}
        style={{
          position: 'absolute',
          top: 'max(env(safe-area-inset-top, 0px), 20px)',
          right: 18,
          width: 36,
          height: 36,
          borderRadius: 18,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.10)',
          color: 'rgba(255,255,255,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <Share2 size={16} />
      </button>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
          maxWidth: 420,
          width: '100%',
          textAlign: 'center',
          marginTop: 'auto',
        }}
      >
        {/* Crown hero */}
        <div
          style={{
            width: 96,
            height: 96,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: LEGEND_COLOR,
            filter: `drop-shadow(0 0 24px ${LEGEND_COLOR}66) drop-shadow(0 0 8px ${LEGEND_COLOR}88)`,
          }}
        >
          <Crown size={96} strokeWidth={1.4} />
        </div>

        {/* Big number: count */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 200,
            lineHeight: 1,
            color: 'rgba(255,255,255,0.98)',
            letterSpacing: '-0.03em',
            ...GAM.TABULAR,
          }}
        >
          {count}
        </div>

        {/* Course name */}
        <div
          style={{
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: '-0.01em',
            color: 'rgba(255,255,255,0.96)',
            padding: '0 8px',
          }}
        >
          {courseName}
        </div>

        {/* Subline */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.55)',
          }}
        >
          {count === 1 ? 'Course record held' : 'Course records held'}
        </div>
      </div>

      {/* Records list */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          marginTop: 28,
          marginBottom: 'auto',
          width: '100%',
          maxWidth: 420,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}
      >
        {records.map((r) => {
          const held = fmtDate(r.attainedAt);
          return (
            <div
              key={r.id}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 10,
                padding: '12px 14px',
                background: '#0A0B0D',
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.85)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {r.name}
                </div>
                {held && (
                  <div
                    style={{
                      marginTop: 3,
                      fontSize: 10.5,
                      color: 'rgba(255,255,255,0.45)',
                      ...GAM.TABULAR,
                    }}
                  >
                    Held since {held}
                  </div>
                )}
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: LEGEND_COLOR,
                  ...GAM.TABULAR,
                  flexShrink: 0,
                }}
              >
                {r.formattedValue}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 'max(env(safe-area-inset-bottom, 0px), 20px)',
          textAlign: 'center',
          fontSize: 10.5,
          color: 'rgba(255,255,255,0.35)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        Tap anywhere to close
      </div>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(overlay, document.body) : null;
};

export default LegendImmersive;
