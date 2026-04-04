/**
 * PlayerSeasonStats - Editorial tabbed season statistics.
 * No card container — content sits directly on page background.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Trophy, Target, BarChart3, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TourPlayerStatistics } from '../../hooks/useTourHubData';

// Tour averages — 2026 PGA Tour season
const TOUR_AVG = {
  drivingDistance: 301.8,
  drivingAccuracy: 59.0,
  gir: 68.5,
  puttingAverage: 1.752,
  sandSaves: 53.1,
  scrambling: 56.8,
  birdiesPerRound: 3.8,
} as const;

function fmt(value: number | null | undefined, type?: 'decimal' | 'percent' | 'yards' | 'currency' | 'signed' | 'putting'): string {
  if (value === null || value === undefined) return '—';
  switch (type) {
    case 'decimal': return value.toFixed(2);
    case 'putting': return value.toFixed(3);
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
        <span className="text-foreground" style={{ fontSize: '15px', fontWeight: 500 }}>{label}</span>
        <div className="flex flex-col items-end">
          <span style={{
            fontSize: '15px',
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            color: hasValue
              ? (trend === 'positive' ? 'hsl(var(--accent-amber))' : trend === 'negative' ? 'hsl(var(--muted-foreground))' : undefined)
              : undefined,
          }} className={hasValue ? (trend ? '' : 'text-foreground') : 'text-muted-foreground'}>
            {mainValue}
            {unitSuffix && (
              <span className="text-muted-foreground" style={{ fontWeight: 500 }}>{' '}{unitSuffix}</span>
            )}
          </span>
          {barPercent !== undefined && hasValue && (
            <div style={{ marginTop: '4px', width: '120px', height: '4px', borderRadius: '2px', backgroundColor: 'hsl(var(--border))' }} className="overflow-hidden">
              <motion.div
                style={{
                  height: '100%',
                  borderRadius: '2px',
                  backgroundColor: 'hsl(var(--accent-amber) / 0.9)',
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
  const maxWidth = 50;
  const barWidth = Math.min(maxWidth, (Math.abs(value) / 3.0) * maxWidth);
  const isPositive = value >= 0;
  const formattedValue = value === 0 ? '0.00' : value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2);

  return (
    <div
      style={{ padding: '12px 0', borderBottom: '1px solid hsl(var(--border) / 0.15)' }}
      aria-label={`${label}: ${formattedValue} strokes gained`}
    >
      <div className="flex justify-between items-center" style={{ marginBottom: '6px' }}>
        <span className="text-foreground" style={{ fontSize: '15px', fontWeight: 500 }}>{label}</span>
        <span style={{
          fontSize: '15px',
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          color: isPositive ? 'hsl(var(--accent-amber))' : 'hsl(var(--muted-foreground))',
        }}>
          {formattedValue}
        </span>
      </div>
      <div className="relative overflow-hidden" style={{ height: '5px', borderRadius: '2.5px' }} >
        <div className="absolute inset-0" style={{ backgroundColor: 'hsl(var(--border))' }} />
        <div className="absolute left-1/2 top-0 bottom-0 z-10" style={{ width: 1, backgroundColor: 'hsl(var(--border))' }} />
        <motion.div
          className="absolute top-0 bottom-0"
          style={{
            borderRadius: '2.5px',
            backgroundColor: isPositive ? 'hsl(var(--accent-amber))' : 'hsl(var(--muted-foreground) / 0.5)',
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

interface PlayerSeasonStatsProps {
  playerStats: TourPlayerStatistics;
  /** Tab controlled externally by PlayerProfilePage sticky header */
  activeTab?: string;
}

export function PlayerSeasonStats({ playerStats, activeTab: externalTab }: PlayerSeasonStatsProps) {
  const [internalTab, setInternalTab] = useState('Player Overview');
  const activeTab = externalTab ?? internalTab;
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
          {activeTab === 'Player Overview' && (
            <div>
              <SubSectionLabel icon={Trophy} label="RESULTS" style={{ marginTop: 0 }} />
              <StatRow label="Events Played" value={fmt(playerStats.events_played)} />
              <StatRow
                label="Wins"
                value={fmt(playerStats.wins)}
                trend={playerStats.wins && playerStats.wins > 0 ? 'positive' : null}
              />
              <StatRow label="Top 10s" value={fmt(playerStats.top_10s)} barPercent={top10Ratio} barIndex={0} />
              <StatRow label="Top 25s" value={fmt(playerStats.top_25s)} barPercent={top25Ratio} barIndex={1} />
              <StatRow label="Cuts Made" value={fmt(playerStats.cuts_made)} />
              <StatRow
                label="Scoring Average"
                value={fmt(playerStats.scoring_average, 'decimal')}
                trend={
                  playerStats.scoring_average
                    ? playerStats.scoring_average < 70 ? 'positive'
                      : playerStats.scoring_average > 72 ? 'negative'
                      : null
                    : null
                }
              />

              <SubSectionLabel icon={TrendingUp} label="EARNINGS" style={{ marginTop: '24px' }} />
              <StatRow label="Season Earnings" value={fmt(playerStats.earnings, 'currency')} />
              <StatRow label="FedEx Points" value={fmt(playerStats.fedex_points)} />
            </div>
          )}

          {activeTab === 'Ball Striking' && (
            <div>
              <SubSectionLabel icon={Target} label="OFF THE TEE" style={{ marginTop: 0 }} />
              <StatRow
                label="Driving Distance"
                value={fmt(playerStats.driving_distance, 'yards')}
                trend={playerStats.driving_distance
                  ? playerStats.driving_distance > TOUR_AVG.drivingDistance ? 'positive'
                    : playerStats.driving_distance < 290 ? 'negative'
                    : null
                  : null}
                barPercent={playerStats.driving_distance
                  ? Math.max(0, ((playerStats.driving_distance - 267) / (328 - 267)) * 100)
                  : undefined}
                barIndex={0}
              />
              <StatRow
                label="Driving Accuracy"
                value={fmt(playerStats.driving_accuracy, 'percent')}
                trend={playerStats.driving_accuracy
                  ? playerStats.driving_accuracy > TOUR_AVG.drivingAccuracy ? 'positive'
                    : playerStats.driving_accuracy < 52 ? 'negative'
                    : null
                  : null}
                barPercent={playerStats.driving_accuracy ?? undefined}
                barIndex={1}
              />

              <SubSectionLabel icon={Target} label="APPROACH" style={{ marginTop: 24 }} />
              <StatRow
                label="Greens in Regulation"
                value={fmt(playerStats.greens_in_reg, 'percent')}
                trend={playerStats.greens_in_reg
                  ? playerStats.greens_in_reg > TOUR_AVG.gir ? 'positive'
                    : playerStats.greens_in_reg < 62 ? 'negative'
                    : null
                  : null}
                barPercent={playerStats.greens_in_reg ?? undefined}
                barIndex={2}
              />
              <StatRow
                label="Proximity to Hole"
                value={playerStats.holes_proximity_avg || '—'}
                barIndex={3}
              />

              <SubSectionLabel icon={Target} label="OVERALL" style={{ marginTop: 24 }} />
              <StatRow
                label="Total Driving"
                value={playerStats.total_driving ? `#${playerStats.total_driving}` : '—'}
                barIndex={4}
              />
              <StatRow
                label="Eagles"
                value={playerStats.holes_per_eagle
                  ? `1 per ${playerStats.holes_per_eagle} holes`
                  : '—'}
                barIndex={5}
              />
            </div>
          )}

          {activeTab === 'Short Game' && (
            <>
              {!playerStats.putting_average && !playerStats.sand_saves && !playerStats.scrambling ? (
                <p className="text-muted-foreground text-center" style={{ fontSize: 14, padding: '24px 0' }}>
                  Short game stats unavailable for this player.
                </p>
              ) : (
                <div>
                  <SubSectionLabel icon={Flag} label="ON THE GREEN" style={{ marginTop: 0 }} />
                  <StatRow
                    label="Putting Average"
                    value={fmt(playerStats.putting_average, 'putting')}
                    trend={
                      playerStats.putting_average
                        ? playerStats.putting_average < TOUR_AVG.puttingAverage ? 'positive'
                          : playerStats.putting_average > 1.820 ? 'negative'
                          : null
                        : null
                    }
                    barPercent={playerStats.putting_average
                      ? Math.max(0, ((1.880 - playerStats.putting_average) / (1.880 - 1.596)) * 100)
                      : undefined}
                    barIndex={0}
                  />
                  <StatRow
                    label="Birdies per Round"
                    value={fmt(playerStats.birdies_per_round, 'decimal')}
                    trend={
                      playerStats.birdies_per_round
                        ? playerStats.birdies_per_round > TOUR_AVG.birdiesPerRound ? 'positive'
                          : playerStats.birdies_per_round < 3.0 ? 'negative'
                          : null
                        : null
                    }
                    barPercent={playerStats.birdies_per_round
                      ? Math.min(100, (playerStats.birdies_per_round / 7) * 100)
                      : undefined}
                    barIndex={1}
                  />

                  <SubSectionLabel icon={Target} label="AROUND THE GREEN" style={{ marginTop: 24 }} />
                  <StatRow
                    label="Sand Saves"
                    value={fmt(playerStats.sand_saves, 'percent')}
                    trend={
                      playerStats.sand_saves
                        ? playerStats.sand_saves > TOUR_AVG.sandSaves ? 'positive'
                          : playerStats.sand_saves < 40 ? 'negative'
                          : null
                        : null
                    }
                    barPercent={playerStats.sand_saves
                      ? Math.max(0, Math.min(100, ((playerStats.sand_saves - 30) / (80 - 30)) * 100))
                      : undefined}
                    barIndex={2}
                  />
                  <StatRow
                    label="Scrambling"
                    value={fmt(playerStats.scrambling, 'percent')}
                    trend={
                      playerStats.scrambling
                        ? playerStats.scrambling > TOUR_AVG.scrambling ? 'positive'
                          : playerStats.scrambling < 48 ? 'negative'
                          : null
                        : null
                    }
                    barPercent={playerStats.scrambling ?? undefined}
                    barIndex={3}
                  />
                </div>
              )}
            </>
          )}

          {activeTab === 'Shots Gained' && (
            <div>
              <SubSectionLabel icon={TrendingUp} label="STROKES GAINED" style={{ marginTop: 0 }} />
              <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground) / 0.5)', marginBottom: 16 }}>
                Strokes gained vs. tour average per round
              </p>
              <SGBar label="SG: Total" value={playerStats.strokes_gained_total} />
              <SGBar label="SG: Tee to Green" value={playerStats.strokes_gained_tee_green} />
              <SGBar label="SG: Around Green" value={playerStats.strokes_gained} />
              {!playerStats.strokes_gained_total && !playerStats.strokes_gained_tee_green && !playerStats.strokes_gained && (
                <p className="text-muted-foreground text-center" style={{ fontSize: 14, padding: '24px 0' }}>
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
        fontWeight: 700,
        letterSpacing: '0.05em',
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
