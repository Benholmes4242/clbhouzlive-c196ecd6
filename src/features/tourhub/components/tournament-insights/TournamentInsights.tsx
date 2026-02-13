/**
 * TournamentInsights - Main container with toggle-based rendering
 * Pre-tournament: existing tab UI (Course DNA + Predictions)
 * In-progress: Live/Upcoming toggle with tracker or next tournament view
 * Completed: Falls back to next tournament or results recap
 */

import { memo, useState } from 'react';
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
  } = useTournamentInsights();

  const [activeTab, setActiveTab] = useState<IntelligenceTab>('courseDNA');
  const [intelligenceView, setIntelligenceView] = useState<IntelligenceView>('live');
  const [showCourseDNA, setShowCourseDNA] = useState(false);

  if (isLoading) return <TournamentInsightsSkeleton />;
  if (error || !data) return null;

  const isLive = tournamentPhase === 'in-progress';
  const isCompleted = tournamentPhase === 'completed';
  const hasUpcoming = !!nextTournamentInsights;

  // Determine which tournament data to show for the hero card
  const heroData = isLive && intelligenceView === 'upcoming' && nextTournamentInsights
    ? nextTournamentInsights.tournament
    : data.tournament;
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
              className="tracking-tight leading-tight"
              style={{ fontSize: '16px', fontWeight: 600, color: '#1C1917', letterSpacing: '-0.2px' }}
            >
              clbhouz intelligence
            </h2>
            {/* Subtitle only when NOT live — toggle replaces it */}
            {!isLive && (
              <p className="mt-0.5" style={{ fontSize: '12px', fontWeight: 400, color: '#78716C' }}>
                {isCompleted ? 'Tournament results' : 'AI-powered tournament analysis'}
              </p>
            )}
          </div>
        </div>

        {/* Live/Upcoming toggle — only shown during in-progress */}
        {isLive && (
          <LiveUpcomingToggle
            activeView={intelligenceView}
            onViewChange={setIntelligenceView}
            hasUpcoming={hasUpcoming}
          />
        )}
      </motion.div>

      {/* Hero Card — full bleed */}
      <div className="-mx-4 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={heroIsLive ? 'live-hero' : 'upcoming-hero'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <TournamentHeroCard tournament={heroData} isLive={heroIsLive} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ═══ Content area — phase & view dependent ═══ */}
      <AnimatePresence mode="wait">
        {/* PRE-TOURNAMENT — existing tab UI (no changes) */}
        {tournamentPhase === 'pre-tournament' && (
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
            {tracker ? (
              <div className="space-y-4">
                {/* Unified leaderboard table */}
                <PredictionLeaderboard allPicks={tracker.allPicks} />

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
              <div className="pb-6">
                {data.winners.length > 0 && (
                  <LikelyWinnersCarousel featured={data.winners[0]} cards={data.contenderCards} />
                )}
              </div>
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
                    id: data.tournament.id, name: data.tournament.name,
                    venueName: data.tournament.courseName, venueCity: '', venueState: '',
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
