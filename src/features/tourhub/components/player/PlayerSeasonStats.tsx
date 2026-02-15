/**
 * PlayerSeasonStats - Editorial tabbed season statistics.
 * No card container — content sits directly on page background.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Trophy, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TourPlayerStatistics } from '../../hooks/useTourHubData';

function fmt(value: number | null | undefined, type?: 'decimal' | 'percent' | 'yards' | 'currency' | 'signed'): string {
  if (value === null || value === undefined) return '—';
  switch (type) {
    case 'decimal': return value.toFixed(2);
    case 'percent': return `${value.toFixed(1)}%`;
    case 'yards': return `${value.toFixed(1)} yds`;
    case 'currency':
      return value >= 1_000_000
        ? `$${(value / 1_000_000).toFixed(2)}M`
        : `$${value.toLocaleString()}`;
    case 'signed':
      if (value === 0) return '0.00';
      return value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
    default: return String(value);
  }
}

interface StatRowProps {
  label: string;
  value: string;
  trend?: 'positive' | 'negative' | null;
  barPercent?: number;
  barIndex?: number;
}

function StatRow({ label, value, trend, barPercent, barIndex = 0 }: StatRowProps) {
  const hasValue = value !== '—';
  return (
    <div className="flex justify-between items-center py-3 border-b border-border">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex flex-col items-end">
        <span className={cn(
          "text-sm font-semibold font-mono tabular-nums",
          hasValue ? (
            trend === 'positive' ? "text-emerald-600" :
            trend === 'negative' ? "text-red-500" :
            "text-foreground"
          ) : "text-muted-foreground"
        )}>
          {value}
        </span>
        {barPercent !== undefined && hasValue && (
          <div className="mt-1 w-24 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-amber-400"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5, delay: 0.2 + barIndex * 0.1, ease: 'easeOut' }}
              style={{
                width: `${Math.min(100, Math.max(0, barPercent))}%`,
                originX: 0,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface SGBarProps {
  label: string;
  value: number | null | undefined;
}

function SGBar({ label, value }: SGBarProps) {
  if (value === null || value === undefined) return null;
  const maxWidth = 60;
  const barWidth = Math.min(maxWidth, Math.abs(value) * 15);
  const isPositive = value >= 0;

  return (
    <div className="py-3 border-b border-border">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={cn(
          "text-sm font-bold font-mono tabular-nums",
          isPositive ? "text-emerald-600" : "text-red-500"
        )}>
          {value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2)}
        </span>
      </div>
      <div className="relative h-2 bg-muted/20 rounded-full overflow-hidden">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border z-10" />
        <span className="absolute left-1/2 -top-4 -translate-x-1/2 text-[8px] text-muted-foreground/60 font-medium">
          Tour Avg
        </span>
        <motion.div
          className={cn(
            "absolute top-0 bottom-0 rounded-full",
            isPositive ? "bg-emerald-500/70" : "bg-red-500/70"
          )}
          initial={{ width: 0 }}
          animate={{
            width: `${barWidth}%`,
            left: isPositive ? '50%' : `${50 - barWidth}%`,
          }}
          transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
          style={{
            left: isPositive ? '50%' : `${50 - barWidth}%`,
          }}
        />
      </div>
    </div>
  );
}

const TABS = ['Overview', 'Ball Striking', 'Short Game', 'Strokes Gained'];

interface PlayerSeasonStatsProps {
  playerStats: TourPlayerStatistics;
}

export function PlayerSeasonStats({ playerStats }: PlayerSeasonStatsProps) {
  const [activeTab, setActiveTab] = useState('Overview');

  const cutsRatio = (playerStats.cuts_made && playerStats.events_played && playerStats.events_played > 0)
    ? (playerStats.cuts_made / playerStats.events_played) * 100 : undefined;
  const top10Ratio = (playerStats.top_10s && playerStats.events_played && playerStats.events_played > 0)
    ? (playerStats.top_10s / playerStats.events_played) * 100 : undefined;
  const top25Ratio = (playerStats.top_25s && playerStats.events_played && playerStats.events_played > 0)
    ? (playerStats.top_25s / playerStats.events_played) * 100 : undefined;

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-muted-foreground" />
        Season Performance
      </h2>

      {/* Tab bar */}
      <div className="flex border-b border-border mb-5">
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "relative flex-1 py-2.5 text-[13px] text-center transition-colors active:scale-[0.95]",
                isActive ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
              )}
            >
              {tab}
              {isActive && (
                <motion.div
                  layoutId="season-tab-editorial"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === 'Overview' && (
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-2 flex items-center gap-1.5 mt-1">
                <Trophy className="w-3.5 h-3.5" />
                Results
              </p>
              <StatRow label="Events Played" value={fmt(playerStats.events_played)} />
              <StatRow label="Cuts Made" value={playerStats.cuts_made != null && playerStats.events_played
                ? `${playerStats.cuts_made}/${playerStats.events_played}`
                : fmt(playerStats.cuts_made)}
                barPercent={cutsRatio}
                barIndex={0}
              />
              <StatRow label="Wins" value={fmt(playerStats.wins)} />
              <StatRow label="Top 10s" value={fmt(playerStats.top_10s)} barPercent={top10Ratio} barIndex={1} />
              <StatRow label="Top 25s" value={fmt(playerStats.top_25s)} barPercent={top25Ratio} barIndex={2} />

              <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-2 flex items-center gap-1.5 mt-6">
                <TrendingUp className="w-3.5 h-3.5" />
                Financials
              </p>
              <StatRow label="Earnings" value={fmt(playerStats.earnings, 'currency')} />
              <StatRow label="FedEx Points" value={fmt(playerStats.fedex_points)} />
              <StatRow label="Scoring Average" value={fmt(playerStats.scoring_average, 'decimal')} />
            </div>
          )}

          {activeTab === 'Ball Striking' && (
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-2 flex items-center gap-1.5 mt-1">
                <Target className="w-3.5 h-3.5" />
                Off the Tee & Approach
              </p>
              <StatRow label="Driving Distance" value={fmt(playerStats.driving_distance, 'yards')} />
              <StatRow label="Driving Accuracy" value={fmt(playerStats.driving_accuracy, 'percent')} />
              <StatRow label="Greens in Regulation" value={fmt(playerStats.greens_in_reg, 'percent')} />
            </div>
          )}

          {activeTab === 'Short Game' && (
            <div>
              <StatRow label="Putting Average" value={playerStats.putting_average ? playerStats.putting_average.toFixed(3) : '—'} />
              <StatRow label="Sand Saves" value={fmt(playerStats.sand_saves, 'percent')} />
              <StatRow label="Scrambling" value={fmt(playerStats.scrambling, 'percent')} />
              <StatRow label="Scoring Average" value={fmt(playerStats.scoring_average, 'decimal')} />
              <StatRow label="Birdies per Round" value={fmt(playerStats.birdies_per_round, 'decimal')} />
            </div>
          )}

          {activeTab === 'Strokes Gained' && (
            <div className="pt-2">
              <SGBar label="SG: Total" value={playerStats.strokes_gained_total} />
              <SGBar label="SG: Putting" value={(playerStats as any).strokes_gained_putting ?? null} />
              <SGBar label="SG: Tee to Green" value={(playerStats as any).strokes_gained_tee_green ?? null} />
              {!playerStats.strokes_gained_total && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Strokes Gained data unavailable for this player.
                </p>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
