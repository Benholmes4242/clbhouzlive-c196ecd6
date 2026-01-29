/**
 * TournamentDetailPage - Cinematic tournament detail experience
 * 
 * Features:
 * - Immersive full-bleed hero with Ken Burns
 * - Premium glassmorphic cards
 * - Animated tab navigation
 * - Apple-grade polish
 */

import { useState, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Globe, BarChart3, Clock, FileText, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TourHubShell } from '../components/TourHubShell';
import { useTourTournament, useTourLeaderboard } from '../hooks/useTourHubData';
import { usePlayerHeadshots } from '../hooks/usePlayerMedia';
import { useSingleCourseImage } from '../hooks/useCourseImageResolver';
import { getCourseImage } from '../utils/placeholders';
import { EventWinnerCard } from '../components/EventWinnerCard';
import { EventMomentsList } from '../components/EventMomentsList';

// Import new cinematic components
import {
  TournamentHero,
  LeaderboardCard,
  CourseInfoCard,
  TournamentInfoGrid,
  TournamentDetailTabs,
  type TournamentTab,
} from '../components/tournament-detail';

// Valid tabs for deep linking
const VALID_TABS: TournamentTab[] = ['overview', 'leaderboard', 'summary', 'tee-times', 'hole-stats'];

// Empty state component for tabs
function TabEmptyState({ variant }: { variant: 'leaderboard' | 'tee-times' | 'summary' | 'hole-stats' }) {
  const config: Record<string, { icon: typeof BarChart3; title: string; message: string }> = {
    leaderboard: {
      icon: BarChart3,
      title: 'Leaderboard Coming Soon',
      message: 'Leaderboard data will appear once the tournament begins.',
    },
    'tee-times': {
      icon: Clock,
      title: 'Tee Times Coming Soon',
      message: 'Tee times will be posted closer to the tournament.',
    },
    summary: {
      icon: FileText,
      title: 'Summary Coming Soon',
      message: 'Tournament summary will be available after completion.',
    },
    'hole-stats': {
      icon: Target,
      title: 'Hole Statistics Coming Soon',
      message: 'Hole-by-hole statistics will appear during play.',
    },
  };
  
  const c = config[variant] || config.leaderboard;
  const Icon = c.icon;
  
  return (
    <motion.div 
      className="flex items-center justify-center py-20"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center space-y-4">
        <div 
          className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(100, 116, 139, 0.1)' }}
        >
          <Icon className="w-8 h-8 text-slate-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-slate-900">{c.title}</h3>
          <p className="text-sm text-slate-500 max-w-[280px] mx-auto">
            {c.message}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function TournamentDetailPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Tab deep linking - read initial tab from URL
  const initialTab = useMemo(() => {
    const tabParam = searchParams.get('tab') as TournamentTab | null;
    return tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'overview';
  }, []);
  
  const [activeTab, setActiveTab] = useState<TournamentTab>(initialTab);
  
  // Update URL when tab changes
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
  
  // Get course image for hero background
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
  
  // Extract player IDs for batch headshot fetching
  const playerIds = useMemo(() => {
    if (!leaderboard) return [];
    return leaderboard
      .map((entry: any) => entry.player?.id)
      .filter(Boolean) as string[];
  }, [leaderboard]);
  
  const { data: headshotMap } = usePlayerHeadshots(playerIds);

  // Loading state with cinematic shimmer
  if (isLoading) {
    return (
      <TourHubShell>
        <div className="animate-pulse">
          {/* Hero skeleton */}
          <div 
            className="-mx-4 sm:-mx-6 lg:-mx-8"
            style={{ 
              marginTop: '-55px',
              height: 'calc(340px + 55px)',
              background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
            }}
          />
          
          {/* Content skeleton */}
          <div className="space-y-4 mt-6 px-4">
            <div className="h-12 bg-slate-100 rounded-xl" />
            <div className="h-48 bg-slate-100 rounded-2xl" />
            <div className="h-32 bg-slate-100 rounded-2xl" />
          </div>
        </div>
      </TourHubShell>
    );
  }
  
  if (!tournament) {
    return (
      <TourHubShell>
        <div className="pt-6 px-4">
          <Link 
            to="/tourhub?tab=schedule" 
            className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Schedule
          </Link>
          <TabEmptyState variant="leaderboard" />
        </div>
      </TourHubShell>
    );
  }

  const hasLeaderboard = leaderboard && leaderboard.length > 0;
  const isCompleted = tournament.status === 'closed';
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <motion.div 
            className="space-y-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Event Winner (for completed tournaments) */}
            {isCompleted && tournamentId && (
              <EventWinnerCard tournamentId={tournamentId} />
            )}
            
            {/* Event Moments (for completed tournaments) */}
            {isCompleted && tournamentId && (
              <EventMomentsList tournamentId={tournamentId} limit={5} />
            )}
            
            {/* Leaderboard Preview (if available) */}
            {hasLeaderboard && (
              <LeaderboardCard
                entries={leaderboard}
                headshotMap={headshotMap}
                onViewAll={() => handleTabChange('leaderboard')}
                limit={5}
              />
            )}
            
            {/* Course Info Card */}
            <CourseInfoCard
              tournament={tournament}
              courseImage={courseMatch?.imageUrl}
              courseId={courseMatch?.golfCourseId}
            />
            
            {/* Tournament Details Grid */}
            <TournamentInfoGrid
              tournament={tournament}
              fieldSize={leaderboard?.length}
            />
          </motion.div>
        );
      
      case 'leaderboard':
        if (!hasLeaderboard) {
          return <TabEmptyState variant="leaderboard" />;
        }
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <LeaderboardCard
              entries={leaderboard}
              headshotMap={headshotMap}
              showHeader={false}
            />
          </motion.div>
        );
      
      case 'summary':
        return <TabEmptyState variant="summary" />;
      case 'tee-times':
        return <TabEmptyState variant="tee-times" />;
      case 'hole-stats':
        return <TabEmptyState variant="hole-stats" />;
      default:
        return null;
    }
  };
  
  return (
    <TourHubShell>
      {/* Cinematic Hero - full bleed */}
      <TournamentHero 
        tournament={tournament} 
        imageUrl={heroImageUrl}
      />
      
      {/* Content area */}
      <div className="px-4 sm:px-6 lg:px-8 pb-24">
        {/* Back navigation */}
        <motion.div
          className="py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Link 
            to="/tourhub?tab=schedule" 
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Schedule
          </Link>
        </motion.div>
        
        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.3 }}
        >
          <TournamentDetailTabs 
            activeTab={activeTab} 
            onTabChange={handleTabChange}
            className="mb-6"
          />
        </motion.div>
        
        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <div key={activeTab}>
            {renderTabContent()}
          </div>
        </AnimatePresence>
        
        {/* Data source footer */}
        <motion.div 
          className="mt-12 pt-6 border-t border-slate-200/60 flex items-center gap-2 text-xs text-slate-400"
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
