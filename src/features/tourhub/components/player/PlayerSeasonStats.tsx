/**
 * PlayerSeasonStats - Dispatch-style tabbed season statistics.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TourPlayerStatistics } from '../../hooks/useTourHubData';

const STAT_TABS = ['Overview', 'Ball Striking', 'Short Game', 'Shots Gained'] as const;
type StatTab = (typeof STAT_TABS)[number];

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
  const unitMatch = hasValue ? value.match(/^(.+?)\s*(yds|%)$/) : null;
  const mainValue = unitMatch ? unitMatch[1] : value;
  const unitSuffix = unitMatch ? unitMatch[2] : null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '11px 0', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
      <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: '#0F172A' }}>{label}</span>
      <div style={{ textAlign: 'right' as const }}>
        <span style={{
          fontSize: '13px', fontWeight: 800, fontVariantNumeric: 'tabular-nums',
          color: hasValue
            ? (trend === 'positive' ? '#F7931E' : trend === 'negative' ? '#94A3B8' : '#0F172A')
            : '#94A3B8',
        }}>
          {mainValue}
          {unitSuffix && <span style={{ fontSize: '10px', fontWeight: 500, color: '#94A3B8' }}> {unitSuffix}</span>}
        </span>
        {barPercent !== undefined && hasValue && (
          <div style={{ marginTop: '4px', width: '100px', height: '3px', borderRadius: '2px', background: 'rgba(15,23,42,0.08)', overflow: 'hidden' }}>
            <motion.div
              style={{
                height: '100%', borderRadius: '2px',
                background: '#F7931E',
                originX: 0,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, barPercent))}%` }}
              transition={{ duration: 0.5, delay: 0.2 + barIndex * 0.08, ease: 'easeOut' }}
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
  const maxPct = 50;
  const barPct = Math.min(maxPct, (Math.abs(value) / 3.0) * maxPct);
  const isPositive = value >= 0;
  const formatted = value === 0 ? '0.00' : value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2);

  return (
    <div style={{ padding: '11px 0', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '13px', fontWeight: 500, color: '#0F172A' }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: isPositive ? '#F7931E' : '#94A3B8' }}>
          {formatted}
        </span>
      </div>
      {/* Centred diverging bar */}
      <div style={{ position: 'relative', height: '4px', borderRadius: '2px', background: 'rgba(15,23,42,0.08)' }}>
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: 'rgba(15,23,42,0.15)' }} />
        <motion.div
          style={{
            position: 'absolute', top: 0, bottom: 0, borderRadius: '2px',
            background: isPositive ? '#F7931E' : '#94A3B8',
            left: isPositive ? '50%' : `${50 - barPct}%`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${barPct}%` }}
          transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function SubSectionLabel({ label, style }: { label: string; style?: React.CSSProperties }) {
  return (
    <p style={{
      fontSize: '8.5px', fontWeight: 900, color: '#CBD5E1',
      letterSpacing: '0.14em', textTransform: 'uppercase' as const,
      padding: '14px 0 6px', margin: 0,
      ...style,
    }}>
      {label}
    </p>
  );
}

interface PlayerSeasonStatsProps {
  playerStats: TourPlayerStatistics;
}

export function PlayerSeasonStats({ playerStats }: PlayerSeasonStatsProps) {
  const [activeTab, setActiveTab] = useState<StatTab>('Overview');

  const top10Ratio = (playerStats.top_10s && playerStats.events_played && playerStats.events_played > 0)
    ? (playerStats.top_10s / playerStats.events_played) * 100 : undefined;
  const top25Ratio = (playerStats.top_25s && playerStats.events_played && playerStats.events_played > 0)
    ? (playerStats.top_25s / playerStats.events_played) * 100 : undefined;

  return (
    <div style={{ background: '#ffffff', borderBottom: '1px solid rgba(15,23,42,0.07)' }}>
      {/* Dispatch section header */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{ width: 3, height: 14, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
          <span style={{ fontSize: '9px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
            STATS · {activeTab}
          </span>
        </div>

        {/* Segmented control — slate-100 trough, white pill active state */}
        <div
          role="tablist"
          aria-label="Stat category"
          style={{
            display: 'flex',
            gap: 2,
            padding: 3,
            background: '#F1F5F9',
            borderRadius: 10,
            marginBottom: 12,
          }}
        >
          {STAT_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab)}
                className="active:opacity-80 transition-opacity"
                style={{
                  flex: 1,
                  padding: '7px 4px',
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#0F172A' : '#64748B',
                  background: isActive ? '#FFFFFF' : 'transparent',
                  border: 'none',
                  borderRadius: 7,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap' as const,
                  boxShadow: isActive ? '0 1px 2px rgba(15,23,42,0.05)' : 'none',
                  transition: 'background 0.15s ease, color 0.15s ease',
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          role="tabpanel"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{ padding: '0 16px 14px' }}
        >
          {activeTab === 'Overview' && (
            <div>
              <SubSectionLabel label="RESULTS" style={{ marginTop: 0 }} />
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

              <SubSectionLabel label="EARNINGS" style={{ marginTop: '24px' }} />
              <StatRow label="Season Earnings" value={fmt(playerStats.earnings, 'currency')} />
              <StatRow label="FedEx Points" value={fmt(playerStats.fedex_points)} />
            </div>
          )}

          {activeTab === 'Ball Striking' && (
            <div>
              <SubSectionLabel label="OFF THE TEE" style={{ marginTop: 0 }} />
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

              <SubSectionLabel label="APPROACH" style={{ marginTop: 24 }} />
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

              <SubSectionLabel label="OVERALL" style={{ marginTop: 24 }} />
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
                <p style={{ fontSize: 14, padding: '24px 0', textAlign: 'center', color: '#94A3B8' }}>
                  Short game stats unavailable for this player.
                </p>
              ) : (
                <div>
                  <SubSectionLabel label="ON THE GREEN" style={{ marginTop: 0 }} />
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

                  <SubSectionLabel label="AROUND THE GREEN" style={{ marginTop: 24 }} />
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
              <SubSectionLabel label="STROKES GAINED" style={{ marginTop: 0 }} />
              <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 16 }}>
                Strokes gained vs. tour average per round
              </p>
              <SGBar label="SG: Total" value={playerStats.strokes_gained_total} />
              <SGBar label="SG: Tee to Green" value={playerStats.strokes_gained_tee_green} />
              <SGBar label="SG: Around Green" value={playerStats.strokes_gained} />
              {!playerStats.strokes_gained_total && !playerStats.strokes_gained_tee_green && !playerStats.strokes_gained && (
                <p style={{ fontSize: 14, padding: '24px 0', textAlign: 'center', color: '#94A3B8' }}>
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
