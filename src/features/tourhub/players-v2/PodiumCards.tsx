/**
 * PodiumCards — top-3 podium (synced tours only).
 * Center No.1 gold-gradient (46px), flanked by white cards (38px, No.2/No.3).
 * Taps navigate to /tourhub/player/{id}.
 */

import { useNavigate } from 'react-router-dom';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { resolvePlayerAvatarCandidates } from '../_shared/resolvePlayerAvatar';
import type { RankedRow } from './data/usePlayersRanking';
import {
  GOLD,
  GOLD_BORDER,
  GOLD_DEEP,
  GOLD_TINT,
  GOLD_TINT_10,
  HAIRLINE_INK_10,
  INK,
  INK_MUTE,
  SURFACE,
} from '../_shared/tokens';

interface Props {
  rows: RankedRow[];
  statLabel: string | null;
}

function formatStat(n: number): string {
  if (Math.abs(n) >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function PodiumCard({
  row,
  size,
  center,
  onClick,
  statLabel,
}: {
  row: RankedRow;
  size: number;
  center: boolean;
  onClick: () => void;
  statLabel: string | null;
}) {
  const candidates = resolvePlayerAvatarCandidates({
    name: row.name,
    photoUrl: row.photoUrl,
    tourSlug: row.tourCode ?? 'pga',
  });
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: center ? '1.15 1 0' : '1 1 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: center ? '16px 10px 14px' : '12px 8px 12px',
        borderRadius: 14,
        background: center
          ? `linear-gradient(180deg, ${GOLD_TINT_10} 0%, ${GOLD_TINT} 100%)`
          : SURFACE,
        border: `0.5px solid ${center ? GOLD_BORDER : HAIRLINE_INK_10}`,
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'center',
      }}
    >
      <div style={{ position: 'relative' }}>
        <SquircleAvatar
          size={size}
          srcCandidates={candidates}
          alt={row.name}
          userId={row.playerId}
          hairlineRing
          ringColor={LIGHT_HAIRLINE}
        />
      </div>


      <div style={{ minWidth: 0, width: '100%' }}>
        <div
          style={{
            fontSize: center ? 9 : 8,
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: center ? GOLD_DEEP : INK_MUTE,
            marginBottom: 4,
          }}
        >
          {center ? `No.1${statLabel ? ' \u00B7 ' + statLabel : ''}` : `No.${row.rank}`}
        </div>
        <div
          style={{
            fontSize: center ? 12 : 11,
            fontWeight: 700,
            color: INK,
            letterSpacing: '-0.01em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {row.name}
        </div>
        {row.stat != null && (
          <div
            style={{
              marginTop: 4,
              fontSize: center ? 15 : 12,
              fontWeight: 200,
              color: center ? GOLD_DEEP : INK,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatStat(row.stat)}
          </div>
        )}
      </div>
    </button>
  );
}

export function PodiumCards({ rows, statLabel }: Props) {
  const navigate = useNavigate();
  if (!rows || rows.length < 3) return null;
  const [first, second, third] = rows;
  const go = (id: string) => id && navigate(`/tourhub/player/${id}`);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: 8,
        padding: '0 16px 12px',
      }}
    >
      <PodiumCard row={second} size={38} center={false} statLabel={statLabel} onClick={() => go(second.playerId)} />
      <PodiumCard row={first} size={46} center={true} statLabel={statLabel} onClick={() => go(first.playerId)} />
      <PodiumCard row={third} size={38} center={false} statLabel={statLabel} onClick={() => go(third.playerId)} />
    </div>
  );
}

export default PodiumCards;
