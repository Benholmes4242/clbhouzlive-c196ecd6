/**
 * MiddleBand — state-driven 40-62px band between photo and leaderboard.
 * §5 of HYBRID_HERO_IMPLEMENTATION_BRIEF + Patch 01 §3 + Polish Patch §4.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react';
import type { HeroState, TickerRow, TopTie } from '../HybridHero.utils';
import { Ticker } from './Ticker';
import { ChampionStrip, CancelledStrip, PlayoffStrip } from './ChampionStrip';
import { TeamWinnerStrip } from './TeamWinnerStrip';
import { FieldStrengthStrip } from './FieldStrengthStrip';
import { CourseStatsStrip } from './CourseStatsStrip';
import type { DefendingChampData } from '../../../hooks/useTournamentDefendingChamp';
import type { FieldStrength } from '../../../hooks/useTournamentFieldStrength';
import type { CourseStats } from '../../../hooks/useTournamentCourseStats';

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
  fieldStrength?: FieldStrength | null;
  courseStats?: CourseStats | null;
  cancelReason?: string;
  fallbackPreview?: { eyebrow: string; body: string };
  teamWinner?: TeamWinner | null;
  championRounds?: number[];
  par?: number;
  /** Pass 5.5: italic narrative line under the champion's name. */
  championNarrative?: string | null;
}


export function MiddleBand({
  state,
  top10,
  champion,
  tiedLeaders,
  defendingChamp,
  fieldStrength,
  courseStats,
  cancelReason,
  fallbackPreview,
  teamWinner,
  championRounds,
  par,
  championNarrative,
}: MiddleBandProps) {
  const { t } = useTranslation('tourhub');

  if (state.kind === 'live') {
    return <Ticker rows={top10 ?? []} />;
  }

  if (state.kind === 'results') {
    if (state.variant === 'cancelled') {
      return <CancelledStrip reason={cancelReason || t('overview.middleBand.cancelledDefault')} />;
    }
    if (state.variant === 'awaiting-playoff' && tiedLeaders) {
      return <PlayoffStrip count={tiedLeaders.count} score={tiedLeaders.score} />;
    }
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
      const eyebrow = state.variant === 'playoff' ? t('overview.champion.eyebrowPlayoff') : t('overview.champion.eyebrow');
      return (
        <ChampionStrip
          name={champion.name}
          country={champion.country}
          score={champion.score}
          eyebrow={eyebrow}
          avatarUrl={champion.avatarUrl}
          rounds={championRounds}
          par={par}
          narrative={championNarrative}
        />
      );
    }

    return <ChampionStrip name={t('overview.champion.resultPending')} score="—" eyebrow={t('overview.champion.eyebrow')} />;
  }

  // Upcoming — 4-level fallback chain (Polish Patch §4.5)
  // Level 1: Defending champion
  if (defendingChamp) {
    return (
      <ChampionStrip
        name={defendingChamp.name}
        country={defendingChamp.country}
        score={defendingChamp.score}
        scoreLabel={defendingChamp.year}
        eyebrow={t('overview.upcoming.defendingEyebrow')}
      />
    );
  }
  // Level 2: Field strength
  if (fieldStrength && fieldStrength.totalPlayers > 0) {
    return (
      <FieldStrengthStrip
        totalPlayers={fieldStrength.totalPlayers}
        topRanked={fieldStrength.topRanked}
        headshots={fieldStrength.headshots}
      />
    );
  }
  // Level 3: Course stats
  if (courseStats && (courseStats.par || courseStats.yardage)) {
    return (
      <CourseStatsStrip
        par={courseStats.par}
        yardage={courseStats.yardage}
        courseRecord={courseStats.courseRecord}
        courseRecordHolder={courseStats.courseRecordHolder}
      />
    );
  }
  // Level 4: Generic preview
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
  {/* Score glyph '›' (rsaquo) is a typographic affordance, not translatable copy. */}
  {/* eslint-disable-next-line i18next/no-literal-string */}
  return <ChampionStrip name={t('overview.upcoming.previewTitle')} score="›" scoreLabel="" eyebrow={t('overview.upcoming.previewEyebrow')} eyebrowIcon={MapPin} />;
}
