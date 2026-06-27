/**
 * TournamentDetailPage - Editorial tournament detail experience
 */

import { useState, useMemo, useEffect } from 'react';
import { useBottomNavigation } from '@/contexts/BottomNavigationContext';

import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Trophy, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TourHubShell } from '../components/TourHubShell';
import { ShellSlot } from '@/components/header/ShellSlot';
import { TournamentTabsShellRow } from '../components/shell/TournamentTabsShellRow';
import { useTourTournament, useTourLeaderboard } from '../hooks/useTourHubData';
import { useLeaderboardRealtime } from '../hooks/useLeaderboardRealtime';
import { useSingleCourseImage } from '../hooks/useCourseImageResolver';
import { getCourseImage } from '../utils/placeholders';

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
  LiveOverviewTab,
  type TournamentTab,
} from '../components/tournament-detail';
import { EditorialEmpty } from '../components/tournament-detail/EditorialEmpty';
import { AMBER } from '../_shared/tokens';
import { INK_TINT_06, INK_TINT_07, SLATE_50, SURFACE } from '../_shared/tokens';

const VALID_TABS: TournamentTab[] = ['overview', 'leaderboard', 'summary', 'tee-times', 'hole-stats'];


export function TournamentDetailPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const { setVisible } = useBottomNavigation();
  useEffect(() => { setVisible(true); }, [setVisible]);
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<TournamentTab>(() => {
    const tabParam = searchParams.get('tab') as TournamentTab | null;
    if (tabParam && VALID_TABS.includes(tabParam)) return tabParam;
    return 'overview';
  });

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



  if (isLoading) {
    return (
      <TourHubShell>
        {/* Light masthead skeleton */}
        <div style={{ background: SLATE_50, padding: '16px 16px 0' }} className="animate-pulse">
          {/* Pills row */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 60 }}>
            <div style={{ height: 22, width: 88, background: INK_TINT_06, borderRadius: 6 }} />
            <div style={{ height: 22, width: 140, background: INK_TINT_06, borderRadius: 6 }} />
          </div>
          {/* h1 */}
          <div style={{ height: 22, width: '65%', background: INK_TINT_06, borderRadius: 4, marginBottom: 8 }} />
          {/* Subhead */}
          <div style={{ height: 13, width: '55%', background: INK_TINT_06, borderRadius: 4, marginBottom: 16 }} />
          {/* 3-col stat strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: `0.5px solid ${INK_TINT_06}` }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ padding: '9px 0 11px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ height: 8, width: 40, background: INK_TINT_06, borderRadius: 4 }} />
                <div style={{ height: 13, width: 50, background: INK_TINT_06, borderRadius: 4 }} />
              </div>
            ))}
          </div>
        </div>
        {/* Tab bar skeleton */}
        <div style={{ background: 'rgba(248,250,252,0.97)', padding: '10px 16px 8px', display: 'flex', gap: '8px' }} className="animate-pulse">
          {['Overview','Leaderboard','Tee Times','Holes'].map(tab => (
            <div key={tab} style={{ height: '11px', width: `${tab.length * 7}px`, background: INK_TINT_06, borderRadius: '4px' }} />
          ))}
        </div>
        {/* Content row skeletons */}
        <div style={{ background: SURFACE, borderTop: `1px solid ${INK_TINT_07}`, borderBottom: `1px solid ${INK_TINT_07}`, marginTop: '8px' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 20px', borderBottom: i < 4 ? `0.5px solid ${INK_TINT_07}` : 'none' }}>
              <div style={{ width: '36px', height: '13px', background: INK_TINT_06, borderRadius: '4px' }} />
              <div style={{ width: '28px', height: '28px', borderRadius: '34%', background: INK_TINT_06 }} />
              <div style={{ flex: 1, height: '13px', background: INK_TINT_06, borderRadius: '4px' }} />
              <div style={{ width: '44px', height: '13px', background: INK_TINT_06, borderRadius: '4px' }} />
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
            <EditorialEmpty
              icon={<Trophy size={28} strokeWidth={1.8} color={AMBER} />}
              eyebrow="Leaderboard"
              title="The board lights up when play begins"
              body="Live positions, scores, and movement appear here the moment the first group tees off."
            />
          );
        }
        return (
          <FullLeaderboard
            entries={leaderboard}
            headshotMap={headshotMap}
            tournamentId={tournamentId}
            tournamentStatus={tournament.status}
            tournamentTimezone={tournament.timezone}
            tournamentName={tournament.name}
            venuePar={tournament.venue_par}
            currentRound={(tournament as any).current_round ?? null}
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
            courseId={courseMatch?.golfCourseId}
            courseName={tournament.venue_course_name}
          />
        );
      
      default:
        return null;
    }
  };

  const tabContent = (
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
  );
  
  return (
    <TourHubShell>
      <ShellSlot>
      <TournamentTabsShellRow
          activeTab={activeTab}
          onChange={handleTabChange}
        />
      </ShellSlot>

      {fullBleedHero ? (
        <div style={{ minHeight: '100dvh', background: SLATE_50 }}>
          <TournamentHero
            tournament={tournament}
            leaderboard={leaderboard}
            isLive={isLive}
            isCompleted={isCompleted}
            isUpcoming={isUpcoming}
          />
          <div ref={heroSentinelRef} />
          {tabContent}
        </div>
      ) : (
        <div style={{ paddingTop: 'var(--chrome-total-h, 0px)', minHeight: '100dvh', background: SLATE_50 }}>
          <TournamentHero
            tournament={tournament}
            leaderboard={leaderboard}
            isLive={isLive}
            isCompleted={isCompleted}
            isUpcoming={isUpcoming}
          />
          {tabContent}
        </div>
      )}
    </TourHubShell>
  );
}
