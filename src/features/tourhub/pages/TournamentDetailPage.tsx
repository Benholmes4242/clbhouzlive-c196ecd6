/**
 * TournamentDetailPage - Apple-grade Tournament Detail
 * Cinematic hero, premium tabs, integrated tee times and hole stats
 */

import { useState, useMemo, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { TourHubShell } from '../components/TourHubShell';
import { TournamentDetailTabs, type TournamentDetailTab } from '../components/TourHubTabs';
import { 
  useTourTournament, 
  useTourLeaderboard, 
  useTourTeeTimes, 
  useTourHoleStats 
} from '../hooks/useTourHubData';
import { usePlayerHeadshots } from '../hooks/usePlayerMedia';
import { useSingleCourseImage } from '../hooks/useCourseImageResolver';
import { EventWinnerCard } from '../components/EventWinnerCard';
import { EventMomentsList } from '../components/EventMomentsList';
import { cn } from '@/lib/utils';

// Import new premium components
import { 
  TournamentDetailHero, 
  TeeTimesTab, 
  HoleStatsTab,
  PremiumLeaderboardTab,
} from '../components/tournament-detail';
import { GlassCard } from '../components/premium';

// Valid tabs for deep linking
const VALID_TABS: TournamentDetailTab[] = ['overview', 'leaderboard', 'summary', 'tee-times', 'hole-stats'];

// Section header component
function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="th-caption-2 text-white/50 mb-3">{title}</h3>
  );
}

// Empty state for tabs
function TabEmptyState({ variant }: { variant: string }) {
  const config: Record<string, { title: string; message: string }> = {
    leaderboard: {
      title: 'Leaderboard Coming Soon',
      message: 'Leaderboard data will appear once the tournament begins.',
    },
    'tee-times': {
      title: 'Tee Times Coming Soon',
      message: 'Tee times will be posted closer to the tournament.',
    },
    summary: {
      title: 'Summary Coming Soon',
      message: 'Tournament summary will be available after completion.',
    },
    'hole-stats': {
      title: 'Hole Statistics Coming Soon',
      message: 'Hole-by-hole statistics will appear during play.',
    },
  };
  
  const c = config[variant] || config.leaderboard;
  
  return (
    <div className="py-16 text-center">
      <h3 className="th-title-2 text-white mb-1">{c.title}</h3>
      <p className="th-body-small text-white/50">{c.message}</p>
    </div>
  );
}

export function TournamentDetailPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Tab deep linking
  const initialTab = useMemo(() => {
    const tabParam = searchParams.get('tab') as TournamentDetailTab | null;
    return tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'overview';
  }, []);
  
  const [activeTab, setActiveTab] = useState<TournamentDetailTab>(initialTab);
  
  // Update URL when tab changes
  const handleTabChange = (tab: TournamentDetailTab) => {
    setActiveTab(tab);
    const newParams = new URLSearchParams(searchParams);
    if (tab === 'overview') {
      newParams.delete('tab');
    } else {
      newParams.set('tab', tab);
    }
    setSearchParams(newParams, { replace: true });
  };
  
  // Data hooks
  const { data: tournament, isLoading } = useTourTournament(tournamentId || '');
  const { data: leaderboard } = useTourLeaderboard(tournamentId || '');
  const { data: teeTimes } = useTourTeeTimes(tournamentId || '');
  const { data: holeStats } = useTourHoleStats(tournamentId || '');
  
  // Get course image for hero
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
  
  // Extract player IDs for batch headshot fetching
  const playerIds = useMemo(() => {
    if (!leaderboard) return [];
    return leaderboard
      .map((entry: any) => entry.player?.id)
      .filter(Boolean) as string[];
  }, [leaderboard]);
  
  const { data: headshotMap } = usePlayerHeadshots(playerIds);

  // Loading state
  if (isLoading) {
    return (
      <TourHubShell>
        <div className="min-h-screen bg-[hsl(var(--th-bg-canvas))] -mx-4">
          {/* Hero skeleton */}
          <div 
            className="animate-pulse bg-slate-800/50"
            style={{ height: '50vh', minHeight: '320px' }}
          />
          
          {/* Content skeleton */}
          <div className="px-4 pt-6 space-y-4">
            <div className="h-10 bg-slate-800/50 rounded-xl w-full" />
            <div className="h-64 bg-slate-800/50 rounded-xl" />
          </div>
        </div>
      </TourHubShell>
    );
  }
  
  if (!tournament) {
    return (
      <TourHubShell>
        <div className="min-h-screen bg-[hsl(var(--th-bg-canvas))] flex items-center justify-center">
          <TabEmptyState variant="leaderboard" />
        </div>
      </TourHubShell>
    );
  }

  const hasLeaderboard = leaderboard && leaderboard.length > 0;
  const hasTeeTimes = teeTimes && teeTimes.length > 0;
  const hasHoleStats = holeStats && holeStats.length > 0;
  const isCompleted = tournament.status === 'closed';
  
  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Event Winner (for completed tournaments) */}
            {isCompleted && tournamentId && (
              <EventWinnerCard tournamentId={tournamentId} />
            )}
            
            {/* Event Moments (for completed tournaments) */}
            {isCompleted && tournamentId && (
              <EventMomentsList tournamentId={tournamentId} limit={5} />
            )}
            
            {/* Course Info Card */}
            <GlassCard className="p-5">
              <SectionHeader title="COURSE" />
              <div className="flex items-start gap-4">
                {courseMatch?.imageUrl && (
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                    <img 
                      src={courseMatch.imageUrl} 
                      alt={tournament.venue_course_name || ''} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <p className="th-title-2 text-white mb-1">
                    {tournament.venue_course_name || tournament.venue_name}
                  </p>
                  <p className="th-body-small text-white/60">
                    {tournament.venue_city}{tournament.venue_state && `, ${tournament.venue_state}`}
                  </p>
                  <div className="flex items-center gap-4 mt-2 th-caption-1 text-white/50">
                    {tournament.venue_par && <span>Par {tournament.venue_par}</span>}
                    {tournament.venue_yardage && <span>{tournament.venue_yardage.toLocaleString()} yards</span>}
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Quick Leaderboard Preview (if available) */}
            {hasLeaderboard && (
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <SectionHeader title="LEADERBOARD" />
                  <button 
                    onClick={() => handleTabChange('leaderboard')}
                    className="text-xs text-white/50 hover:text-white/80 transition-colors"
                  >
                    View All →
                  </button>
                </div>
                
                <div className="space-y-2">
                  {leaderboard.slice(0, 5).map((entry: any, index: number) => {
                    const score = entry.score;
                    const scoreColor = score < 0 
                      ? 'text-[hsl(var(--th-accent-birdie))]' 
                      : score > 0 
                      ? 'text-[hsl(var(--th-accent-bogey))]' 
                      : 'text-white';
                    
                    return (
                      <div 
                        key={entry.id}
                        className="flex items-center gap-3 py-2"
                      >
                        <span className="w-6 th-body font-semibold text-white/50">
                          {entry.position_tied ? `T${entry.position}` : entry.position}
                        </span>
                        <span className="flex-1 th-body text-white truncate">
                          {entry.player?.full_name}
                        </span>
                        <span className={cn("th-body font-semibold font-mono", scoreColor)}>
                          {score === 0 ? 'E' : score > 0 ? `+${score}` : score}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            )}

            {/* Tournament Details */}
            <GlassCard className="p-5">
              <SectionHeader title="TOURNAMENT DETAILS" />
              <div className="grid grid-cols-2 gap-4">
                {tournament.purse && (
                  <div>
                    <p className="th-caption-1 text-white/40 mb-1">Purse</p>
                    <p className="th-body text-white">
                      ${tournament.purse.toLocaleString()}
                    </p>
                  </div>
                )}
                {tournament.defending_champion && (
                  <div>
                    <p className="th-caption-1 text-white/40 mb-1">Defending Champion</p>
                    <p className="th-body text-white">
                      {tournament.defending_champion}
                    </p>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        );
      
      case 'leaderboard':
        if (!hasLeaderboard) {
          return <TabEmptyState variant="leaderboard" />;
        }
        return (
          <PremiumLeaderboardTab 
            leaderboard={leaderboard} 
            headshotMap={headshotMap}
          />
        );
      
      case 'tee-times':
        if (!hasTeeTimes) {
          return <TabEmptyState variant="tee-times" />;
        }
        return (
          <TeeTimesTab 
            teeTimes={teeTimes} 
            tournamentName={tournament.name}
          />
        );
      
      case 'hole-stats':
        if (!hasHoleStats) {
          return <TabEmptyState variant="hole-stats" />;
        }
        return (
          <HoleStatsTab 
            holeStats={holeStats}
            courseName={tournament.venue_course_name || tournament.venue_name}
            coursePar={tournament.venue_par}
            courseYardage={tournament.venue_yardage}
          />
        );
      
      case 'summary':
        return <TabEmptyState variant="summary" />;
      
      default:
        return null;
    }
  };
  
  return (
    <TourHubShell>
      <div className="min-h-screen bg-[hsl(var(--th-bg-canvas))] -mx-4 pb-24">
        {/* Cinematic Hero */}
        <TournamentDetailHero
          tournament={tournament}
          courseImageUrl={courseMatch?.imageUrl}
        />

        {/* Tabs + Content */}
        <div className="px-4 pt-6">
          {/* Tab Bar */}
          <TournamentDetailTabs 
            activeTab={activeTab} 
            onTabChange={handleTabChange} 
            className="mb-6" 
          />
          
          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderTab()}
          </motion.div>
        </div>

        {/* Data source footer */}
        <div className="px-4 mt-12 pt-6 border-t border-white/10 flex items-center gap-2 th-caption-1 text-white/30">
          <Globe className="w-3.5 h-3.5" />
          <span>Powered by SportsRadar</span>
        </div>
      </div>
    </TourHubShell>
  );
}
