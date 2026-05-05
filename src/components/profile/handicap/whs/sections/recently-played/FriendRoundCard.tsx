import React from 'react';
import { Trophy, Flame } from 'lucide-react';
import { initials, firstName } from '@/lib/whs/utils/initials';
import type { WhsFriendActivityWithImage } from '@/lib/whs/types';

interface Props {
  activity: WhsFriendActivityWithImage;
  onClick: () => void;
}

const T = {
  ink: '#0F172A',
  inkMute: 'rgba(15,23,42,0.55)',
  inkSoft: 'rgba(15,23,42,0.35)',
  hairline: 'rgba(15,23,42,0.08)',
  amber: '#F7931E',
  amberDeep: '#C97211',
  amberTint: 'rgba(247,147,30,0.10)',
  green: '#059669',
  greenTint: 'rgba(5,150,105,0.10)',
};
const FONT_SERIF = 'Georgia, "Iowan Old Style", "Apple Garamond", serif';
const FONT_DISPLAY = 'SF Pro Display, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

const fmtRel = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const ms = Date.now() - d.getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days <= 0) {
    const hours = Math.floor(ms / 3_600_000);
    if (hours < 1) return 'just now';
    return `${hours}h ago`;
  }
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

const fmtDiff = (n: number | null | undefined) => {
  if (n === null || n === undefined) return null;
  if (n > 0) return `+${n.toFixed(1)}`;
  if (n < 0) return `\u2212${Math.abs(n).toFixed(1)}`;
  return '0.0';
};

export const FriendRoundCard: React.FC<Props> = ({ activity, onClick }) => {
  const diff = activity.last_round_differential;
  const diffStr = fmtDiff(diff);
  const isFire = diff !== null && diff !== undefined && diff < 0;

  // Bottom-left status tag
  let statusTag: { label: string; tone: 'invite' | 'sync' } | null = null;
  if (!activity.is_clbhouz_user) {
    statusTag = { label: 'INVITE TO UNLOCK MORE', tone: 'invite' };
  } else if (!activity.friend_connection_id) {
    statusTag = { label: 'ASK TO SYNC', tone: 'sync' };
  }

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
      }}
    >
      {/* Header — avatar + first name + relative time + course-best */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 14px 10px',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '34%',
            overflow: 'hidden',
            background: 'rgba(15,23,42,0.06)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {activity.friend_thumbnail_url ? (
            <img
              src={activity.friend_thumbnail_url}
              alt={activity.friend_name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>
              {initials(activity.friend_name)}
            </span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 800,
              color: T.ink,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              letterSpacing: '-0.01em',
            }}
          >
            {firstName(activity.friend_name)}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              color: T.inkMute,
              marginTop: 1,
              fontWeight: 500,
              letterSpacing: '0.02em',
            }}
          >
            {fmtRel(activity.last_round_played_at)}
          </p>
        </div>

        {activity.is_course_best && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              borderRadius: 999,
              background: T.amberTint,
              color: T.amberDeep,
              fontSize: 9,
              fontWeight: 900,
              letterSpacing: '0.10em',
              border: `1px solid rgba(247,147,30,0.20)`,
              flexShrink: 0,
            }}
          >
            <Trophy size={10} strokeWidth={2.5} />
            COURSE BEST
          </span>
        )}
      </div>

      {/* Course image banner with overlaid score */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        }}
      >
        {activity.course_thumbnail_image && (
          <img
            src={activity.course_thumbnail_image}
            alt={activity.last_round_course_name ?? ''}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(15,23,42,0) 35%, rgba(15,23,42,0.88) 100%)',
          }}
        />

        {/* Big gross score, top-right */}
        {activity.last_round_adjusted_gross !== null && (
          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 12,
              display: 'flex',
              alignItems: 'baseline',
              gap: 6,
              padding: '4px 10px 5px',
              borderRadius: 10,
              background: 'rgba(15,23,42,0.55)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: 900,
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
                fontFamily: FONT_DISPLAY,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}
            >
              {activity.last_round_adjusted_gross}
            </span>
          </div>
        )}

        {/* Course name, bottom */}
        <p
          style={{
            position: 'absolute',
            left: 14,
            right: 14,
            bottom: 10,
            margin: 0,
            color: '#fff',
            fontSize: 15,
            fontWeight: 800,
            fontFamily: FONT_SERIF,
            letterSpacing: '-0.01em',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {activity.last_round_course_name ?? 'Round played'}
        </p>
      </div>

      {/* Footer strip — status tag + diff */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          padding: '10px 14px 12px',
          minHeight: 38,
        }}
      >
        {statusTag ? (
          <span
            style={{
              fontSize: 9,
              fontWeight: 900,
              letterSpacing: '0.14em',
              color: statusTag.tone === 'invite' ? T.amberDeep : T.inkMute,
              padding: '4px 8px',
              borderRadius: 6,
              background:
                statusTag.tone === 'invite' ? T.amberTint : 'rgba(15,23,42,0.05)',
              border:
                statusTag.tone === 'invite'
                  ? `1px solid rgba(247,147,30,0.20)`
                  : `1px solid ${T.hairline}`,
            }}
          >
            {statusTag.label}
          </span>
        ) : (
          <span />
        )}

        {diffStr !== null && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: 800,
              color: isFire ? T.green : T.ink,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.01em',
            }}
          >
            {isFire && <Flame size={12} strokeWidth={2.5} color={T.green} />}
            <span style={{ color: T.inkSoft, fontSize: 9, fontWeight: 900, letterSpacing: '0.14em', marginRight: 2 }}>
              DIFF
            </span>
            {diffStr}
          </span>
        )}
      </div>
    </div>
  );
};

export default FriendRoundCard;
