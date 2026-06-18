import React from 'react';
import { Check, MapPin } from 'lucide-react';
import { GAM } from '../../tokens';
import type { Top100CourseProgress } from '@/hooks/gam/useTop100ListProgress';

interface Props {
  row: Top100CourseProgress;
  /** Shown when the owner is NOT the viewer — emphasises the owner's played-state */
  isFriendView: boolean;
  /** Called when row tapped — closes the sheet and navigates to course detail */
  onNavigate: (courseId: string) => void;
}

export const Top100CourseRow: React.FC<Props> = ({ row, isFriendView, onNavigate }) => {
  const played = row.is_owner_played;
  const viewerAlsoPlayed = row.is_viewer_played;

  return (
    <button
      type="button"
      onClick={() => onNavigate(row.course_id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        background: 'transparent',
        border: 'none',
        borderRadius: 10,
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        fontFamily: GAM.FONT_GEIST,
        color: 'var(--hcp-t-100)',
        opacity: played ? 1 : 0.65,
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: 30,
          height: 30,
          borderRadius: 8,
          background: played
            ? 'linear-gradient(180deg, rgba(247,147,30,0.18), rgba(247,147,30,0.04))'
            : 'var(--hcp-bg-2)',
          border: played
            ? '1px solid rgba(247,147,30,0.32)'
            : '1px solid var(--hcp-line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 800,
          color: played ? '#FBBC2E' : 'var(--hcp-t-60)',
          ...GAM.TABULAR,
        }}
      >
        {row.rank != null ? `#${row.rank}` : '—'}
      </div>

      {row.thumbnail_image ? (
        <img
          src={row.thumbnail_image}
          alt=""
          loading="lazy"
          style={{
            flexShrink: 0,
            width: 44,
            height: 44,
            borderRadius: 10,
            objectFit: 'cover',
            background: 'var(--hcp-bg-2)',
          }}
        />
      ) : (
        <div
          style={{
            flexShrink: 0,
            width: 44,
            height: 44,
            borderRadius: 10,
            background: 'var(--hcp-bg-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--hcp-t-60)',
          }}
        >
          <MapPin size={18} strokeWidth={2} />
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            lineHeight: 1.2,
            color: 'var(--hcp-t-100)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            letterSpacing: '-0.01em',
          }}
        >
          {row.course_name}
        </div>
        <div
          style={{
            marginTop: 2,
            fontSize: 11,
            color: 'var(--hcp-t-60)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {[row.region, row.country].filter(Boolean).join(' · ') || ' '}
        </div>
      </div>

      {played && (
        <div
          aria-label="Played"
          style={{
            flexShrink: 0,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: 'linear-gradient(180deg, rgba(247,147,30,0.24), rgba(247,147,30,0.08))',
            border: '1px solid rgba(247,147,30,0.40)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FBBC2E',
          }}
        >
          <Check size={12} strokeWidth={3} />
        </div>
      )}

      {isFriendView && viewerAlsoPlayed && (
        <div
          aria-label="You have also played here"
          style={{
            flexShrink: 0,
            fontSize: 9,
            fontWeight: 800,
            color: 'var(--hcp-t-60)',
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            marginLeft: 4,
          }}
        >
          You
        </div>
      )}
    </button>
  );
};

export default Top100CourseRow;
