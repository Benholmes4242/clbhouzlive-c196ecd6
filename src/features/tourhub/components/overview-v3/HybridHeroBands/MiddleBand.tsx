/**
 * MiddleBand — state-driven 40-62px band between photo and leaderboard.
 * §5 of HYBRID_HERO_IMPLEMENTATION_BRIEF + Patch 01 §3.
 */

import React from 'react';
import type { HeroState, TickerRow, TopTie } from '../HybridHero.utils';
import { Ticker } from './Ticker';
import { ChampionStrip, CancelledStrip, PlayoffStrip } from './ChampionStrip';
import { TeamWinnerStrip } from './TeamWinnerStrip';
import type { DefendingChampData } from '../../../hooks/useTournamentDefendingChamp';

export interface TeamWinner {
  teamName: string;
  members: { fullName: string; photoUrl: string | null }[];
  score: string;
  scoreLabel?: string;
  teamColor?: string;
  teamCrestUrl?: string | null;
}

interface MiddleBandProps {
  state: HeroState;
  top10?: TickerRow[];
  champion?: { name: string; country?: string; score: string; playoffWin?: boolean; avatarUrl?: string | null };
  tiedLeaders?: TopTie | null;
  defendingChamp?: DefendingChampData | null;
  cancelReason?: string;
  fallbackPreview?: { eyebrow: string; body: string };
  teamWinner?: TeamWinner | null;
}

export function MiddleBand({
  state,
  top10,
  champion,
  tiedLeaders,
  defendingChamp,
  cancelReason,
  fallbackPreview,
  teamWinner,
}: MiddleBandProps) {
  if (state.kind === 'live') {
    return <Ticker rows={top10 ?? []} />;
  }

  if (state.kind === 'results') {
    if (state.variant === 'cancelled') {
      return <CancelledStrip reason={cancelReason || 'No play — tournament cancelled.'} />;
    }
    if (state.variant === 'awaiting-playoff' && tiedLeaders) {
      return <PlayoffStrip count={tiedLeaders.count} score={tiedLeaders.score} />;
    }
    // Team winner takes precedence over solo champion strip when present.
    if (teamWinner) {
      return (
        <TeamWinnerStrip
          teamName={teamWinner.teamName}
          members={teamWinner.members}
          score={teamWinner.score}
          scoreLabel={teamWinner.scoreLabel}
          teamColor={teamWinner.teamColor}
          teamCrestUrl={teamWinner.teamCrestUrl}
        />
      );
    }
    if (champion) {
      const eyebrow = state.variant === 'playoff' ? '🏆 CHAMPION · PLAYOFF' : '🏆 CHAMPION';
      return (
        <ChampionStrip
          name={champion.name}
          country={champion.country}
          score={champion.score}
          eyebrow={eyebrow}
          avatarUrl={champion.avatarUrl}
        />
      );
    }
    return <ChampionStrip name="Result pending" score="—" eyebrow="🏆 CHAMPION" />;
  }

  // Upcoming
  if (defendingChamp) {
    return (
      <ChampionStrip
        name={defendingChamp.name}
        country={defendingChamp.country}
        score={defendingChamp.score}
        scoreLabel={defendingChamp.year}
        eyebrow="🏆 DEFENDING"
      />
    );
  }
  if (fallbackPreview) {
    return (
      <ChampionStrip
        name={fallbackPreview.body}
        score=""
        scoreLabel=""
        eyebrow={fallbackPreview.eyebrow}
      />
    );
  }
  return <ChampionStrip name="Tournament Preview" score="›" scoreLabel="" eyebrow="📍 PREVIEW" />;
}
