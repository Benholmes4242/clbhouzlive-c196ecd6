/**
 * TournamentInsights - Main container with three-state rendering
 * Pre-tournament: existing tab UI (Course DNA + Predictions)
 * In-progress: Live prediction tracker with accuracy + scorecard
 * Completed: Results recap + next tournament preview
 */

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain } from 'lucide-react';
import { useTournamentInsights } from './hooks/useTournamentInsights';
import { TournamentHeroCard } from './TournamentHeroCard';
import { CourseDNACard } from './CourseDNACard';
import { ClubhouseIntelligence } from './ClubhouseIntelligence';
import { LikelyWinnersCarousel } from './LikelyWinnersCarousel';
import { PredictionTracker } from './PredictionTracker';
import { ResultsRecap } from './ResultsRecap';
import { LiveBadge } from './LiveBadge';
import IntelligenceTabSwitcher from './components/IntelligenceTabSwitcher';

type IntelligenceTab = 'courseDNA' | 'predictions';

// Skeleton loader - light themed
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
    nextTournamentPredictions,
  } = useTournamentInsights();
  const [activeTab, setActiveTab] = useState<IntelligenceTab>('courseDNA');

  if (isLoading) {
    return <TournamentInsightsSkeleton />;
  }

  if (error || !data) {
    return null;
  }

  const isLive = tournamentPhase === 'in-progress';
  const isCompleted = tournamentPhase === 'completed';

  return (
    <section aria-label="Featured tournament analysis" className="space-y-0 px-4">
      {/* Section Header — ABOVE hero card */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        viewport={{ once: true }}
        className="flex items-center justify-between mb-4"
      >
        {/* Left: Brain icon + text */}
        <div className="flex items-center gap-3">
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
            <p className="mt-0.5" style={{ fontSize: '12px', fontWeight: 400, color: '#78716C' }}>
              {isLive ? 'Live prediction tracking' : isCompleted ? 'Tournament results' : 'AI-powered tournament analysis'}
            </p>
          </div>
        </div>

        {/* Live badge */}
        {isLive && <LiveBadge />}
      </motion.div>

      {/* Hero Card — full bleed */}
      <div className="-mx-4 relative">
        <TournamentHeroCard tournament={data.tournament} isLive={isLive} />
      </div>

      {/* ═══ Content area — phase-dependent ═══ */}
      <AnimatePresence mode="wait">
        {/* STATE 1: Pre-tournament — existing tab UI */}
        {tournamentPhase === 'pre-tournament' && (
          <motion.div
            key="pre-tournament"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
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
                    <CourseDNACard
                      items={data.courseDNA}
                      courseName={data.tournament.courseName}
                      inline
                    />
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
                  <LikelyWinnersCarousel
                    featured={data.winners[0]}
                    cards={data.contenderCards}
                  />
                )}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* STATE 2: In-progress — Live tracking mode */}
        {tournamentPhase === 'in-progress' && (
          <motion.div
            key="in-progress"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-0 pt-5 bg-background"
            style={{ borderTop: '1px solid rgba(0, 0, 0, 0.05)' }}
          >
            {tracker ? (
              <PredictionTracker
                tracker={tracker}
                nextTournament={nextTournament}
                courseDNA={data.courseDNA}
                courseName={data.tournament.courseName}
                clubhouseIntelligence={data.clubhouseIntelligence}
              />
            ) : trackerLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-24 bg-black/[0.04] rounded-2xl" />
                <div className="h-64 bg-black/[0.04] rounded-2xl" />
              </div>
            ) : (
              // Fallback to pre-tournament view if no leaderboard data yet
              <div className="pb-6">
                {data.winners.length > 0 && (
                  <LikelyWinnersCarousel
                    featured={data.winners[0]}
                    cards={data.contenderCards}
                  />
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* STATE 3: Completed — Results recap + next tournament */}
        {tournamentPhase === 'completed' && (
          <motion.div
            key="completed"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-0 pt-5 bg-background space-y-4"
            style={{ borderTop: '1px solid rgba(0, 0, 0, 0.05)' }}
          >
            {tracker ? (
              <ResultsRecap
                predictions={{ tournament: { id: data.tournament.id, name: data.tournament.name, venueName: data.tournament.courseName, venueCity: '', venueState: '', startDate: '', endDate: '', purse: 0, par: 0, yardage: 0, status: 'complete' }, topContenders: [], darkHorses: [], courseAnalysis: { winnerProfile: '', keyStats: [], insight: '', difficulty: '' }, confidence: 0, generatedAt: '', isAIPowered: true }}
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

// Helper: find the "best call" — predicted player closest to their actual position
function getBestCall(tracker: { predictions: Array<{ playerName: string; predictedRank: number; actualPosition: number | null; performanceStatus: string }> }) {
  const eligible = tracker.predictions.filter(
    p => p.actualPosition !== null && p.performanceStatus !== 'cut' && p.performanceStatus !== 'withdrawn'
  );
  if (eligible.length === 0) return null;
  
  // Best = smallest absolute delta (closest to predicted position)
  return eligible.reduce((best, curr) => {
    const bestDelta = Math.abs(best.predictedRank - (best.actualPosition ?? 999));
    const currDelta = Math.abs(curr.predictedRank - (curr.actualPosition ?? 999));
    return currDelta < bestDelta ? curr : best;
  });
}
