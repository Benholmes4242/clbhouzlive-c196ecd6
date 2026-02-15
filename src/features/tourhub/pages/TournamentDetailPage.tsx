/**
 * TournamentDetailPage - Cinematic tournament detail experience
 * 
 * Features:
 * - Immersive full-bleed hero with Ken Burns + parallax
 * - Glass back button on hero
 * - Premium glassmorphic cards
 * - Animated tab navigation (sticky)
 * - Live/Final/Upcoming status bars
 * - Full leaderboard with round scores, search, filter
 * - Tee Times, Hole Stats, Summary tabs
 */

import { useState, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { TourHubShell } from '../components/TourHubShell';
import { useTourTournament, useTourLeaderboard } from '../hooks/useTourHubData';
import { useLeaderboardRealtime } from '../hooks/useLeaderboardRealtime';
import { usePlayerHeadshots } from '../hooks/usePlayerMedia';
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

const VALID_TABS: TournamentTab[] = ['overview', 'leaderboard', 'summary', 'tee-times', 'hole-stats'];

export function TournamentDetailPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const initialTab = useMemo(() => {
    const tabParam = searchParams.get('tab') as TournamentTab | null;
    return tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'overview';
  }, []);
  
  const [activeTab, setActiveTab] = useState<TournamentTab>(initialTab);
  
  const handleTabChange = (tab: TournamentTab) => {
    setActiveTab(tab);
    const newParams = new URLSearchParams(searchParams);
    if (tab === 'overview') {
      newParams.delete('tab');
    } else {
      newParams.set('tab', tab);
    }
    setSearchParams(newParams, { replace: true });
  };
  
  const { data: tournament, isLoading } = useTourTournament(tournamentId || '');
  const { data: leaderboard } = useTourLeaderboard(tournamentId || '');
  
  const isLive = tournament?.status === 'inprogress';
  const isCompleted = tournament?.status === 'closed';
  const isUpcoming = tournament?.status === 'scheduled' || tournament?.status === 'created';
  
  // Realtime subscription — replaces useTournamentLiveUpdates (no more per-user API calls)
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
  
  const playerIds = useMemo(() => {
    if (!leaderboard) return [];
    return leaderboard
      .map((entry: any) => entry.player?.id)
      .filter(Boolean) as string[];
  }, [leaderboard]);
  
  const { data: headshotMap } = usePlayerHeadshots(playerIds);

  // Countdown text for upcoming tournaments
  const countdownText = useMemo(() => {
    if (!tournament || !isUpcoming) return undefined;
    try {
      return `Starts ${formatDistanceToNow(new Date(tournament.start_date), { addSuffix: true })}`;
    } catch {
      return undefined;
    }
  }, [tournament, isUpcoming]);

  // Current leader info for live status bar
  const leader = useMemo(() => {
    if (!isLive || !leaderboard?.length) return null;
    const first = leaderboard[0] as any;
    const name = first?.player?.full_name;
    const score = first?.score;
    if (!name) return null;
    const scoreStr = score === 0 ? 'E' : score < 0 ? String(score) : score > 0 ? `+${score}` : null;
    return { name, score: scoreStr };
  }, [isLive, leaderboard]);

  // Loading state
  if (isLoading) {
    return (
      <TourHubShell immersive>
        <div className="animate-pulse">
          <div 
            className=""
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
  
  if (!tournament) {
    return (
      <TourHubShell>
        <div className="pt-6 px-4">
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Tournament Not Found</h3>
              <p className="text-sm text-muted-foreground">This tournament may not exist or has been removed.</p>
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
            className="space-y-section"
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
            <motion.div className="flex items-center justify-center py-20" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center">
                  <Globe className="w-8 h-8 text-muted-foreground/70" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Leaderboard Coming Soon</h3>
                <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">Leaderboard data will appear once the tournament begins.</p>
              </div>
            </motion.div>
          );
        }
        return (
          <FullLeaderboard
            entries={leaderboard}
            headshotMap={headshotMap}
            tournamentStatus={tournament.status}
            tournamentTimezone={tournament.timezone}
            venuePar={tournament.venue_par}
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
          />
        );
      
      default:
        return null;
    }
  };
  
  return (
    <TourHubShell immersive>
      <TournamentHero 
        tournament={tournament} 
        imageUrl={heroImageUrl}
      />
      
      <div className="px-4 sm:px-6 lg:px-8 pb-24">
        {/* Status bar — live, final, or upcoming */}
        <div className="pt-5">
          {isLive && (
            <StatusBar
              variant="live"
              lastUpdatedText={isConnected ? 'Live' : 'Reconnecting…'}
              isRefreshing={false}
              leaderName={leader?.name}
              leaderScore={leader?.score}
              className="mb-5"
            />
          )}
          {isCompleted && (
            <StatusBar variant="final" className="mb-5" />
          )}
          {isUpcoming && (
            <StatusBar variant="upcoming" countdownText={countdownText} className="mb-5" />
          )}
        </div>
        
        {/* Tabs */}
        <motion.div
          className="py-2.5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.3 }}
        >
          <TournamentDetailTabs 
            activeTab={activeTab} 
            onTabChange={handleTabChange}
            tournamentStatus={tournament.status}
          />
        </motion.div>
        
        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <div key={activeTab} className="pt-5">
            {renderTabContent()}
          </div>
        </AnimatePresence>
        
        {/* Data source footer */}
        <motion.div 
          className="mt-section pt-6 border-t border-border/40 flex items-center gap-2 text-[11px] text-muted-foreground/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Powered by SportsRadar</span>
        </motion.div>
      </div>
    </TourHubShell>
  );
}