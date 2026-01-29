/**
 * HoleStatsTab - Hole difficulty cards with scoring breakdown
 * Shows hardest/easiest holes with birdie/bogey distribution
 * Per Apple-grade redesign spec
 */

import { useState, useMemo } from 'react';
import { Target, TrendingUp, TrendingDown, Flag } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GlassCard } from '../premium';

interface HoleStatistic {
  id: string;
  hole_number: number;
  par: number;
  yardage: number | null;
  avg_diff: number | null;
  eagles: number | null;
  birdies: number | null;
  pars: number | null;
  bogeys: number | null;
  double_bogeys: number | null;
  round_number?: number | null;
}

interface HoleStatsTabProps {
  holeStats: HoleStatistic[];
  courseName?: string;
  coursePar?: number;
  courseYardage?: number;
}

// Round filter pill
function FilterPill({ 
  label, 
  active, 
  onClick 
}: { 
  label: string; 
  active: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
        active 
          ? "bg-white text-black" 
          : "bg-white/10 text-white/60 hover:bg-white/15 hover:text-white/80"
      )}
    >
      {label}
    </button>
  );
}

// Individual hole card
function HoleCard({ 
  hole, 
  rank,
  isHardest,
}: { 
  hole: HoleStatistic;
  rank?: number;
  isHardest?: boolean;
}) {
  const avgDiff = hole.avg_diff || 0;
  const avgScore = hole.par + avgDiff;
  const diffColor = avgDiff > 0 
    ? 'text-[hsl(var(--th-accent-bogey))]' 
    : avgDiff < 0 
    ? 'text-[hsl(var(--th-accent-birdie))]' 
    : 'text-white/60';
  
  const diffPrefix = avgDiff > 0 ? '+' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <GlassCard className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {rank && (
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold",
                rank === 1 && isHardest && "bg-red-500/20 text-red-400",
                rank === 1 && !isHardest && "bg-emerald-500/20 text-emerald-400",
                rank > 1 && "bg-white/10 text-white/60"
              )}>
                #{rank}
              </div>
            )}
            <div>
              <h4 className="th-title-2 text-white">
                Hole {hole.hole_number}
              </h4>
              <p className="th-caption-1 text-white/50">
                Par {hole.par} • {hole.yardage ? `${hole.yardage} yds` : '—'}
              </p>
            </div>
          </div>

          {/* Average Score */}
          <div className="text-right">
            <p className="th-title-1 text-white font-mono">
              {avgScore.toFixed(2)}
            </p>
            <p className={cn("th-caption-1 font-semibold", diffColor)}>
              {diffPrefix}{avgDiff.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Score Distribution */}
        <div className="flex items-center gap-3 pt-3 border-t border-white/10">
          {hole.eagles !== null && hole.eagles > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-white/40">Eagles:</span>
              <span className="text-sm font-semibold text-amber-400">{hole.eagles}</span>
            </div>
          )}
          {hole.birdies !== null && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-white/40">Birdies:</span>
              <span className="text-sm font-semibold text-[hsl(var(--th-accent-birdie))]">{hole.birdies}</span>
            </div>
          )}
          {hole.pars !== null && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-white/40">Pars:</span>
              <span className="text-sm font-semibold text-white/70">{hole.pars}</span>
            </div>
          )}
          {hole.bogeys !== null && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-white/40">Bogeys:</span>
              <span className="text-sm font-semibold text-[hsl(var(--th-accent-bogey))]">{hole.bogeys}</span>
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}

export function HoleStatsTab({ 
  holeStats, 
  courseName, 
  coursePar, 
  courseYardage 
}: HoleStatsTabProps) {
  const [roundFilter, setRoundFilter] = useState<'all' | number>('all');

  // Get available rounds
  const rounds = useMemo(() => {
    const roundSet = new Set(holeStats.map(h => h.round_number).filter(Boolean));
    return Array.from(roundSet).sort((a, b) => (a || 0) - (b || 0)) as number[];
  }, [holeStats]);

  // Filter and aggregate stats
  const filteredStats = useMemo(() => {
    if (roundFilter === 'all') {
      // Aggregate all rounds by hole
      const byHole = new Map<number, HoleStatistic>();
      holeStats.forEach(stat => {
        const existing = byHole.get(stat.hole_number);
        if (!existing) {
          byHole.set(stat.hole_number, { ...stat });
        } else {
          // Aggregate (simplified - just use latest)
          byHole.set(stat.hole_number, stat);
        }
      });
      return Array.from(byHole.values()).sort((a, b) => a.hole_number - b.hole_number);
    }
    return holeStats
      .filter(h => h.round_number === roundFilter)
      .sort((a, b) => a.hole_number - b.hole_number);
  }, [holeStats, roundFilter]);

  // Hardest and easiest holes
  const { hardest, easiest } = useMemo(() => {
    const sorted = [...filteredStats].sort((a, b) => 
      (b.avg_diff || 0) - (a.avg_diff || 0)
    );
    return {
      hardest: sorted.slice(0, 3),
      easiest: sorted.slice(-3).reverse(),
    };
  }, [filteredStats]);

  if (holeStats.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-white/5 flex items-center justify-center mb-4">
          <Target className="w-7 h-7 text-white/40" />
        </div>
        <h3 className="th-title-2 text-white mb-1">Hole Statistics Coming Soon</h3>
        <p className="th-body-small text-white/50">
          Hole-by-hole statistics will appear during play.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Course Info Header */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Flag className="w-4 h-4 text-white/50" />
          <h3 className="th-title-2 text-white">
            {courseName || 'Course Statistics'}
          </h3>
        </div>
        <div className="flex items-center gap-4 th-caption-1 text-white/50">
          {coursePar && <span>Par {coursePar}</span>}
          {courseYardage && <span>{courseYardage.toLocaleString()} yards</span>}
        </div>
      </GlassCard>

      {/* Round Filter */}
      {rounds.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          <FilterPill
            label="All Rounds"
            active={roundFilter === 'all'}
            onClick={() => setRoundFilter('all')}
          />
          {rounds.map(round => (
            <FilterPill
              key={round}
              label={`R${round}`}
              active={roundFilter === round}
              onClick={() => setRoundFilter(round)}
            />
          ))}
        </div>
      )}

      {/* Hardest Holes */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-red-400" />
          <h3 className="th-caption-2 text-white/70">HARDEST HOLES</h3>
        </div>
        <div className="space-y-3">
          {hardest.map((hole, index) => (
            <HoleCard 
              key={hole.id} 
              hole={hole} 
              rank={index + 1}
              isHardest
            />
          ))}
        </div>
      </div>

      {/* Easiest Holes */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingDown className="w-4 h-4 text-emerald-400" />
          <h3 className="th-caption-2 text-white/70">EASIEST HOLES</h3>
        </div>
        <div className="space-y-3">
          {easiest.map((hole, index) => (
            <HoleCard 
              key={hole.id} 
              hole={hole} 
              rank={index + 1}
              isHardest={false}
            />
          ))}
        </div>
      </div>

      {/* All Holes */}
      <div>
        <h3 className="th-caption-2 text-white/70 mb-3">ALL HOLES</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredStats.map(hole => (
            <HoleCard key={hole.id} hole={hole} />
          ))}
        </div>
      </div>
    </div>
  );
}
