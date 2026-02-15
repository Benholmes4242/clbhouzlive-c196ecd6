/**
 * HoleStatsTab - Hole-by-hole tournament statistics
 * 
 * Editorial layout: no card containers, flowing list with dividers,
 * toughest/easiest holes podiums, summary stats strip, front/back nine dividers.
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { Target, TrendingUp, TrendingDown, Flame, Leaf } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { RoundSelector } from './RoundSelector';
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
    <motion.div
      className="flex items-center justify-center min-h-[300px] py-12"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center space-y-3">
        <Target className="w-12 h-12 mx-auto text-muted-foreground/30" />
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">{subtitle}</p>
      </div>
    </motion.div>
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

// Scoring distribution bar
function ScoringBar({ hole }: { hole: ProcessedHole }) {
  const total = hole.eagles + hole.birdies + hole.pars + hole.bogeys + hole.doubleBogeys + hole.other;
  if (total === 0) return null;

  const segments = [
    { count: hole.eagles, color: 'bg-amber-400', label: 'Eag' },
    { count: hole.birdies, color: 'bg-green-500', label: 'Bir' },
    { count: hole.pars, color: 'bg-blue-400', label: 'Par' },
    { count: hole.bogeys, color: 'bg-orange-400', label: 'Bog' },
    { count: hole.doubleBogeys + hole.other, color: 'bg-red-500', label: 'Dbl+' },
  ].filter(s => s.count > 0);

  return (
    <div className="space-y-1">
      <div className="flex h-2.5 rounded-full overflow-hidden">
        {segments.map((seg, i) => (
          <div
            key={i}
            className={cn("transition-all", seg.color)}
            style={{ width: `${(seg.count / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-2.5 gap-y-0.5">
        {segments.map((seg, i) => (
          <span key={i} className="text-[10px] text-muted-foreground font-mono tabular-nums">
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

  // Determine available rounds
  const availableRounds = useMemo(() => {
    if (!rawHoleStats || rawHoleStats.length === 0) return ['Overall'];
    const rounds = [...new Set(rawHoleStats.map((h: any) => h.round_number))].sort();
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
        existing.eagles += stat.eagles || 0;
        existing.birdies += stat.birdies || 0;
        existing.pars += stat.pars || 0;
        existing.bogeys += stat.bogeys || 0;
        existing.doubleBogeys += stat.double_bogeys || 0;
        existing.other += stat.other || 0;
        existing.scoringAverage = (existing.scoringAverage + (stat.scoring_average || 0)) / 2;
        existing.avgDiff = (existing.avgDiff + (stat.avg_diff || 0)) / 2;
      } else {
        holeMap.set(stat.hole_number, {
          holeNumber: stat.hole_number,
          par: stat.par,
          yardage: stat.yardage,
          scoringAverage: stat.scoring_average || 0,
          avgDiff: stat.avg_diff || 0,
          eagles: stat.eagles || 0,
          birdies: stat.birdies || 0,
          pars: stat.pars || 0,
          bogeys: stat.bogeys || 0,
          doubleBogeys: stat.double_bogeys || 0,
          other: stat.other || 0,
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

  return (
    <motion.div
      ref={contentRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Round selector */}
      {availableRounds.length > 1 && (
        <RoundSelector
          rounds={availableRounds}
          activeRound={selectedRound}
          onRoundChange={setSelectedRound}
        />
      )}

      {/* Toughest holes */}
      {toughestHoles.length > 0 && (
        <div className="px-4 pt-6 pb-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Flame className="w-3.5 h-3.5 text-red-500" />
            <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
              Toughest Holes
            </span>
          </div>
          <div className="flex gap-3">
            {toughestHoles.map((hole, idx) => (
              <div
                key={hole.holeNumber}
                className="flex-1 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/30 p-3 text-center"
              >
                <div className="text-sm font-bold text-red-500">#{idx + 1}</div>
                <div className="text-xl font-bold text-foreground font-mono tabular-nums">
                  Hole {hole.holeNumber}
                </div>
                <div className="text-xs text-muted-foreground">
                  Par {hole.par} · Avg {hole.scoringAverage.toFixed(2)}
                </div>
                <div className="text-sm font-semibold text-red-500 mt-1 font-mono tabular-nums">
                  +{hole.avgDiff.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Easiest holes */}
      {easiestHoles.length > 0 && easiestHoles[0].avgDiff < 0 && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Leaf className="w-3.5 h-3.5 text-green-500" />
            <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
              Easiest Holes
            </span>
          </div>
          <div className="flex gap-3">
            {easiestHoles.map((hole, idx) => (
              <div
                key={hole.holeNumber}
                className="flex-1 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-100 dark:border-green-900/30 p-3 text-center"
              >
                <div className="text-sm font-bold text-green-600">#{idx + 1}</div>
                <div className="text-xl font-bold text-foreground font-mono tabular-nums">
                  Hole {hole.holeNumber}
                </div>
                <div className="text-xs text-muted-foreground">
                  Par {hole.par} · Avg {hole.scoringAverage.toFixed(2)}
                </div>
                <div className="text-sm font-semibold text-green-600 mt-1 font-mono tabular-nums">
                  {hole.avgDiff.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Course summary stats strip */}
      {summary && (
        <div className="border-y border-border grid grid-cols-3 text-center py-4">
          <div>
            <div className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
              Course Avg
            </div>
            <div className="text-xl font-bold text-foreground font-mono tabular-nums">
              {summary.avgScore.toFixed(1)}
            </div>
            <div className="text-[10px] text-muted-foreground font-mono tabular-nums">Par {summary.totalPar}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
              Birdies
            </div>
            <div className="text-xl font-bold text-green-600 font-mono tabular-nums">
              {summary.totalBirdies}
            </div>
            {summary.totalEagles > 0 && (
              <div className="text-[10px] text-muted-foreground font-mono tabular-nums">{summary.totalEagles} eagles</div>
            )}
          </div>
          <div>
            <div className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
              Bogeys
            </div>
            <div className="text-xl font-bold text-red-500 font-mono tabular-nums">
              {summary.totalBogeys}
            </div>
          </div>
        </div>
      )}

      {/* Hole rows — flowing list */}
      <div>
        {/* Front Nine header */}
        {frontNine.length > 0 && (
          <div className="bg-muted/50 text-center py-2 border-b border-border">
            <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
              Front Nine
            </span>
            {frontNineAvg !== null && (
              <span className="text-[10px] text-muted-foreground ml-2 font-mono tabular-nums">
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
          <div className="bg-muted/50 text-center py-2 border-y border-border">
            <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
              Back Nine
            </span>
            {backNineAvg !== null && (
              <span className="text-[10px] text-muted-foreground ml-2 font-mono tabular-nums">
                Avg {backNineAvg.toFixed(1)} (Par {backNinePar})
              </span>
            )}
          </div>
        )}

        {backNine.map((hole) => (
          <HoleRow key={hole.holeNumber} hole={hole} total={processedHoles.length} />
        ))}
      </div>
    </motion.div>
  );
}

// Extracted hole row for performance
const HoleRow = ({ hole, total }: { hole: ProcessedHole; total: number }) => (
  <div className="flex items-start gap-3 py-5 px-4 border-b border-border">
    {/* Hole badge */}
    <div className={cn(
      "w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
      getDiffBadge(hole.avgDiff)
    )}>
      {hole.holeNumber}
    </div>

    {/* Content */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">Par {hole.par}</span>
          {hole.yardage && (
            <span className="text-xs text-muted-foreground font-mono tabular-nums">{hole.yardage} yds</span>
          )}
        </div>
        {/* Difficulty indicator */}
        <div className="shrink-0">
          {hole.avgDiff > 0 ? (
            <div className="flex items-center gap-0.5 text-red-500">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="font-mono text-xs font-semibold tabular-nums">+{hole.avgDiff.toFixed(2)}</span>
            </div>
          ) : hole.avgDiff < 0 ? (
            <div className="flex items-center gap-0.5 text-green-600">
              <TrendingDown className="w-3.5 h-3.5" />
              <span className="font-mono text-xs font-semibold tabular-nums">{hole.avgDiff.toFixed(2)}</span>
            </div>
          ) : (
            <span className="font-mono text-xs text-muted-foreground tabular-nums">Even</span>
          )}
        </div>
      </div>

      {/* Average score indicator */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full relative overflow-hidden">
          {hole.avgDiff !== 0 && (
            <div
              className={cn(
                "absolute top-0 h-full rounded-full",
                hole.avgDiff > 0 ? "bg-red-400/60 left-1/2" : "bg-green-400 right-1/2"
              )}
              style={{
                width: `${Math.min(Math.abs(hole.avgDiff) * 50, 50)}%`,
              }}
            />
          )}
          <div className="absolute top-0 left-1/2 w-px h-full bg-muted-foreground/30" />
        </div>
        <span className="font-mono text-base font-bold text-foreground w-12 text-right tabular-nums">
          {hole.scoringAverage.toFixed(2)}
        </span>
      </div>

      {/* Scoring distribution */}
      <ScoringBar hole={hole} />
    </div>
  </div>
);
