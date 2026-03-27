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
import { TournamentResultsCard } from './TournamentResultsCard';
import { NextUpPickCard } from './NextUpPickCard';
import { usePickHistory, type PickHistoryEntry } from '../../hooks/usePickHistory';
import { createPortal } from 'react-dom';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import { useNavigate } from 'react-router-dom';

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
// ─── Pick Record Rail ────────────────────────────────────────────────────────

function PickRecordRail() {
  const navigate = useNavigate();
  const { data: pickHistory, isLoading } = usePickHistory();
  const [selectedEntry, setSelectedEntry] = React.useState<PickHistoryEntry | null>(null);

  if (isLoading) {
    return (
      <div style={{ padding: '16px 0 8px' }}>
        <div style={{ padding: '0 16px 10px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.8, textTransform: 'uppercase' as const, color: 'hsl(var(--muted-foreground))' }}>
            Tournament Intelligence
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: 'hsl(var(--foreground))' }}>Pick Record</div>
        </div>
        <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px', overflow: 'hidden' }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="animate-pulse" style={{ width: 110, height: 90, borderRadius: 14, background: 'hsl(var(--muted) / 0.4)', flexShrink: 0 }} />
          ))}
        </div>
      </div>
    );
  }

  if (!pickHistory.length) return null;

  const wins = pickHistory.filter(e => e.isWinner).length;
  const top5 = pickHistory.filter(e => e.actualPosition !== null && e.actualPosition <= 5).length;

  return (
    <>
      <div style={{ padding: '16px 0 8px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 16px 10px' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.8, textTransform: 'uppercase' as const, color: 'hsl(var(--muted-foreground))' }}>
              Tournament Intelligence
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'hsl(var(--foreground))' }}>Pick Record</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {wins > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 8px', borderRadius: 8,
                background: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.35)',
              }}>
                <span style={{ fontSize: 10 }}>🏆</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'hsl(var(--accent-amber))' }}>{wins} win{wins !== 1 ? 's' : ''}</span>
              </div>
            )}
            {top5 > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 8px', borderRadius: 8,
                background: 'rgba(22,163,74,0.08)',
                border: '1px solid rgba(22,163,74,0.25)',
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#16A34A' }}>{top5} top 5</span>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable rail */}
        <div style={{
          display: 'flex', gap: 8, padding: '0 16px 16px',
          overflowX: 'auto', scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}>
          {pickHistory.map((entry) => {
            const surname = entry.topPickName.split(' ').pop() ?? entry.topPickName;
            return (
              <div
                key={entry.tournamentId}
                onClick={() => setSelectedEntry(entry)}
                style={{
                  width: 110, flexShrink: 0, borderRadius: 14, padding: 12,
                  cursor: 'pointer',
                  background: entry.isWinner
                    ? 'linear-gradient(160deg, rgba(255,248,225,0.95), rgba(255,252,238,0.98))'
                    : 'hsl(var(--card))',
                  border: entry.isWinner
                    ? '1.5px solid rgba(245,158,11,0.4)'
                    : '1px solid hsl(var(--border))',
                  boxShadow: entry.isWinner ? '0 0 12px rgba(245,158,11,0.1)' : 'none',
                }}
              >
                {/* Tournament short name */}
                <div style={{
                  fontSize: 11, fontWeight: 700,
                  color: entry.isWinner ? 'hsl(var(--accent-amber))' : 'hsl(var(--muted-foreground))',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                  marginBottom: 4,
                }}>
                  {entry.shortName}
                </div>

                {/* Player surname */}
                <div style={{
                  fontSize: 14, fontWeight: 700,
                  color: 'hsl(var(--foreground))',
                  lineHeight: 1.2, marginBottom: 2,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                }}>
                  {surname}
                </div>
                {/* Predicted rank label */}
                <div style={{
                  fontSize: 9, color: 'hsl(var(--muted-foreground))', marginBottom: 6,
                }}>
                  Pick #{entry.predictedRank}
                </div>

                {/* Result badge */}
                {entry.isWinner ? (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                    padding: '2px 7px', borderRadius: 6,
                    background: 'rgba(245,158,11,0.15)',
                    fontSize: 11, fontWeight: 700, color: '#92400E',
                  }}>
                    🏆 Won
                  </div>
                ) : entry.actualPosition && entry.actualPosition <= 5 ? (
                  <div style={{
                    display: 'inline-block',
                    padding: '2px 7px', borderRadius: 6,
                    background: 'rgba(22,163,74,0.08)',
                    fontSize: 11, fontWeight: 700, color: '#16A34A',
                  }}>
                    {entry.actualPositionTied ? 'T' : ''}{entry.actualPosition}{['st','nd','rd'][((entry.actualPosition % 100) - 20) % 10 - 1] || ['st','nd','rd'][(entry.actualPosition % 100) - 1] || 'th'}
                  </div>
                ) : (
                  <div style={{
                    display: 'inline-block',
                    padding: '2px 7px', borderRadius: 6,
                    background: 'hsl(var(--muted) / 0.3)',
                    fontSize: 11, fontWeight: 600, color: 'hsl(var(--muted-foreground))',
                  }}>
                    {entry.actualPosition
                      ? `${entry.actualPositionTied ? 'T' : ''}${entry.actualPosition}th`
                      : '—'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom sheet */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedEntry && (
            <>
              <motion.div
                key="pick-sheet-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedEntry(null)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9998 }}
              />
              <motion.div
                key="pick-sheet"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                style={{
                  position: 'fixed', bottom: 0, left: 0, right: 0,
                  background: 'hsl(var(--card))',
                  borderTopLeftRadius: 20, borderTopRightRadius: 20,
                  zIndex: 9999,
                  borderTop: selectedEntry.isWinner ? '2px solid hsl(var(--accent-amber))' : '1px solid hsl(var(--border))',
                  paddingBottom: 'env(safe-area-inset-bottom, 16px)',
                }}
              >
                {/* Drag handle */}
                <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px' }}>
                  <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.1)' }} />
                </div>

                <div style={{ padding: '4px 20px 20px' }}>
                  {/* Year */}
                  <div style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: 1.8,
                    textTransform: 'uppercase' as const,
                    color: 'hsl(var(--muted-foreground))',
                    marginBottom: 6,
                  }}>
                    {selectedEntry.year}
                  </div>

                  {/* Tournament name + badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'hsl(var(--foreground))', flex: 1 }}>
                      {selectedEntry.tournamentName}
                    </div>
                    {selectedEntry.isWinner && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '4px 10px', borderRadius: 8,
                        background: 'rgba(245,158,11,0.15)',
                        fontSize: 11, fontWeight: 800, color: '#92400E',
                        flexShrink: 0,
                      }}>
                        🏆 Called It
                      </div>
                    )}
                  </div>

                  {/* Pick result card */}
                  <div style={{
                    borderRadius: 14, padding: '14px 16px',
                    marginBottom: 16,
                    background: selectedEntry.isWinner
                      ? 'rgba(245,158,11,0.06)'
                      : 'hsl(var(--muted) / 0.3)',
                    border: selectedEntry.isWinner
                      ? '1px solid rgba(245,158,11,0.2)'
                      : '1px solid hsl(var(--border))',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'hsl(var(--foreground))', marginBottom: 3 }}>
                        {selectedEntry.topPickName}
                      </div>
                      <div style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>
                        {selectedEntry.scoreToPar !== null
                          ? (selectedEntry.scoreToPar === 0 ? 'E' : selectedEntry.scoreToPar < 0 ? String(selectedEntry.scoreToPar) : `+${selectedEntry.scoreToPar}`)
                          : '—'}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 24, fontWeight: 900,
                      color: selectedEntry.isWinner ? 'hsl(var(--accent-amber))' : 'hsl(var(--foreground))',
                      background: selectedEntry.isWinner ? 'rgba(245,158,11,0.1)' : 'hsl(var(--muted) / 0.3)',
                      borderRadius: 10, padding: '6px 12px',
                    }}>
                      {selectedEntry.isWinner ? '🏆' : selectedEntry.actualPosition ?? '—'}
                    </div>
                  </div>

                  {/* CTA button */}
                  <button
                    onClick={() => {
                      setSelectedEntry(null);
                      navigate(`/tourhub/tournament/${selectedEntry.tournamentId}`);
                    }}
                    style={{
                      width: '100%', padding: '14px 0',
                      borderRadius: 14, border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--card))',
                      fontSize: 13, fontWeight: 600,
                      color: 'hsl(var(--foreground))',
                      cursor: 'pointer',
                    }}
                  >
                    View Full Tournament
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

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

  // DEV PREVIEW — REMOVE BEFORE RELEASE: Force results tab for UI review
  const getDefaultTab = useMemo(() => {
    return 'results';
  }, [isLive, hasUpcoming, isCompleted]);

  const [activeMainTab, setActiveMainTab] = useState(getDefaultTab);

  // Sync active tab when available tabs change (e.g., data loads)
  useEffect(() => {
    if (tabs.length > 0 && !tabs.find(t => t.id === activeMainTab)) {
      setActiveMainTab(getDefaultTab);
    }
  }, [tabs, activeMainTab, getDefaultTab]);

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
              <NextUpPickCard
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
              courseName={data.tournament.courseName}
              tournamentName={data.tournament.name}
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
          <PredictionLeaderboard allPicks={tracker.allPicks} isCompleted={false} tournamentLeaderScore={tracker.tournamentLeaderScore} />

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
            courseName={data.tournament.courseName}
            tournamentName={data.tournament.name}
          />
        )}
      </div>
    );
  };

  const renderResultsContent = () => {
    if (!data?.tournament) return null;

    return (
      <>
        <TournamentResultsCard
          tournamentId={data.tournament.id}
          tournamentName={data.tournament.name}
          courseName={data.tournament.courseName}
          location={data.tournament.location}
          allPicks={tracker?.allPicks}
          tourSlug="pga"
        />
        <PickRecordRail />
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
