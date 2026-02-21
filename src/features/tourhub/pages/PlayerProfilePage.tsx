/**
 * PlayerProfilePage - Editorial player profile with full-bleed hero,
 * no card containers — content flows directly on page background.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Globe, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { PageRoot } from '@/components/layout/PageRoot';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
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

const PULL_THRESHOLD = 50;

export function PlayerProfilePage() {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { setVariant, hideHeader, showHeader } = useHeader();

  // Transparent status bar for immersive hero bleed into safe area
  useMedianStatusBar("dark", "transparent", true, false);

  const { data: player, isLoading: playerLoading, refetch } = useTourPlayer(playerId || '');
  const { data: playerStats } = useSinglePlayerStatistics(playerId);

  // Pull-to-refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === 0 || isRefreshing) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(delta * 0.5, 100));
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['player', playerId] }),
        queryClient.invalidateQueries({ queryKey: ['player-stats', playerId] }),
        queryClient.invalidateQueries({ queryKey: ['player-results', playerId] }),
        queryClient.invalidateQueries({ queryKey: ['world-rankings', playerId] }),
      ]);
      setIsRefreshing(false);
    }
    setPullDistance(0);
    touchStartY.current = 0;
  }, [pullDistance, isRefreshing, queryClient, playerId]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [playerId]);

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
          <div style={{ height: 'clamp(380px, 55dvh, 550px)' }} className="bg-muted" />
          <div className="bg-card" style={{ padding: '14px 4px', borderBottom: '1px solid hsl(var(--border) / 0.1)' }}>
            <div className="flex justify-between px-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="text-center space-y-1">
                  <div className="h-3 w-10 bg-muted rounded mx-auto" />
                  <div className="h-5 w-8 bg-muted rounded mx-auto" />
                </div>
              ))}
            </div>
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
          <div className="text-center py-20 flex flex-col items-center gap-3">
            <AlertCircle className="w-10 h-10 text-muted-foreground" />
            <p className="text-muted-foreground text-lg font-medium">Couldn't load player data</p>
            <p className="text-sm text-muted-foreground">Tap to try again</p>
            <button
              onClick={() => refetch()}
              className="mt-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium active:opacity-70 transition-opacity"
            >
              Retry
            </button>
          </div>
        </div>
      </PageRoot>
    );
  }

  const pullProgress = Math.min(pullDistance / PULL_THRESHOLD, 1);

  return (
    <PageRoot
      className="min-h-screen w-full bg-background"
      immersive
      immersiveStatusBar
      hasBottomNav
    >
      {/* Pull-to-refresh indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="absolute left-0 right-0 flex items-center justify-center z-50"
          style={{ top: 0, height: pullDistance || PULL_THRESHOLD }}
        >
          <motion.div
            className="w-10 h-10 rounded-full bg-background shadow-md border border-border flex items-center justify-center"
            animate={isRefreshing ? { rotate: 360 } : { rotate: pullProgress * 360 }}
            transition={isRefreshing ? { repeat: Infinity, duration: 0.8, ease: 'linear' } : { duration: 0 }}
            style={{ opacity: Math.min(pullProgress * 1.5, 1) }}
          >
            <RefreshCw className="w-5 h-5 text-primary" />
          </motion.div>
        </div>
      )}

      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: !pullDistance && !isRefreshing ? 'transform 0.2s ease-out' : 'none',
        }}
      >
        {/* Hero */}
        <PlayerHero player={player} playerStats={playerStats ?? null} />

        {/* Stats Strip — flush below hero */}
        <StatRibbon playerStats={playerStats ?? null} />

        {/* Momentum Strip — flush, 0 gap from stats */}
        {playerId && <PlayerRecentForm playerId={playerId} />}

        {/* Content sections */}
        <div className="w-full max-w-5xl mx-auto px-4" style={{ paddingBottom: 'calc(var(--sab, 30px) + 16px)' }}>
          {/* Season Performance — 24px from momentum strip */}
          <motion.div
            style={{ marginTop: '24px' }}
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

          {/* Skill Build — 28px gap */}
          {playerId && (
            <motion.div
              style={{ marginTop: '28px' }}
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <PlayerSkillTreeCard playerId={playerId} />
            </motion.div>
          )}

          {/* Recent Tournaments — 28px gap */}
          {playerId && (
            <motion.div
              style={{ marginTop: '28px' }}
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <PlayerTournamentHistory playerId={playerId} />
            </motion.div>
          )}

          {/* Player Info — 28px gap */}
          <motion.div
            style={{ marginTop: '28px' }}
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <PlayerInfoCard player={player} />
          </motion.div>

          {/* Footer */}
          <div style={{ marginTop: '24px' }}>
            <div className="flex items-center justify-center gap-2">
              <Globe className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground) / 0.2)' }} />
              <span style={{ fontSize: '11px', fontWeight: 400, color: 'hsl(var(--muted-foreground) / 0.3)' }}>
                Powered by SportsRadar
              </span>
            </div>
          </div>
        </div>
      </div>
    </PageRoot>
  );
}
