/**
 * PlayerSeasonStats - Tabbed season statistics display
 * Tabs: Overview | Ball Striking | Short Game | Strokes Gained
 */

import { useState } from 'react';
import { TrendingUp, Trophy, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RoundSelector } from '../tournament-detail/RoundSelector';
import type { TourPlayerStatistics } from '../../hooks/useTourHubData';

// Helpers
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
  barPercent?: number; // 0-100 for visual bar
}

function StatRow({ label, value, trend, barPercent }: StatRowProps) {
  const hasValue = value !== '—';
  return (
    <div className="py-3 border-b border-border/20 last:border-0">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={cn(
          "text-sm font-medium font-mono",
          hasValue ? (
            trend === 'positive' ? "text-emerald-500" :
            trend === 'negative' ? "text-red-500" :
            "text-foreground"
          ) : "text-muted-foreground"
        )}>
          {value}
        </span>
      </div>
      {barPercent !== undefined && hasValue && (
        <div className="mt-1.5 h-1.5 bg-muted/30 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              trend === 'positive' ? "bg-emerald-500/70" :
              trend === 'negative' ? "bg-red-500/70" :
              "bg-primary/50"
            )}
            style={{ width: `${Math.min(100, Math.max(0, barPercent))}%` }}
          />
        </div>
      )}
    </div>
  );
}

interface SGBarProps {
  label: string;
  value: number | null | undefined;
}

function SGBar({ label, value }: SGBarProps) {
  if (value === null || value === undefined) return null;
  const maxWidth = 60; // percent of bar width
  const barWidth = Math.min(maxWidth, Math.abs(value) * 15);
  const isPositive = value >= 0;

  return (
    <div className="py-3 border-b border-border/20 last:border-0">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={cn(
          "text-sm font-bold font-mono",
          isPositive ? "text-emerald-500" : "text-red-500"
        )}>
          {value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2)}
        </span>
      </div>
      <div className="relative h-2 bg-muted/20 rounded-full overflow-hidden">
        {/* Center line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border/60" />
        {/* Bar */}
        <div
          className={cn(
            "absolute top-0 bottom-0 rounded-full transition-all duration-500",
            isPositive ? "bg-emerald-500/70" : "bg-red-500/70"
          )}
          style={{
            left: isPositive ? '50%' : `${50 - barWidth}%`,
            width: `${barWidth}%`,
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
    <div className="bg-card rounded-xl border border-border/50 p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2 pl-3 border-l-3 border-primary">
        <TrendingUp className="w-5 h-5 text-primary" />
        Season Performance
      </h2>

      <RoundSelector
        rounds={TABS}
        activeRound={activeTab}
        onRoundChange={setActiveTab}
        className="mb-5"
      />

      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2 font-medium flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" />
              Results
            </p>
            <StatRow label="Events Played" value={fmt(playerStats.events_played)} />
            <StatRow label="Cuts Made" value={playerStats.cuts_made != null && playerStats.events_played
              ? `${playerStats.cuts_made}/${playerStats.events_played}`
              : fmt(playerStats.cuts_made)}
              barPercent={cutsRatio}
            />
            <StatRow label="Wins" value={fmt(playerStats.wins)} />
            <StatRow label="Top 10s" value={fmt(playerStats.top_10s)} barPercent={top10Ratio} />
            <StatRow label="Top 25s" value={fmt(playerStats.top_25s)} barPercent={top25Ratio} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2 font-medium flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Financials
            </p>
            <StatRow label="Earnings" value={fmt(playerStats.earnings, 'currency')} />
            <StatRow label="FedEx Points" value={fmt(playerStats.fedex_points)} />
            <StatRow label="Scoring Average" value={fmt(playerStats.scoring_average, 'decimal')} />
          </div>
        </div>
      )}

      {activeTab === 'Ball Striking' && (
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2 font-medium flex items-center gap-1.5">
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
        <div>
          <SGBar label="SG: Total" value={playerStats.strokes_gained_total} />
          {/* SG: Putting from raw_data if available */}
          <SGBar label="SG: Putting" value={(playerStats as any).strokes_gained_putting ?? null} />
          <SGBar label="SG: Tee to Green" value={(playerStats as any).strokes_gained_tee_green ?? null} />
          {!playerStats.strokes_gained_total && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Strokes Gained data unavailable for this player.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
