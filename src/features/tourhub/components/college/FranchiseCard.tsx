/**
 * FranchiseCard - Premium college card with medallion + performance ring
 * Enhanced with: alumni face preview, dominance bar, position change animation
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/formatCurrency';
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
  /** Stagger delay for entrance animation */
  animationDelay?: number;
}

// --- Sub-components (PerformanceRing, MomentumRing, StatusBadge, Medallion) ---

interface PerformanceRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  isTopThree?: boolean;
}

function PerformanceRing({ progress, size = 60, strokeWidth = 2.5, isTopThree = false }: PerformanceRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(1, Math.max(0, progress)));
  const gradientId = isTopThree ? "performanceGradientGold" : "performanceGradient";

  return (
    <svg width={size} height={size} className="absolute inset-0 -rotate-90">
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-border/30" />
      <motion.circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={`url(#${gradientId})`} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset }} transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }} />
      <defs>
        <linearGradient id="performanceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--tab-orange))" />
        </linearGradient>
        <linearGradient id="performanceGradientGold" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(45, 93%, 47%)" />
          <stop offset="100%" stopColor="hsl(36, 100%, 50%)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function MomentumRing({ isRising, size = 60, strokeWidth = 1.5 }: { isRising: boolean; size?: number; strokeWidth?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  if (!isRising) return null;
  return (
    <svg width={size} height={size} className="absolute inset-0 -rotate-90">
      <motion.circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="url(#momentumGradient)" strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={`${circumference * 0.3} ${circumference * 0.1}`} initial={{ rotate: 0 }} animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: 'center' }} />
      <defs>
        <linearGradient id="momentumGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(142, 76%, 46%)" stopOpacity="0.8" />
          <stop offset="100%" stopColor="hsl(142, 76%, 46%)" stopOpacity="0.2" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function StatusBadge({ status }: { status: CollegeStatus }) {
  const bgColors: Record<string, string> = {
    hotStreak: 'bg-orange-500/15 border-orange-500/30',
    defendingChamp: 'bg-amber-500/15 border-amber-500/30',
    risingFast: 'bg-emerald-500/15 border-emerald-500/30',
  };
  return (
    <div className={cn("absolute -top-1 -right-1 z-20 w-5 h-5 rounded-full flex items-center justify-center text-xs border shadow-sm", bgColors[status.type] || 'bg-muted')}>
      {status.emoji}
    </div>
  );
}

function Medallion({ logoUrl, displayName, isTopThree = false, progress, status, momentum }: {
  logoUrl?: string | null; displayName: string; isTopThree?: boolean; progress: number;
  status?: CollegeStatus | null; momentum?: CollegeMomentum | null;
}) {
  const isRising = momentum?.isRising ?? false;
  return (
    <div className="relative shrink-0 w-[60px] h-[60px]">
      {isTopThree && <div className="absolute inset-0 rounded-full bg-amber-400/15 blur-xl scale-150" style={{ animation: 'pulse 3s ease-in-out infinite' }} />}
      {status && <StatusBadge status={status} />}
      <PerformanceRing progress={progress} size={60} isTopThree={isTopThree} />
      {isRising && <MomentumRing isRising={isRising} size={60} />}
      <div className={cn("absolute inset-[6px] rounded-full z-10 bg-gradient-to-br from-background via-background to-muted/30 border border-border/50 flex items-center justify-center overflow-hidden", isTopThree ? "shadow-[0_4px_20px_-4px_rgba(251,191,36,0.25),0_2px_8px_-2px_rgba(0,0,0,0.08)]" : "shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1),0_4px_16px_-4px_rgba(0,0,0,0.06)]")}>
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 rounded-full shadow-[inset_0_1px_2px_rgba(255,255,255,0.1),inset_0_-1px_2px_rgba(0,0,0,0.05)] pointer-events-none" />
        {logoUrl ? (
          <img src={logoUrl} alt={displayName} className="w-9 h-9 object-contain relative z-10" loading="lazy" />
        ) : (
          <span className="text-lg font-bold text-muted-foreground/60 relative z-10">{displayName.charAt(0).toUpperCase()}</span>
        )}
      </div>
    </div>
  );
}

// --- Main FranchiseCard ---

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
          'block p-4 rounded-xl',
          'bg-card/80 backdrop-blur-sm',
          'border border-border/40',
          'hover:border-primary/30 hover:bg-card hover:shadow-lg hover:shadow-primary/5',
          'transition-all duration-200',
          'group',
          className
        )}
      >
        <div className="flex items-center gap-4">
          {/* Rank Badge */}
          <div className="flex flex-col items-center shrink-0 w-8">
            <span className={cn("text-lg font-bold tabular-nums", isTopThree ? "text-primary" : "text-muted-foreground")}>
              {rank}
            </span>
            {rankDelta !== 0 && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: animationDelay + 0.2, type: 'spring', stiffness: 400 }}
                className={cn("flex items-center gap-0.5 text-[10px] font-medium", rankDelta > 0 ? "text-emerald-500" : "text-rose-500")}
              >
                {rankDelta > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                <span>{Math.abs(rankDelta)}</span>
              </motion.div>
            )}
          </div>

          {/* Medallion */}
          <Medallion
            logoUrl={college?.logo_url}
            displayName={displayName}
            isTopThree={isTopThree}
            progress={progress}
            status={status}
            momentum={momentum}
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-bold text-foreground truncate group-hover:text-primary transition-colors">
              {displayName}
            </h3>

            <div className="flex items-center gap-3 mt-1">
              <span className={cn("text-sm font-semibold", activeMetric === 'earnings' ? "text-[hsl(var(--tab-orange))]" : "text-foreground")}>
                {typeof metricDisplay.value === 'string' ? metricDisplay.value : `${metricDisplay.value} ${metricDisplay.label}`}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/60">
                <Users className="w-3 h-3" />
                {stats.player_count}
              </span>
            </div>

            {/* Alumni face preview */}
            {alumni && alumni.length > 0 && (
              <div className="flex items-center -space-x-1.5 mt-2">
                {alumni.slice(0, 3).map(a => (
                  <div key={a.id} className="w-6 h-6 rounded-full border-[1.5px] border-card overflow-hidden bg-muted">
                    {a.photo_url ? (
                      <img src={a.photo_url} alt={a.full_name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                        {a.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 self-center" />
        </div>

        {/* Dominance bar */}
        <div className="mt-3 h-1 rounded-full bg-border/20 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, hsl(var(--tab-orange)), hsl(45, 93%, 47%))' }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(progress * 100, 2)}%` }}
            transition={{ duration: 0.6, delay: animationDelay + 0.03 }}
          />
        </div>
      </Link>
    </motion.div>
  );
}
