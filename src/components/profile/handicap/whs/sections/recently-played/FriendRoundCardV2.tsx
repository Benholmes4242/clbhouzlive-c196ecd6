import React, { useMemo, useState } from 'react';
import { Flame, ChevronRight } from 'lucide-react';
import { displayName } from '@/lib/whs/utils/initials';
import { fmtAbsoluteDate } from '@/lib/whs/utils/nameFormat';
import { useFriendRoundDetail } from '@/lib/whs/hooks';
import FlagSilhouetteOverlay from '@/components/whs/FlagSilhouetteOverlay';
import type { WhsFriendActivityWithImage } from '@/lib/whs/types';

type Variant = 'clbhouz-synced' | 'clbhouz-not-synced' | 'eg-only';

interface Props {
  activity: WhsFriendActivityWithImage;
  variant: Variant;
  onClick: () => void;
}

const FONT = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

const FALLBACK_BG = 'linear-gradient(135deg, #46665a 0%, #2f4a40 100%)';

export const FriendRoundCardV2: React.FC<Props> = ({
  activity,
  variant,
  onClick,
}) => {
  const isSynced = variant === 'clbhouz-synced';
  const [imgFailed, setImgFailed] = useState(false);
  const hasImage = !!activity.course_thumbnail_image && !imgFailed;
  // State B: synced friend whose round summary exists but has no detailed
  // scorecard (e.g. EG published summary only). Card still renders the synced
  // summary row, but we suppress the chevron / "tap for card" affordance.
  const hasScorecard = isSynced && !!activity.last_round_score_id;

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
  const playedDate = fmtAbsoluteDate(activity.last_round_played_at);

  const diffColor = 'var(--hcp-t-100)';

  const ringColor = isCounter
    ? 'rgba(5,150,105,0.55)'
    : 'var(--hcp-line-2)';

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
        margin: '0 16px 8px',
        background: 'var(--hcp-bg-1)',
        border: '1px solid var(--hcp-line-2)',
        borderRadius: 14,
        overflow: 'hidden',
        fontFamily: FONT,
        cursor: 'pointer',
        boxShadow: '0 1px 2px rgba(15,23,42,0.06)',
        display: 'flex',
        alignItems: 'stretch',
        minHeight: 108,
      }}
    >
      {/* Left column — photo (92px wide, full card height) */}
      <div
        style={{
          flexShrink: 0,
          width: 92,
          position: 'relative',
          overflow: 'hidden',
          background: FALLBACK_BG,
        }}
      >
        {hasImage ? (
          <img
            src={activity.course_thumbnail_image!}
            alt=""
            onError={() => setImgFailed(true)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <FlagSilhouetteOverlay opacity={0.30} />
        )}


      </div>

      {/* Right column — content */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 800,
                color: 'var(--hcp-t-100)',
                letterSpacing: '-0.01em',
                lineHeight: 1.15,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {displayName(activity.friend_name)}
            </div>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: 'var(--hcp-t-60)',
                marginTop: 2,
                lineHeight: 1.15,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {playedDate}
            </div>
          </div>

          {isSynced && hcpDelta !== null && Math.abs(hcpDelta) >= 0.05 ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 8px',
                borderRadius: 999,
                fontSize: 10.5,
                fontWeight: 800,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '0.02em',
                color: hcpDelta < 0 ? '#34D399' : 'var(--hcp-bad)',
                background:
                  hcpDelta < 0 ? 'rgba(5,150,105,0.22)' : 'rgba(159,29,29,0.22)',
                border:
                  hcpDelta < 0
                    ? '0.5px solid rgba(5,150,105,0.55)'
                    : '0.5px solid rgba(159,29,29,0.55)',
                flexShrink: 0,
                lineHeight: 1,
              }}
            >
              HCP {hcpDelta < 0 ? '↓' : '↑'} {Math.abs(hcpDelta).toFixed(1)}
              {showHotFlame && (
                <Flame
                  size={11}
                  strokeWidth={2.4}
                  aria-label="Hot streak"
                  style={{ marginLeft: 2, color: '#34D399' }}
                />
              )}
            </div>
          ) : !isSynced ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '3px 8px',
                borderRadius: 999,
                fontSize: 8.5,
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--hcp-t-100)',
                background: 'var(--hcp-bg-2)',
                border: '0.5px solid var(--hcp-line-2)',
                flexShrink: 0,
                lineHeight: 1,
              }}
            >
              England Golf
            </div>
          ) : null}
        </div>

        <div
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: 'var(--hcp-t-80)',
            letterSpacing: '-0.005em',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {courseName}
          {(par != null || slope != null) && (
            <span
              style={{
                marginLeft: 6,
                fontSize: 9.5,
                fontWeight: 700,
                color: 'var(--hcp-t-60)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {par != null && <>· PAR {par}</>}
              {par != null && slope != null && <> · SL {slope}</>}
              {par == null && slope != null && <>· SL {slope}</>}
            </span>
          )}
        </div>

        {isSynced ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginTop: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  color: 'var(--hcp-t-60)',
                  textTransform: 'uppercase',
                }}
              >
                GROSS
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '3px 9px',
                  borderRadius: 999,
                  border: `1.5px solid ${ringColor}`,
                  fontSize: 14,
                  fontWeight: 800,
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--hcp-t-100)',
                  lineHeight: 1,
                }}
              >
                {gross ?? '—'}
              </span>
            </div>
            {stableford != null && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    color: 'var(--hcp-t-60)',
                    textTransform: 'uppercase',
                  }}
                >
                  STBL
                </span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    fontVariantNumeric: 'tabular-nums',
                    color: 'var(--hcp-t-100)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                  }}
                >
                  {stableford}
                </span>
              </div>
            )}
            {diff != null && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    color: 'var(--hcp-t-60)',
                    textTransform: 'uppercase',
                  }}
                >
                  DIFF
                </span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    fontVariantNumeric: 'tabular-nums',
                    color: diffColor,
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                  }}
                >
                  {`${diff > 0 ? '+' : ''}${diff.toFixed(1)}`}
                  {diff < 0 && (
                    <span style={{ marginLeft: 4, fontSize: 12 }} aria-label="sub-par round">
                      🔥
                    </span>
                  )}
                </span>
              </div>
            )}
            {hasScorecard && (
              <ChevronRight
                size={16}
                strokeWidth={2.2}
                style={{ color: 'var(--hcp-t-40)', marginLeft: 'auto', flexShrink: 0 }}
              />
            )}
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginTop: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  color: 'var(--hcp-t-60)',
                  textTransform: 'uppercase',
                }}
              >
                GROSS
              </span>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--hcp-t-100)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                }}
              >
                {gross ?? '—'}
              </span>
            </div>
            <div
              aria-hidden
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                padding: '5px 11px',
                borderRadius: 999,
                background: 'var(--hcp-bg-3)',
                border: '0.5px solid var(--hcp-line-2)',
                color: 'var(--hcp-t-100)',
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.06em',
                fontFamily: FONT,
                textTransform: 'uppercase',
                lineHeight: 1,
                pointerEvents: 'none',
              }}
            >
              {variant === 'clbhouz-not-synced' ? 'Ask to sync' : 'Invite'}
              <ChevronRight size={11} strokeWidth={2.2} color="var(--hcp-t-100)" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendRoundCardV2;
