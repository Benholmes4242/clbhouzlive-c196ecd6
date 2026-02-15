/**
 * PlayerProfilePage - Editorial player profile with full-bleed hero,
 * no card containers — content flows directly on page background.
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

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [playerId]);

  // Immersive mode
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
      <PageRoot className="min-h-screen w-full bg-background" immersive immersiveStatusBar>
        <div className="animate-pulse">
          <div className="h-[53vh] bg-muted" />
          <div className="border-t border-b border-border px-4 py-4 flex justify-between">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="text-center space-y-1">
                <div className="h-3 w-10 bg-muted rounded mx-auto" />
                <div className="h-5 w-8 bg-muted rounded mx-auto" />
              </div>
            ))}
          </div>
          <div className="px-4 mt-6 space-y-6">
            <div className="h-48 bg-muted/30 rounded" />
            <div className="h-64 bg-muted/30 rounded" />
          </div>
        </div>
      </PageRoot>
    );
  }

  if (!player) {
    return (
      <PageRoot className="min-h-screen w-full bg-background">
        <div className="pt-20 px-4">
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
    <PageRoot className="min-h-screen w-full bg-background" immersive immersiveStatusBar hasBottomNav>
      {/* Hero */}
      <PlayerHero player={player} playerStats={playerStats ?? null} />

      {/* Stats Strip — full width, no card */}
      <StatRibbon playerStats={playerStats ?? null} />

      {/* Recent Form — full width tinted strip */}
      {playerId && <PlayerRecentForm playerId={playerId} />}

      {/* Content sections — no cards, editorial flow */}
      <div className="w-full max-w-5xl mx-auto px-4 pb-8">
        {/* Section dividers via border-t on each section wrapper */}

        {/* Season Performance */}
        <motion.div
          className="py-6 border-t border-border"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.4 }}
        >
          {playerStats ? (
            <PlayerSeasonStats playerStats={playerStats} />
          ) : (
            <div className="py-16 text-center">
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
            className="py-6 border-t border-border"
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
            className="py-6 border-t border-border"
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
          className="py-6 border-t border-border"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <PlayerInfoCard player={player} />
        </motion.div>

        {/* Footer */}
        <div className="py-8 text-center border-t border-border">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/30">
            <Globe className="w-3.5 h-3.5" />
            <span>Powered by SportsRadar</span>
          </div>
        </div>
      </div>
    </PageRoot>
  );
}
