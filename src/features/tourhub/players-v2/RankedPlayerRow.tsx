/**
 * RankedPlayerRow - the one shared field row for THE FIELD ledger.
 * Dumb, tab-agnostic; the Leaders rebuild will consume this too.
 *
 * Separation is whitespace: no row hairline. The grid is load-bearing, so the
 * rank and stat cells are fixed width and figures align down the page.
 */

import { memo, type ReactNode } from 'react';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import CountryFlag from '@/components/ui/country-flag';
import { resolvePlayerAvatarCandidates } from '../_shared/resolvePlayerAvatar';
import { formatNumberMaxFrac } from '@/i18n/format';
import { HAIRLINE_INK_10, INK, STATUS_LIVE } from '../_shared/tokens';

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
  live?: boolean;
  /** Composed by the parent; may carry mixed colour. */
  sub?: ReactNode;
  onClick?: () => void;
  /** False for rows with no linked player: renders inert, looks identical. */
  interactive?: boolean;
}

function formatStat(n: number): string {
  if (Math.abs(n) >= 1000) return formatNumberMaxFrac(n, 0);
  return formatNumberMaxFrac(n, 2);
}

function RankedPlayerRowInner({
  rank,
  player,
  stat,
  statFormatted,
  live,
  sub,
  onClick,
  interactive = true,
}: RankedPlayerRowProps) {
  const candidates = resolvePlayerAvatarCandidates({
    name: player.name,
    photoUrl: player.photoUrl,
    tourSlug: player.tourCode ?? 'pga',
  });

  const shellStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    padding: '13px 16px',
    background: 'transparent',
    border: 'none',
    textAlign: 'left',
    fontFamily: 'inherit',
    fontVariantNumeric: 'tabular-nums lining-nums',
  };

  const body = (
    <>

      {/* Rank */}
      <div
        style={{
          width: 28,
          flex: '0 0 28px',
          fontSize: 15,
          fontWeight: 200,
          color: INK,
          fontVariantNumeric: 'tabular-nums lining-nums',
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
              top: 2,
              right: 2,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: STATUS_LIVE,
              boxShadow: '0 0 0 1.5px #FFFFFF',
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
              display: 'flex',
              alignItems: 'center',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.13em',
              textTransform: 'uppercase',
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
      <div
        style={{
          width: 72,
          flex: '0 0 72px',
          textAlign: 'right',
          fontSize: 14,
          fontWeight: 200,
          color: INK,
          fontVariantNumeric: 'tabular-nums lining-nums',
          lineHeight: 1,
        }}
      >
        {statFormatted ?? (stat != null ? formatStat(stat) : '')}
      </div>
    </>
  );

  if (!interactive) {
    return <div style={shellStyle}>{body}</div>;
  }

  return (
    <button type="button" onClick={onClick} style={{ ...shellStyle, cursor: 'pointer' }}>
      {body}
    </button>
  );
}


export const RankedPlayerRow = memo(RankedPlayerRowInner);
export default RankedPlayerRow;

/** Column-header grid twin of the row above. Kept here so the two cannot drift. */
export function RankedPlayerHeader({
  rankLabel,
  playerLabel,
  statLabel,
}: {
  rankLabel: string;
  playerLabel: string;
  statLabel: string | null;
}) {
  const cell: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.13em',
    textTransform: 'uppercase',
    color: 'rgba(15,23,42,0.45)',
  };
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px 6px',
        borderBottom: `0.5px solid ${HAIRLINE_INK_10}`,
      }}
    >
      <div style={{ ...cell, width: 28, flex: '0 0 28px', textAlign: 'right' }}>{rankLabel}</div>
      <div style={{ ...cell, flex: 1, minWidth: 0 }}>{playerLabel}</div>
      {statLabel && (
        <div style={{ ...cell, width: 72, flex: '0 0 72px', textAlign: 'right' }}>{statLabel}</div>
      )}
    </div>
  );
}
