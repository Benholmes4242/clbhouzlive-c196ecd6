/**
 * TournamentDetailPage - Editorial tournament detail experience
 */

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useBottomNavigation } from '@/contexts/BottomNavigationContext';

import { useParams, useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Trophy, RefreshCw, AlertCircle, ChevronLeft } from 'lucide-react';
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
import { getReferrerLabel, type TournamentReferrer } from '../routes';

import {
  TournamentHero,
  LeaderboardCard,
  FullLeaderboard,
  CourseInfoCard,
  TournamentInfoGrid,
  TeeTimesTab,
  HoleStatsTab,
  SummaryTab,
  LiveOverviewTab,
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
  const location = useLocation();
  const referrer = (location.state as { referrer?: TournamentReferrer } | null)?.referrer;
  const backLabel = getReferrerLabel(referrer);

  const [activeTab, setActiveTab] = useState<TournamentTab>(() => {
    const tabParam = searchParams.get('tab') as TournamentTab | null;
    if (tabParam && VALID_TABS.includes(tabParam)) return tabParam;
    return 'overview';
  });

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
  
  useLeaderboardRealtime(isLive ? tournamentId : null);
  
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
  
  const headshotMap = undefined;

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
      <TourHubShell>
        {/* Slate masthead skeleton */}
        <div style={{ background: '#0F172A', padding: 'calc(16px + env(safe-area-inset-top, 0px)) 16px 0' }} className="animate-pulse">
          <div style={{ height: '8px', width: '140px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', marginBottom: '10px' }} />
          <div style={{ height: '22px', width: '70%', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', marginBottom: '10px' }} />
          <div style={{ height: '120px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px 10px 0 0' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ padding: '9px 4px 11px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '4px' }}>
                <div style={{ height: '8px', width: '40px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px' }} />
                <div style={{ height: '13px', width: '50px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px' }} />
              </div>
            ))}
          </div>
        </div>
        {/* Tab bar skeleton */}
        <div style={{ background: 'rgba(248,250,252,0.97)', padding: '10px 16px 8px', display: 'flex', gap: '8px' }} className="animate-pulse">
          {['Overview','Leaderboard','Tee Times','Holes'].map(tab => (
            <div key={tab} style={{ height: '11px', width: `${tab.length * 7}px`, background: 'rgba(15,23,42,0.06)', borderRadius: '4px' }} />
          ))}
        </div>
        {/* Content row skeletons */}
        <div style={{ background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)', borderBottom: '1px solid rgba(15,23,42,0.07)', marginTop: '8px' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 20px', borderBottom: i < 4 ? '0.5px solid rgba(15,23,42,0.07)' : 'none' }}>
              <div style={{ width: '36px', height: '13px', background: 'rgba(15,23,42,0.06)', borderRadius: '4px' }} />
              <div style={{ width: '28px', height: '28px', borderRadius: '34%', background: 'rgba(15,23,42,0.06)' }} />
              <div style={{ flex: 1, height: '13px', background: 'rgba(15,23,42,0.06)', borderRadius: '4px' }} />
              <div style={{ width: '44px', height: '13px', background: 'rgba(15,23,42,0.06)', borderRadius: '4px' }} />
            </div>
          ))}
        </div>
      </TourHubShell>
    );
  }
  
  if (!tournament) {
    return (
      <TourHubShell>
        <div className="pt-6 px-5">
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
        if (isLive) {
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <LiveOverviewTab
                tournament={tournament}
                leaderboard={leaderboard}
                courseImage={courseMatch?.imageUrl}
                courseId={courseMatch?.golfCourseId}
                onViewLeaderboard={() => handleTabChange('leaderboard')}
              />
            </motion.div>
          );
        }
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {isCompleted && tournamentId && <EventWinnerCard tournamentId={tournamentId} />}
            {isCompleted && tournamentId && <EventMomentsList tournamentId={tournamentId} limit={5} />}
            
            {hasLeaderboard && (
              <LeaderboardCard
                entries={leaderboard}
                headshotMap={headshotMap}
                onViewAll={() => handleTabChange('leaderboard')}
                limit={5}
                tournamentName={tournament.name}
              />
            )}
            
            <CourseInfoCard
              tournament={tournament}
              courseImage={courseMatch?.imageUrl}
              courseId={courseMatch?.golfCourseId}
            />
            
            <TournamentInfoGrid
              tournament={tournament}
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
            tournamentName={tournament.name}
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
              tournamentName={tournament.name}
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
            tournamentName={tournament.name}
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
      {/* Pull-to-refresh indicator */}
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
          leader={leader}
          leaderboard={leaderboard ?? null}
        />

        {/* STICKY HEADER — ← Back | underline tabs */}
        <div
          className="sticky top-0 z-20"
          style={{
            background: 'rgba(248,250,252,0.97)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '0.5px solid rgba(15,23,42,0.08)',
            paddingTop: 0,
          }}
        >
          {/* Back link */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '7px 20px 0', gap: '4px' }}>
            <button
              onClick={() => { if (window.history.length > 1) navigate(-1); else navigate('/tourhub?tab=schedule'); }}
              style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '13px', fontWeight: 500, color: 'rgba(15,23,42,0.5)', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
              className="active:opacity-50 transition-opacity"
            >
              <ChevronLeft size={13} strokeWidth={2.5} />
              {backLabel}
            </button>
          </div>

          {/* Underline tab bar — flex:1 equal-width */}
          <div
            style={{ display: 'flex', borderBottom: '0.5px solid rgba(15,23,42,0.07)', marginTop: '6px' }}
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
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live leader is now rendered as a hero pill (see TournamentHero buildPills).
            The legacy floating "LIVE • leader" block was removed in Phase 1 to
            avoid duplication with the hero narrative pills. */}

        <div style={{ paddingBottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 80px)' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              role="tabpanel"
              aria-label={`${activeTab} content`}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </TourHubShell>
  );
}
