/**
 * PlayerProfilePage - Immersive player profile with full-bleed hero,
 * stat ribbon, and magazine-quality sections.
 */

import { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Globe, TrendingUp } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import {
  PlayerHero,
  PlayerSeasonStats,
  PlayerSkillTreeCard,
  PlayerTournamentHistory,
  PlayerInfoCard,
} from '../components/player';
import { StatRibbon } from '../components/player/StatRibbon';
import { PlayerRecentForm } from '../components/player/PlayerRecentForm';
import { useTourPlayer, useSinglePlayerStatistics } from '../hooks/useTourHubData';

// Section entrance animation wrapper
const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export function PlayerProfilePage() {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { setVariant, hideHeader, showHeader } = useHeader();

  const { data: player, isLoading: playerLoading } = useTourPlayer(playerId || '');
  const { data: playerStats } = useSinglePlayerStatistics(playerId);

  // Immersive mode: hide header, go transparent
  useEffect(() => {
    hideHeader();
    return () => {
      showHeader();
      setVariant('solid-light');
    };
  }, [hideHeader, showHeader, setVariant]);

  const handleBack = () => {
    if (location.key !== 'default') {
      navigate(-1);
    } else {
      navigate('/tourhub?tab=players');
    }
  };

  if (playerLoading) {
    return (
      <PageRoot className="min-h-screen w-full bg-background" immersive>
        <div className="animate-pulse">
          <div className="h-[60vh] bg-muted" />
          <div className="px-5 mt-4 space-y-6">
            <div className="h-20 bg-muted rounded-2xl" />
            <div className="h-64 bg-muted rounded-xl" />
          </div>
        </div>
      </PageRoot>
    );
  }

  if (!player) {
    return (
      <PageRoot className="min-h-screen w-full bg-background">
        <div className="pt-20 px-5">
          <button
            onClick={handleBack}
            className="text-primary hover:underline flex items-center gap-1 mb-6 text-sm active:opacity-70 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Players
          </button>
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg font-medium">Player not found</p>
          </div>
        </div>
      </PageRoot>
    );
  }

  return (
    <PageRoot className="min-h-screen w-full bg-background" immersive hasBottomNav>
      {/* Hero — Full bleed, no max-width */}
      <PlayerHero player={player} playerStats={playerStats ?? null} />

      {/* Stat Ribbon — overlaps hero */}
      <StatRibbon playerStats={playerStats ?? null} />

      {/* Recent Form indicator */}
      {playerId && <PlayerRecentForm playerId={playerId} />}

      {/* Content sections — constrained width */}
      <div className="w-full max-w-5xl mx-auto px-4 pb-8 mt-6 space-y-section">
        {/* Season Performance */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.4 }}
        >
          {playerStats ? (
            <PlayerSeasonStats playerStats={playerStats} />
          ) : (
            <div className="py-16 text-center rounded-2xl border border-border/40 bg-card shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">Season Statistics Unavailable</p>
              <p className="text-sm text-muted-foreground mt-1">
                No season statistics found for this player.
              </p>
            </div>
          )}
        </motion.div>

        {/* Skill Build */}
        {playerId && (
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <PlayerSkillTreeCard playerId={playerId} />
          </motion.div>
        )}

        {/* Recent Tournaments */}
        {playerId && (
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <PlayerTournamentHistory playerId={playerId} />
          </motion.div>
        )}

        {/* Player Info */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <PlayerInfoCard player={player} />
        </motion.div>

        {/* Data Source Attribution */}
        <div className="py-3 rounded-lg bg-muted/20 border border-border/30">
          <div className="flex items-center gap-2 px-4 text-[11px] text-muted-foreground/50">
            <Globe className="w-3.5 h-3.5" />
            <span>Powered by SportsRadar</span>
          </div>
        </div>
      </div>
    </PageRoot>
  );
}