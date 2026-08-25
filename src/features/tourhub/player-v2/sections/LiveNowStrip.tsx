/**
 * LiveNowStrip - charcoal row shown ONLY when the player is in an
 * inprogress tournament. Reads usePlayerState.liveData (extended in P1
 * to include position + thru so the row can render the sub line
 * without a second query).
 *
 * LIVE is a haloed STATUS_LIVE dot + LABEL, matching the leaderboard
 * masthead / side menu / schedule / tournament hero. No capsule, no border.
 * Scores go through the canonical fmtScore + getScoreColor helpers.
 * The strip's own border/radius stays: it is a discrete live object on canvas,
 * not a row in a list.
 */

import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { PlayerLiveData } from '../../hooks/usePlayerState';
import { tournamentRoute } from '../../routes';
import { fmtScore } from '../../utils/fmtScore';
import { getScoreColor } from '../../_shared/scoreColor';
import { CHARCOAL, STATUS_LIVE_ON_DARK, WHITE_ALPHA_55 } from '../../_shared/tokens';

interface LiveNowStripProps {
  liveData: PlayerLiveData;
  playerName: string;
}

// AXIS 10 (floor): this token carries the LIVE badge marker and the
// position/thru meta markers on the immersive hero — markers, not language.
const LABEL_ON_DARK = {
  fontSize: 10,
  fontWeight: 700 as const,
  letterSpacing: '0.13em',
  textTransform: 'uppercase' as const,
};

function posLabel(pos: number | null, tied: boolean | null): string | null {
  if (pos === null) return null;
  return `${tied ? 'T' : ''}${pos}`;
}

export function LiveNowStrip({ liveData, playerName }: LiveNowStripProps) {
  const { t } = useTranslation('tourhub');
  const target = tournamentRoute(liveData.tournamentId, {
    kind: 'player',
    playerName,
  });
  const pos = posLabel(liveData.position, liveData.positionTied);
  const thruLabel =
    liveData.thru === null
      ? null
      : liveData.thru >= 18
      ? t('player.live.finished')
      : t('player.live.thru', { holes: liveData.thru });

  const subParts = [pos, thruLabel].filter(Boolean).join(' \u00b7 ');
  const scoreDisplay = liveData.score === null ? '' : fmtScore(liveData.score);
  const scoreColor = getScoreColor(liveData.score, 'dark');

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
          background: CHARCOAL,
          borderRadius: 14,
          textDecoration: 'none',
          color: '#FFFFFF',
        }}
        className="active:opacity-80 transition-opacity"
      >
        {/* LIVE dot + label */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: STATUS_LIVE_ON_DARK,
              boxShadow: `0 0 8px ${STATUS_LIVE_ON_DARK}`,
            }}
          />
          <span style={{ ...LABEL_ON_DARK, color: STATUS_LIVE_ON_DARK }}>
            {t('player.live.badge')}
          </span>
        </div>

        {/* Event line */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 700,
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
                {t('player.live.roundSuffix', { round: liveData.currentRound })}
              </span>
            )}
          </div>
          {subParts && (
            <div
              style={{
                marginTop: 3,
                ...LABEL_ON_DARK,
                color: WHITE_ALPHA_55,
                fontVariantNumeric: 'tabular-nums lining-nums',
              }}
            >
              {subParts}
            </div>
          )}
        </div>

        {/* Total */}
        {scoreDisplay && (
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: scoreColor,
              fontVariantNumeric: 'tabular-nums lining-nums',
              flexShrink: 0,
            }}
          >
            {scoreDisplay}
          </div>
        )}

        <ChevronRight size={18} color={WHITE_ALPHA_55} style={{ flexShrink: 0 }} />
      </Link>
    </div>
  );
}
