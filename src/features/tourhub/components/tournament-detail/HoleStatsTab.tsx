/**
 * HoleStatsTab - Hole-by-hole tournament statistics
 * 
 * World-class editorial layout: elevated cards, refined typography,
 * toughest/easiest holes podiums, summary stats strip, front/back nine dividers.
 */

import { useState, useMemo } from 'react';
import { Target, TrendingUp, TrendingDown, Flame, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { RoundSelector } from './RoundSelector';
import { TournamentEmptyState } from './TournamentEmptyState';
import { useTourHoleStats } from '../../hooks/useTourHubData';
import type React from 'react';

interface HoleStatsTabProps {
  tournamentId: string;
  tournamentSrId: string | null;
  isLive: boolean;
  isCompleted?: boolean;
}

interface ProcessedHole {
  holeNumber: number;
  par: number;
  yardage: number | null;
  scoringAverage: number;
  avgDiff: number;
  eagles: number;
  birdies: number;
  pars: number;
  bogeys: number;
  doubleBogeys: number;
  other: number;
  totalPlayers: number;
  difficultyRank: number;
  _scoreSum: number;
  _scoreCount: number;
  _diffSum: number;
  _diffCount: number;
}

// Loading skeleton
function HoleStatsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-muted rounded-full w-40" />
      <div className="flex gap-3 px-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex-1 h-24 bg-muted rounded-xl" />
        ))}
      </div>
      <div className="border-y border-border py-4 px-4">
        <div className="h-12 bg-muted/40 rounded" />
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-20 bg-muted/30 mx-4 rounded" />
      ))}
    </div>
  );
}

// Empty state — contextual
function HoleStatsEmpty({ isCompleted, roundLabel }: { isCompleted?: boolean; roundLabel?: string }) {
  let title = 'Hole Statistics Not Available Yet';
  let subtitle = 'Hole-by-hole statistics will appear once play begins.';

  if (isCompleted) {
    title = 'Hole Statistics Not Available';
    subtitle = 'Detailed hole statistics are not available for this tournament.';
  } else if (roundLabel) {
    title = `${roundLabel} Statistics Not Yet Available`;
    subtitle = `${roundLabel} statistics will appear during play.`;
  }

  return (
    <TournamentEmptyState
      icon={<Target className="w-16 h-16" />}
      title={title}
      subtitle={subtitle}
    />
  );
}

// Difficulty badge style — returns inline styles for dark mode compat
function getDiffStyle(avgDiff: number): React.CSSProperties {
  if (avgDiff > 0.05) return {
    backgroundColor: 'hsl(var(--destructive) / 0.1)',
    color: 'hsl(var(--destructive))',
    border: '1px solid hsl(var(--destructive) / 0.2)',
  };
  if (avgDiff > 0.01) return {
    backgroundColor: 'hsl(var(--muted-foreground) / 0.08)',
    color: 'hsl(var(--muted-foreground))',
    border: '1px solid hsl(var(--muted-foreground) / 0.15)',
  };
  if (avgDiff > -0.01) return {
    backgroundColor: 'hsl(var(--muted))',
    color: 'hsl(var(--muted-foreground))',
  };
  if (avgDiff > -0.15) return {
    backgroundColor: 'hsl(var(--accent-amber) / 0.1)',
    color: 'hsl(var(--accent-amber))',
    border: '1px solid hsl(var(--accent-amber) / 0.2)',
  };
  return {
    backgroundColor: 'hsl(var(--accent-amber) / 0.18)',
    color: 'hsl(var(--accent-amber))',
    border: '1px solid hsl(var(--accent-amber) / 0.3)',
  };
}

// Scoring segment colours — amber spectrum for good, muted for bad
const SEGMENT_COLORS = {
  eagles: 'hsl(var(--accent-amber))',
  birdies: 'hsl(var(--accent-amber) / 0.55)',
  pars: 'hsl(var(--border))',
  bogeys: 'hsl(var(--muted-foreground) / 0.5)',
  doublePlus: 'hsl(var(--muted-foreground) / 0.8)',
};

// Scoring distribution bar
function ScoringBar({ hole }: { hole: ProcessedHole }) {
  const total = hole.eagles + hole.birdies + hole.pars + hole.bogeys + hole.doubleBogeys + hole.other;
  if (total === 0) return null;

  const segments = [
    { count: hole.eagles, color: SEGMENT_COLORS.eagles, label: 'Eag' },
    { count: hole.birdies, color: SEGMENT_COLORS.birdies, label: 'Bir' },
    { count: hole.pars, color: SEGMENT_COLORS.pars, label: 'Par' },
    { count: hole.bogeys, color: SEGMENT_COLORS.bogeys, label: 'Bog' },
    { count: hole.doubleBogeys + hole.other, color: SEGMENT_COLORS.doublePlus, label: 'Dbl+' },
  ].filter(s => s.count > 0);

  return (
    <div className="flex items-start gap-2">
      <div className="flex-1 space-y-1">
        <div className="flex h-1.5 rounded-full overflow-hidden">
          {segments.map((seg, i) => (
            <div
              key={i}
              className="transition-all"
              style={{ width: `${(seg.count / total) * 100}%`, backgroundColor: seg.color }}
            />
          ))}
        </div>
        <div className="flex items-center justify-center gap-x-2.5 mt-1">
          {segments.map((seg, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
              <span style={{ fontSize: 10, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }} className="text-muted-foreground/60">
                {seg.count}
              </span>
            </span>
          ))}
        </div>
      </div>
      <span className="text-foreground w-14 text-right shrink-0" style={{ fontSize: '15px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
        {hole.scoringAverage.toFixed(2)}
      </span>
    </div>
  );
}

export function HoleStatsTab({ tournamentId, isCompleted }: HoleStatsTabProps) {
  const [selectedRound, setSelectedRound] = useState('Overall');
  const { data: rawHoleStats, isLoading } = useTourHoleStats(tournamentId);

  // Determine available rounds — hide individual tabs if only 1 round
  const availableRounds = useMemo(() => {
    if (!rawHoleStats || rawHoleStats.length === 0) return ['Overall'];
    const rounds = [...new Set(rawHoleStats.map((h: any) => h.round_number))].sort();
    if (rounds.length <= 1) return ['Overall'];
    return ['Overall', ...rounds.map(r => `R${r}`)];
  }, [rawHoleStats]);

  // Process and aggregate hole stats
  const processedHoles = useMemo((): ProcessedHole[] => {
    if (!rawHoleStats || rawHoleStats.length === 0) return [];

    const roundNum = selectedRound === 'Overall' ? null : parseInt(selectedRound.replace('R', ''));
    const filtered = roundNum
      ? rawHoleStats.filter((h: any) => h.round_number === roundNum)
      : rawHoleStats;

    const holeMap = new Map<number, ProcessedHole>();

    for (const stat of filtered as any[]) {
      const scoreAvg = Number(stat.scoring_average) || 0;
      const diff = Number(stat.avg_diff) || 0;
      const existing = holeMap.get(stat.hole_number);

      if (existing) {
        existing.eagles += Number(stat.eagles) || 0;
        existing.birdies += Number(stat.birdies) || 0;
        existing.pars += Number(stat.pars) || 0;
        existing.bogeys += Number(stat.bogeys) || 0;
        existing.doubleBogeys += Number(stat.double_bogeys) || 0;
        existing.other += Number(stat.other) || 0;
        existing._scoreSum += scoreAvg;
        existing._scoreCount += 1;
        existing.scoringAverage = existing._scoreSum / existing._scoreCount;
        existing._diffSum += diff;
        existing._diffCount += 1;
        existing.avgDiff = existing._diffSum / existing._diffCount;
      } else {
        holeMap.set(stat.hole_number, {
          holeNumber: stat.hole_number,
          par: stat.par,
          yardage: stat.yardage,
          scoringAverage: scoreAvg,
          avgDiff: diff,
          eagles: Number(stat.eagles) || 0,
          birdies: Number(stat.birdies) || 0,
          pars: Number(stat.pars) || 0,
          bogeys: Number(stat.bogeys) || 0,
          doubleBogeys: Number(stat.double_bogeys) || 0,
          other: Number(stat.other) || 0,
          totalPlayers: stat.raw_data?.players || 0,
          difficultyRank: 0,
          _scoreSum: scoreAvg,
          _scoreCount: 1,
          _diffSum: diff,
          _diffCount: 1,
        });
      }
    }

    const holes = Array.from(holeMap.values()).sort((a, b) => a.holeNumber - b.holeNumber);
    const sorted = [...holes].sort((a, b) => b.avgDiff - a.avgDiff);
    sorted.forEach((hole, idx) => {
      const original = holes.find(h => h.holeNumber === hole.holeNumber);
      if (original) original.difficultyRank = idx + 1;
    });

    return holes;
  }, [rawHoleStats, selectedRound]);

  // Summary stats
  const summary = useMemo(() => {
    if (processedHoles.length === 0) return null;
    const totalEagles = processedHoles.reduce((a, h) => a + h.eagles, 0);
    const totalBirdies = processedHoles.reduce((a, h) => a + h.birdies, 0);
    const totalBogeys = processedHoles.reduce((a, h) => a + h.bogeys, 0);
    const avgScore = processedHoles.reduce((a, h) => a + h.scoringAverage, 0);
    const totalPar = processedHoles.reduce((a, h) => a + h.par, 0);
    return { totalEagles, totalBirdies, totalBogeys, avgScore, totalPar };
  }, [processedHoles]);

  // Toughest & easiest 3 holes
  const toughestHoles = useMemo(() =>
    [...processedHoles].sort((a, b) => b.avgDiff - a.avgDiff).slice(0, 3),
    [processedHoles]
  );
  const easiestHoles = useMemo(() =>
    [...processedHoles].sort((a, b) => a.avgDiff - b.avgDiff).slice(0, 3),
    [processedHoles]
  );

  // Front/back nine splits
  const frontNine = useMemo(() => processedHoles.filter(h => h.holeNumber <= 9), [processedHoles]);
  const backNine = useMemo(() => processedHoles.filter(h => h.holeNumber > 9), [processedHoles]);

  const frontNineTotal = frontNine.length > 0 ? frontNine.reduce((a, h) => a + h.scoringAverage, 0) : null;
  const backNineTotal = backNine.length > 0 ? backNine.reduce((a, h) => a + h.scoringAverage, 0) : null;
  const frontNinePar = frontNine.reduce((a, h) => a + h.par, 0);
  const backNinePar = backNine.reduce((a, h) => a + h.par, 0);

  if (isLoading) return <HoleStatsSkeleton />;
  if (!rawHoleStats || rawHoleStats.length === 0) {
    return <HoleStatsEmpty isCompleted={isCompleted} />;
  }

  // Check if selected round has actual data
  const hasRoundData = processedHoles.some(h => h.scoringAverage > 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Round selector — only show if more than just Overall */}
      {availableRounds.length > 1 && (
        <div className="mb-6">
          <RoundSelector
            rounds={availableRounds}
            activeRound={selectedRound}
            onRoundChange={setSelectedRound}
          />
        </div>
      )}

      {/* Empty round state */}
      {!hasRoundData && selectedRound !== 'Overall' ? (
        <motion.div
          className="flex items-center justify-center min-h-[300px] py-12"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center space-y-3">
            <Clock className="w-8 h-8 mx-auto text-muted-foreground" />
            <h3 className="text-base font-semibold text-foreground">
              {selectedRound} hasn't started yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
              Hole-by-hole stats will appear once play begins.
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="px-4">
          {/* Toughest holes */}
          {hasRoundData && toughestHoles.length > 0 && (
            <div className="mt-6 mb-3">
              <div className="flex items-center gap-1.5 mb-3">
                <Flame className="w-4 h-4" style={{ color: 'hsl(var(--destructive))' }} />
                <span className="text-muted-foreground/60" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>
                  Toughest Holes
                </span>
              </div>
              <div className="flex gap-2">
                {toughestHoles.map((hole, idx) => (
                  <div
                    key={hole.holeNumber}
                    className="flex-1 bg-card rounded-2xl border border-border/50 p-4 text-center"
                    style={{ borderLeft: '3px solid hsl(var(--destructive))' }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--destructive))' }}>#{idx + 1}</div>
                    <div className="text-xl font-bold text-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      Hole {hole.holeNumber}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Par {hole.par} · Avg {hole.scoringAverage.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'hsl(var(--destructive))', marginTop: 4 }}>
                      +{hole.avgDiff.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Easiest holes */}
          {hasRoundData && easiestHoles.length > 0 && easiestHoles[0].avgDiff < 0 && (
            <div className="mt-6 mb-3">
              <div className="flex items-center gap-1.5 mb-3">
                <TrendingDown className="w-4 h-4" style={{ color: 'hsl(var(--accent-amber))' }} />
                <span className="text-muted-foreground/60" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>
                  Easiest Holes
                </span>
              </div>
              <div className="flex gap-2">
                {easiestHoles.map((hole, idx) => (
                  <div
                    key={hole.holeNumber}
                    className="flex-1 bg-card rounded-2xl border border-border/50 p-4 text-center"
                    style={{ borderLeft: '3px solid hsl(var(--accent-amber))' }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--accent-amber))' }}>#{idx + 1}</div>
                    <div className="text-xl font-bold text-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      Hole {hole.holeNumber}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Par {hole.par} · Avg {hole.scoringAverage.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'hsl(var(--accent-amber))', marginTop: 4 }}>
                      {hole.avgDiff.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Course summary stats strip */}
          {hasRoundData && summary && (
            <div
              className="bg-card rounded-2xl border border-border/50 grid grid-cols-4 text-center p-4 mt-8"
            >
              <div>
                <div className="text-muted-foreground/60" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>
                  Course Avg
                </div>
                <div className="text-foreground" style={{ fontSize: '20px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  {summary.avgScore.toFixed(1)}
                </div>
                <div className="text-muted-foreground" style={{ fontSize: '11px', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>Par {summary.totalPar}</div>
              </div>
              <div>
                <div className="text-muted-foreground/60" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>
                  Eagles
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'hsl(var(--accent-amber))' }}>
                  {summary.totalEagles}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground/60" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>
                  Birdies
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'hsl(var(--accent-amber))' }}>
                  {summary.totalBirdies}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground/60" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>
                  Bogeys
                </div>
                <div className="text-muted-foreground" style={{ fontSize: '20px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  {summary.totalBogeys}
                </div>
              </div>
            </div>
          )}

          {/* Hole rows */}
          <div className="mt-8">
            {/* Front Nine header */}
            {frontNine.length > 0 && (
              <div
                className="flex items-center justify-between"
                style={{ borderTop: '1px solid hsl(var(--border) / 0.3)', paddingTop: '20px', marginTop: '8px' }}
              >
                <span className="text-muted-foreground/60" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>
                  Front Nine
                </span>
                {frontNineTotal !== null && (
                  <span className="text-muted-foreground" style={{ fontSize: '11px', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                    {frontNineTotal.toFixed(1)} / Par {frontNinePar}
                  </span>
                )}
              </div>
            )}

            {frontNine.map((hole) => (
              <HoleRow key={hole.holeNumber} hole={hole} total={processedHoles.length} />
            ))}

            {/* Back Nine header */}
            {backNine.length > 0 && (
              <div
                className="flex items-center justify-between"
                style={{ borderTop: '1px solid hsl(var(--border) / 0.3)', paddingTop: '20px', marginTop: '8px' }}
              >
                <span className="text-muted-foreground/60" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>
                  Back Nine
                </span>
                {backNineTotal !== null && (
                  <span className="text-muted-foreground" style={{ fontSize: '11px', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                    {backNineTotal.toFixed(1)} / Par {backNinePar}
                  </span>
                )}
              </div>
            )}

            {backNine.map((hole) => (
              <HoleRow key={hole.holeNumber} hole={hole} total={processedHoles.length} />
            ))}

            {/* Persistent color legend */}
            {hasRoundData && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                gap: 16, 
                paddingTop: 24, 
                paddingBottom: 32,
                borderTop: '1px solid hsl(var(--border) / 0.15)',
                marginTop: 8,
              }}>
                {[
                  { color: SEGMENT_COLORS.eagles, label: 'Eagles' },
                  { color: SEGMENT_COLORS.birdies, label: 'Birdies' },
                  { color: SEGMENT_COLORS.pars, label: 'Pars' },
                  { color: SEGMENT_COLORS.bogeys, label: 'Bogeys' },
                  { color: SEGMENT_COLORS.doublePlus, label: 'Dbl Bogey+' },
                ].map((item, i) => (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ 
                      width: 6, 
                      height: 6, 
                      borderRadius: '50%', 
                      backgroundColor: item.color, 
                      flexShrink: 0 
                    }} />
                    <span style={{ 
                      fontSize: 10, 
                      fontWeight: 500, 
                      color: 'hsl(var(--muted-foreground) / 0.6)' 
                    }}>
                      {item.label}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Extracted hole row
const HoleRow = ({ hole, total }: { hole: ProcessedHole; total: number }) => {
  const hasData = hole.scoringAverage > 0;

  return (
    <div
      className="flex items-start gap-3 py-4 px-0"
      style={{ borderBottom: '1px solid hsl(var(--border) / 0.15)' }}
    >
      {/* Hole badge */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{ fontSize: '12px', fontWeight: 600, ...getDiffStyle(hole.avgDiff) }}
      >
        {hole.holeNumber}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Line 1: Par + yardage (left), difficulty arrow + value (right) */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-foreground" style={{ fontSize: '14px', fontWeight: 600 }}>Par {hole.par}</span>
            {hole.yardage && hole.yardage > 0 && (
              <span className="text-muted-foreground" style={{ fontSize: '12px', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{hole.yardage} yds</span>
            )}
          </div>
          {/* Difficulty indicator */}
          <div className="shrink-0">
            {hole.avgDiff > 0 ? (
              <div className="flex items-center gap-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                <TrendingUp className="w-3 h-3" />
                <span style={{ fontSize: '12px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>+{hole.avgDiff.toFixed(2)}</span>
              </div>
            ) : hole.avgDiff < 0 ? (
              <div className="flex items-center gap-0.5" style={{ color: 'hsl(var(--accent-amber))' }}>
                <TrendingDown className="w-3 h-3" />
                <span style={{ fontSize: '12px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{hole.avgDiff.toFixed(2)}</span>
              </div>
            ) : (
              <span className="text-muted-foreground" style={{ fontSize: '12px', fontVariantNumeric: 'tabular-nums' }}>Even</span>
            )}
          </div>
        </div>

        {/* Scoring distribution bar */}
        {hasData ? (
          <ScoringBar hole={hole} />
        ) : (
          <div className="text-muted-foreground" style={{ fontSize: '14px', fontVariantNumeric: 'tabular-nums' }}>—</div>
        )}
      </div>
    </div>
  );
};
