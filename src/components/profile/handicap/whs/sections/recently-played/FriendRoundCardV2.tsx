import React, { useMemo } from 'react';
import { Flame, ChevronRight } from 'lucide-react';
import { displayName } from '@/lib/whs/utils/initials';
import { pickAvatarSrc } from '@/lib/whs/utils/avatarSrc';
import { fmtRelative } from '@/lib/whs/utils/nameFormat';
import { useFriendRoundDetail } from '@/lib/whs/hooks';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import FlagSilhouetteOverlay from '@/components/whs/FlagSilhouetteOverlay';
import type { WhsFriendActivityWithImage } from '@/lib/whs/types';

type Variant = 'clbhouz-synced' | 'clbhouz-not-synced' | 'eg-only';

interface Props {
  activity: WhsFriendActivityWithImage;
  variant: Variant;
  onClick: () => void;
  onInviteClick?: () => void;
}

const FONT = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

const FALLBACK_GRADIENT =
  'linear-gradient(140deg, #2d3a2d 0%, #4a5d4a 25%, #6b7a5a 50%, #8a9670 72%, #c4a574 88%, #d4956b 100%)';

const PHOTO_SCRIM_TOP =
  'linear-gradient(180deg, rgba(5,8,16,0.55) 0%, rgba(5,8,16,0) 100%)';
const PHOTO_SCRIM_BOTTOM =
  'linear-gradient(180deg, rgba(5,8,16,0) 0%, rgba(5,8,16,0.92) 90%)';

export const FriendRoundCardV2: React.FC<Props> = ({
  activity,
  variant,
  onClick,
  onInviteClick,
}) => {
  const isSynced = variant === 'clbhouz-synced';

  const { data: detail } = useFriendRoundDetail(
    isSynced ? activity.last_round_score_id : null,
  );

  const par = useMemo(() => {
    if (!detail?.holes?.length) return null;
    const played = detail.holes.filter((h: any) => h.played && h.par != null);
    if (!played.length) return null;
    return played.reduce((sum: number, h: any) => sum + (h.par ?? 0), 0);
  }, [detail]);

  const slope = (detail as any)?.slope_rating ?? null;

  const impactDelta =
    isSynced &&
    activity.is_counter &&
    activity.handicap_index_at_time !== null &&
    activity.friend_handicap_index !== null
      ? (activity.friend_handicap_index as number) -
        (activity.handicap_index_at_time as number)
      : null;
  const showHotFlame =
    impactDelta !== null && Math.abs(impactDelta) >= 0.05 && impactDelta < 0;
  const hcpDelta = impactDelta;

  const courseName = activity.last_round_course_name ?? 'Unknown course';
  const gross = activity.last_round_adjusted_gross;
  const stableford = activity.last_round_stableford;
  const diff = activity.last_round_differential;
  const isCounter = activity.is_counter;
  const timeAgo = fmtRelative(activity.last_round_played_at, { compact: false });

  const diffColor =
    diff != null && diff > 0
      ? 'var(--hcp-amber, #F7931E)'
      : diff != null && diff < 0
        ? 'var(--hcp-good, #22C55E)'
        : 'var(--hcp-t-100)';

  const ringColor = isCounter
    ? 'rgba(34,197,94,0.45)'
    : 'rgba(255,255,255,0.18)';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        margin: '0 20px 12px',
        background: 'var(--hcp-bg-1)',
        border: '1px solid var(--hcp-line-2)',
        borderRadius: 14,
        overflow: 'hidden',
        fontFamily: FONT,
        cursor: 'pointer',
        boxShadow: '0 1px 2px rgba(15,23,42,0.06)',
      }}
    >
      {/* Photo header band (56px) */}
      <div
        style={{
          position: 'relative',
          height: 56,
          width: '100%',
          overflow: 'hidden',
          background: FALLBACK_GRADIENT,
        }}
      >
        {activity.course_thumbnail_image ? (
          <img
            src={activity.course_thumbnail_image}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <FlagSilhouetteOverlay opacity={0.18} />
        )}

        {/* Scrim */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: PHOTO_SCRIM,
            pointerEvents: 'none',
          }}
        />

        {/* Eyebrow row */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            padding: '0 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          {/* Left cluster */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              minWidth: 0,
              flex: 1,
            }}
          >
            <SquircleAvatar
              src={pickAvatarSrc(activity.friend_thumbnail_url, activity.friend_profile_photo_url)}
              alt={activity.friend_name ?? ''}
              size={30}
              hairlineRing
              userId={activity.friend_user_id ?? undefined}
            />
            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  letterSpacing: '-0.015em',
                  lineHeight: 1.15,
                  textShadow: '0 1px 2px rgba(0,0,0,0.45)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {displayName(activity.friend_name)}
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.7)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.35)',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.02em',
                  lineHeight: 1.1,
                }}
              >
                {timeAgo}
              </div>
            </div>
          </div>

          {/* Right pill */}
          {isSynced && hcpDelta !== null && Math.abs(hcpDelta) >= 0.05 ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 9px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '0.04em',
                color: hcpDelta < 0 ? '#86EFAC' : '#FCA5A5',
                background:
                  hcpDelta < 0 ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)',
                border:
                  hcpDelta < 0
                    ? '0.5px solid rgba(34,197,94,0.5)'
                    : '0.5px solid rgba(239,68,68,0.5)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                flexShrink: 0,
              }}
            >
              HCP {hcpDelta < 0 ? '↓' : '↑'} {Math.abs(hcpDelta).toFixed(1)}
              {showHotFlame && (
                <Flame
                  size={11}
                  strokeWidth={2}
                  style={{ color: '#F7931E', marginLeft: 2 }}
                />
              )}
            </div>
          ) : !isSynced ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 9px',
                borderRadius: 999,
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--hcp-amber, #F7931E)',
                background: 'rgba(15,23,42,0.45)',
                border: '0.5px solid rgba(247,147,30,0.35)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                flexShrink: 0,
              }}
            >
              England Golf
            </div>
          ) : null}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '10px 14px' }}>
        <div
          style={{
            fontSize: 14.5,
            fontWeight: 800,
            color: 'var(--hcp-t-100)',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {courseName}
        </div>
        {(par != null || slope != null) && (
          <div
            style={{
              marginTop: 2,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: 'var(--hcp-t-60)',
              textTransform: 'uppercase',
            }}
          >
            {par != null && <>PAR {par}</>}
            {par != null && slope != null && <> · </>}
            {slope != null && <>SL {slope}</>}
          </div>
        )}

        {/* Hairline */}
        <div
          style={{
            height: 1,
            background: 'var(--hcp-line)',
            marginTop: 7,
            marginBottom: 9,
          }}
        />

        {/* Stat row */}
        {isSynced ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr auto',
              alignItems: 'start',
              gap: 8,
            }}
          >
            <StatColumn label="GROSS" ring ringColor={ringColor}>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--hcp-t-100)',
                }}
              >
                {gross ?? '—'}
              </span>
            </StatColumn>
            <StatColumn label="STBL">
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--hcp-t-100)',
                }}
              >
                {stableford ?? '—'}
              </span>
            </StatColumn>
            <StatColumn label="DIFF" color={diffColor}>
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  fontVariantNumeric: 'tabular-nums',
                  color: diffColor,
                }}
              >
                {diff != null
                  ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)}`
                  : '—'}
              </span>
            </StatColumn>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                paddingLeft: 4,
              }}
            >
              {/* invisible label spacer */}
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  visibility: 'hidden',
                  lineHeight: 1.2,
                }}
              >
                ·
              </span>
              <div
                style={{
                  height: 34,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ChevronRight
                  size={18}
                  strokeWidth={2.2}
                  style={{ color: 'var(--hcp-t-40)' }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <StatColumn label="GROSS">
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--hcp-t-100)',
                }}
              >
                {gross ?? '—'}
              </span>
            </StatColumn>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onInviteClick?.();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 13px',
                borderRadius: 999,
                background: 'rgba(247,147,30,0.10)',
                border: '0.5px solid rgba(247,147,30,0.35)',
                color: 'var(--hcp-amber, #F7931E)',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.06em',
                cursor: 'pointer',
                fontFamily: FONT,
                textTransform: 'uppercase',
              }}
            >
              {variant === 'clbhouz-not-synced' ? 'Ask to sync' : 'Invite'}
              <ChevronRight size={13} strokeWidth={2.2} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const StatColumn: React.FC<{
  label: string;
  children: React.ReactNode;
  ring?: boolean;
  ringColor?: string;
  color?: string;
}> = ({ label, children, ring = false, ringColor = 'rgba(255,255,255,0.18)' }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minWidth: 0,
    }}
  >
    <span
      style={{
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: '0.12em',
        color: 'var(--hcp-t-60)',
        lineHeight: 1.2,
        textTransform: 'uppercase',
      }}
    >
      {label}
    </span>
    {ring ? (
      <div
        style={{
          marginTop: 3,
          width: 34,
          height: 34,
          borderRadius: '50%',
          border: `1.5px solid ${ringColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </div>
    ) : (
      <div
        style={{
          marginTop: 3,
          height: 34,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </div>
    )}
  </div>
);

export default FriendRoundCardV2;
