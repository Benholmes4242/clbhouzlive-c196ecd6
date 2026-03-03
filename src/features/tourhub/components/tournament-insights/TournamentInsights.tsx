/**
 * TournamentInsights - Main container with tab-based rendering
 * Phases: Pre-tournament, In-progress (Live), Completed (Results)
 * Tab priority: Live > Next Up > Results
 */

import React, { memo, useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { useTournamentInsights } from './hooks/useTournamentInsights';
import { TournamentHeroCard } from './TournamentHeroCard';
import { CourseDNACard } from './CourseDNACard';
import { ClubhouseIntelligence } from './ClubhouseIntelligence';
import { LikelyWinnersCarousel } from './LikelyWinnersCarousel';
import { PredictionLeaderboard } from './PredictionLeaderboard';
import { LiveUpcomingToggle } from './LiveUpcomingToggle';
import { BestPickSpotlight } from './BestPickSpotlight';
import { StaleBadge } from './StaleBadge';
import IntelligenceTabSwitcher from './components/IntelligenceTabSwitcher';

type IntelligenceTab = 'courseDNA' | 'predictions';

const GeneratingPredictionsSkeleton: React.FC<{ label?: string }> = ({ label = 'Generating AI predictions…' }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex flex-col items-center gap-3 py-10 px-4"
  >
    <div className="space-y-2 w-full animate-pulse">
      <div className="h-24 bg-black/[0.04] rounded-2xl" />
      <div className="h-16 bg-black/[0.04] rounded-2xl" />
      <div className="h-16 bg-black/[0.04] rounded-2xl" />
    </div>
    <p className="text-xs text-muted-foreground font-medium mt-1">{label}</p>
  </motion.div>
);

const TournamentInsightsSkeleton = () => (
  <div className="space-y-4 animate-pulse px-4">
    <div className="h-52 bg-black/[0.04] rounded-2xl" />
    <div className="h-8 bg-black/[0.04] rounded-lg w-3/4" />
    <div className="h-40 bg-black/[0.04] rounded-2xl" />
  </div>
);

export const TournamentInsights = memo(function TournamentInsights() {
  const {
    data,
    isLoading,
    error,
    tournamentPhase,
    tracker,
    trackerLoading,
    nextTournament,
    nextTournamentInsights,
    nextTournamentPreview,
    nextTournamentPredictionsLoading,
    hasUpcoming,
    isStale,
  } = useTournamentInsights();

  const isLive = tournamentPhase === 'in-progress';
  const isCompleted = tournamentPhase === 'completed';

  // Live score check for waiting-for-play detection
  const currentTournamentId = data?.tournament?.id ?? null;
  const { data: liveScoreCount } = useQuery({
    queryKey: ['live-score-check', currentTournamentId],
    queryFn: async () => {
      const { count } = await supabase
        .from('sr_leaderboards')
        .select('id', { count: 'exact', head: true })
        .eq('tournament_id', currentTournamentId!)
        .not('position', 'is', null)
        .gt('strokes', 0);
      return count ?? 0;
    },
    enabled: isLive && !!currentTournamentId,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const hasLiveScores = (liveScoreCount ?? 0) > 0;
  const isWaitingForPlay = isLive && !hasLiveScores;

  // Withdrawn player IDs from tracker
  const withdrawnPlayerIds = useMemo(() => {
    if (!tracker) return undefined;
    const wdIds = new Set<string>();
    for (const p of tracker.allPicks) {
      if (p.performanceStatus === 'withdrawn') wdIds.add(p.playerId);
    }
    return wdIds.size > 0 ? wdIds : undefined;
  }, [tracker]);

  // ═══ TAB SYSTEM ═══
  // Build available tabs based on tournament state
  const tabs = useMemo(() => {
    const result: Array<{ id: string; label: string; hasLiveDot?: boolean }> = [];
    if (isLive) result.push({ id: 'live', label: 'Live', hasLiveDot: true });
    if (hasUpcoming) result.push({ id: 'nextup', label: 'Next Up' });
    if (isCompleted) result.push({ id: 'results', label: 'Results' });
    // Pre-tournament with no completed: just show content directly (no tabs)
    if (!isLive && !isCompleted && !hasUpcoming) {
      result.push({ id: 'current', label: 'Current' });
    }
    return result;
  }, [isLive, hasUpcoming, isCompleted]);

  const [activeMainTab, setActiveMainTab] = useState(tabs[0]?.id || 'current');

  // Reset active tab when tabs change
  useEffect(() => {
    if (tabs.length > 0 && !tabs.find(t => t.id === activeMainTab)) {
      setActiveMainTab(tabs[0].id);
    }
  }, [tabs, activeMainTab]);

  // Sub-tab for upcoming/pre-tournament content
  const [activeSubTab, setActiveSubTab] = useState<IntelligenceTab>('predictions');
  const [showCourseDNA, setShowCourseDNA] = useState(false);

  // Auto-expand Course DNA while waiting for play
  useEffect(() => {
    if (isWaitingForPlay) setShowCourseDNA(true);
  }, [isWaitingForPlay]);

  if (isLoading) return <TournamentInsightsSkeleton />;
  if (error || !data) {
    if (error) {
      return (
        <section aria-label="Tournament intelligence" className="px-4">
          <div className="rounded-2xl bg-card border border-border/50 p-6 text-center">
            <span className="text-base mx-auto mb-2 text-muted-foreground/50">🔍</span>
            <p className="text-sm text-muted-foreground">Intelligence unavailable right now.</p>
          </div>
        </section>
      );
    }
    return null;
  }

  // ═══ Hero card data resolution ═══
  const upcomingHeroData = nextTournamentInsights?.tournament ?? (nextTournamentPreview ? {
    id: nextTournamentPreview.id,
    name: nextTournamentPreview.name,
    courseName: nextTournamentPreview.courseName,
    dateRangeText: nextTournamentPreview.startDate,
    heroImageUrl: '',
  } : null);

  const isShowingUpcoming = activeMainTab === 'nextup';
  const heroData = isShowingUpcoming && upcomingHeroData
    ? upcomingHeroData
    : data?.tournament ?? null;
  const heroIsLive = isLive && activeMainTab === 'live';
  const heroIsCompleted = isCompleted && activeMainTab === 'results';

  // ═══ CONTENT RENDERERS ═══

  const renderUpcomingContent = (insightsData: typeof nextTournamentInsights | typeof data, picksFirst: boolean = true) => {
    if (!insightsData) {
      if (nextTournamentPredictionsLoading) return <GeneratingPredictionsSkeleton />;
      if (nextTournamentPreview) return <GeneratingPredictionsSkeleton label="Generating predictions…" />;
      return (
        <p className="text-sm text-muted-foreground text-center py-8">
          No upcoming tournament data available yet.
        </p>
      );
    }

    return (
      <>
        <IntelligenceTabSwitcher activeTab={activeSubTab} onTabChange={setActiveSubTab} picksFirst={picksFirst} />

        {activeSubTab === 'courseDNA' && (
          <motion.div
            key="courseDNA"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="pb-6"
          >
            <div>
              {insightsData.courseDNA.length > 0 && (
                <CourseDNACard
                  items={insightsData.courseDNA}
                  courseName={insightsData.tournament.courseName}
                  inline
                />
              )}
              <ClubhouseIntelligence insight={insightsData.clubhouseIntelligence} inline />
            </div>
          </motion.div>
        )}

        {activeSubTab === 'predictions' && (
          <motion.div
            key="predictions"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="pb-6 space-y-3"
          >
            {isStale && <StaleBadge />}
            {insightsData.winners.length > 0 && (
              <LikelyWinnersCarousel
                featured={insightsData.winners[0]}
                cards={insightsData.contenderCards}
                withdrawnPlayerIds={withdrawnPlayerIds}
              />
            )}
          </motion.div>
        )}
      </>
    );
  };

  const renderLiveContent = () => {
    if (isWaitingForPlay) {
      return (
        <div className="space-y-4 pb-6">
          {/* Amber waiting banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.15)',
            }}
          >
            <div
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: 'rgba(245, 158, 11, 0.8)',
                animation: 'pulse 2s ease-in-out infinite',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: '12.5px',
                fontWeight: 600,
                color: 'hsl(var(--foreground) / 0.6)',
              }}
            >
              Play begins shortly — tracking starts when scores are in
            </span>
          </div>

          {data.winners.length > 0 && (
            <LikelyWinnersCarousel
              featured={data.winners[0]}
              cards={data.contenderCards}
              withdrawnPlayerIds={withdrawnPlayerIds}
            />
          )}

          <AnimatePresence>
            {showCourseDNA && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div>
                  {data.courseDNA.length > 0 && (
                    <CourseDNACard items={data.courseDNA} courseName={data.tournament.courseName} inline />
                  )}
                  <ClubhouseIntelligence insight={data.clubhouseIntelligence} inline />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    if (tracker) {
      return (
        <div className="space-y-4">
          <PredictionLeaderboard allPicks={tracker.allPicks} isCompleted={false} />

          {/* Course DNA toggle */}
          <div
            onClick={() => setShowCourseDNA(!showCourseDNA)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              margin: '12px 0',
              borderRadius: '12px',
              cursor: 'pointer',
            }}
            className="active:scale-[0.98] transition-transform bg-muted/50 border border-border/40"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px' }}>🧬</span>
              <span className="text-foreground/70" style={{ fontSize: '13.5px', fontWeight: 600 }}>
                {showCourseDNA ? 'Hide Course DNA' : 'View Course DNA'}
              </span>
            </div>
            <span
              className="text-muted-foreground"
              style={{
                fontSize: '16px',
                transform: showCourseDNA ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                display: 'inline-block',
              }}
            >
              ›
            </span>
          </div>

          <AnimatePresence>
            {showCourseDNA && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div>
                  {data.courseDNA.length > 0 && (
                    <CourseDNACard items={data.courseDNA} courseName={data.tournament.courseName} inline />
                  )}
                  <ClubhouseIntelligence insight={data.clubhouseIntelligence} inline />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    if (trackerLoading) {
      return (
        <div className="space-y-3 animate-pulse">
          <div className="h-24 bg-black/[0.04] rounded-2xl" />
          <div className="h-64 bg-black/[0.04] rounded-2xl" />
        </div>
      );
    }

    // Fallback: show predictions carousel
    return (
      <div className="pb-6">
        {data.winners.length > 0 && (
          <LikelyWinnersCarousel
            featured={data.winners[0]}
            cards={data.contenderCards}
            withdrawnPlayerIds={withdrawnPlayerIds}
          />
        )}
      </div>
    );
  };

  const renderResultsContent = () => {
    if (!tracker) return null;
    const bestCall = getBestCall(tracker);
    const bestCallPick = bestCall
      ? tracker.allPicks.find((p) => p.playerId === bestCall.playerId) ?? null
      : null;
    // Remaining picks exclude the best pick (it's in the spotlight card)
    const remainingPicks = bestCallPick
      ? tracker.allPicks.filter((p) => p.playerId !== bestCallPick.playerId)
      : tracker.allPicks;

    return (
      <>
        {bestCallPick && data?.tournament && (
          <BestPickSpotlight
            bestPick={bestCallPick}
            tournamentId={data.tournament.id}
            courseName={data.tournament.courseName}
            tournamentName={data.tournament.name}
          />
        )}
        <PredictionLeaderboard
          allPicks={remainingPicks}
          isCompleted={true}
          bestCallPlayerId={bestCall?.playerId}
        />
      </>
    );
  };

  const renderContent = () => {
    switch (activeMainTab) {
      case 'live':
        return renderLiveContent();
      case 'nextup':
        return renderUpcomingContent(nextTournamentInsights, true);
      case 'results':
        return renderResultsContent();
      case 'current':
        return renderUpcomingContent(data, false);
      default:
        return null;
    }
  };

  return (
    <section aria-label="Featured tournament analysis" className="space-y-0 px-4">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        viewport={{ once: true }}
        style={{ marginBottom: '24px' }}
      >
        <div className="mb-1">
          <h2
            className="text-foreground"
            style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px' }}
          >
            Tournament Intelligence
          </h2>
          {!isLive && (
            <p className="mt-1 text-muted-foreground/60" style={{ fontSize: '13px', fontWeight: 500 }}>
              AI analysis of course fit, form, and field strength
            </p>
          )}
        </div>

        {/* Tab bar — only when multiple tabs */}
        {tabs.length > 1 && (
          <div style={{ paddingTop: '12px' }} className="flex justify-center">
            <LiveUpcomingToggle
              tabs={tabs}
              activeTab={activeMainTab}
              onTabChange={setActiveMainTab}
            />
          </div>
        )}
      </motion.div>

      {/* Hero Card — full bleed */}
      {heroData && (
        <div className="-mx-4 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={`hero-${activeMainTab}-${heroData?.id ?? 'none'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <TournamentHeroCard tournament={heroData} isLive={heroIsLive} isCompleted={heroIsCompleted} />
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* ═══ Content area ═══ */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeMainTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-0 pt-6 bg-background"
          style={{ borderTop: '1px solid hsl(var(--border) / 0.3)' }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </section>
  );
});

/** Best call = the pick with the lowest (best) actual finishing position */
function getBestCall(tracker: { predictions: Array<{ playerName: string; playerId: string; predictedRank: number; actualPosition: number | null; performanceStatus: string }> }) {
  const eligible = tracker.predictions.filter(
    p => p.actualPosition !== null && p.performanceStatus !== 'cut' && p.performanceStatus !== 'withdrawn'
  );
  if (eligible.length === 0) return null;
  return eligible.reduce((best, curr) => {
    return (curr.actualPosition ?? 999) < (best.actualPosition ?? 999) ? curr : best;
  });
}
