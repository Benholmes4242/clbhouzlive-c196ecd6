/**
 * FranchiseCard - College card matching PlayerCardV2 layout
 * 110px height, squircle logo left, info right, clean design
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
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
  rank: number;
  maxValue?: number;
  activeMetric?: 'earnings' | 'wins' | 'cuts' | 'top10s';
  previousRank?: number;
  status?: CollegeStatus | null;
  momentum?: CollegeMomentum | null;
  alumni?: AlumniFace[];
  className?: string;
  animationDelay?: number;
}

export function FranchiseCard({
  stats, college, rank, maxValue = 1, activeMetric = 'earnings',
  previousRank, status, momentum, alumni, className, animationDelay = 0,
}: FranchiseCardProps) {
  const displayName = college?.short_name || college?.college_name || stats.normalized_name;
  const slug = stats.normalized_name;

  const getMetricValue = () => {
    switch (activeMetric) {
      case 'wins': return stats.wins_total;
      case 'cuts': return stats.cuts_total;
      case 'top10s': return stats.top10_total;
      default: return stats.earnings_total;
    }
  };

  const progress = maxValue > 0 ? getMetricValue() / maxValue : 0;
  const rankDelta = previousRank ? previousRank - rank : 0;
  const isTopThree = rank <= 3;
  const momentumRising = momentum?.isRising ?? false;

  const getMetricDisplay = () => {
    switch (activeMetric) {
      case 'wins': return { value: stats.wins_total, label: 'wins' };
      case 'cuts': return { value: stats.cuts_total, label: 'cuts' };
      case 'top10s': return { value: stats.top10_total, label: 'top 10s' };
      default: return { value: formatCurrency(stats.earnings_total), label: '' };
    }
  };
  const metricDisplay = getMetricDisplay();

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: animationDelay, duration: 0.3 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link
        to={`/tourhub/college-golf/${slug}`}
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
        {/* Logo section — left ~110px, matching PlayerCardV2 photo area */}
        <div className="relative w-[110px] shrink-0 bg-muted overflow-hidden flex items-center justify-center">
          {college?.logo_url ? (
            <img
              src={college.logo_url}
              alt={displayName}
              className="w-16 h-16 object-contain"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20" />
          )}
          {/* Rank badge overlay */}
          <div className={cn(
            "absolute top-2 left-2 w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold tabular-nums font-mono",
            isTopThree ? "bg-amber-500/20 text-amber-600" : "bg-background/80 text-muted-foreground"
          )}>
            {rank}
          </div>
          {/* Momentum indicator */}
          {momentumRising && (
            <div className="absolute bottom-2 left-2">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            </div>
          )}
        </div>

        {/* Info section — right */}
        <div className="flex-1 min-w-0 px-3.5 py-3 flex flex-col justify-center">
          {/* Name */}
          <h3 className="text-base font-semibold text-foreground truncate leading-tight group-hover:text-primary transition-colors">
            {displayName}
          </h3>

          {/* Stats row */}
          <div className="flex items-center gap-3 mt-1.5">
            <span className={cn(
              "text-[13px] font-semibold font-mono tabular-nums",
              activeMetric === 'earnings' ? "text-[hsl(var(--tab-orange))]" : "text-foreground"
            )}>
              {typeof metricDisplay.value === 'string' ? metricDisplay.value : `${metricDisplay.value} ${metricDisplay.label}`}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/50">
              <Users className="w-3 h-3" />
              {stats.player_count}
            </span>
          </div>

          {/* Alumni face preview — squircle */}
          {alumni && alumni.length > 0 && (
            <div className="flex items-center -space-x-1.5 mt-2">
              {alumni.slice(0, 3).map(a => {
                const photoUrl = resolvePhotoUrl(a.photo_url, a.pga_tour_id);
                return (
                  <div key={a.id} className="w-5 h-5 border border-card overflow-hidden bg-muted" style={{ borderRadius: '34%' }}>
                    {photoUrl ? (
                      <img src={photoUrl} alt={a.full_name} className="w-full h-full object-cover object-top" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20" />
                    )}
                  </div>
                );
              })}
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
