/**
 * FranchiseHero - Premium college hero with medallion + season summary
 * 
 * Features:
 * - Big medallion logo with performance ring
 * - College name + season context
 * - 3 key metrics: Wins, Earnings, Active Players
 * - Optional rivals chips (for future)
 */

import { motion } from 'framer-motion';
import { Trophy, DollarSign, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CollegeSeasonStats } from '../../hooks/useCollegeStats';
import type { CollegeMedia } from '../../hooks/useCollegeMedia';
import { useTourSeason } from '../../hooks/useTourHubData';

interface FranchiseHeroProps {
  stats: CollegeSeasonStats;
  college: CollegeMedia | null;
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

interface StatCardProps {
  icon: React.ElementType;
  value: string | number;
  label: string;
  iconColor?: string;
}

function StatCard({ icon: Icon, value, label, iconColor }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col items-center p-4 rounded-xl",
        "bg-card/60 backdrop-blur-sm",
        "border border-border/40"
      )}
    >
      <Icon className={cn('w-5 h-5 mb-2', iconColor || 'text-muted-foreground')} />
      <span className="text-2xl font-bold text-foreground tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground mt-1">{label}</span>
    </motion.div>
  );
}

export function FranchiseHero({ stats, college, className }: FranchiseHeroProps) {
  const { data: season } = useTourSeason();
  const seasonYear = season?.year || 2025;
  const displayName = college?.short_name || college?.college_name || stats.normalized_name;
  
  // Calculate a simple performance score for the ring (based on relative earnings)
  // This would ideally come from comparing to other colleges
  const performanceScore = Math.min(1, stats.earnings_total / 10_000_000); // Normalize to $10M max
  
  return (
    <div className={cn('', className)}>
      {/* Header with medallion */}
      <div className="flex flex-col items-center text-center mb-8">
        {/* Big Medallion with Ring */}
        <div className="relative mb-4">
          {/* Performance Ring */}
          <svg
            width={120}
            height={120}
            className="absolute inset-0 -rotate-90"
          >
            {/* Background ring */}
            <circle
              cx={60}
              cy={60}
              r={56}
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              className="text-border/30"
            />
            {/* Progress ring */}
            <motion.circle
              cx={60}
              cy={60}
              r={56}
              fill="none"
              stroke="url(#heroGradient)"
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 56}
              initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 56 * (1 - performanceScore) }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            />
            <defs>
              <linearGradient id="heroGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--tab-orange))" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Medallion Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className={cn(
              "w-[120px] h-[120px] rounded-full",
              "bg-gradient-to-br from-background via-background to-muted/50",
              "border-2 border-border/60",
              "shadow-xl shadow-black/10",
              "flex items-center justify-center overflow-hidden",
              "relative z-10"
            )}
          >
            {college?.logo_url ? (
              <img 
                src={college.logo_url} 
                alt={displayName}
                className="w-20 h-20 object-contain"
              />
            ) : (
              <span className="text-4xl font-bold text-muted-foreground/60">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </motion.div>
        </div>
        
        {/* College Name */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="text-2xl md:text-3xl font-bold text-foreground tracking-tight"
        >
          {displayName}
        </motion.h1>
        
        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="text-sm text-muted-foreground mt-2"
        >
          {stats.player_count} PGA Tour {stats.player_count === 1 ? 'player' : 'players'} · {seasonYear} Season
        </motion.p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard 
          icon={Trophy} 
          value={stats.wins_total}
          label="Wins"
          iconColor="text-amber-500"
        />
        <StatCard 
          icon={DollarSign} 
          value={formatCurrency(stats.earnings_total)}
          label="Earnings"
          iconColor="text-emerald-500"
        />
        <StatCard 
          icon={Users} 
          value={stats.player_count}
          label="Active"
          iconColor="text-primary"
        />
      </div>
    </div>
  );
}
