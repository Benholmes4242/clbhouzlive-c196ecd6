/**
 * FranchiseCard — College Franchise leaderboard row.
 *
 * Phase 1 polish (College Franchise brief):
 *  - Top-3 tier accent: amber wash bg, 3px amber rail, 38px logo, name 900,
 *    primary value amber, padding 12px 16px.
 *  - Below top-3: white bg, no rail, 34px logo, name 700, value ink, 11px 16px.
 *  - Captain context line replaces "{N} alumni" subline.
 *    Falls back to "{N} alumni" when no captain dominates by >20% margin.
 *  - Inline MovementIndicator next to franchise name (rank-change driven).
 *  - Proportion bars removed.
 *
 * Movers/delta variant (isDelta) is preserved unchanged for FranchiseMovers.
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import type { CollegeSeasonStats } from '../../hooks/useCollegeStats';
import type { CollegeMedia } from '../../hooks/useCollegeMedia';
import type { CollegeMomentum } from '../../hooks/useCollegeStatus';
import type { AlumniFace } from '../../hooks/useBatchCollegeAlumni';
import type { FranchiseCaptain } from '../../hooks/useFranchiseCaptains';
import { MovementIndicator } from '../shared/MovementIndicator';
import {
  captainDominates,
  formatCaptainEarnings,
  captainShortName,
} from '../../utils/captainAnchor';

interface FranchiseCardProps {
  stats: CollegeSeasonStats;
  college: CollegeMedia | null;
  rank?: number;
  /** @deprecated Proportion bars removed in Phase 1 polish. Kept for prop-shape stability. */
  maxValue?: number;
  activeMetric?: 'earnings' | 'wins' | 'top10s';
  previousRank?: number;
  momentum?: CollegeMomentum | null;
  alumni?: AlumniFace[];
  /** Captain (top-earning alumnus) for this franchise. Used for context subline. */
  captain?: FranchiseCaptain | null;
  /** Week-over-week earnings rank delta. Positive = rank improved (e.g. #8 → #5 = +3).
   *  Convention matches MovementIndicator's positive=improved, so passed through
   *  unchanged at the call site. */
  earningsRankChange?: number | null;
  /** Movers-tab driver (highest-money finisher this week). Renders as
   *  "{N} alumni · {driver}" in the isDelta subline. Null = fall back to "{N} alumni". */
  driverText?: string | null;
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

export function FranchiseCard({
  stats, college, rank, activeMetric = 'earnings',
  alumni: _alumni, captain, earningsRankChange, driverText,
  className, animationDelay = 0,
  isDelta = false, deltas,
}: FranchiseCardProps) {
  const displayName = college?.short_name || college?.college_name || stats.normalized_name;
  const slug = stats.normalized_name;
  const logoUrl = getCollegeLogoUrl(college?.college_name || stats.normalized_name);

  const isTopThree = !isDelta && rank !== undefined && rank >= 1 && rank <= 3;

  const primaryValueText = activeMetric === 'wins'
    ? String(stats.wins_total)
    : activeMetric === 'top10s'
    ? String(stats.top10_total)
    : formatCompact(stats.earnings_total);

  // Captain context line (non-delta rows). Falls back to "{N} alumni" when
  // captain doesn't dominate by >20% (see captainAnchor.ts).
  // Movers (isDelta) rows use a separate driver-line rule below.
  const showCaptain = !isDelta && captain && captainDominates(captain);
  const sublineText = isDelta
    ? (driverText
        ? `${stats.player_count} alumni · ${driverText}`
        : `${stats.player_count} alumni`)
    : showCaptain
      ? `${captainShortName(captain!.fullName)} · ${formatCaptainEarnings(captain!.earnings)} season`
      : `${stats.player_count} alumni`;

  const ariaLabel = [
    rank !== undefined ? `Rank ${rank}` : null,
    displayName,
    `${formatCompact(stats.earnings_total)} earnings`,
    `${stats.wins_total} ${pluralize(stats.wins_total, 'win')}`,
    `${stats.top10_total} top 10s`,
  ].filter(Boolean).join(', ');

  // Tier-driven row metrics
  const logoSize = isTopThree ? 38 : 34;
  const nameWeight = isTopThree ? 900 : 700;
  const primaryValueColor = isTopThree ? '#F7931E' : '#0F172A';
  const rowPaddingY = isTopThree ? 12 : 11;
  const rankNumberColor = isTopThree ? '#c97a10' : 'rgba(15,23,42,0.12)';
  const rankNumberWeight = isTopThree ? 900 : 800;

  // Data layer and component conventions agree: positive earnings_rank_change
  // = rank improved (e.g. #8 → #5 = +3), MovementIndicator positive = improved.
  // Pass through unchanged.
  const movementDelta = earningsRankChange ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: animationDelay, duration: 0.25 }}
      className={className}
    >
      <Link
        to={`/tourhub/college-golf/${slug}`}
        aria-label={ariaLabel}
        style={{
          display: 'flex', alignItems: 'center',
          padding: `${rowPaddingY}px 16px`,
          borderBottom: '0.5px solid rgba(15,23,42,0.07)',
          textDecoration: 'none',
          ...(isDelta && deltas ? {
            borderLeft: deltas.earnings_delta >= 0
              ? '3px solid #16A34A'
              : '3px solid #DC2626',
            background: deltas.earnings_delta >= 0
              ? 'rgba(22,163,74,0.025)'
              : 'rgba(220,38,38,0.02)',
          } : isTopThree ? {
            borderLeft: '3px solid #F7931E',
            background: 'rgba(247,147,30,0.05)',
          } : {
            borderLeft: '3px solid transparent',
            background: 'transparent',
          }),
        }}
        className="active:bg-black/[0.02] transition-colors"
      >
        {/* Rank number */}
        {rank !== undefined && !isDelta && (
          <div style={{ width: '32px', flexShrink: 0, textAlign: 'center' as const }}>
            <span style={{
              fontSize: isTopThree ? '17px' : '16px',
              fontWeight: rankNumberWeight,
              color: rankNumberColor,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.02em',
            }}>
              {rank}
            </span>
          </div>
        )}

        {/* College logo + name + subline */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div style={{
            width: logoSize, height: logoSize, borderRadius: 8, flexShrink: 0,
            background: 'rgba(15,23,42,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={displayName}
                style={{ width: logoSize - 8, height: logoSize - 8, objectFit: 'contain' }}
                loading="lazy"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <span style={{ fontSize: 13, fontWeight: 800, color: '#94A3B8' }}>
                {displayName.charAt(0)}
              </span>
            )}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <p style={{
                fontSize: 15, fontWeight: nameWeight, color: '#0F172A',
                margin: 0, letterSpacing: '-0.3px',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
              }}>
                {displayName}
              </p>
              {!isDelta && <MovementIndicator delta={movementDelta} />}
            </div>
            <p style={{
              fontSize: 11,
              fontWeight: (showCaptain || (isDelta && driverText)) ? 600 : 500,
              color: (showCaptain || (isDelta && driverText)) ? '#475569' : '#94A3B8',
              margin: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
            }}>
              {sublineText}
            </p>
          </div>
        </div>

        {/* Secondary stats — wins + top10s (non-delta only) */}
        {!isDelta && (
          <>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', width: 28, textAlign: 'center' as const, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
              {stats.wins_total}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', width: 28, textAlign: 'center' as const, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
              {stats.top10_total}
            </span>
          </>
        )}

        {/* Primary value */}
        <div style={{ textAlign: 'right' as const, flexShrink: 0, minWidth: 72 }}>
          {isDelta && deltas ? (
            <>
              {deltas.earnings_rank_change !== null && deltas.earnings_rank_change !== 0 && (
                <div style={{
                  fontSize: 12, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
                  // Data layer: negative earnings_rank_change = rank worsened.
                  // For movers-row text colour we keep the existing semantic:
                  // positive raw = improved (green), negative raw = worsened (red).
                  color: deltas.earnings_rank_change > 0 ? '#16A34A' : '#DC2626',
                  marginBottom: 2,
                }}>
                  {deltas.earnings_rank_change > 0 ? `+${deltas.earnings_rank_change}` : String(deltas.earnings_rank_change)}
                </div>
              )}
              <div style={{
                fontSize: 15, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
                color: deltas.earnings_delta >= 0 ? '#16A34A' : '#DC2626',
              }}>
                {formatDeltaValue(deltas.earnings_delta)}
              </div>
            </>
          ) : (
            <span style={{
              fontSize: 17, fontWeight: 900, color: primaryValueColor,
              fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.4px',
            }}>
              {primaryValueText}
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
