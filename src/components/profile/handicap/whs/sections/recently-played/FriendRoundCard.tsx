import React from 'react';
import { Trophy } from 'lucide-react';
import { initials, firstName } from '@/lib/whs/utils/initials';
import type { WhsFriendActivityWithImage } from '@/lib/whs/types';

interface Props {
  activity: WhsFriendActivityWithImage;
  onClick: () => void;
}

const T = {
  ink: '#0F172A',
  inkMute: 'rgba(15,23,42,0.55)',
  hairline: 'rgba(15,23,42,0.08)',
  amber: '#F7931E',
  amberDeep: '#C97211',
  amberTint: 'rgba(247,147,30,0.10)',
  green: '#059669',
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
  if (n === null || n === undefined) return '—';
  if (n > 0) return `+${n.toFixed(1)}`;
  if (n < 0) return `\u2212${Math.abs(n).toFixed(1)}`;
  return '0.0';
};

const Stat: React.FC<{
  label: string;
  value: string | number;
  color?: string;
  divider?: boolean;
}> = ({ label, value, color = T.ink, divider = false }) => (
  <div
    style={{
      textAlign: 'center',
      ...(divider
        ? {
            borderLeft: `1px solid ${T.hairline}`,
            borderRight: `1px solid ${T.hairline}`,
          }
        : {}),
    }}
  >
    <p
      style={{
        margin: 0,
        fontSize: 9,
        fontWeight: 800,
        color: T.inkMute,
        letterSpacing: '0.14em',
        marginBottom: 2,
      }}
    >
      {label}
    </p>
    <p
      style={{
        margin: 0,
        fontSize: 22,
        fontWeight: 800,
        color,
        fontFamily: FONT_DISPLAY,
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.02em',
        lineHeight: 1,
      }}
    >
      {value}
    </p>
  </div>
);

export const FriendRoundCard: React.FC<Props> = ({ activity, onClick }) => {
  const isClickable = activity.is_clbhouz_user && !!activity.friend_user_id;
  const diff = activity.last_round_differential;

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={
        isClickable
          ? `View ${firstName(activity.friend_name)}'s profile — round at ${activity.last_round_course_name ?? 'a course'}`
          : undefined
      }
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      style={{
        margin: '0 20px 12px',
        background: '#FFFFFF',
        border: `1px solid ${T.hairline}`,
        borderRadius: 16,
        overflow: 'hidden',
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'transform 200ms ease, box-shadow 200ms ease',
      }}
    >
      {/* Header — avatar + first name + relative time + course-best rosette */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 14px',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
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
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: '#64748B',
              }}
            >
              {initials(activity.friend_name)}
            </span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 800,
              color: T.ink,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
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

      {/* Course image banner */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 8',
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
              'linear-gradient(180deg, rgba(15,23,42,0) 50%, rgba(15,23,42,0.85) 100%)',
          }}
        />
        <p
          style={{
            position: 'absolute',
            left: 14,
            right: 14,
            bottom: 10,
            margin: 0,
            color: '#fff',
            fontSize: 14,
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

      {/* Stat strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          padding: '12px 4px',
        }}
      >
        <Stat
          label="GROSS"
          value={activity.last_round_adjusted_gross ?? '—'}
        />
        <Stat
          label="STABLEFORD"
          value={activity.last_round_stableford ?? '—'}
          divider
        />
        <Stat
          label="DIFF"
          value={fmtDiff(diff)}
          color={diff !== null && diff !== undefined && diff < 0 ? T.green : T.ink}
        />
      </div>
    </div>
  );
};

export default FriendRoundCard;
