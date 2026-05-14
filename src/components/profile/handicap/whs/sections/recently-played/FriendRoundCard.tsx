import React from 'react';
import { Trophy, Flame, ChevronRight } from 'lucide-react';
import { firstName } from '@/lib/whs/utils/initials';
import { fmtRelative, reformatFriendName } from '@/lib/whs/utils/nameFormat';
import { fmtDiff } from '@/lib/whs/format';
import type { WhsFriendActivityWithImage } from '@/lib/whs/types';
import { CinemaFriendCard } from './cinema-friend-card';

interface Props {
  activity: WhsFriendActivityWithImage;
  onClick: () => void;
  /** Triggered when the EG-only INVITE pill is tapped. Stop-propagated from `onClick`. */
  onInviteClick?: () => void;
}

const T = {
  ink: '#0F172A',
  inkMute: 'rgba(15,23,42,0.55)',
  inkSoft: 'rgba(15,23,42,0.35)',
  hairline: 'rgba(15,23,42,0.08)',
  amber: '#F7931E',
  amberDeep: '#C97211',
  amberTint: 'rgba(247,147,30,0.10)',
  amberBorder: 'rgba(247,147,30,0.20)',
};
const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

const fmtRel = (iso: string | null) => fmtRelative(iso, { compact: false });
const fmtDiffNullable = (n: number | null | undefined) =>
  n === null || n === undefined ? null : fmtDiff(n, { plus: true });

// ─────────────────────────────────────────────────────────────────────
// Reportage card — compact horizontal layout for EG-only friends and
// Clbhouz users who haven't synced yet.
// ─────────────────────────────────────────────────────────────────────

const ReportageCard: React.FC<{
  activity: WhsFriendActivityWithImage;
  onClick: () => void;
  onInviteClick?: () => void;
}> = ({ activity, onClick, onInviteClick }) => {
  const diff = activity.last_round_differential;
  const diffStr = fmtDiffNullable(diff);

  const beatBy =
    activity.last_round_differential !== null && activity.friend_handicap_index !== null
      ? activity.friend_handicap_index - activity.last_round_differential
      : null;
  const fireCount =
    beatBy === null || beatBy < 0 ? 0 : beatBy < 2 ? 1 : beatBy < 4 ? 2 : 3;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Open ${firstName(activity.friend_name)}'s round at ${activity.last_round_course_name ?? 'a course'}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        margin: '0 20px 12px',
        background: '#FFFFFF',
        border: `1px solid ${T.hairline}`,
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        fontFamily: FONT_GEIST,
        display: 'flex',
        flexDirection: 'row',
        minHeight: 124,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 144,
          flexShrink: 0,
          background: activity.course_thumbnail_image
            ? 'linear-gradient(135deg, #1e293b, #0f172a)'
            : 'linear-gradient(135deg, #1a3c2a 0%, #0f172a 100%)',
        }}
      >
        {activity.course_thumbnail_image ? (
          <img
            src={activity.course_thumbnail_image}
            alt={activity.last_round_course_name ?? ''}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : (
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              opacity: 0.08,
              color: '#ffffff',
            }}
            aria-hidden="true"
          >
            <g fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
              <line x1="32" y1="20" x2="32" y2="82" />
              <path d="M32 22 L70 32 L32 42 Z" />
              <circle cx="34" cy="84" r="3" />
            </g>
          </svg>
        )}

        {activity.last_round_adjusted_gross !== null && (
          <div
            style={{
              position: 'absolute',
              left: 8,
              bottom: 8,
              display: 'flex',
              alignItems: 'baseline',
              gap: 4,
              padding: '4px 8px 5px',
              borderRadius: 10,
              background: 'rgba(15,23,42,0.62)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: 800,
                color: 'rgba(255,255,255,0.7)',
                letterSpacing: '0.16em',
              }}
            >
              GROSS
            </span>
            <span
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: '#fff',
                fontFamily: FONT_GEIST,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}
            >
              {activity.last_round_adjusted_gross}
            </span>
          </div>
        )}

        {activity.is_course_best && (
          <span
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              padding: '2px 6px',
              borderRadius: 999,
              background: T.amberTint,
              color: T.amberDeep,
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '0.14em',
              border: `1px solid ${T.amberBorder}`,
            }}
          >
            <Trophy size={9} strokeWidth={2.5} />
            BEST
          </span>
        )}
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: '12px 14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              color: activity.is_clbhouz_user ? '#006747' : '#F7931E',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            {activity.is_clbhouz_user ? 'Clbhouz · Not synced' : 'England Golf'}
          </span>
        </div>

        <p
          style={{
            margin: '4px 0 0',
            fontSize: 15,
            fontWeight: 800,
            color: T.ink,
            lineHeight: 1.2,
            letterSpacing: '-0.015em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {reformatFriendName(activity.friend_name)}
        </p>

        <p
          style={{
            margin: '2px 0 0',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: FONT_GEIST,
            color: T.inkMute,
            lineHeight: 1.25,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {activity.last_round_course_name ?? 'Course unknown'}
        </p>

        <div
          style={{
            marginTop: 'auto',
            paddingTop: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'nowrap',
            fontSize: 11,
            color: T.inkMute,
            fontWeight: 600,
          }}
        >
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>
            {fmtRel(activity.last_round_played_at)}
          </span>
          {diffStr !== null && (
            <>
              <span style={{ color: T.inkSoft }}>·</span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: 11,
                  fontWeight: 800,
                  color: T.ink,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.01em',
                }}
              >
                <span
                  style={{
                    color: T.inkSoft,
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: '0.14em',
                    marginRight: 1,
                  }}
                >
                  DIFF
                </span>
                {diffStr}
                {fireCount > 0 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 2 }}>
                    {Array.from({ length: fireCount }).map((_, i) => (
                      <Flame
                        key={i}
                        size={11}
                        strokeWidth={2.5}
                        color={T.amber}
                        fill={T.amber}
                        style={{ marginLeft: i === 0 ? 0 : -3 }}
                      />
                    ))}
                  </span>
                )}
              </span>
            </>
          )}

          <div style={{ flex: 1 }} />

          {onInviteClick && !activity.is_clbhouz_user && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onInviteClick();
              }}
              aria-label={`Invite ${firstName(activity.friend_name)} to Clbhouz`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
                padding: '3px 5px 3px 8px',
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 800,
                color: T.amberDeep,
                background: 'rgba(247,147,30,0.08)',
                border: `1px solid ${T.amberBorder}`,
                letterSpacing: '0.14em',
                cursor: 'pointer',
                fontFamily: FONT_GEIST,
                flexShrink: 0,
              }}
            >
              INVITE
              <ChevronRight size={12} strokeWidth={2.5} />
            </button>
          )}

          {activity.is_clbhouz_user && !activity.friend_connection_id && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '0.14em',
                color: T.inkMute,
                padding: '3px 6px',
                borderRadius: 6,
                background: 'rgba(15,23,42,0.05)',
                border: `1px solid ${T.hairline}`,
                flexShrink: 0,
              }}
            >
              ASK TO SYNC
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
// Top-level — branches by sync state.
//   - Clbhouz user + synced  → CinemaFriendCard (immersive)
//   - Clbhouz user, no sync  → ReportageCard with ASK TO SYNC nudge
//   - EG-only                → ReportageCard
// ─────────────────────────────────────────────────────────────────────

export const FriendRoundCard: React.FC<Props> = ({ activity, onClick, onInviteClick }) => {
  if (activity.is_clbhouz_user && activity.friend_connection_id) {
    return <CinemaFriendCard activity={activity} onClick={onClick} />;
  }
  return <ReportageCard activity={activity} onClick={onClick} onInviteClick={onInviteClick} />;
};

export default FriendRoundCard;
