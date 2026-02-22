/**
 * PlayerSeasonStats - Editorial tabbed season statistics.
 * No card container — content sits directly on page background.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Trophy, Target, BarChart3 } from 'lucide-react';
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
  
  // Split value and units
  const unitMatch = hasValue ? value.match(/^(.+?)\s*(yds|%)$/) : null;
  const mainValue = unitMatch ? unitMatch[1] : value;
  const unitSuffix = unitMatch ? unitMatch[2] : null;
  
  return (
    <div
      style={{ padding: '12px 0', borderBottom: '1px solid hsl(var(--border) / 0.15)' }}
      aria-label={`${label}: ${value}`}
    >
      <div className="flex justify-between items-center">
        <span className="text-foreground" style={{ fontSize: '14px', fontWeight: 500 }}>{label}</span>
        <div className="flex flex-col items-end">
          <span style={{
            fontSize: '14px',
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            color: hasValue
              ? (trend === 'positive' ? '#22C55E' : trend === 'negative' ? '#EF4444' : undefined)
              : undefined,
          }} className={hasValue ? (trend ? '' : 'text-foreground') : 'text-muted-foreground'}>
            {mainValue}
            {unitSuffix && (
              <span className="text-muted-foreground" style={{ fontWeight: 500 }}>{' '}{unitSuffix}</span>
            )}
          </span>
          {barPercent !== undefined && hasValue && (
            <div style={{ marginTop: '4px', width: '120px', height: '4px', borderRadius: '2px', backgroundColor: '#CBD5E1' }} className="overflow-hidden">
              <motion.div
                style={{
                  height: '100%',
                  borderRadius: '2px',
                  backgroundColor: '#f59e0b',
                  width: `${Math.min(100, Math.max(0, barPercent))}%`,
                  originX: 0,
                }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: 0.2 + barIndex * 0.1, ease: 'easeOut' }}
              />
            </div>
          )}
        </div>
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
  const formattedValue = value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2);

  return (
    <div
      style={{ padding: '12px 0', borderBottom: '1px solid hsl(var(--border) / 0.15)' }}
      aria-label={`${label}: ${formattedValue} strokes gained`}
    >
      <div className="flex justify-between items-center" style={{ marginBottom: '6px' }}>
        <span className="text-foreground" style={{ fontSize: '14px', fontWeight: 500 }}>{label}</span>
        <span style={{
          fontSize: '14px',
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          color: isPositive ? '#f59e0b' : '#EF4444',
        }}>
          {formattedValue}
        </span>
      </div>
      <div className="relative overflow-hidden" style={{ height: '5px', borderRadius: '2.5px' }} >
        <div className="absolute inset-0" style={{ backgroundColor: '#CBD5E1' }} />
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border z-10" />
        <motion.div
          className="absolute top-0 bottom-0"
          style={{
            borderRadius: '2.5px',
            backgroundColor: isPositive ? '#f59e0b' : '#EF4444',
            width: `${barWidth}%`,
            left: isPositive ? '50%' : `${50 - barWidth}%`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${barWidth}%` }}
          transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
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

  const top10Ratio = (playerStats.top_10s && playerStats.events_played && playerStats.events_played > 0)
    ? (playerStats.top_10s / playerStats.events_played) * 100 : undefined;
  const top25Ratio = (playerStats.top_25s && playerStats.events_played && playerStats.events_played > 0)
    ? (playerStats.top_25s / playerStats.events_played) * 100 : undefined;

  return (
    <div>
      {/* Section header — 22px / 700 / tracking -0.3px */}
      <div className="flex items-center gap-2" style={{ marginBottom: '12px' }}>
        <BarChart3 className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-foreground" style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.3px' }}>
          Season Performance
        </h2>
      </div>

      {/* Tab bar — sticky pill style */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md pb-3 pt-1">
        <div className="rounded-xl p-1 flex gap-1" role="tablist" aria-label="Season Performance Stats">
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 rounded-lg py-2.5 min-h-[44px] transition-all text-center",
                  isActive
                    ? "bg-foreground text-background shadow-sm"
                    : "bg-transparent text-muted-foreground"
                )}
                style={{
                  fontSize: tab === 'Strokes Gained' ? '12px' : '13px',
                  fontWeight: 600,
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content — 16px gap from tabs */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          role="tabpanel"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{ marginTop: '16px' }}
        >
          {activeTab === 'Overview' && (
            <div>
              <SubSectionLabel icon={Trophy} label="RESULTS" />
              <StatRow label="Events Played" value={fmt(playerStats.events_played)} />
              <StatRow label="Wins" value={fmt(playerStats.wins)} />
              <StatRow label="Top 10s" value={fmt(playerStats.top_10s)} barPercent={top10Ratio} barIndex={0} />
              <StatRow label="Top 25s" value={fmt(playerStats.top_25s)} barPercent={top25Ratio} barIndex={1} />

              <SubSectionLabel icon={TrendingUp} label="FINANCIALS" style={{ marginTop: '24px' }} />
              <StatRow label="Earnings" value={fmt(playerStats.earnings, 'currency')} />
              <StatRow label="FedEx Points" value={fmt(playerStats.fedex_points)} />
              <StatRow label="Scoring Average" value={fmt(playerStats.scoring_average, 'decimal')} />
            </div>
          )}

          {activeTab === 'Ball Striking' && (
            <div>
              <SubSectionLabel icon={Target} label="OFF THE TEE & APPROACH" />
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
              <SGBar label="SG: Putting" value={(playerStats as any).strokes_gained_putting ?? null} />
              <SGBar label="SG: Tee to Green" value={(playerStats as any).strokes_gained_tee_green ?? null} />
              {!playerStats.strokes_gained_total && (
                <p className="text-muted-foreground text-center" style={{ fontSize: '14px', padding: '24px 0' }}>
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

function SubSectionLabel({ icon: Icon, label, style }: { icon: React.ElementType; label: string; style?: React.CSSProperties }) {
  return (
    <p
      className="flex items-center gap-1.5 text-muted-foreground/50"
      style={{
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.8px',
        textTransform: 'uppercase' as const,
        marginTop: '20px',
        marginBottom: '10px',
        ...style,
      }}
    >
      <Icon style={{ width: '14px', height: '14px' }} />
      {label}
    </p>
  );
}