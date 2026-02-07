/**
 * PlayerProfilePage - Slim orchestrator for player profile
 * 
 * Composes: PlayerHero, PlayerSeasonStats, PlayerSkillTreeCard,
 *           PlayerTournamentHistory, PlayerInfoCard
 */

import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Globe, TrendingUp } from 'lucide-react';
import { TourHubShell } from '../components/TourHubShell';
import { TourHubEmptyState } from '../components/TourHubEmptyState';
import {
  PlayerHero,
  PlayerSeasonStats,
  PlayerSkillTreeCard,
  PlayerTournamentHistory,
  PlayerInfoCard,
} from '../components/player';
import { useTourPlayer, useSinglePlayerStatistics } from '../hooks/useTourHubData';

export function PlayerProfilePage() {
  const { playerId } = useParams<{ playerId: string }>();

  const { data: player, isLoading: playerLoading } = useTourPlayer(playerId || '');
  const { data: playerStats } = useSinglePlayerStatistics(playerId);

  if (playerLoading) {
    return (
      <TourHubShell>
        <div className="pt-6 animate-pulse space-y-6">
          <div className="h-6 w-32 bg-muted rounded" />
          <div className="h-64 bg-muted rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-64 bg-muted rounded-xl" />
            <div className="h-64 bg-muted rounded-xl" />
          </div>
        </div>
      </TourHubShell>
    );
  }

  if (!player) {
    return (
      <TourHubShell>
        <div className="pt-6">
          <Link
            to="/tourhub?tab=players"
            className="text-primary hover:underline flex items-center gap-1 mb-6 text-sm active:opacity-70 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Players
          </Link>
          <TourHubEmptyState variant="players" />
        </div>
      </TourHubShell>
    );
  }

  return (
    <TourHubShell>
      <div className="pt-6 pb-24">
        {/* Back Link */}
        <Link
          to="/tourhub?tab=players"
          className="text-primary hover:underline flex items-center gap-1 mb-6 text-sm font-medium active:opacity-70 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Players
        </Link>

        {/* Hero */}
        <div className="mb-8">
          <PlayerHero player={player} playerStats={playerStats ?? null} />
        </div>

        {/* Body: 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Season Performance */}
            {playerStats ? (
              <PlayerSeasonStats playerStats={playerStats} />
            ) : (
              <div className="py-16 text-center bg-card rounded-xl border border-border/50">
                <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">Season Statistics Unavailable</p>
                <p className="text-sm text-muted-foreground mt-1">
                  No season statistics found for this player in the current season.
                </p>
                <p className="text-xs text-muted-foreground/60 mt-2">
                  Check their Recent Tournaments below for performance data.
                </p>
              </div>
            )}

            {/* Skill Build */}
            {playerId && <PlayerSkillTreeCard playerId={playerId} />}

            {/* Recent Tournaments */}
            {playerId && <PlayerTournamentHistory playerId={playerId} />}
          </div>

          {/* Right Column: Sidebar */}
          <div className="space-y-6">
            <PlayerInfoCard player={player} />

            {/* Data Source */}
            <div className="px-4 py-3 rounded-lg bg-muted/30 border border-border/30">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Globe className="w-3.5 h-3.5" />
                <span>Powered by SportsRadar</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TourHubShell>
  );
}
