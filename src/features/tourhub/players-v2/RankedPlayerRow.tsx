/**
 * RankedPlayerRow - the field row used by PlayersTab.
 * The overview row grammar is load-bearing: rank stays fixed inside the text
 * track while the right-aligned figure stack sizes to its content.
 */

import { memo, type ReactNode } from 'react';
import CountryFlag from '@/components/ui/country-flag';
import { formatNumberMaxFrac } from '@/i18n/format';
import { INK, INK_FAINT, INK_MUTE, WHITE_ALPHA_06 } from '../_shared/tokens';

export interface RankedPlayer {
  playerId: string;
  name: string;
  country: string | null;
  countryCode: string | null;
  photoUrl: string | null;
  tourCode: string | null;
}

export interface RankedPlayerRowProps {
  rank: number | string;
  player: RankedPlayer;
  stat?: number | null;
  /** Pre-formatted string override for `stat` (e.g. "$30.1M", "72.3%"). */
  statFormatted?: string;
  /** Ranking context, or live state followed by the event name. */
  kicker: ReactNode;
  /** Career facts; composed by the parent and rendered as one ellipsising line. */
  sub?: ReactNode;
  /** PTS for ranked rows; position and score for live rows. */
  unit: ReactNode;
  last?: boolean;
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
  kicker,
  sub,
  unit,
  last = false,
  onClick,
  interactive = true,
}: RankedPlayerRowProps) {
  const shellStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'minmax(0,1fr) auto',
    alignItems: 'center',
    columnGap: 12,
    width: '100%',
    minHeight: 76,
    padding: '13px 24px',
    background: 'transparent',
    border: 'none',
    borderBottom: last ? 'none' : `1px solid ${WHITE_ALPHA_06}`,
    textAlign: 'left',
    fontFamily: 'inherit',
    fontVariantNumeric: 'tabular-nums lining-nums',
  };

  const body = (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '28px minmax(0,1fr)', alignItems: 'center', columnGap: 12, minWidth: 0 }}>
        <div
          style={{
            width: 28,
            fontSize: 15,
            fontWeight: 200,
            color: INK,
            fontVariantNumeric: 'tabular-nums lining-nums',
            textAlign: 'right',
          }}
        >
          {rank}
        </div>
        <div style={{ minWidth: 0 }}>
          <span
            style={{
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: 10,
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: INK_FAINT,
            }}
          >
            {kicker}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, marginTop: 3 }}>
            <span
              style={{
                minWidth: 0,
                fontSize: 15,
                fontWeight: 700,
                color: INK,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {player.name}
            </span>
            <CountryFlag country={player.country} size="sm" />
          </span>
          {sub && (
            <span
              data-player-subline
              style={{
                display: 'block',
                marginTop: 2,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.13em',
                textTransform: 'uppercase',
                color: INK_MUTE,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              }}
            >
              {sub}
            </span>
          )}
        </div>
      </div>
      <div data-player-figure style={{ flex: 'none', textAlign: 'right', minWidth: 0 }}>
        <span style={{ display: 'block', whiteSpace: 'nowrap', fontSize: 17, fontWeight: 700, color: INK, fontVariantNumeric: 'tabular-nums lining-nums', lineHeight: 1.1 }}>
          {statFormatted ?? (stat != null ? formatStat(stat) : '')}
        </span>
        <span style={{ display: 'block', marginTop: 2, whiteSpace: 'nowrap', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: INK_FAINT }}>
          {unit}
        </span>
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
    // AXIS 10: column headers (#, PLAYER, FEDEX PTS) - coordinates, not language.
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.13em',
    textTransform: 'uppercase',
    color: INK_FAINT,
  };
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) auto',
        alignItems: 'center',
        columnGap: 12,
        padding: '10px 24px 6px',
        borderBottom: `1px solid ${WHITE_ALPHA_06}`,
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '28px minmax(0,1fr)', columnGap: 12, minWidth: 0 }}>
        <div style={{ ...cell, width: 28, textAlign: 'right' }}>{rankLabel}</div>
        <div style={{ ...cell, minWidth: 0 }}>{playerLabel}</div>
      </div>
      {statLabel && (
        <div data-player-header-stat style={{ ...cell, textAlign: 'right', whiteSpace: 'nowrap' }}>{statLabel}</div>
      )}
    </div>
  );
}
