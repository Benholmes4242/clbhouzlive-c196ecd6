/**
 * TournamentInsights - Main container with toggle-based rendering
 * Pre-tournament: existing tab UI (Course DNA + Predictions)
 * In-progress: Live/Upcoming toggle with tracker or next tournament view
 * Completed: Falls back to next tournament or results recap
 */

import React, { memo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronRight } from 'lucide-react';
import { useTournamentInsights } from './hooks/useTournamentInsights';
import { TournamentHeroCard } from './TournamentHeroCard';
import { CourseDNACard } from './CourseDNACard';
import { ClubhouseIntelligence } from './ClubhouseIntelligence';
import { LikelyWinnersCarousel } from './LikelyWinnersCarousel';
import { AccuracyHeadlineCard } from './AccuracyHeadlineCard';
import { PredictionLeaderboard } from './PredictionLeaderboard';
import { LiveUpcomingToggle } from './LiveUpcomingToggle';
import { ResultsRecap } from './ResultsRecap';
import IntelligenceTabSwitcher from './components/IntelligenceTabSwitcher';
import type { IntelligenceView } from './types';

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
  } = useTournamentInsights();

  // Derived phase booleans — computed before early returns so hooks below are valid
  const isLive = tournamentPhase === 'in-progress';
  const isCompleted = tournamentPhase === 'completed';

  // Independent live-score check — does NOT depend on tracker matching predictions.
  // A lightweight HEAD count against sr_leaderboards; polls every 30s.
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

  const [activeTab, setActiveTab] = useState<IntelligenceTab>('courseDNA');
  const [intelligenceView, setIntelligenceView] = useState<IntelligenceView>('live');
  const [showCourseDNA, setShowCourseDNA] = useState(false);

  // Auto-expand Course DNA while waiting for play to begin
  useEffect(() => {
    if (isWaitingForPlay) {
      setShowCourseDNA(true);
    }
  }, [isWaitingForPlay]);

  if (isLoading) return <TournamentInsightsSkeleton />;
  if (error || !data) {
    if (error) {
      return (
        <section aria-label="Tournament intelligence" className="px-4">
          <div className="rounded-2xl bg-card border border-border/50 p-6 text-center">
            <Brain className="w-5 h-5 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Intelligence unavailable right now.</p>
          </div>
        </section>
      );
    }
    return null;
  }

  // Determine which tournament data to show for the hero card
  // When upcoming is selected, use full insights if available, else preview as minimal fallback
  const upcomingHeroData = nextTournamentInsights?.tournament ?? (nextTournamentPreview ? {
    id: nextTournamentPreview.id,
    name: nextTournamentPreview.name,
    courseName: nextTournamentPreview.courseName,
    dateRangeText: nextTournamentPreview.startDate,
    heroImageUrl: '',
  } : null);
  const heroData = isLive && intelligenceView === 'upcoming' && upcomingHeroData
    ? upcomingHeroData
    : data?.tournament ?? null;
  const heroIsLive = isLive && intelligenceView === 'live';

  return (
    <section aria-label="Featured tournament analysis" className="space-y-0 px-4">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        viewport={{ once: true }}
        className="mb-4"
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 184, 0, 0.12) 0%, rgba(255, 140, 0, 0.06) 100%)',
              border: '1px solid rgba(255, 184, 0, 0.2)',
            }}
          >
            <Brain className="w-5 h-5" style={{ color: '#B8860B' }} />
          </div>
          <div className="flex flex-col">
            <h2
              className="tracking-tight leading-tight text-foreground"
              style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.3px' }}
            >
              clbhouz intelligence
            </h2>
            {/* Subtitle only when NOT live — toggle replaces it */}
            {!isLive && (
              <p className="mt-0.5 text-muted-foreground" style={{ fontSize: '13px', fontWeight: 400 }}>
                {isCompleted ? 'Tournament results' : 'AI-powered tournament analysis'}
              </p>
            )}
          </div>
        </div>

        {/* Live/Upcoming toggle — shown when live OR when there's upcoming data */}
        {(isLive || hasUpcoming) && (
          <LiveUpcomingToggle
            activeView={intelligenceView}
            onViewChange={setIntelligenceView}
            hasUpcoming={hasUpcoming}
            isLive={isLive}
          />
        )}
      </motion.div>

      {/* Hero Card — full bleed */}
      {heroData && (
        <div className="-mx-4 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={heroIsLive ? 'live-hero' : 'upcoming-hero'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <TournamentHeroCard tournament={heroData} isLive={heroIsLive} isCompleted={isCompleted} />
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* ═══ Content area — phase & view dependent ═══ */}
      <AnimatePresence mode="wait">
        {/* PRE-TOURNAMENT — existing tab UI (when not viewing upcoming) */}
        {tournamentPhase === 'pre-tournament' && intelligenceView === 'live' && (
          <motion.div
            key="pre-tournament"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-0 pt-7 bg-background"
            style={{ borderTop: '1px solid rgba(0, 0, 0, 0.05)' }}
          >
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              viewport={{ once: true }}
            >
              <IntelligenceTabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
            </motion.div>

            {activeTab === 'courseDNA' && (
              <motion.div
                key="courseDNA"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                className="pb-6"
              >
                <div
                  className="rounded-2xl bg-card border border-border overflow-hidden"
                  style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
                >
                  {data.courseDNA.length > 0 && (
                    <CourseDNACard items={data.courseDNA} courseName={data.tournament.courseName} inline />
                  )}
                  <ClubhouseIntelligence insight={data.clubhouseIntelligence} inline />
                </div>
              </motion.div>
            )}

            {activeTab === 'predictions' && (
              <motion.div
                key="predictions"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                className="pb-6"
              >
                {data.winners.length > 0 && (
                  <LikelyWinnersCarousel featured={data.winners[0]} cards={data.contenderCards} />
                )}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* PRE-TOURNAMENT — UPCOMING VIEW */}
        {tournamentPhase === 'pre-tournament' && intelligenceView === 'upcoming' && (
          <motion.div
            key="pre-upcoming"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-0 pt-7 bg-background"
            style={{ borderTop: '1px solid rgba(0, 0, 0, 0.05)' }}
          >
            {nextTournamentInsights ? (
              <>
                <IntelligenceTabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />

                {activeTab === 'courseDNA' && (
                  <motion.div
                    key="upcoming-courseDNA"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                    className="pb-6"
                  >
                    <div
                      className="rounded-2xl bg-card border border-border overflow-hidden"
                      style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
                    >
                      {nextTournamentInsights.courseDNA.length > 0 && (
                        <CourseDNACard
                          items={nextTournamentInsights.courseDNA}
                          courseName={nextTournamentInsights.tournament.courseName}
                          inline
                        />
                      )}
                      <ClubhouseIntelligence insight={nextTournamentInsights.clubhouseIntelligence} inline />
                    </div>
                  </motion.div>
                )}

                {activeTab === 'predictions' && (
                  <motion.div
                    key="upcoming-predictions"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                    className="pb-6"
                  >
                    {nextTournamentInsights.winners.length > 0 && (
                      <LikelyWinnersCarousel
                        featured={nextTournamentInsights.winners[0]}
                        cards={nextTournamentInsights.contenderCards}
                      />
                    )}
                  </motion.div>
                )}
              </>
            ) : nextTournamentPredictionsLoading ? (
              <GeneratingPredictionsSkeleton />
            ) : nextTournamentPreview ? (
              <GeneratingPredictionsSkeleton label="Generating predictions…" />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No upcoming tournament data available yet.
              </p>
            )}
          </motion.div>
        )}

        {/* IN-PROGRESS — LIVE VIEW */}
        {isLive && intelligenceView === 'live' && (
          <motion.div
            key="in-progress-live"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-0 pt-5 bg-background"
            style={{ borderTop: '1px solid rgba(0, 0, 0, 0.05)' }}
          >
            {isWaitingForPlay ? (
              /* ── WAITING FOR PLAY: show predictions + Course DNA, not empty tracker ── */
              <div className="space-y-4 pb-6">
                {/* Amber "play begins shortly" banner */}
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

                {/* AI predicted contenders with confidence bars */}
                {data.winners.length > 0 && (
                  <LikelyWinnersCarousel featured={data.winners[0]} cards={data.contenderCards} />
                )}

                {/* Course DNA — auto-expanded via useEffect */}
                <AnimatePresence>
                  {showCourseDNA && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div
                        className="rounded-2xl bg-card border border-border overflow-hidden"
                        style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
                      >
                        {data.courseDNA.length > 0 && (
                          <CourseDNACard items={data.courseDNA} courseName={data.tournament.courseName} inline />
                        )}
                        <ClubhouseIntelligence insight={data.clubhouseIntelligence} inline />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : tracker ? (
              /* ── LIVE SCORES IN: show live tracking table ── */
              <div className="space-y-4">
                <PredictionLeaderboard allPicks={tracker.allPicks} isCompleted={false} />

                {/* Course DNA toggle */}
                <button
                  onClick={() => setShowCourseDNA(!showCourseDNA)}
                  className="flex items-center gap-1 text-xs font-medium active:opacity-70 transition-opacity"
                  style={{ color: '#78716C' }}
                >
                  <span>{showCourseDNA ? 'Hide' : 'View'} Course DNA</span>
                  <ChevronRight
                    className="w-3 h-3 transition-transform"
                    style={{ transform: showCourseDNA ? 'rotate(90deg)' : undefined }}
                  />
                </button>

                <AnimatePresence>
                  {showCourseDNA && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div
                        className="rounded-2xl bg-card border border-border overflow-hidden"
                        style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
                      >
                        {data.courseDNA.length > 0 && (
                          <CourseDNACard items={data.courseDNA} courseName={data.tournament.courseName} inline />
                        )}
                        <ClubhouseIntelligence insight={data.clubhouseIntelligence} inline />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : trackerLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-24 bg-black/[0.04] rounded-2xl" />
                <div className="h-64 bg-black/[0.04] rounded-2xl" />
              </div>
            ) : (
              /* ── NO TRACKER: fallback to predictions carousel ── */
              <div className="pb-6">
                {data.winners.length > 0 && (
                  <LikelyWinnersCarousel featured={data.winners[0]} cards={data.contenderCards} />
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* UPCOMING VIEW — shown from any phase when toggled to upcoming */}
        {intelligenceView === 'upcoming' && !isLive && (
          <motion.div
            key="upcoming-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-0 pt-7 bg-background"
            style={{ borderTop: '1px solid rgba(0, 0, 0, 0.05)' }}
          >
            {nextTournamentInsights ? (
              <>
                <IntelligenceTabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />

                {activeTab === 'courseDNA' && (
                  <motion.div
                    key="upcoming-courseDNA"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                    className="pb-6"
                  >
                    <div
                      className="rounded-2xl bg-card border border-border overflow-hidden"
                      style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
                    >
                      {nextTournamentInsights.courseDNA.length > 0 && (
                        <CourseDNACard
                          items={nextTournamentInsights.courseDNA}
                          courseName={nextTournamentInsights.tournament.courseName}
                          inline
                        />
                      )}
                      <ClubhouseIntelligence insight={nextTournamentInsights.clubhouseIntelligence} inline />
                    </div>
                  </motion.div>
                )}

                {activeTab === 'predictions' && (
                  <motion.div
                    key="upcoming-predictions"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                    className="pb-6"
                  >
                    {nextTournamentInsights.winners.length > 0 && (
                      <LikelyWinnersCarousel
                        featured={nextTournamentInsights.winners[0]}
                        cards={nextTournamentInsights.contenderCards}
                      />
                    )}
                  </motion.div>
                )}
              </>
            ) : nextTournamentPredictionsLoading ? (
              <GeneratingPredictionsSkeleton />
            ) : nextTournamentPreview ? (
              <GeneratingPredictionsSkeleton label="Generating predictions for this tournament…" />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No upcoming tournament data available yet.
              </p>
            )}
          </motion.div>
        )}

        {/* IN-PROGRESS — UPCOMING VIEW */}
        {isLive && intelligenceView === 'upcoming' && (
          <motion.div
            key="in-progress-upcoming"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-0 pt-7 bg-background"
            style={{ borderTop: '1px solid rgba(0, 0, 0, 0.05)' }}
          >
            {nextTournamentInsights ? (
              <>
                <IntelligenceTabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />

                {activeTab === 'courseDNA' && (
                  <motion.div
                    key="upcoming-courseDNA"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                    className="pb-6"
                  >
                    <div
                      className="rounded-2xl bg-card border border-border overflow-hidden"
                      style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
                    >
                      {nextTournamentInsights.courseDNA.length > 0 && (
                        <CourseDNACard
                          items={nextTournamentInsights.courseDNA}
                          courseName={nextTournamentInsights.tournament.courseName}
                          inline
                        />
                      )}
                      <ClubhouseIntelligence insight={nextTournamentInsights.clubhouseIntelligence} inline />
                    </div>
                  </motion.div>
                )}

                {activeTab === 'predictions' && (
                  <motion.div
                    key="upcoming-predictions"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                    className="pb-6"
                  >
                    {nextTournamentInsights.winners.length > 0 && (
                      <LikelyWinnersCarousel
                        featured={nextTournamentInsights.winners[0]}
                        cards={nextTournamentInsights.contenderCards}
                      />
                    )}
                  </motion.div>
                )}
              </>
            ) : nextTournamentPredictionsLoading ? (
              <GeneratingPredictionsSkeleton />
            ) : nextTournamentPreview ? (
              <GeneratingPredictionsSkeleton label="Generating predictions for this tournament…" />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No upcoming tournament data available yet.
              </p>
            )}
          </motion.div>
        )}

        {/* COMPLETED — Results recap then fallback */}
        {isCompleted && (
          <motion.div
            key="completed"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-0 pt-5 bg-background space-y-4"
            style={{ borderTop: '1px solid rgba(0, 0, 0, 0.05)' }}
          >
            {tracker ? (
              <ResultsRecap
                predictions={{
                  tournament: {
                    id: data?.tournament.id ?? '', name: data?.tournament.name ?? '',
                    venueName: data?.tournament.courseName ?? '', venueCity: '', venueState: '',
                    startDate: '', endDate: '', purse: 0, par: 0, yardage: 0, status: 'complete',
                  },
                  topContenders: [], darkHorses: [],
                  courseAnalysis: { winnerProfile: '', keyStats: [], insight: '', difficulty: '' },
                  confidence: 0, generatedAt: '', isAIPowered: true,
                }}
                accuracy={tracker.accuracy}
                bestCallName={getBestCall(tracker)?.playerName}
                bestCallPredicted={getBestCall(tracker)?.predictedRank}
                bestCallActual={getBestCall(tracker)?.actualPosition ?? undefined}
              />
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
});

function getBestCall(tracker: { predictions: Array<{ playerName: string; predictedRank: number; actualPosition: number | null; performanceStatus: string }> }) {
  const eligible = tracker.predictions.filter(
    p => p.actualPosition !== null && p.performanceStatus !== 'cut' && p.performanceStatus !== 'withdrawn'
  );
  if (eligible.length === 0) return null;
  return eligible.reduce((best, curr) => {
    const bestDelta = Math.abs(best.predictedRank - (best.actualPosition ?? 999));
    const currDelta = Math.abs(curr.predictedRank - (curr.actualPosition ?? 999));
    return currDelta < bestDelta ? curr : best;
  });
}
