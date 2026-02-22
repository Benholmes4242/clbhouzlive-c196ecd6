/**
 * FranchiseCard - Unified college card for both Leaderboard and Movers sections
 * ~110px height, logo left (140px) with rank badge, full stats right, player thumbnails
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, ChevronRight, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { FollowCollegeButton } from './FollowCollegeButton';
import type { CollegeSeasonStats } from '../../hooks/useCollegeStats';
import type { CollegeMedia } from '../../hooks/useCollegeMedia';
import type { CollegeStatus, CollegeMomentum } from '../../hooks/useCollegeStatus';
import type { AlumniFace } from '../../hooks/useBatchCollegeAlumni';

interface FranchiseCardProps {
  stats: CollegeSeasonStats;
  college: CollegeMedia | null;
  rank?: number;
  maxValue?: number;
  activeMetric?: 'earnings' | 'wins' | 'cuts' | 'top10s';
  previousRank?: number;
  status?: CollegeStatus | null;
  momentum?: CollegeMomentum | null;
  alumni?: AlumniFace[];
  className?: string;
  animationDelay?: number;
  isDelta?: boolean;
  deltas?: {
    earnings_delta: number;
    wins_delta: number;
    cuts_delta: number;
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

export function FranchiseCard({
  stats, college, rank, activeMetric = 'earnings',
  status, momentum, alumni, className, animationDelay = 0,
  isDelta = false, deltas,
}: FranchiseCardProps) {
  const displayName = college?.short_name || college?.college_name || stats.normalized_name;
  const slug = stats.normalized_name;
  const isTopThree = rank !== undefined && rank <= 3;
  const momentumRising = momentum?.isRising ?? false;

  const buildStats = () => {
    if (isDelta && deltas) {
      const items: { label: string; value: string; isAccent: boolean; color?: string }[] = [];
      const earningsStr = formatDeltaValue(deltas.earnings_delta);
      const winsStr = deltas.wins_delta !== 0 ? `${deltas.wins_delta > 0 ? '+' : ''}${deltas.wins_delta}` : null;
      const cutsStr = deltas.cuts_delta !== 0 ? `${deltas.cuts_delta > 0 ? '+' : ''}${deltas.cuts_delta}` : null;
      
      items.push({ label: '', value: earningsStr, isAccent: true, color: deltas.earnings_delta >= 0 ? 'text-emerald-600' : 'text-rose-600' });
      if (winsStr) items.push({ label: pluralize(deltas.wins_delta, 'win'), value: winsStr, isAccent: false, color: deltas.wins_delta > 0 ? 'text-amber-600' : 'text-muted-foreground' });
      if (cutsStr) items.push({ label: pluralize(deltas.cuts_delta, 'cut'), value: cutsStr, isAccent: false });
      return items;
    }

    return [
      { label: '', value: formatCompact(stats.earnings_total), isAccent: activeMetric === 'earnings' },
      { label: pluralize(stats.wins_total, 'win'), value: String(stats.wins_total), isAccent: activeMetric === 'wins' },
      { label: pluralize(stats.cuts_total, 'cut'), value: String(stats.cuts_total), isAccent: activeMetric === 'cuts' },
    ];
  };

  const statItems = buildStats();
  const rankChange = isDelta ? deltas?.earnings_rank_change : null;

  const ariaLabel = [
    rank !== undefined ? `Rank ${rank}` : null,
    displayName,
    `${formatCompact(stats.earnings_total)} earnings`,
    `${stats.wins_total} ${pluralize(stats.wins_total, 'win')}`,
    `${stats.cuts_total} ${pluralize(stats.cuts_total, 'cut')}`,
    `${stats.player_count} alumni`,
  ].filter(Boolean).join(', ');

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: animationDelay, duration: 0.3 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link
        to={`/tourhub/college-golf/${slug}`}
        aria-label={ariaLabel}
        className={cn(
          'flex overflow-hidden group',
          'active:scale-[0.98] transition-all',
          className
        )}
        style={{
          background: 'hsl(var(--card))',
          borderRadius: 16,
          border: '1px solid hsl(var(--border) / 0.5)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          minHeight: 110,
        }}
      >
        {/* Logo section — left, 140px wide */}
        <div
          className="relative shrink-0 overflow-hidden flex items-center justify-center"
          style={{
            width: 140,
            background: 'hsl(var(--muted) / 0.3)',
            borderRadius: '16px 0 0 16px',
          }}
        >
          {getCollegeLogoUrl(college?.college_name || stats.normalized_name) ? (
            <img
              src={getCollegeLogoUrl(college?.college_name || stats.normalized_name)!}
              alt={displayName}
              style={{ width: 64, height: 64, objectFit: 'contain' }}
              loading="lazy"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20" />
          )}

          {/* Rank badge — top-left */}
          {rank !== undefined && (
            <div
              className="absolute flex items-center justify-center"
              style={{
                top: 8,
                left: 10,
                width: isTopThree ? 24 : 'auto',
                height: isTopThree ? 24 : 'auto',
                borderRadius: isTopThree ? '50%' : 4,
                background: isTopThree ? '#f59e0b' : 'transparent',
                color: isTopThree ? 'white' : 'hsl(var(--muted-foreground) / 0.5)',
                fontSize: isTopThree ? 11 : 12,
                fontWeight: isTopThree ? 700 : 600,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {rank}
            </div>
          )}

          {/* Rank change for movers */}
          {isDelta && rankChange !== null && rankChange !== 0 && (
            <div className={cn(
              "absolute bottom-2 left-2 text-[10px] font-bold tabular-nums",
              rankChange > 0 ? "text-emerald-600" : "text-rose-600"
            )}>
              {rankChange > 0 ? `+${rankChange}` : rankChange}
            </div>
          )}

          {/* Momentum indicator */}
          {!isDelta && momentumRising && (
            <div className="absolute bottom-2 left-2">
              <TrendingUp className="w-3.5 h-3.5" style={{ color: '#22C55E' }} />
            </div>
          )}
        </div>

        {/* Info section — right */}
        <div className="flex-1 min-w-0 flex flex-col justify-center" style={{ padding: '14px 12px 14px 0', paddingLeft: 14 }}>
          {/* College name — 16px, 600 */}
          <h3
            className="text-foreground truncate leading-tight group-hover:text-primary transition-colors"
            style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.1px' }}
          >
            {displayName}
          </h3>

          {/* Stats inline — 12px, 500 */}
          <div className="flex items-center gap-1 flex-wrap" style={{ marginTop: 4 }}>
            {statItems.map((item, i) => (
              <span key={i} className="flex items-center">
                {i > 0 && <span className="text-muted-foreground/30 mx-0.5" style={{ fontSize: 10 }}>·</span>}
                <span
                  className={cn(
                    'tabular-nums',
                    item.isAccent
                      ? 'text-[#f59e0b]'
                      : item.color || 'text-muted-foreground'
                  )}
                  style={{
                    fontSize: 12,
                    fontWeight: item.isAccent ? 600 : 500,
                  }}
                >
                  {item.value}{item.label ? ` ${item.label}` : ''}
                </span>
              </span>
            ))}
            {/* Alumni count */}
            <span className="flex items-center">
              <span className="text-muted-foreground/30 mx-0.5" style={{ fontSize: 10 }}>·</span>
              <Users className="w-3 h-3 text-muted-foreground mr-0.5" />
              <span className="text-muted-foreground tabular-nums" style={{ fontSize: 12 }}>{stats.player_count}</span>
            </span>
          </div>

          {/* Alumni face thumbnails — 24×24 circular */}
          {alumni && alumni.length > 0 && (
            <div className="flex items-center" style={{ marginTop: 6 }}>
              <div className="flex items-center">
                {alumni.slice(0, 3).map((a, i) => {
                  const photoUrl = getPlayerHeadshotUrl(a.full_name, 'pga');
                  return (
                    <div
                      key={a.id}
                      className="bg-muted overflow-hidden"
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        border: '1.5px solid white',
                        marginLeft: i === 0 ? 0 : -6,
                        zIndex: 3 - i,
                        position: 'relative',
                      }}
                    >
                      {photoUrl ? (
                        <img src={photoUrl} alt={a.full_name} className="w-full h-full object-cover object-top" loading="lazy" />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <span className="text-[6px] font-bold text-muted-foreground/70">
                            {getInitials(a.full_name)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {stats.player_count > 3 && (
                <span className="text-muted-foreground/40 ml-1.5 tabular-nums" style={{ fontSize: 11, fontWeight: 500 }}>
                  +{stats.player_count - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Follow button + Chevron */}
        <div className="flex items-center pr-3 shrink-0 gap-2">
          <FollowCollegeButton normalizedName={slug} className="h-7 text-xs px-3" />
          <ChevronRight className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground) / 0.25)' }} />
        </div>
      </Link>
    </motion.div>
  );
}
