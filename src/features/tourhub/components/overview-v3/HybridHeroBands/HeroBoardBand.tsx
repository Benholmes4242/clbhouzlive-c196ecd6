/**
 * HeroBoardBand — the expanded live leaderboard that OCCUPIES THE PHOTO BAND.
 *
 * Why it lives here and not over the hero: the hero is a horizontally swiping
 * carousel whose cards share a definite height (TOTAL_HERO_HEIGHT_TARGET). This
 * band renders at exactly PHOTO_BAND_HEIGHT in place of PhotoBand, so the hero's
 * height is byte-identical in both states and no sibling card moves. It never
 * floats over the hero (that would fight the swipe gesture) and it never scrolls
 * internally (a vertical scroller inside a horizontal pager is a gesture trap) —
 * six rows, fixed, with the tournament page as the route to the rest.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';

import { PHOTO_BAND_HEIGHT } from '../HybridHero.constants';
import { FONT, CHARCOAL, WHITE_ALPHA_10, WHITE_ALPHA_55, AMBER } from '../../../_shared/tokens';
import { MiniBoard } from '../../../tournament-v2/sections/MiniBoard';

/** Six rows (~41px) + header (~29px) + footer (~40px) fits 306px. */
export const HERO_BOARD_ROWS = 6;

interface HeroBoardBandProps {
  tournamentId: string;
  entries: any[];
  /** Active round — REQUIRED. TODAY is meaningless without it. */
  currentRound: number;
  onFullLeaderboard: () => void;
  onRowTap?: (playerId: string) => void;
}

export function HeroBoardBand({
  tournamentId,
  entries,
  currentRound,
  onFullLeaderboard,
  onRowTap,
}: HeroBoardBandProps) {
  const { t } = useTranslation('tourhub');

  return (
    <div
      style={{
        height: PHOTO_BAND_HEIGHT,
        minHeight: PHOTO_BAND_HEIGHT,
        maxHeight: PHOTO_BAND_HEIGHT,
        background: CHARCOAL,
        fontFamily: FONT,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ flex: 1, minHeight: 0 }}>
        <MiniBoard
          tournamentId={tournamentId}
          entries={entries}
          limit={HERO_BOARD_ROWS}
          currentRound={currentRound}
          theme="dark"
          onRowTap={onRowTap}
        />
      </div>
      <button
        type="button"
        onClick={onFullLeaderboard}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '9px 16px',
          background: 'transparent',
          border: 'none',
          borderTop: `0.5px solid ${WHITE_ALPHA_10}`,
          fontFamily: FONT,
          cursor: 'pointer',
          flexShrink: 0,
        }}
        className="active:bg-white/[0.06] transition-colors"
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.16em',
            color: WHITE_ALPHA_55,
            textTransform: 'uppercase',
          }}
        >
          {t('overview.ticker.fullLeaderboard')}
        </span>
        <ChevronRight size={14} color={AMBER} strokeWidth={2.5} />
      </button>
    </div>
  );
}
