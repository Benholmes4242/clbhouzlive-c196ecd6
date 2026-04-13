/**
 * FranchiseCard - Flat dispatch row for college franchise leaderboard
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import type { CollegeSeasonStats } from '../../hooks/useCollegeStats';
import type { CollegeMedia } from '../../hooks/useCollegeMedia';
import type { CollegeMomentum } from '../../hooks/useCollegeStatus';
import type { AlumniFace } from '../../hooks/useBatchCollegeAlumni';

interface FranchiseCardProps {
  stats: CollegeSeasonStats;
  college: CollegeMedia | null;
  rank?: number;
  maxValue?: number;
  activeMetric?: 'earnings' | 'wins' | 'top10s';
  previousRank?: number;
  momentum?: CollegeMomentum | null;
  alumni?: AlumniFace[];
  className?: string;
  animationDelay?: number;
  isDelta?: boolean;
  deltas?: {
    earnings_delta: number;
    wins_delta: number;
    top10_delta: number;
    earnings_rank_change: number | null;
  };
}

function formatCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function formatDeltaValue(n: number): string {
  const sign = n >= 0 ? '+' : '';
  if (Math.abs(n) >= 1_000_000) return `${sign}$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${sign}$${(n / 1_000).toFixed(0)}K`;
  return `${sign}$${Math.abs(n).toLocaleString()}`;
}

function pluralize(count: number, singular: string, plural?: string): string {
  return Math.abs(count) === 1 ? singular : (plural || singular + 's');
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0]?.slice(0, 2).toUpperCase() || '?';
}

function getMetricRaw(stats: CollegeSeasonStats, metric: string): number {
  if (metric === 'wins') return stats.wins_total;
  if (metric === 'top10s') return stats.top10_total;
  return stats.earnings_total;
}

export function FranchiseCard({
  stats, college, rank, maxValue = 1, activeMetric = 'earnings',
  momentum, alumni, className, animationDelay = 0,
  isDelta = false, deltas,
}: FranchiseCardProps) {
  const displayName = college?.short_name || college?.college_name || stats.normalized_name;
  const slug = stats.normalized_name;
  const logoUrl = getCollegeLogoUrl(college?.college_name || stats.normalized_name);

  const buildStats = () => {
    if (isDelta && deltas) {
      const items: { label: string; value: string; isAccent: boolean; color?: string }[] = [];
      const earningsStr = formatDeltaValue(deltas.earnings_delta);
      items.push({ label: '', value: earningsStr, isAccent: true, color: deltas.earnings_delta >= 0 ? '#16A34A' : '#DC2626' });
      return items;
    }

    const primaryStat = activeMetric === 'wins'
      ? { label: pluralize(stats.wins_total, 'win'), value: String(stats.wins_total), isAccent: true }
      : activeMetric === 'top10s'
      ? { label: 'top 10s', value: String(stats.top10_total), isAccent: true }
      : { label: '', value: formatCompact(stats.earnings_total), isAccent: true };

    return [primaryStat];
  };

  const statItems = buildStats();
  const proportionPct = maxValue > 0 ? (getMetricRaw(stats, activeMetric) / maxValue) * 100 : 0;

  const ariaLabel = [
    rank !== undefined ? `Rank ${rank}` : null,
    displayName,
    `${formatCompact(stats.earnings_total)} earnings`,
    `${stats.wins_total} ${pluralize(stats.wins_total, 'win')}`,
    `${stats.top10_total} top 10s`,
  ].filter(Boolean).join(', ');

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: animationDelay, duration: 0.25 }}
    >
      <Link
        to={`/tourhub/college-golf/${slug}`}
        aria-label={ariaLabel}
        style={{
          display: 'flex', alignItems: 'center',
          padding: '10px 16px',
          borderBottom: '0.5px solid rgba(15,23,42,0.07)',
          textDecoration: 'none',
          ...(isDelta && deltas ? {
            borderLeft: deltas.earnings_delta >= 0
              ? '3px solid #16A34A'
              : '3px solid #DC2626',
            background: deltas.earnings_delta >= 0
              ? 'rgba(22,163,74,0.025)'
              : 'rgba(220,38,38,0.02)',
          } : {
            borderLeft: rank === 1 ? '3px solid #F7931E' : '3px solid transparent',
            background: rank === 1 ? 'rgba(247,147,30,0.025)' : 'transparent',
          }),
        }}
        className="active:bg-black/[0.02] transition-colors"
      >
        {/* Faded rank number */}
        {rank !== undefined && (
          <div style={{ width: '32px', flexShrink: 0, textAlign: 'center' as const }}>
            <span style={{
              fontSize: '16px', fontWeight: 900,
              color: rank === 1 ? 'rgba(247,147,30,0.25)' : 'rgba(15,23,42,0.12)',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {rank}
            </span>
          </div>
        )}

        {/* College logo chip + name + alumni */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          {/* 30px logo chip */}
          <div style={{
            width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0,
            background: 'rgba(15,23,42,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={displayName}
                style={{ width: '22px', height: '22px', objectFit: 'contain' }}
                loading="lazy"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8' }}>
                {displayName.charAt(0)}
              </span>
            )}
          </div>

          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
              {displayName}
            </p>
            <p style={{ fontSize: '10px', color: '#94A3B8', margin: 0 }}>
              {stats.player_count} alumni
            </p>
          </div>
        </div>

        {/* Secondary stats — wins + top10s (for non-delta rows) */}
        {!isDelta && (
          <>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', width: '28px', textAlign: 'center' as const, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
              {stats.wins_total}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', width: '28px', textAlign: 'center' as const, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
              {stats.top10_total}
            </span>
          </>
        )}

        {/* Primary value + proportion bar OR delta for movers */}
        <div style={{ textAlign: 'right' as const, flexShrink: 0, minWidth: '72px' }}>
          {isDelta && deltas ? (
            <>
              {deltas.earnings_rank_change !== null && deltas.earnings_rank_change !== 0 && (
                <div style={{
                  fontSize: '10px', fontWeight: 800, fontVariantNumeric: 'tabular-nums',
                  color: deltas.earnings_rank_change > 0 ? '#16A34A' : '#DC2626',
                  marginBottom: '2px',
                }}>
                  {deltas.earnings_rank_change > 0 ? `+${deltas.earnings_rank_change}` : String(deltas.earnings_rank_change)}
                </div>
              )}
              <div style={{
                fontSize: '13px', fontWeight: 800, fontVariantNumeric: 'tabular-nums',
                color: deltas.earnings_delta >= 0 ? '#16A34A' : '#DC2626',
              }}>
                {formatDeltaValue(deltas.earnings_delta)}
              </div>
            </>
          ) : (
            <>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
                {statItems[0]?.value ?? '—'}
              </span>
              {/* Proportion bar */}
              <div style={{ marginTop: '4px', width: '60px', height: '3px', borderRadius: '2px', background: 'rgba(15,23,42,0.06)', overflow: 'hidden', marginLeft: 'auto' }}>
                <div style={{ height: '100%', borderRadius: '2px', background: '#F7931E', width: `${Math.min(100, proportionPct)}%`, transition: 'width 0.4s ease' }} />
              </div>
            </>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
