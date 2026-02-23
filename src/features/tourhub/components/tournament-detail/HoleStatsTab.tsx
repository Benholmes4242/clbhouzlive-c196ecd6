/**
 * HoleStatsTab - Hole-by-hole tournament statistics
 * 
 * World-class editorial layout: elevated cards, refined typography,
 * toughest/easiest holes podiums, summary stats strip, front/back nine dividers.
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { Target, TrendingUp, TrendingDown, Flame, Leaf, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { RoundSelector } from './RoundSelector';
import { TournamentEmptyState } from './TournamentEmptyState';
import { useTourHoleStats } from '../../hooks/useTourHubData';

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
}

// Loading skeleton
function HoleStatsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-muted rounded-full w-40" />
      <div className="flex gap-3 px-4">
        {[1, 2, 3].map(i => (
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

// Difficulty badge color
function getDiffBadge(avgDiff: number) {
  if (avgDiff > 0.05) return 'bg-red-500 text-white';
  if (avgDiff > 0.01) return 'bg-orange-100 text-orange-700';
  if (avgDiff > -0.01) return 'bg-gray-100 text-gray-600';
  if (avgDiff > -0.15) return 'bg-green-100 text-green-700';
  return 'bg-green-500 text-white';
}

// Scoring distribution bar — refined colors
function ScoringBar({ hole }: { hole: ProcessedHole }) {
  const total = hole.eagles + hole.birdies + hole.pars + hole.bogeys + hole.doubleBogeys + hole.other;
  if (total === 0) return null;

  const segments = [
    { count: hole.eagles, color: '#f59e0b', label: 'Eag' },
    { count: hole.birdies, color: '#22C55E', label: 'Bir' },
    { count: hole.pars, color: '#3B82F6', label: 'Par' },
    { count: hole.bogeys, color: '#F97316', label: 'Bog' },
    { count: hole.doubleBogeys + hole.other, color: '#EF4444', label: 'Dbl+' },
  ].filter(s => s.count > 0);

  return (
    <div className="space-y-1">
      <div className="flex h-2.5 rounded-full overflow-hidden">
        {segments.map((seg, i) => (
          <div
            key={i}
            className="transition-all"
            style={{ width: `${(seg.count / total) * 100}%`, backgroundColor: seg.color }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-2.5 gap-y-0.5">
        {segments.map((seg, i) => (
          <span key={i} className="text-muted-foreground" style={{ fontSize: '10px', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
            {seg.count} {seg.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function HoleStatsTab({ tournamentId, isCompleted }: HoleStatsTabProps) {
  const [selectedRound, setSelectedRound] = useState('Overall');
  const { data: rawHoleStats, isLoading } = useTourHoleStats(tournamentId);
  const contentRef = useRef<HTMLDivElement>(null);

  // Scroll to top when switching rounds
  useEffect(() => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selectedRound]);

  // Determine available rounds — FIX A: hide individual tabs if only 1 round
  const availableRounds = useMemo(() => {
    if (!rawHoleStats || rawHoleStats.length === 0) return ['Overall'];
    const rounds = [...new Set(rawHoleStats.map((h: any) => h.round_number))].sort();
    // If only 1 round exists (e.g., LIV), don't show individual round tabs — only Overall
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
      const existing = holeMap.get(stat.hole_number);
      if (existing) {
        existing.eagles += Number(stat.eagles) || 0;
        existing.birdies += Number(stat.birdies) || 0;
        existing.pars += Number(stat.pars) || 0;
        existing.bogeys += Number(stat.bogeys) || 0;
        existing.doubleBogeys += Number(stat.double_bogeys) || 0;
        existing.other += Number(stat.other) || 0;
        existing.scoringAverage = (existing.scoringAverage + (Number(stat.scoring_average) || 0)) / 2;
        existing.avgDiff = (existing.avgDiff + (Number(stat.avg_diff) || 0)) / 2;
      } else {
        holeMap.set(stat.hole_number, {
          holeNumber: stat.hole_number,
          par: stat.par,
          yardage: stat.yardage,
          scoringAverage: Number(stat.scoring_average) || 0,
          avgDiff: Number(stat.avg_diff) || 0,
          eagles: Number(stat.eagles) || 0,
          birdies: Number(stat.birdies) || 0,
          pars: Number(stat.pars) || 0,
          bogeys: Number(stat.bogeys) || 0,
          doubleBogeys: Number(stat.double_bogeys) || 0,
          other: Number(stat.other) || 0,
          totalPlayers: stat.raw_data?.players || 0,
          difficultyRank: 0,
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

  const frontNineAvg = frontNine.length > 0 ? frontNine.reduce((a, h) => a + h.scoringAverage, 0) : null;
  const backNineAvg = backNine.length > 0 ? backNine.reduce((a, h) => a + h.scoringAverage, 0) : null;
  const frontNinePar = frontNine.reduce((a, h) => a + h.par, 0);
  const backNinePar = backNine.reduce((a, h) => a + h.par, 0);

  if (isLoading) return <HoleStatsSkeleton />;
  if (!rawHoleStats || rawHoleStats.length === 0) {
    return <HoleStatsEmpty isCompleted={isCompleted} />;
  }

  // TD-03: Check if selected round has actual data
  const hasRoundData = processedHoles.some(h => h.scoringAverage > 0);

  return (
    <motion.div
      ref={contentRef}
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

      {/* TD-03: Empty round state */}
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
                <Flame className="w-4 h-4 text-red-500" />
                <span className="text-muted-foreground/60" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' as const }}>
                  Toughest Holes
                </span>
              </div>
              <div className="flex gap-3">
                {toughestHoles.map((hole, idx) => (
                  <div
                    key={hole.holeNumber}
                    className="flex-1 bg-card rounded-2xl border border-border/50 p-4 text-center"
                    style={{ borderLeft: '3px solid #EF4444', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                  >
                    <div className="font-bold text-red-500" style={{ fontSize: '11px' }}>#{idx + 1}</div>
                    <div className="text-xl font-bold text-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      Hole {hole.holeNumber}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Par {hole.par} · Avg {hole.scoringAverage.toFixed(2)}
                    </div>
                    <div className="font-semibold text-red-500 mt-1" style={{ fontSize: '13px', fontVariantNumeric: 'tabular-nums' }}>
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
                <Leaf className="w-4 h-4 text-green-500" />
                <span className="text-muted-foreground/60" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' as const }}>
                  Easiest Holes
                </span>
              </div>
              <div className="flex gap-3">
                {easiestHoles.map((hole, idx) => (
                  <div
                    key={hole.holeNumber}
                    className="flex-1 bg-card rounded-2xl border border-border/50 p-4 text-center"
                    style={{ borderLeft: '3px solid #22C55E', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                  >
                    <div className="font-bold text-green-600" style={{ fontSize: '11px' }}>#{idx + 1}</div>
                    <div className="text-xl font-bold text-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      Hole {hole.holeNumber}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Par {hole.par} · Avg {hole.scoringAverage.toFixed(2)}
                    </div>
                    <div className="font-semibold text-green-600 mt-1" style={{ fontSize: '13px', fontVariantNumeric: 'tabular-nums' }}>
                      {hole.avgDiff.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Course summary stats strip — FIX D: card-style container */}
          {hasRoundData && summary && (
            <div
              className="bg-card rounded-2xl border border-border/50 grid grid-cols-3 text-center p-5 mt-8"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
            >
              <div>
                <div className="text-muted-foreground/60" style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' as const }}>
                  Course Avg
                </div>
                <div className="text-foreground" style={{ fontSize: '22px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  {summary.avgScore.toFixed(1)}
                </div>
                <div className="text-muted-foreground" style={{ fontSize: '11px', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>Par {summary.totalPar}</div>
              </div>
              <div>
                <div className="text-muted-foreground/60" style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' as const }}>
                  Birdies
                </div>
                <div style={{ fontSize: '22px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#22C55E' }}>
                  {summary.totalBirdies}
                </div>
                {summary.totalEagles > 0 && (
                  <div className="text-muted-foreground" style={{ fontSize: '11px', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{summary.totalEagles} eagles</div>
                )}
              </div>
              <div>
                <div className="text-muted-foreground/60" style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' as const }}>
                  Bogeys
                </div>
                <div style={{ fontSize: '22px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#EF4444' }}>
                  {summary.totalBogeys}
                </div>
              </div>
            </div>
          )}

          {/* Hole rows — flowing list */}
          <div className="mt-8">
            {/* Front Nine header */}
            {frontNine.length > 0 && (
              <div className="text-center py-2.5" style={{ borderBottom: '1px solid hsl(var(--border) / 0.15)' }}>
                <span className="text-muted-foreground/60" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' as const }}>
                  Front Nine
                </span>
                {frontNineAvg !== null && (
                  <span className="text-muted-foreground ml-2" style={{ fontSize: '11px', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                    Avg {frontNineAvg.toFixed(1)} (Par {frontNinePar})
                  </span>
                )}
              </div>
            )}

            {frontNine.map((hole) => (
              <HoleRow key={hole.holeNumber} hole={hole} total={processedHoles.length} />
            ))}

            {/* Back Nine header */}
            {backNine.length > 0 && (
              <div className="text-center py-2.5 mt-2" style={{ borderBottom: '1px solid hsl(var(--border) / 0.15)' }}>
                <span className="text-muted-foreground/60" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' as const }}>
                  Back Nine
                </span>
                {backNineAvg !== null && (
                  <span className="text-muted-foreground ml-2" style={{ fontSize: '11px', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                    Avg {backNineAvg.toFixed(1)} (Par {backNinePar})
                  </span>
                )}
              </div>
            )}

            {backNine.map((hole) => (
              <HoleRow key={hole.holeNumber} hole={hole} total={processedHoles.length} />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Extracted hole row — refined layout (FIX E + G)
const HoleRow = ({ hole, total }: { hole: ProcessedHole; total: number }) => {
  const hasData = hole.scoringAverage > 0;

  return (
    <div
      className="flex items-start gap-3 py-4 px-0"
      style={{ borderBottom: '1px solid hsl(var(--border) / 0.15)' }}
    >
      {/* Hole badge — w-10 h-10 */}
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
        getDiffBadge(hole.avgDiff)
      )} style={{ fontSize: '13px', fontWeight: 700 }}>
        {hole.holeNumber}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-foreground" style={{ fontSize: '14px', fontWeight: 600 }}>Par {hole.par}</span>
            {hole.yardage && (
              <span className="text-muted-foreground" style={{ fontSize: '12px', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{hole.yardage} yds</span>
            )}
          </div>
          {/* Difficulty indicator */}
          <div className="shrink-0">
            {hole.avgDiff > 0 ? (
              <div className="flex items-center gap-0.5" style={{ color: '#EF4444' }}>
                <TrendingUp className="w-3 h-3" />
                <span style={{ fontSize: '12px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>+{hole.avgDiff.toFixed(2)}</span>
              </div>
            ) : hole.avgDiff < 0 ? (
              <div className="flex items-center gap-0.5" style={{ color: '#22C55E' }}>
                <TrendingDown className="w-3 h-3" />
                <span style={{ fontSize: '12px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{hole.avgDiff.toFixed(2)}</span>
              </div>
            ) : (
              <span className="text-muted-foreground" style={{ fontSize: '12px', fontVariantNumeric: 'tabular-nums' }}>Even</span>
            )}
          </div>
        </div>

        {/* FIX G: Only render scoring data if we have it */}
        {hasData ? (
          <>
            {/* Average score indicator — refined */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-1 bg-muted/50 rounded-full relative overflow-hidden">
                {hole.avgDiff !== 0 && (
                  <div
                    className={cn(
                      "absolute top-0 h-full rounded-full",
                      hole.avgDiff > 0 ? "left-1/2" : "right-1/2"
                    )}
                    style={{
                      width: `${Math.min(Math.abs(hole.avgDiff) * 50, 50)}%`,
                      backgroundColor: hole.avgDiff > 0 ? 'rgba(248,113,113,0.4)' : 'rgba(74,222,128,0.4)',
                    }}
                  />
                )}
                <div className="absolute top-0 left-1/2 w-px h-2 bg-border" style={{ transform: 'translateY(-1px)' }} />
                {hole.avgDiff !== 0 && (
                  <div
                    className="absolute rounded-full"
                    style={{
                      width: '6px',
                      height: '6px',
                      top: '-1px',
                      left: `calc(50% + ${Math.min(Math.max(hole.avgDiff * 50, -50), 50)}%)`,
                      transform: 'translateX(-50%)',
                      backgroundColor: hole.avgDiff > 0 ? '#EF4444' : '#22C55E',
                    }}
                  />
                )}
              </div>
              <span className="text-foreground w-12 text-right" style={{ fontSize: '15px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {hole.scoringAverage.toFixed(2)}
              </span>
            </div>

            {/* Scoring distribution */}
            <ScoringBar hole={hole} />
          </>
        ) : (
          <div className="text-muted-foreground" style={{ fontSize: '14px', fontVariantNumeric: 'tabular-nums' }}>—</div>
        )}
      </div>
    </div>
  );
};
