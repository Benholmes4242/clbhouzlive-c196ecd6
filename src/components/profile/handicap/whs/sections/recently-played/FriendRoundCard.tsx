import React from 'react';
import { Trophy, Flame, ChevronRight, ArrowDown, ArrowUp, Heart, BadgeCheck } from 'lucide-react';
import { initials, firstName } from '@/lib/whs/utils/initials';
import { fmtRelative } from '@/lib/whs/utils/nameFormat';
import { fmtDiff } from '@/lib/whs/format';
import { useToggleRoundReaction } from '@/lib/whs/hooks';
import type { WhsFriendActivityWithImage } from '@/lib/whs/types';

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
  greenInk: '#065F46',
  greenTint: 'rgba(6,95,70,0.10)',
  redInk: '#7F1D1D',
  redTint: 'rgba(127,29,29,0.08)',
  slate: '#475569',
};
const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

const fmtRel = (iso: string | null) => fmtRelative(iso, { compact: false });

const fmtDiffNullable = (n: number | null | undefined) =>
  n === null || n === undefined ? null : fmtDiff(n, { plus: true });

// ─────────────────────────────────────────────────────────────────────
// On-app card — unchanged from the prior FriendRoundCard rendering.
// ─────────────────────────────────────────────────────────────────────

const OnAppCard: React.FC<{ activity: WhsFriendActivityWithImage; onClick: () => void }> = ({ activity, onClick }) => {
  const diff = activity.last_round_differential;
  const diffStr = fmtDiffNullable(diff);

  // HCP impact pill
  const impactDelta =
    activity.is_counter &&
    activity.handicap_index_at_time !== null &&
    activity.friend_handicap_index !== null
      ? activity.friend_handicap_index - activity.handicap_index_at_time
      : null;
  const showImpact = impactDelta !== null && impactDelta !== 0;
  const impactIsImprovement = (impactDelta ?? 0) < 0;

  // Multi-fire magnitude
  const beatBy =
    activity.last_round_differential !== null && activity.friend_handicap_index !== null
      ? activity.friend_handicap_index - activity.last_round_differential
      : null;
  const fireCount =
    beatBy === null || beatBy < 0 ? 0 : beatBy < 2 ? 1 : beatBy < 4 ? 2 : 3;

  // Bottom-left status tag
  let statusTag: { label: string; tone: 'sync' } | null = null;
  if (activity.is_clbhouz_user && !activity.friend_connection_id) {
    statusTag = { label: 'ASK TO SYNC', tone: 'sync' };
  }

  const isSynced = activity.is_clbhouz_user && !!activity.friend_connection_id;

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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px 10px' }}>
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
          {isSynced && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                marginBottom: 3,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: '#006747',
                  display: 'inline-block',
                }}
              />
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 900,
                  letterSpacing: '0.14em',
                  color: '#006747',
                }}
              >
                POSTED · CLBHOUZ
              </span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
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
            {isSynced && (
              <span
                aria-label="Verified Clbhouz user"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <BadgeCheck
                  size={14}
                  strokeWidth={2.5}
                  color="#FFFFFF"
                  fill="#006747"
                />
              </span>
            )}
          </div>
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
          {showImpact && (
            <div style={{ marginTop: 4 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 8px',
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 800,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '0.04em',
                  color: impactIsImprovement ? T.greenInk : T.redInk,
                  background: impactIsImprovement ? T.greenTint : T.redTint,
                  border: `1px solid ${impactIsImprovement ? 'rgba(6,95,70,0.18)' : 'rgba(127,29,29,0.18)'}`,
                }}
              >
                HCP
                {impactIsImprovement ? (
                  <ArrowDown size={11} strokeWidth={2.5} />
                ) : (
                  <ArrowUp size={11} strokeWidth={2.5} />
                )}
                {Math.abs(impactDelta!).toFixed(1)}
              </span>
            </div>
          )}
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
          background: activity.course_thumbnail_image
            ? 'linear-gradient(135deg, #1e293b, #0f172a)'
            : 'linear-gradient(135deg, #1a3c2a 0%, #0f172a 100%)',
        }}
      >
        {activity.course_thumbnail_image ? (
          <img
            src={activity.course_thumbnail_image}
            alt={activity.last_round_course_name ?? ''}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
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
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(15,23,42,0) 35%, rgba(15,23,42,0.88) 100%)',
          }}
        />

        {activity.last_round_adjusted_gross !== null && (
          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 12,
              display: 'flex',
              alignItems: 'baseline',
              gap: 6,
              padding: '6px 12px 7px',
              borderRadius: 12,
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
                fontSize: 32,
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
            fontStyle: 'italic',
            fontFamily: FONT_GEIST,
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

      {/* Footer strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px 12px',
          minHeight: 40,
        }}
      >
        {/* LEFT: status tag */}
        {statusTag ? (
          <span
            style={{
              fontSize: 9,
              fontWeight: 900,
              letterSpacing: '0.14em',
              color: T.inkMute,
              padding: '4px 8px',
              borderRadius: 6,
              background: 'rgba(15,23,42,0.05)',
              border: `1px solid ${T.hairline}`,
              flexShrink: 0,
            }}
          >
            {statusTag.label}
          </span>
        ) : null}

        <div style={{ flex: 1 }} />

        {/* HCP impact pill moved to header (under the date) */}

        {/* DIFF + fires */}
        {diffStr !== null && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: 800,
              color: T.ink,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.01em',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                color: T.inkSoft,
                fontSize: 9,
                fontWeight: 900,
                letterSpacing: '0.14em',
                marginRight: 2,
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
                    size={12}
                    strokeWidth={2.5}
                    color={T.amber}
                    fill={T.amber}
                    style={{ marginLeft: i === 0 ? 0 : -3 }}
                  />
                ))}
              </span>
            )}
          </span>
        )}

        {/* Scorecard CTA */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            padding: '4px 6px 4px 9px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 800,
            color: T.ink,
            background: 'rgba(15,23,42,0.05)',
            border: `1px solid ${T.hairline}`,
            letterSpacing: '-0.01em',
            flexShrink: 0,
          }}
        >
          Scorecard
          <ChevronRight size={13} strokeWidth={2.5} />
        </span>
      </div>

      {isSynced && activity.last_round_score_id && (
        <ReactionStrip activity={activity} />
      )}
    </div>
  );
};

const ReactionStrip: React.FC<{ activity: WhsFriendActivityWithImage }> = ({
  activity,
}) => {
  const toggle = useToggleRoundReaction();
  const reacted = activity.viewer_has_reacted;
  const count = activity.reaction_count;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activity.last_round_score_id || toggle.isPending) return;
    toggle.mutate({ scoreId: activity.last_round_score_id });
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        borderTop: `1px solid ${T.hairline}`,
      }}
    >
      <button
        type="button"
        onClick={handleClick}
        disabled={toggle.isPending}
        aria-pressed={reacted}
        aria-label={
          count > 0
            ? `${count} reaction${count === 1 ? '' : 's'}. ${reacted ? 'You reacted.' : 'Tap to react.'}`
            : 'Tap to react with a heart'
        }
        style={{
          flex: 1,
          padding: '9px 0',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          background: 'transparent',
          border: 'none',
          cursor: toggle.isPending ? 'wait' : 'pointer',
          fontSize: 11,
          fontWeight: 700,
          color: reacted ? T.redInk : T.inkMute,
          letterSpacing: '-0.005em',
          fontFamily: 'inherit',
          transition: 'color 150ms ease',
        }}
      >
        <Heart
          size={14}
          strokeWidth={2.2}
          color={reacted ? T.redInk : T.inkMute}
          fill={reacted ? T.redInk : 'none'}
        />
        {count > 0 ? count : 'React'}
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
// Reportage card — new compact horizontal layout for EG-only friends.
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
      {/* Left: course image strip */}
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
                fontSize: 8,
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
              fontSize: 8,
              fontWeight: 900,
              letterSpacing: '0.10em',
              border: `1px solid ${T.amberBorder}`,
            }}
          >
            <Trophy size={9} strokeWidth={2.5} />
            BEST
          </span>
        )}
      </div>

      {/* Right: body */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: '12px 14px',
        }}
      >
        {/* Eyebrow — provenance */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 8.5,
              fontWeight: 800,
              color: '#F7931E',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            England Golf
          </span>
        </div>

        {/* Name as headline */}
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
          {activity.friend_name}
        </p>

        {/* Course name */}
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

        {/* Meta row — pinned to bottom */}
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
                    fontWeight: 900,
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

          {onInviteClick && (
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
                letterSpacing: '0.08em',
                cursor: 'pointer',
                fontFamily: FONT_GEIST,
                flexShrink: 0,
              }}
            >
              INVITE
              <ChevronRight size={12} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
// Top-level component — branches by is_clbhouz_user.
// ─────────────────────────────────────────────────────────────────────

export const FriendRoundCard: React.FC<Props> = ({ activity, onClick, onInviteClick }) => {
  if (!activity.is_clbhouz_user) {
    return <ReportageCard activity={activity} onClick={onClick} onInviteClick={onInviteClick} />;
  }
  return <OnAppCard activity={activity} onClick={onClick} />;
};

export default FriendRoundCard;
