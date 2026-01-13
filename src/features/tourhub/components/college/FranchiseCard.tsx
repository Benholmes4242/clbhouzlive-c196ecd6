/**
 * FranchiseCard - Premium college card with medallion + performance ring
 * 
 * Features:
 * - Medallion container with glass/metal feel for logo
 * - Performance ring around logo (normalized score visualization)
 * - Rank badge with movement indicator
 * - Contextual metrics per tab
 * - Subtle tap scale animation
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CollegeSeasonStats } from '../../hooks/useCollegeStats';
import type { CollegeMedia } from '../../hooks/useCollegeMedia';

interface FranchiseCardProps {
  stats: CollegeSeasonStats;
  college: CollegeMedia | null;
  rank: number;
  /** For calculating normalized performance ring */
  maxValue?: number;
  /** Which metric to show the ring for */
  activeMetric?: 'earnings' | 'wins' | 'cuts' | 'top10s';
  /** Previous rank for movement indicator */
  previousRank?: number;
  className?: string;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount.toFixed(0)}`;
}

interface PerformanceRingProps {
  progress: number; // 0-1
  size?: number;
  strokeWidth?: number;
}

function PerformanceRing({ progress, size = 56, strokeWidth = 2.5 }: PerformanceRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(1, Math.max(0, progress)));

  return (
    <svg
      width={size}
      height={size}
      className="absolute inset-0 -rotate-90"
    >
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-border/30"
      />
      {/* Progress ring */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#performanceGradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
      />
      <defs>
        <linearGradient id="performanceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--tab-orange))" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function FranchiseCard({ 
  stats, 
  college, 
  rank, 
  maxValue = 1,
  activeMetric = 'earnings',
  previousRank,
  className 
}: FranchiseCardProps) {
  const displayName = college?.short_name || college?.college_name || stats.normalized_name;
  const slug = stats.normalized_name;

  // Calculate performance ring progress based on active metric
  const getMetricValue = () => {
    switch (activeMetric) {
      case 'wins': return stats.wins_total;
      case 'cuts': return stats.cuts_total;
      case 'top10s': return stats.top10_total;
      default: return stats.earnings_total;
    }
  };
  
  const progress = maxValue > 0 ? getMetricValue() / maxValue : 0;

  // Calculate rank movement
  const rankDelta = previousRank ? previousRank - rank : 0;
  const RankIcon = rankDelta > 0 ? TrendingUp : rankDelta < 0 ? TrendingDown : Minus;

  // Get contextual metric display
  const getMetricDisplay = () => {
    switch (activeMetric) {
      case 'wins': 
        return { value: stats.wins_total, label: 'wins' };
      case 'cuts': 
        return { value: stats.cuts_total, label: 'cuts' };
      case 'top10s': 
        return { value: stats.top10_total, label: 'top 10s' };
      default: 
        return { value: formatCurrency(stats.earnings_total), label: '' };
    }
  };

  const metricDisplay = getMetricDisplay();

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
    >
      <Link
        to={`/tourhub/college-golf/${slug}`}
        className={cn(
          'flex items-center gap-3 p-4 rounded-xl',
          'bg-card/80 backdrop-blur-sm',
          'border border-border/40',
          'hover:border-primary/30 hover:bg-card hover:shadow-lg hover:shadow-primary/5',
          'transition-all duration-200',
          'group',
          className
        )}
      >
        {/* Rank Badge with Movement */}
        <div className="flex flex-col items-center shrink-0 w-8">
          <span className={cn(
            "text-lg font-bold tabular-nums",
            rank <= 3 ? "text-primary" : "text-muted-foreground"
          )}>
            {rank}
          </span>
          {rankDelta !== 0 && (
            <div className={cn(
              "flex items-center gap-0.5 text-[10px] font-medium",
              rankDelta > 0 ? "text-emerald-500" : "text-rose-500"
            )}>
              <RankIcon className="w-2.5 h-2.5" />
              <span>{Math.abs(rankDelta)}</span>
            </div>
          )}
        </div>
        
        {/* Medallion with Performance Ring */}
        <div className="relative shrink-0">
          {/* Performance Ring */}
          <PerformanceRing progress={progress} size={56} />
          
          {/* Medallion Container */}
          <div className={cn(
            "w-14 h-14 rounded-full",
            "bg-gradient-to-br from-background via-background to-muted/50",
            "border border-border/60",
            "shadow-inner",
            "flex items-center justify-center overflow-hidden",
            "relative z-10"
          )}>
            {college?.logo_url ? (
              <img 
                src={college.logo_url} 
                alt={displayName}
                className="w-10 h-10 object-contain"
                loading="lazy"
              />
            ) : (
              <span className="text-xl font-bold text-muted-foreground/60">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {displayName}
          </h3>
          
          {/* Stats Row */}
          <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-muted-foreground/60" />
              {stats.player_count}
            </span>
            <span className={cn(
              "font-medium",
              activeMetric === 'earnings' ? "text-emerald-600" : "text-foreground"
            )}>
              {typeof metricDisplay.value === 'string' 
                ? metricDisplay.value 
                : `${metricDisplay.value} ${metricDisplay.label}`
              }
            </span>
          </div>
        </div>
        
        {/* Arrow */}
        <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
      </Link>
    </motion.div>
  );
}
