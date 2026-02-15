/**
 * FranchiseCard - Unified college card for both Leaderboard and Movers sections
 * ~110px height, logo left with rank badge, full stats right, player thumbnails
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, ChevronRight, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';
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
  /** When true, shows delta values with +/- prefix instead of totals */
  isDelta?: boolean;
  /** Delta values for movers mode */
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

  // Build stat items based on mode (totals vs deltas)
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

    // Totals mode — show all stats, emphasize active
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
          'flex overflow-hidden',
          'bg-card rounded-xl border border-border/40 shadow-sm',
          'hover:border-primary/30 hover:shadow-md',
          'active:scale-[0.98] transition-all',
          'group',
          className
        )}
        style={{ height: '110px' }}
      >
        {/* Logo section — left */}
        <div className="relative w-[100px] shrink-0 bg-muted/50 overflow-hidden flex items-center justify-center">
          {college?.logo_url ? (
            <img
              src={college.logo_url}
              alt={displayName}
              className="w-14 h-14 object-contain"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20" />
          )}

          {/* Rank badge — top-left */}
          {rank !== undefined && (
            <div className={cn(
              "absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold tabular-nums",
              isTopThree
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-background/90 text-muted-foreground border border-border/60"
            )}>
              {rank}
            </div>
          )}

          {/* Rank change for movers — bottom-left */}
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
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            </div>
          )}
        </div>

        {/* Info section — right */}
        <div className="flex-1 min-w-0 px-3 py-2.5 flex flex-col justify-center">
          {/* Row 1 — College name */}
          <h3 className="text-[15px] font-semibold text-foreground truncate leading-tight group-hover:text-primary transition-colors">
            {displayName}
          </h3>

          {/* Row 2 — Stats inline */}
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {statItems.map((item, i) => (
              <span key={i} className="flex items-center">
                {i > 0 && <span className="text-muted-foreground/30 mx-0.5 text-[10px]">·</span>}
                <span className={cn(
                  "text-[12px] tabular-nums",
                  item.isAccent
                    ? "font-semibold text-[hsl(var(--tab-orange))]"
                    : item.color || "font-medium text-muted-foreground"
                )}>
                  {item.value}{item.label ? ` ${item.label}` : ''}
                </span>
              </span>
            ))}
            {/* Alumni count always shown */}
            <span className="flex items-center">
              <span className="text-muted-foreground/30 mx-0.5 text-[10px]">·</span>
              <Users className="w-3 h-3 text-muted-foreground/50 mr-0.5" />
              <span className="text-[12px] text-muted-foreground tabular-nums">{stats.player_count}</span>
            </span>
          </div>

          {/* Row 3 — Alumni face thumbnails */}
          {alumni && alumni.length > 0 && (
            <div className="flex items-center mt-1.5">
              <div className="flex -space-x-1.5">
                {alumni.slice(0, 3).map(a => {
                  const photoUrl = resolvePhotoUrl(a.photo_url, a.pga_tour_id);
                  return (
                    <div key={a.id} className="w-5 overflow-hidden bg-muted" style={{ borderRadius: '34%', aspectRatio: '1 / 1.05', border: '1px solid #D1D5DB' }}>
                      {photoUrl ? (
                        <img src={photoUrl} alt={a.full_name} className="w-full h-full object-cover object-top" loading="lazy" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/30 flex items-center justify-center">
                          <span className="text-[6px] font-bold text-muted-foreground/70 leading-none">
                            {getInitials(a.full_name)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {stats.player_count > 3 && (
                <span className="text-[10px] text-muted-foreground/50 ml-1.5 tabular-nums">
                  +{stats.player_count - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Chevron */}
        <div className="flex items-center pr-3 shrink-0">
          <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
        </div>
      </Link>
    </motion.div>
  );
}
