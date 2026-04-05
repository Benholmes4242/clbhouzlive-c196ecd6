/**
 * TournamentDetailPage - Editorial tournament detail experience
 */

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useBottomNavigation } from '@/contexts/BottomNavigationContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Trophy, Clock, RefreshCw, AlertCircle, ChevronLeft } from 'lucide-react';
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
  TeeTimesTab,
  HoleStatsTab,
  SummaryTab,
  type TournamentTab,
} from '../components/tournament-detail';
import { TournamentEmptyState } from '../components/tournament-detail/TournamentEmptyState';

const VALID_TABS: TournamentTab[] = ['overview', 'leaderboard', 'summary', 'tee-times', 'hole-stats'];


export function TournamentDetailPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const { setVisible } = useBottomNavigation();
  useEffect(() => { setVisible(true); }, [setVisible]);
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<TournamentTab>(() => {
    const tabParam = searchParams.get('tab') as TournamentTab | null;
    if (tabParam && VALID_TABS.includes(tabParam)) return tabParam;
    return 'overview'; // Will be corrected once tournament data loads
  });

  // Scroll position handled by centralized ScrollRestoration component

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
    // Count how many players share position 1
    const tiedForLead = leaderboard.filter((e: any) => e.position === 1);
    const first = tiedForLead[0] as any;
    const score = first?.score;
    const scoreStr = score === 0 ? 'E' : score < 0 ? String(score) : score > 0 ? `+${score}` : null;
    
    if (tiedForLead.length > 1) {
      return { name: `${tiedForLead.length} tied for the lead`, score: scoreStr };
    }
    const name = first?.player?.full_name;
    if (!name) return null;
    return { name: `${name} leads`, score: scoreStr };
  }, [isLive, leaderboard]);

  // Redirect to 'summary' tab for completed tournaments if on 'overview'
  useEffect(() => {
    if (isCompleted && activeTab === 'overview') {
      setActiveTab('summary');
      const newParams = new URLSearchParams(searchParams);
      newParams.set('tab', 'summary');
      setSearchParams(newParams, { replace: true });
    }
  }, [isCompleted, activeTab, searchParams, setSearchParams]);

  if (isLoading) {
    return (
      <TourHubShell immersive>
        <Skeleton
          className="w-full"
          style={{
            minHeight: 'calc(35dvh + var(--sat, env(safe-area-inset-top, 0px)))',
          }}
        />
        <div className="space-y-4 mt-6 px-4">
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </TourHubShell>
    );
  }
  
  // TD-02: Error state with retry
  if (!tournament) {
    return (
      <TourHubShell immersive>
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
                <Link to="/tourhub?tab=schedule" className="text-sm text-muted-foreground active:opacity-70 transition-opacity">
                  Back to Schedule
                </Link>
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
            onPlayerTap={() => {}}
          />
        );
      
      case 'summary':
        return (
          <>
            <SummaryTab
              tournamentId={tournamentId || ''}
              tournamentSrId={tournament.sr_id}
              isLive={isLive}
              isCompleted={isCompleted}
              leaderboard={leaderboard}
              headshotMap={headshotMap}
            />
            {isCompleted && (
              <>
                <CourseInfoCard
                  tournament={tournament}
                  courseImage={courseMatch?.imageUrl}
                  courseId={courseMatch?.golfCourseId}
                />
                <TournamentInfoGrid
                  tournament={tournament}
                  fieldSize={leaderboard?.length}
                />
              </>
            )}
          </>
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

        {/* ══════════════════════════════════════════════
            STICKY HEADER — ← Back | status pill | tabs
            ══════════════════════════════════════════════ */}
        <div
          className="-mx-5 sticky top-0 z-20"
          style={{
            background: 'hsl(var(--background) / 0.96)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid hsl(var(--border) / 0.10)',
            paddingTop: 10,
            marginTop: 8,
          }}
        >
          {/* Row 1: ← Back | [spacer] | status pill */}
          <div className="flex items-center gap-2 px-5 pt-2">
            <button
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate('/tourhub?tab=schedule');
                }
              }}
              className="-ml-1 flex items-center gap-0.5 text-[12px] font-medium active:opacity-50 transition-opacity shrink-0"
              style={{ color: 'hsl(var(--muted-foreground) / 0.70)', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              <ChevronLeft size={13} strokeWidth={2.5} />
              Back
            </button>

            <div className="flex-1" />

            {/* Status pill — compact, right-aligned */}
            {isLive && (
              <div
                className="flex items-center gap-1.5 shrink-0 max-w-[220px]"
                style={{
                  background: 'rgba(34,197,94,0.08)',
                  border: '1px solid rgba(34,197,94,0.20)',
                  borderRadius: 99,
                  padding: '5px 10px',
                }}
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: 'rgb(34,197,94)' }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: 'rgb(34,197,94)' }} />
                </span>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'rgb(34,197,94)', flexShrink: 0 }}>
                  Live
                </span>
                {leader && (
                  <>
                    <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground) / 0.35)', flexShrink: 0 }}>·</span>
                    <span className="text-[12px] font-medium text-foreground truncate">
                      {leader.name}{leader.score ? ` at ${leader.score}` : ''}
                    </span>
                  </>
                )}
                {isConnected && (
                  <span className="text-[11px] text-muted-foreground/50 shrink-0 ml-1">Live</span>
                )}
              </div>
            )}

            {isUpcoming && (
              <div
                className="flex items-center gap-1.5 shrink-0"
                style={{
                  background: 'hsl(var(--accent-amber) / 0.08)',
                  border: '1px solid hsl(var(--accent-amber) / 0.20)',
                  borderRadius: 99,
                  padding: '5px 10px',
                }}
              >
                <Clock
                  className="w-[13px] h-[13px] shrink-0"
                  style={{ color: 'hsl(var(--accent-amber))' }}
                  strokeWidth={2.5}
                />
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'hsl(var(--accent-amber))', flexShrink: 0 }}>
                  Upcoming
                </span>
                {countdownText && (
                  <>
                    <span style={{ fontSize: 11, color: 'hsl(var(--accent-amber) / 0.35)', flexShrink: 0 }}>·</span>
                    <span style={{ fontSize: 12, color: 'hsl(var(--accent-amber) / 0.85)' }} className="truncate">
                      {countdownText}
                    </span>
                  </>
                )}
              </div>
            )}

            {isCompleted && (
              <div
                className="flex items-center gap-1.5 shrink-0"
                style={{
                  background: 'hsl(var(--muted) / 0.5)',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 99,
                  padding: '5px 10px',
                }}
              >
                <Trophy
                  className="w-[13px] h-[13px] shrink-0"
                  style={{ color: 'hsl(var(--accent-amber) / 0.80)' }}
                  strokeWidth={2.5}
                />
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'hsl(var(--foreground))', flexShrink: 0 }}>
                  Final
                </span>
                <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground) / 0.35)', flexShrink: 0 }}>·</span>
                <span className="text-[12px] text-muted-foreground">Official results</span>
              </div>
            )}
          </div>

          {/* Row 2: Tabs */}
          <div
            className="flex gap-1 overflow-x-auto scrollbar-hide px-5 pt-2 pb-2.5"
            role="tablist"
            aria-label="Tournament Sections"
          >
            {(isCompleted
              ? [
                  { value: 'summary' as TournamentTab, label: 'Summary' },
                  { value: 'leaderboard' as TournamentTab, label: 'Leaderboard' },
                  { value: 'tee-times' as TournamentTab, label: 'Tee Times' },
                  { value: 'hole-stats' as TournamentTab, label: 'Holes' },
                ]
              : [
                  { value: 'overview' as TournamentTab, label: 'Overview' },
                  { value: 'leaderboard' as TournamentTab, label: 'Leaderboard' },
                  { value: 'tee-times' as TournamentTab, label: 'Tee Times' },
                  { value: 'hole-stats' as TournamentTab, label: 'Holes' },
                ]
            ).map((tab) => {
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleTabChange(tab.value)}
                  className="flex-shrink-0 transition-all duration-200 active:scale-[0.97]"
                  style={{
                    height: 34,
                    padding: '0 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: isActive ? 600 : 500,
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isActive ? 'hsl(var(--foreground))' : 'transparent',
                    color: isActive ? '#fff' : 'hsl(var(--muted-foreground))',
                    border: isActive ? 'none' : '1.5px solid hsl(var(--border))',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-5" style={{ paddingBottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 80px)' }}>
          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <div key={activeTab} className="pt-5" role="tabpanel" aria-label={`${activeTab} content`}>
              {renderTabContent()}
            </div>
          </AnimatePresence>
        </div>
      </div>
    </TourHubShell>
  );
}
