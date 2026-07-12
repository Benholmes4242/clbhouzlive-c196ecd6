/**
 * LiveNowStrip — charcoal row shown ONLY when the player is in an
 * inprogress tournament. Reads usePlayerState.liveData (extended in P1
 * to include position + thru so the row can render the sub line
 * without a second query).
 */

import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PlayerLiveData } from '../../hooks/usePlayerState';
import { tournamentRoute } from '../../routes';
import { LIVE_DOT, SCORE_UNDER_PAR_DARK, WHITE_ALPHA_55 } from '../../_shared/tokens';

interface LiveNowStripProps {
  liveData: PlayerLiveData;
  playerName: string;
}

function posLabel(pos: number | null, tied: boolean | null): string | null {
  if (pos === null) return null;
  return `${tied ? 'T' : ''}${pos}`;
}

export function LiveNowStrip({ liveData, playerName }: LiveNowStripProps) {
  const target = tournamentRoute(liveData.tournamentId, {
    kind: 'player',
    playerName,
  });
  const pos = posLabel(liveData.position, liveData.positionTied);
  const thruLabel =
    liveData.thru === null
      ? null
      : liveData.thru >= 18
      ? 'F'
      : `thru ${liveData.thru}`;

  const subParts = [pos, thruLabel].filter(Boolean).join(' · ');
  const scoreDisplay =
    liveData.score === null
      ? '—'
      : liveData.score === 0
      ? 'E'
      : liveData.score > 0
      ? `+${liveData.score}`
      : String(liveData.score);

  return (
    <div style={{ padding: '12px 16px 8px' }}>
      <Link
        to={target.to}
        state={target.state}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 14px',
          background: '#15171F',
          borderRadius: 14,
          textDecoration: 'none',
          color: '#FFFFFF',
        }}
        className="active:opacity-80 transition-opacity"
      >
        {/* LIVE pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 8px',
            borderRadius: 999,
            background: 'rgba(34,197,94,0.14)',
            border: `1px solid rgba(34,197,94,0.36)`,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: LIVE_DOT,
              boxShadow: `0 0 8px ${LIVE_DOT}`,
            }}
          />
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              color: LIVE_DOT,
              letterSpacing: '0.14em',
            }}
          >
            LIVE
          </span>
        </div>

        {/* Event line */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: '-0.005em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {liveData.tournamentName}
            {liveData.currentRound && (
              <span style={{ color: WHITE_ALPHA_55, fontWeight: 700 }}>
                {' · R'}
                {liveData.currentRound}
              </span>
            )}
          </div>
          {subParts && (
            <div
              style={{
                marginTop: 2,
                fontSize: 10.5,
                fontWeight: 700,
                color: WHITE_ALPHA_55,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {subParts}
            </div>
          )}
        </div>

        {/* Total */}
        <div
          style={{
            fontSize: 20,
            fontWeight: 200,
            letterSpacing: '-0.02em',
            color: SCORE_UNDER_PAR_DARK,
            fontVariantNumeric: 'tabular-nums',
            flexShrink: 0,
          }}
        >
          {scoreDisplay}
        </div>

        <ChevronRight size={18} color={WHITE_ALPHA_55} style={{ flexShrink: 0 }} />
      </Link>
    </div>
  );
}
