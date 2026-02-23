/**
 * TournamentDetailPage - Editorial tournament detail experience
 */

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Trophy, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { TourHubShell } from '../components/TourHubShell';
import { useTourTournament, useTourLeaderboard } from '../hooks/useTourHubData';
import { useLeaderboardRealtime } from '../hooks/useLeaderboardRealtime';
import { useSingleCourseImage } from '../hooks/useCourseImageResolver';
import { getCourseImage } from '../utils/placeholders';
import { EventWinnerCard } from '../components/EventWinnerCard';
import { EventMomentsList } from '../components/EventMomentsList';

import {
  TournamentHero,
  LeaderboardCard,
  FullLeaderboard,
  CourseInfoCard,
  TournamentInfoGrid,
  TournamentDetailTabs,
  StatusBar,
  TeeTimesTab,
  HoleStatsTab,
  SummaryTab,
  type TournamentTab,
} from '../components/tournament-detail';
import { TournamentEmptyState } from '../components/tournament-detail/TournamentEmptyState';

const VALID_TABS: TournamentTab[] = ['overview', 'leaderboard', 'summary', 'tee-times', 'hole-stats'];
const SCROLL_KEY = 'tournament-detail-scroll';

export function TournamentDetailPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const initialTab = useMemo(() => {
    const tabParam = searchParams.get('tab') as TournamentTab | null;
    return tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'overview';
  }, []);
  
  const [activeTab, setActiveTab] = useState<TournamentTab>(initialTab);

  // TD-08: Scroll position restoration
  useEffect(() => {
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved) {
      requestAnimationFrame(() => window.scrollTo(0, parseInt(saved, 10)));
      sessionStorage.removeItem(SCROLL_KEY);
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  const saveScrollPosition = useCallback(() => {
    sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
  }, []);

  // TD-01: Pull-to-refresh
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const PULL_THRESHOLD = 50;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY <= 0) {
      touchStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) {
      setPullDistance(Math.min(delta, 100));
    }
  }, [isPulling]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(0);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] }),
        queryClient.invalidateQueries({ queryKey: ['tournament-leaderboard', tournamentId] }),
        queryClient.invalidateQueries({ queryKey: ['tournament-tee-times', tournamentId] }),
        queryClient.invalidateQueries({ queryKey: ['tournament-holes', tournamentId] }),
      ]);
      setIsRefreshing(false);
    } else {
      setPullDistance(0);
    }
    setIsPulling(false);
  }, [pullDistance, isRefreshing, queryClient, tournamentId]);
  
  const handleTabChange = (tab: TournamentTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'instant' });
    const newParams = new URLSearchParams(searchParams);
    if (tab === 'overview') {
      newParams.delete('tab');
    } else {
      newParams.set('tab', tab);
    }
    setSearchParams(newParams, { replace: true });
  };
  
  const { data: tournament, isLoading, refetch } = useTourTournament(tournamentId || '');
  const { data: leaderboard } = useTourLeaderboard(tournamentId || '');
  
  const isLive = tournament?.status === 'inprogress';
  const isCompleted = tournament?.status === 'closed';
  const isUpcoming = tournament?.status === 'scheduled' || tournament?.status === 'created';
  
  const { isConnected } = useLeaderboardRealtime(isLive ? tournamentId : null);
  
  const venueInput = useMemo(() => {
    if (!tournament) return null;
    return {
      venueName: tournament.venue_name || tournament.name,
      venueCourseName: tournament.venue_course_name,
      city: tournament.venue_city,
      country: tournament.venue_country,
    };
  }, [tournament]);
  
  const { courseImage: courseMatch } = useSingleCourseImage(venueInput);
  const heroImageUrl = courseMatch?.imageUrl || getCourseImage({ id: tournamentId || '' });
  
  const headshotMap = undefined; // R2 CDN handles headshots via PlayerAvatar

  const countdownText = useMemo(() => {
    if (!tournament || !isUpcoming) return undefined;
    try {
      return `Starts ${formatDistanceToNow(new Date(tournament.start_date), { addSuffix: true })}`;
    } catch {
      return undefined;
    }
  }, [tournament, isUpcoming]);

  const leader = useMemo(() => {
    if (!isLive || !leaderboard?.length) return null;
    const first = leaderboard[0] as any;
    const name = first?.player?.full_name;
    const score = first?.score;
    if (!name) return null;
    const scoreStr = score === 0 ? 'E' : score < 0 ? String(score) : score > 0 ? `+${score}` : null;
    return { name, score: scoreStr };
  }, [isLive, leaderboard]);

  // Derive winner from leaderboard for completed tournaments (fallback for EventWinnerCard)
  const leaderboardWinner = useMemo(() => {
    if (!isCompleted || !leaderboard?.length) return null;
    const first = leaderboard[0] as any;
    if (!first?.player) return null;
    return first;
  }, [isCompleted, leaderboard]);

  if (isLoading) {
    return (
      <TourHubShell immersive>
        <div className="animate-pulse">
          <div 
            style={{ 
              minHeight: 'calc(clamp(282px, 53vh, 422px) + max(var(--sat, env(safe-area-inset-top, 0px)), 47px))',
              background: 'linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--background)) 50%, hsl(var(--muted)) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
            }}
          />
          <div className="space-y-4 mt-6 px-4">
            <div className="h-12 bg-muted rounded-xl" />
            <div className="h-48 bg-muted rounded-2xl" />
            <div className="h-32 bg-muted rounded-2xl" />
          </div>
        </div>
      </TourHubShell>
    );
  }
  
  // TD-02: Error state with retry
  if (!tournament) {
    return (
      <TourHubShell>
        <div className="pt-6 px-4">
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">Couldn't load tournament</h3>
              <p className="text-sm text-muted-foreground">Tap to try again</p>
              <div className="flex flex-col items-center gap-3 pt-2">
                <button
                  onClick={() => refetch()}
                  className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-semibold active:scale-95 transition-transform"
                >
                  Retry
                </button>
                <a href="/tourhub?tab=schedule" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Back to Schedule
                </a>
              </div>
            </div>
          </div>
        </div>
      </TourHubShell>
    );
  }

  const hasLeaderboard = leaderboard && leaderboard.length > 0;
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Champion section for completed tournaments */}
            {isCompleted && tournamentId && <EventWinnerCard tournamentId={tournamentId} />}
            
            {/* Champion placeholder — only for non-completed tournaments */}
            {!isCompleted && (
              <motion.div
                className="py-6 border-t border-border"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex flex-col items-center text-center py-6 space-y-3">
                  <Trophy className="w-12 h-12 text-amber-500/60" />
                  <h3 className="text-base font-semibold text-foreground">Champion unlocking soon</h3>
                  <p className="text-xs text-muted-foreground max-w-[260px]">
                    Official results will appear once the event concludes
                  </p>
                </div>
              </motion.div>
            )}
            {isCompleted && tournamentId && <EventMomentsList tournamentId={tournamentId} limit={5} />}
            
            {hasLeaderboard && (
              <LeaderboardCard
                entries={leaderboard}
                headshotMap={headshotMap}
                onViewAll={() => handleTabChange('leaderboard')}
                limit={5}
              />
            )}
            
            <CourseInfoCard
              tournament={tournament}
              courseImage={courseMatch?.imageUrl}
              courseId={courseMatch?.golfCourseId}
            />
            
            <TournamentInfoGrid
              tournament={tournament}
              fieldSize={leaderboard?.length}
            />
          </motion.div>
        );
      
      case 'leaderboard':
        if (!hasLeaderboard) {
          return (
            <TournamentEmptyState
              icon={<Trophy className="w-16 h-16" />}
              title="Leaderboard Coming Soon"
              subtitle="Leaderboard data will appear once the tournament begins."
              countdown={countdownText}
            />
          );
        }
        return (
          <FullLeaderboard
            entries={leaderboard}
            headshotMap={headshotMap}
            tournamentStatus={tournament.status}
            tournamentTimezone={tournament.timezone}
            venuePar={tournament.venue_par}
            onPlayerTap={saveScrollPosition}
          />
        );
      
      case 'summary':
        return (
          <SummaryTab
            tournamentId={tournamentId || ''}
            tournamentSrId={tournament.sr_id}
            isLive={isLive}
            isCompleted={isCompleted}
            leaderboard={leaderboard}
            headshotMap={headshotMap}
          />
        );
      
      case 'tee-times':
        return (
          <TeeTimesTab
            tournamentId={tournamentId || ''}
            tournamentSrId={tournament.sr_id}
            isLive={isLive}
          />
        );
      
      case 'hole-stats':
        return (
          <HoleStatsTab
            tournamentId={tournamentId || ''}
            tournamentSrId={tournament.sr_id}
            isLive={isLive}
            isCompleted={isCompleted}
          />
        );
      
      default:
        return null;
    }
  };
  
  return (
    <TourHubShell immersive>
      {/* TD-01: Pull-to-refresh indicator */}
      <AnimatePresence>
        {(pullDistance > 0 || isRefreshing) && (
          <motion.div
            className="flex items-center justify-center py-3 bg-background z-50 relative"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <RefreshCw
              className={cn(
                "w-5 h-5 text-muted-foreground transition-transform",
                isRefreshing && "animate-spin"
              )}
              style={!isRefreshing ? { transform: `rotate(${(pullDistance / PULL_THRESHOLD) * 360}deg)` } : undefined}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <TournamentHero 
          tournament={tournament} 
          imageUrl={heroImageUrl}
        />
        
        <div className="px-4" style={{ paddingBottom: 'calc(var(--sab, 30px) + 16px)' }}>
          {/* Status bar */}
          <div className="pt-5">
            {isLive && (
              <StatusBar
                variant="live"
                lastUpdatedText={isConnected ? 'Live' : 'Reconnecting…'}
                isRefreshing={false}
                leaderName={leader?.name}
                leaderScore={leader?.score}
                className="mb-4"
              />
            )}
            {isCompleted && (
              <StatusBar variant="final" className="mb-4" />
            )}
            {isUpcoming && (
              <StatusBar variant="upcoming" countdownText={countdownText} className="mb-4" />
            )}
          </div>

          {/* Canonical back link */}
          <button
            onClick={() => navigate(-1)}
            className="text-muted-foreground active:opacity-70 transition-opacity"
            style={{ fontSize: 13, fontWeight: 500, padding: '12px 0 4px 0' }}
          >
            ← Back
          </button>
          
          {/* TD-05: Tabs with role="tablist" */}
          <TournamentDetailTabs 
            activeTab={activeTab} 
            onTabChange={handleTabChange}
            tournamentStatus={tournament.status}
          />
          
          {/* Tab Content with role="tabpanel" */}
          <AnimatePresence mode="wait">
            <div key={activeTab} className="pt-4" role="tabpanel" aria-label={`${activeTab} content`}>
              {renderTabContent()}
            </div>
          </AnimatePresence>
        </div>
      </div>
    </TourHubShell>
  );
}
