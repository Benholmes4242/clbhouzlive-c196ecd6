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

import { PredictionLeaderboard } from './PredictionLeaderboard';
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
      <div style={{ background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)', borderBottom: '1px solid rgba(15,23,42,0.07)', padding: '12px 16px' }}>
        <div style={{ height: 12, width: 160, borderRadius: 6, background: 'rgba(15,23,42,0.06)', marginBottom: 10 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="animate-pulse" style={{ width: 90, height: 88, borderRadius: 10, background: 'rgba(15,23,42,0.06)', flexShrink: 0 }} />
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
      <div style={{
        background: '#ffffff',
        borderTop: '1px solid rgba(15,23,42,0.07)',
        borderBottom: '1px solid rgba(15,23,42,0.07)',
        padding: '12px 16px',
      }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 3, height: 14, background: '#0F172A', borderRadius: 1, flexShrink: 0 }} />
            <span style={{ fontSize: 9, fontWeight: 900, color: '#0F172A', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
              Our Pick Record · Season 2025–26
            </span>
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {wins > 0 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '3px 7px', borderRadius: 6, background: 'rgba(247,147,30,0.07)', border: '0.5px solid rgba(247,147,30,0.2)', lineHeight: 1 }}>
                <span style={{ fontSize: 9, lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}>🏆</span>
                <span style={{ fontSize: 9, fontWeight: 800, color: '#F7931E', lineHeight: 1 }}>{wins} win{wins !== 1 ? 's' : ''}</span>
              </div>
            )}
            {top5 > 0 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '3px 7px', borderRadius: 6, background: 'rgba(22,163,74,0.07)', border: '0.5px solid rgba(22,163,74,0.2)', lineHeight: 1 }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: '#16A34A', lineHeight: 1 }}>{top5} top-5</span>
              </div>
            )}
          </div>
        </div>

        {/* Scroll rail */}
        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {pickHistory.map((entry) => {
            const surname = entry.topPickName.split(' ').pop() ?? entry.topPickName;
            return (
              <div
                key={entry.tournamentId}
                onClick={() => setSelectedEntry(entry)}
                style={{
                  width: 88, flexShrink: 0, borderRadius: 10, padding: '9px 10px', cursor: 'pointer',
                  background: entry.isWinner ? 'rgba(247,147,30,0.06)' : 'rgba(15,23,42,0.03)',
                  border: entry.isWinner ? '1px solid rgba(247,147,30,0.2)' : '0.5px solid rgba(15,23,42,0.08)',
                }}
              >
                <div style={{ fontSize: 9, fontWeight: 700, color: entry.isWinner ? '#F7931E' : '#94A3B8', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                  {entry.shortName}
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                  {surname}
                </div>
                {entry.isWinner ? (
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#F7931E' }}>🏆 Won</div>
                ) : entry.actualPosition && entry.actualPosition <= 5 ? (
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#16A34A' }}>
                    {entry.actualPositionTied ? 'T' : ''}{entry.actualPosition}{['st','nd','rd'][((entry.actualPosition % 100)-20)%10-1] || ['st','nd','rd'][(entry.actualPosition%100)-1] || 'th'}
                  </div>
                ) : (
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8' }}>
                    {entry.actualPosition ? `${entry.actualPositionTied ? 'T' : ''}${entry.actualPosition}th` : '—'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom sheet — keep existing portal/sheet JSX unchanged */}
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

function PickRecordBadge() {
  const { data: pickHistory = [], isLoading } = usePickHistory();
  if (isLoading || !pickHistory.length) return null;

  const wins = pickHistory.filter(e => e.isWinner).length;
  const top5 = pickHistory.filter(e => e.actualPosition !== null && e.actualPosition <= 5).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 4, flexShrink: 0 }}>
      {wins > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 4,
          padding: '3px 8px', borderRadius: 6,
          background: 'rgba(247,147,30,0.08)',
          border: '0.5px solid rgba(247,147,30,0.25)',
        }}>
          <span style={{ fontSize: 10 }}>🏆</span>
          <span style={{ fontSize: 10, fontWeight: 800, color: '#F7931E' }}>
            {wins} win{wins !== 1 ? 's' : ''}
          </span>
        </div>
      )}
      {top5 > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 4,
          padding: '3px 8px', borderRadius: 6,
          background: 'rgba(22,163,74,0.07)',
          border: '0.5px solid rgba(22,163,74,0.25)',
        }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: '#16A34A' }}>
            {top5} top-5
          </span>
        </div>
      )}
    </div>
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
  const tabs = useMemo(() => {
    const result: Array<{ id: string; label: string; hasLiveDot?: boolean }> = [];
    if (isLive) result.push({ id: 'live', label: 'Live', hasLiveDot: true });
    if (hasUpcoming) result.push({ id: 'nextup', label: 'Upcoming' });
    if (isCompleted) result.push({ id: 'results', label: 'Results' });
    if (!isLive && !isCompleted && !hasUpcoming) {
      result.push({ id: 'current', label: 'Current' });
    }
    return result;
  }, [isLive, hasUpcoming, isCompleted]);

  const getDefaultTab = useMemo(() => {
    if (isLive) return 'live';
    if (hasUpcoming) return 'nextup';
    if (isCompleted) return 'results';
    return 'current';
  }, [isLive, hasUpcoming, isCompleted]);

  const [activeMainTab, setActiveMainTab] = useState(getDefaultTab);

  useEffect(() => {
    if (tabs.length > 0 && !tabs.find(t => t.id === activeMainTab)) {
      setActiveMainTab(getDefaultTab);
    }
  }, [tabs, activeMainTab, getDefaultTab]);

  const [activeSubTab, setActiveSubTab] = useState<IntelligenceTab>('predictions');
  const [showCourseDNA, setShowCourseDNA] = useState(false);

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

  const renderSecondaryContent = () => {
    switch (activeMainTab) {
      case 'live':
        if (isWaitingForPlay) {
          return (
            <div className="space-y-4 pb-6">
              <div
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '10px 16px', borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.15)',
                }}
              >
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.8)', flexShrink: 0 }} />
                <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'hsl(var(--foreground) / 0.6)' }}>
                  Play begins shortly — tracking starts when scores are in
                </span>
              </div>
              {data.courseDNA.length > 0 && <CourseDNACard items={data.courseDNA} courseName={data.tournament.courseName} inline />}
              <ClubhouseIntelligence insight={data.clubhouseIntelligence} inline />
            </div>
          );
        }
        if (tracker) {
          return (
            <div>
              <PredictionLeaderboard allPicks={tracker.allPicks} isCompleted={false} tournamentLeaderScore={tracker.tournamentLeaderScore} />

              {/* Course DNA toggle — dispatch style */}
              <div style={{
                background: '#ffffff',
                borderTop: '1px solid rgba(15,23,42,0.07)',
                borderBottom: '1px solid rgba(15,23,42,0.07)',
                marginTop: 12,
              }}>
                <button
                  onClick={() => setShowCourseDNA(!showCourseDNA)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '11px 16px', background: 'transparent', border: 'none', cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 3, height: 14, background: '#0F172A', borderRadius: 1 }} />
                    <span style={{ fontSize: 9, fontWeight: 900, color: '#0F172A', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
                      Course DNA
                    </span>
                  </div>
                  <span style={{
                    fontSize: 12, color: '#94A3B8',
                    transform: showCourseDNA ? 'rotate(90deg)' : 'none',
                    transition: 'transform 0.18s', display: 'inline-block',
                  }}>›</span>
                </button>
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
        return null;

      case 'nextup':
      case 'current': {
        const insightsData = activeMainTab === 'nextup' ? nextTournamentInsights : data;
        if (!insightsData) {
          if (nextTournamentPredictionsLoading) return <GeneratingPredictionsSkeleton />;
          if (nextTournamentPreview) return <GeneratingPredictionsSkeleton label="Generating predictions…" />;
          return null;
        }
        return (
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
        );
      }

      case 'results':
        return null;

      default:
        return null;
    }
  };

  return (
    <section aria-label="Featured tournament analysis" style={{ background: '#F8FAFC' }}>
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        viewport={{ once: true }}
        style={{ padding: '20px 16px 0' }}
      >
        {/* Top row: identity + social proof */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            {/* Amber stamp eyebrow */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: '#F7931E', borderRadius: 6, padding: '3px 9px',
              marginBottom: 7,
            }}>
              <span style={{ fontSize: 10 }}>⚡</span>
              <span style={{ fontSize: 9, fontWeight: 900, color: '#451A03', letterSpacing: '0.06em' }}>
                AI PREDICTIONS
              </span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', margin: 0, lineHeight: 1.05 }}>
              Tournament Intelligence
            </h2>
            <p style={{ fontSize: 11, color: '#94A3B8', margin: '3px 0 0' }}>
              Know who to back before a shot is hit. AI picks built on course history, player form and field strength.
            </p>
          </div>
          <PickRecordBadge />
        </div>

        {/* Tab bar — flat underline */}
        {tabs.length > 1 && (
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(15,23,42,0.1)' }}>
            {tabs.map(tab => {
              const isActive = tab.id === activeMainTab;
              const isLiveTab = tab.id === 'live';
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveMainTab(tab.id)}
                  style={{
                    flex: 1,
                    padding: '9px 0',
                    fontSize: '12px',
                    fontWeight: isActive ? 800 : 500,
                    color: isActive ? '#0F172A' : '#94A3B8',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: `2px solid ${isActive ? (isLiveTab ? '#22C55E' : '#F7931E') : 'transparent'}`,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                    transition: 'all 0.15s',
                  }}
                  className="active:scale-[0.97] transition-transform"
                >
                  {tab.hasLiveDot && (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block', flexShrink: 0 }} />
                  )}
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Hero Card — full bleed with section rule */}
      {heroData && (
        <div style={{ borderBottom: '3px solid #0F172A', marginBottom: 0, padding: '0 16px' }}>
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
        </div>
      )}

      {/* ── Pick card — always first after hero ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`picks-${activeMainTab}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ paddingTop: 16 }}
        >
          {activeMainTab === 'live' && !isWaitingForPlay && data.winners.length > 0 && (
            <NextUpPickCard
              featured={data.winners[0]}
              cards={data.contenderCards}
              withdrawnPlayerIds={withdrawnPlayerIds}
            />
          )}
          {activeMainTab === 'nextup' && nextTournamentInsights?.winners && nextTournamentInsights.winners.length > 0 && (
            <NextUpPickCard
              featured={nextTournamentInsights.winners[0]}
              cards={nextTournamentInsights.contenderCards}
              withdrawnPlayerIds={withdrawnPlayerIds}
            />
          )}
          {activeMainTab === 'results' && (
            <TournamentResultsCard
              tournamentId={data.tournament.id}
              tournamentName={data.tournament.name}
              courseName={data.tournament.courseName}
              location={data.tournament.location}
              allPicks={tracker?.allPicks}
              tourSlug="pga"
            />
          )}
          {activeMainTab === 'current' && data.winners.length > 0 && (
            <NextUpPickCard
              featured={data.winners[0]}
              cards={data.contenderCards}
              withdrawnPlayerIds={withdrawnPlayerIds}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Pick Record Rail — always visible ── */}
      <PickRecordRail />

      {/* ── Remaining tab content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`secondary-${activeMainTab}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ background: '#F8FAFC', paddingTop: 0 }}
        >
          {renderSecondaryContent()}
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
