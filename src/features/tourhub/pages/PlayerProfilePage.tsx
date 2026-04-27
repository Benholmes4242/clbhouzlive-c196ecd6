/**
 * PlayerProfilePage - Dispatch-style player profile.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, AlertCircle, RefreshCw, ChevronLeft } from 'lucide-react';
// NOTE: ArrowLeft remains used in the error branch (L144). P3 (orphan import) is
// out of scope this loop and remains in the resume queue.
import { useQueryClient } from '@tanstack/react-query';
import { PageRoot } from '@/components/layout/PageRoot';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import {
  PlayerHero,
  PlayerSeasonStats,
  PlayerTournamentHistory,
  PlayerInfoCard,
  FormSection,
} from '../components/player';
import { useTourPlayer, useSinglePlayerStatistics } from '../hooks/useTourHubData';
import { getPlayerReferrerLabel, type PlayerReferrer } from '../routes';

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const PULL_THRESHOLD = 50;
// STAT_TABS moved into PlayerSeasonStats (Fix 1 — segmented control now lives inside the card).

export function PlayerProfilePage() {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { hideHeader, showHeader } = useHeader();

  useMedianStatusBar("dark", "transparent", true, false);

  const { data: player, isLoading: playerLoading, refetch } = useTourPlayer(playerId || '');
  const { data: playerStats } = useSinglePlayerStatistics(playerId);

  const [activeStatTab, setActiveStatTab] = useState<StatTab>('Overview');

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
        queryClient.invalidateQueries({ queryKey: ['player-rating', playerId] }),
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
    };
  }, [hideHeader, showHeader]);

  const referrer = (location.state as { referrer?: PlayerReferrer } | null)?.referrer;
  const backLabel = getPlayerReferrerLabel(referrer);

  const handleBack = () => {
    if (location.key !== 'default') {
      navigate(-1);
    } else {
      navigate('/tourhub?tab=players');
    }
  };

  if (playerLoading) {
    return (
      <PageRoot className="min-h-screen w-full" hasBottomNav immersive immersiveStatusBar>
        <div style={{ background: '#0F172A', padding: 'calc(16px + env(safe-area-inset-top, 0px)) 16px 0' }}>
          <Skeleton className="h-3 w-32 mb-3" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <Skeleton className="h-6 w-48 mb-2" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <Skeleton className="h-4 w-32" style={{ background: 'rgba(255,255,255,0.1)' }} />
            </div>
            <Skeleton className="w-[110px] h-[130px] rounded-t-[14px]" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '0.5px solid rgba(255,255,255,0.08)', marginTop: 8 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ padding: '10px 0 12px', textAlign: 'center' }}>
                <Skeleton className="h-2 w-8 mx-auto mb-2" style={{ background: 'rgba(255,255,255,0.1)' }} />
                <Skeleton className="h-4 w-10 mx-auto" style={{ background: 'rgba(255,255,255,0.1)' }} />
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '16px', marginTop: 8 }}>
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-64 rounded-lg mt-4" />
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
          <div className="text-center py-20 flex flex-col items-center gap-3">
            <AlertCircle className="w-10 h-10 text-muted-foreground" />
            <p className="text-muted-foreground text-lg font-medium">Couldn't load player data</p>
            <p className="text-sm text-muted-foreground">Tap to try again</p>
            <button
              onClick={() => refetch()}
              className="mt-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium active:opacity-70 transition-opacity"
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
      className="min-h-screen w-full"
      hasBottomNav
      immersive
      immersiveStatusBar
      style={{ background: '#F8FAFC' }}
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

        {/* Sticky header — underline tab bar */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 20,
            background: 'rgba(248,250,252,0.97)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '0.5px solid rgba(15,23,42,0.08)',
            paddingTop: 0,
          }}
        >
          {/* Back link */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '8px 20px 0' }}>
            <button
              onClick={handleBack}
              style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '13px', fontWeight: 500, color: 'rgba(15,23,42,0.5)', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
              className="active:opacity-50 transition-opacity"
            >
              <ChevronLeft size={13} strokeWidth={2.5} />
              {backLabel}
            </button>
          </div>

          {/* Underline tab bar — flex:1 equal-width */}
          <div style={{ display: 'flex', borderBottom: '0.5px solid rgba(15,23,42,0.07)', marginTop: '6px' }}>
            {STAT_TABS.map((tab) => {
              const isActive = activeStatTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveStatTab(tab)}
                  className="active:opacity-70 transition-opacity"
                  style={{
                    flex: 1,
                    padding: '10px 4px 9px',
                    fontSize: '13px',
                    fontWeight: isActive ? 800 : 500,
                    color: isActive ? '#0F172A' : '#94A3B8',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: isActive ? '2px solid #F7931E' : '2px solid transparent',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap' as const,
                    textAlign: 'center' as const,
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form section — three-branch render (Heating up / In form / Steady / Out of form). */}
        {playerId && <FormSection playerId={playerId} />}

        {/* Content sections */}
        <div style={{ paddingBottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 80px)' }}>
          {/* Season Performance */}
          <motion.div
            style={{ marginTop: 8 }}
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4 }}
          >
            {playerStats ? (
              <PlayerSeasonStats playerStats={playerStats} activeTab={activeStatTab} />
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

          {/* Skill Build — REMOVED in Phase 1 (D8). Metrics now covered by the four stats tabs. */}

          {/* Recent Tournaments */}
          {playerId && (
            <motion.div
              style={{ marginTop: 8 }}
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
            style={{ marginTop: 8 }}
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <PlayerInfoCard player={player} />
          </motion.div>

          {/* Bottom spacer */}
          <div style={{ marginTop: 8 }} />
        </div>
      </div>
    </PageRoot>
  );
}
