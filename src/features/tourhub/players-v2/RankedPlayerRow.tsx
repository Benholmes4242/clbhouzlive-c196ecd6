/**
 * RankedPlayerRow — the one shared field row for THE FIELD ledger.
 * Dumb, tab-agnostic; the Leaders rebuild will consume this too.
 */

import { memo } from 'react';
import { ChevronRight } from 'lucide-react';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import CountryFlag from '@/components/ui/country-flag';
import { resolvePlayerAvatarCandidates } from '../_shared/resolvePlayerAvatar';
import {
  GOLD_DEEP,
  HAIRLINE_INK_10,
  INK,
  INK_MUTE,
} from '../_shared/tokens';

export interface RankedPlayer {
  playerId: string;
  name: string;
  country: string | null;
  countryCode: string | null;
  photoUrl: string | null;
  tourCode: string | null;
}

export interface RankedPlayerRowProps {
  rank: number;
  player: RankedPlayer;
  stat?: number | null;
  /** Pre-formatted string override for `stat` (e.g. "$30.1M", "72.3%"). */
  statFormatted?: string;
  statLabel?: string | null;
  live?: boolean;
  sub?: string | null;
  subLive?: boolean;
  goldRank?: boolean;
  onClick?: () => void;
}

const LIVE_GREEN = '#10B981';

function formatStat(n: number): string {
  if (Math.abs(n) >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function RankedPlayerRowInner({
  rank,
  player,
  stat,
  statFormatted,
  statLabel,
  live,
  sub,
  subLive,
  goldRank,
  onClick,
}: RankedPlayerRowProps) {
  const candidates = resolvePlayerAvatarCandidates({
    name: player.name,
    photoUrl: player.photoUrl,
    tourSlug: player.tourCode ?? 'pga',
  });

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        padding: '12px 16px',
        background: 'transparent',
        border: 'none',
        borderBottom: `0.5px solid ${HAIRLINE_INK_10}`,
        textAlign: 'left',
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {/* Rank */}
      <div
        style={{
          width: 28,
          fontSize: 15,
          fontWeight: 200,
          color: goldRank ? GOLD_DEEP : INK,
          fontVariantNumeric: 'tabular-nums',
          textAlign: 'right',
        }}
      >
        {rank}
      </div>

      {/* Avatar with live dot */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <SquircleAvatar
          size={34}
          srcCandidates={candidates}
          alt={player.name}
          userId={player.playerId}
          hairlineRing
          ringColor={LIGHT_HAIRLINE}
        />
        {live && (
          <span
            style={{
              position: 'absolute',
              bottom: -1,
              right: -1,
              width: 9,
              height: 9,
              borderRadius: '50%',
              background: LIVE_GREEN,
              border: '1.5px solid #FFFFFF',
            }}
          />
        )}
      </div>

      {/* Name + sub-line */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: INK,
              letterSpacing: '-0.01em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {player.name}
          </span>
          <CountryFlag country={player.country} size="sm" />
        </div>
        {sub && (
          <div
            style={{
              fontSize: 9,
              fontWeight: subLive ? 700 : 500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: subLive ? LIVE_GREEN : INK_MUTE,
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {sub}
          </div>
        )}
      </div>

      {/* Stat column */}
      {(statFormatted != null || stat != null) && (
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 200,
              color: INK,
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
            }}
          >
            {statFormatted ?? (stat != null ? formatStat(stat) : '')}
          </div>
          {statLabel && (
            <div
              style={{
                fontSize: 6.5,
                fontWeight: 800,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: INK_MUTE,
                marginTop: 3,
              }}
            >
              {statLabel}
            </div>
          )}
        </div>
      )}

      <ChevronRight size={14} color={INK_MUTE} style={{ flexShrink: 0 }} />
    </button>
  );
}

export const RankedPlayerRow = memo(RankedPlayerRowInner);
export default RankedPlayerRow;
