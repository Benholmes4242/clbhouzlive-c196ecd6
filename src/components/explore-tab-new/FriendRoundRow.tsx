import type { CSSProperties } from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

import { getInitialsFromName } from '@/lib/avatarFallback';
import { formatRelativeMonths } from '@/i18n/format';
import { TOPAR_UNDER_LIGHT } from '@/features/tourhub/_shared/tokens';
import type { FriendRoundRow } from '@/hooks/gam/useFriendsLatestRounds';
import { RoundFeatChips, featChipBase } from './RoundFeatChips';

/**
 * FriendRoundRow — Discover "Friends' latest rounds".
 * Custom row so we can carry an inline chip strip (hcp delta + up to two
 * feats derived from round stats) under the name. Density constants match
 * StatRow "compact" so this section sits flush with the Record Book above
 * and below.
 */


const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const INK = '#0F172A';
const SLATE_400 = '#94A3B8';
const SLATE_500 = '#64748B';
const HAIRLINE = '#E2E8F0';
const LAUREL_INK = '#0e8a57'; // hcp drop = green
const RED = '#D2222D';         // hcp rise = red

// Compact density (canonical Discover/Champions).
const ROW_MIN_HEIGHT = 56;
const ROW_PADDING = '10px 16px';
const AVATAR_SIZE = 34;
const NAME_SIZE = 14.5;
const SUBLINE_SIZE = 12.5;
const STAT_VALUE_SIZE = 17;
const STAT_LABEL_SIZE = 9.5;

const chipBase: CSSProperties = featChipBase;

interface Props {
  row: FriendRoundRow;
  isLast?: boolean;
  onPress?: () => void;
}

export function FriendRoundRow({ row, isLast = false, onPress }: Props) {
  const {
    display_name,
    profile_photo_url,
    user_id,
    play_date,
    course_name,
    gross,
    net,
    stableford,
    hcp_delta,
    feats,
  } = row;


  const relative = formatRelativeMonths(play_date);


  // hcp movement — direction inverted: negative delta (lower index) is good.
  const hcpChip = (() => {
    if (hcp_delta == null || Math.abs(hcp_delta) < 0.05) return null;
    const dropped = hcp_delta < 0;
    const abs = Math.abs(hcp_delta).toFixed(1);
    return (
      <span
        style={{
          ...chipBase,
          background: dropped ? 'rgba(14,138,87,0.10)' : 'rgba(210,34,45,0.10)',
          color: dropped ? LAUREL_INK : RED,
        }}
      >
        {dropped ? '↓' : '↑'} {abs}
      </span>
    );
  })();

  return (
    <button
      type="button"
      onClick={onPress}
      className="w-full text-left active:bg-slate-50 transition-colors"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        minHeight: ROW_MIN_HEIGHT,
        padding: ROW_PADDING,
        background: 'transparent',
        border: 'none',
        borderBottom: isLast ? 'none' : `1px solid ${HAIRLINE}`,
        cursor: onPress ? 'pointer' : 'default',
        fontFamily: FONT,
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <SquircleAvatar
          size={AVATAR_SIZE}
          srcCandidates={profile_photo_url ? [profile_photo_url] : []}
          alt={display_name}
          fallback={getInitialsFromName(display_name)}
          userId={user_id ?? undefined}
          hairlineRing
        />
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: NAME_SIZE,
              fontWeight: 600,
              color: INK,
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
              flex: '0 1 auto',
            }}
          >
            {display_name}
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: SLATE_400,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {relative}
          </div>
          {hcpChip ? <span style={{ flexShrink: 0 }}>{hcpChip}</span> : null}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: SUBLINE_SIZE,
            fontWeight: 500,
            color: SLATE_500,
            lineHeight: 1.2,
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontWeight: 600,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {course_name ?? ''}
          </span>
        </div>

        {feats.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 6,
              marginTop: 2,
            }}
          >
            <RoundFeatChips feats={feats} />
          </div>
        )}

      </div>


      {gross != null ? (
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 2,
          }}
        >
          <div
            className="tabular-nums"
            style={{
              fontSize: STAT_VALUE_SIZE,
              fontWeight: 700,
              lineHeight: 1,
              color: net != null && net < 0 ? TOPAR_UNDER_LIGHT : INK,
              letterSpacing: '-0.01em',
            }}
          >
            {gross}
          </div>
          <div
            style={{
              fontSize: STAT_LABEL_SIZE,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: SLATE_400,
              lineHeight: 1,
            }}
          >
            {stableford != null ? `${stableford} PTS` : 'GROSS'}
          </div>
        </div>
      ) : null}
    </button>
  );
}

export default FriendRoundRow;
