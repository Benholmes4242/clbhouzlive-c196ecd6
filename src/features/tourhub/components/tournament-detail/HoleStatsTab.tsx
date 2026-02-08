/**
 * HoleStatsTab - Hole-by-hole tournament statistics
 * 
 * Features:
 * - Round selector with Overall option
 * - Toughest holes strip (glassmorphic)
 * - Summary stats row
 * - 18 hole cards with scoring distribution bars
 * - Difficulty-based color coding
 * - Staggered entrance animations
 */

import { useState, useMemo } from 'react';
import { Target, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { RoundSelector } from './RoundSelector';
import { useTourHoleStats } from '../../hooks/useTourHubData';

interface HoleStatsTabProps {
  tournamentId: string;
  tournamentSrId: string | null;
  isLive: boolean;
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
      <div className="h-11 bg-muted rounded-[14px]" />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-muted rounded-xl" />
        ))}
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-24 bg-muted rounded-xl" />
      ))}
    </div>
  );
}

// Empty state
function HoleStatsEmpty() {
  return (
    <motion.div
      className="flex items-center justify-center py-20"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center">
          <Target className="w-8 h-8 text-muted-foreground/70" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Hole Statistics Not Available</h3>
          <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
            Hole-by-hole statistics will appear during play.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// Difficulty color logic
function getDifficultyColor(rank: number, total: number) {
  if (rank <= 3) return 'bg-destructive text-destructive-foreground';
  if (rank <= 6) return 'bg-orange-400 text-white';
  if (rank > total - 3) return 'bg-green-500 text-white';
  return 'bg-muted text-foreground';
}

// Scoring distribution bar
function ScoringBar({ hole }: { hole: ProcessedHole }) {
  const total = hole.eagles + hole.birdies + hole.pars + hole.bogeys + hole.doubleBogeys + hole.other;
  if (total === 0) return null;

  const segments = [
    { count: hole.eagles, color: 'bg-amber-400', label: 'Eagles' },
    { count: hole.birdies, color: 'bg-green-500', label: 'Birdies' },
    { count: hole.pars, color: 'bg-muted-foreground/30', label: 'Pars' },
    { count: hole.bogeys, color: 'bg-orange-400', label: 'Bogeys' },
    { count: hole.doubleBogeys + hole.other, color: 'bg-destructive', label: 'Double+' },
  ].filter(s => s.count > 0);

  return (
    <div className="space-y-1">
      <div className="flex h-2 rounded-full overflow-hidden">
        {segments.map((seg, i) => (
          <div
            key={i}
            className={cn("transition-all", seg.color)}
            style={{ width: `${(seg.count / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {segments.map((seg, i) => (
          <span key={i} className="text-[9px] text-muted-foreground">
            {seg.count} {seg.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function HoleStatsTab({ tournamentId }: HoleStatsTabProps) {
  const [selectedRound, setSelectedRound] = useState('Overall');
  const { data: rawHoleStats, isLoading } = useTourHoleStats(tournamentId);

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

    // Filter by round
    const filtered = roundNum
      ? rawHoleStats.filter((h: any) => h.round_number === roundNum)
      : rawHoleStats;

    // Group by hole number and aggregate
    const holeMap = new Map<number, ProcessedHole>();

    for (const stat of filtered as any[]) {
      const existing = holeMap.get(stat.hole_number);
      if (existing) {
        // Aggregate across rounds (for Overall)
        existing.eagles += stat.eagles || 0;
        existing.birdies += stat.birdies || 0;
        existing.pars += stat.pars || 0;
        existing.bogeys += stat.bogeys || 0;
        existing.doubleBogeys += stat.double_bogeys || 0;
        existing.other += stat.other || 0;
        // Average the scoring average
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

    // Sort by hole number
    const holes = Array.from(holeMap.values()).sort((a, b) => a.holeNumber - b.holeNumber);

    // Calculate difficulty ranking
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
    const toughest = processedHoles.reduce((prev, curr) => curr.avgDiff > prev.avgDiff ? curr : prev);
    const easiest = processedHoles.reduce((prev, curr) => curr.avgDiff < prev.avgDiff ? curr : prev);

    return { totalEagles, totalBirdies, totalBogeys, avgScore, totalPar, toughest, easiest };
  }, [processedHoles]);

  // Toughest 3 holes
  const toughestHoles = useMemo(() => {
    return [...processedHoles].sort((a, b) => b.avgDiff - a.avgDiff).slice(0, 3);
  }, [processedHoles]);

  if (isLoading) return <HoleStatsSkeleton />;
  if (!rawHoleStats || rawHoleStats.length === 0) return <HoleStatsEmpty />;

  return (
    <motion.div
      className="space-y-4"
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

      {/* Toughest holes strip */}
      {toughestHoles.length > 0 && (
        <motion.div
          className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/30 p-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <h4 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Toughest Holes
          </h4>
          <div className="flex gap-3">
            {toughestHoles.map((hole, idx) => (
              <div
                key={hole.holeNumber}
                className="flex-1 bg-destructive/5 border border-destructive/10 rounded-xl p-3 text-center"
              >
                <div className="text-xs font-bold text-destructive/80 mb-1">
                  #{idx + 1}
                </div>
                <div className="text-lg font-bold text-foreground score-mono">
                  Hole {hole.holeNumber}
                </div>
                <div className="text-xs text-muted-foreground">
                  Par {hole.par} • Avg {hole.scoringAverage.toFixed(2)}
                </div>
                <div className="text-xs font-semibold text-destructive mt-1 score-mono">
                  +{hole.avgDiff.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Summary stats */}
      {summary && (
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/30 p-3 text-center"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.3 }}
          >
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
              Course Avg
            </div>
            <div className="text-lg font-bold text-foreground score-mono">
              {summary.avgScore.toFixed(1)}
            </div>
            <div className="text-[10px] text-muted-foreground">Par {summary.totalPar}</div>
          </motion.div>
          <motion.div
            className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/30 p-3 text-center"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
              Birdies
            </div>
            <div className="text-lg font-bold text-green-600 score-mono">
              {summary.totalBirdies}
            </div>
            <div className="text-[10px] text-muted-foreground">{summary.totalEagles} eagles</div>
          </motion.div>
          <motion.div
            className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/30 p-3 text-center"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
              Bogeys
            </div>
            <div className="text-lg font-bold text-orange-500 score-mono">
              {summary.totalBogeys}
            </div>
          </motion.div>
        </div>
      )}

      {/* Hole cards */}
      <div className="space-y-2">
        {processedHoles.map((hole, idx) => (
          <motion.div
            key={hole.holeNumber}
            className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/30 p-3"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.02, duration: 0.25 }}
          >
            <div className="flex items-start gap-3">
              {/* Hole number circle */}
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                getDifficultyColor(hole.difficultyRank, processedHoles.length)
              )}>
                {hole.holeNumber}
              </div>

              {/* Center content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm font-semibold text-foreground">
                    Par {hole.par}
                  </span>
                  {hole.yardage && (
                    <span className="text-xs text-muted-foreground">
                      {hole.yardage} yds
                    </span>
                  )}
                </div>

                {/* Scoring average vs par bar */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-1.5 bg-muted rounded-full relative overflow-hidden">
                    {hole.avgDiff !== 0 && (
                      <div
                        className={cn(
                          "absolute top-0 h-full rounded-full",
                          hole.avgDiff > 0 ? "bg-destructive/60 left-1/2" : "bg-green-400 right-1/2"
                        )}
                        style={{
                          width: `${Math.min(Math.abs(hole.avgDiff) * 50, 50)}%`,
                        }}
                      />
                    )}
                    <div className="absolute top-0 left-1/2 w-px h-full bg-muted-foreground/30" />
                  </div>
                  <span className="score-mono text-sm font-bold text-foreground w-12 text-right">
                    {hole.scoringAverage.toFixed(2)}
                  </span>
                </div>

                {/* Score distribution */}
                <ScoringBar hole={hole} />
              </div>

              {/* Difficulty indicator */}
              <div className="shrink-0 text-right">
                {hole.avgDiff > 0 ? (
                  <div className="flex items-center gap-0.5 text-destructive">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span className="score-mono text-xs font-semibold">+{hole.avgDiff.toFixed(2)}</span>
                  </div>
                ) : hole.avgDiff < 0 ? (
                  <div className="flex items-center gap-0.5 text-green-500">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span className="score-mono text-xs font-semibold">{hole.avgDiff.toFixed(2)}</span>
                  </div>
                ) : (
                  <span className="score-mono text-xs text-muted-foreground">Even</span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
