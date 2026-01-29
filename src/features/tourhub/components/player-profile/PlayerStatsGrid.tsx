/**
 * PlayerStatsGrid - Bloomberg-style stats dashboard for player profile
 */

import { motion } from 'framer-motion';
import { Target, Crosshair, Flag, Percent, TrendingUp, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard } from '../premium';
import type { TourPlayerStatistics } from '../../hooks/useTourHubData';

interface PlayerStatsGridProps {
  stats: TourPlayerStatistics;
  className?: string;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number | null;
  suffix?: string;
  trend?: 'up' | 'down' | null;
  delay?: number;
}

function StatCard({ icon, label, value, suffix = '', trend, delay = 0 }: StatCardProps) {
  if (value === null || value === undefined) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <GlassCard className="p-4 h-full">
        <div className="flex items-start justify-between mb-2">
          <div className="p-2 rounded-lg bg-white/10">
            {icon}
          </div>
          {trend && (
            <TrendingUp 
              className={cn(
                'w-4 h-4',
                trend === 'up' ? 'text-green-400' : 'text-red-400 rotate-180'
              )} 
            />
          )}
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-white">
            {typeof value === 'number' ? value.toLocaleString() : value}
            {suffix && <span className="text-sm font-normal text-white/60 ml-1">{suffix}</span>}
          </p>
          <p className="text-sm text-white/60 mt-1">{label}</p>
        </div>
      </GlassCard>
    </motion.div>
  );
}

export function PlayerStatsGrid({ stats, className }: PlayerStatsGridProps) {
  const hasAnyStats = stats.scoring_average || stats.driving_distance || 
    stats.driving_accuracy || stats.greens_in_reg || stats.putting_average ||
    stats.events_played || stats.cuts_made || stats.wins || stats.top_10s;
  
  if (!hasAnyStats) {
    return (
      <div className={cn('text-center py-12', className)}>
        <p className="text-white/60">No statistics available yet</p>
      </div>
    );
  }
  
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4', className)}>
      {/* Performance Stats */}
      <StatCard
        icon={<Award className="w-5 h-5 text-yellow-400" />}
        label="Wins"
        value={stats.wins}
        delay={0}
      />
      
      <StatCard
        icon={<Flag className="w-5 h-5 text-th-accent" />}
        label="Top 10s"
        value={stats.top_10s}
        delay={0.05}
      />
      
      <StatCard
        icon={<Target className="w-5 h-5 text-green-400" />}
        label="Cuts Made"
        value={stats.cuts_made}
        delay={0.1}
      />
      
      <StatCard
        icon={<Crosshair className="w-5 h-5 text-blue-400" />}
        label="Events Played"
        value={stats.events_played}
        delay={0.15}
      />
      
      {/* Technical Stats */}
      {stats.scoring_average && (
        <StatCard
          icon={<Target className="w-5 h-5 text-purple-400" />}
          label="Scoring Average"
          value={stats.scoring_average.toFixed(2)}
          delay={0.2}
        />
      )}
      
      {stats.driving_distance && (
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-orange-400" />}
          label="Driving Distance"
          value={stats.driving_distance.toFixed(1)}
          suffix="yds"
          delay={0.25}
        />
      )}
      
      {stats.driving_accuracy && (
        <StatCard
          icon={<Percent className="w-5 h-5 text-cyan-400" />}
          label="Driving Accuracy"
          value={stats.driving_accuracy.toFixed(1)}
          suffix="%"
          delay={0.3}
        />
      )}
      
      {stats.greens_in_reg && (
        <StatCard
          icon={<Flag className="w-5 h-5 text-emerald-400" />}
          label="GIR"
          value={stats.greens_in_reg.toFixed(1)}
          suffix="%"
          delay={0.35}
        />
      )}
      
      {stats.putting_average && (
        <StatCard
          icon={<Crosshair className="w-5 h-5 text-indigo-400" />}
          label="Putting Average"
          value={stats.putting_average.toFixed(2)}
          delay={0.4}
        />
      )}
      
      {stats.sand_saves && (
        <StatCard
          icon={<Percent className="w-5 h-5 text-amber-400" />}
          label="Sand Saves"
          value={stats.sand_saves.toFixed(1)}
          suffix="%"
          delay={0.45}
        />
      )}
      
      {stats.scrambling && (
        <StatCard
          icon={<Percent className="w-5 h-5 text-pink-400" />}
          label="Scrambling"
          value={stats.scrambling.toFixed(1)}
          suffix="%"
          delay={0.5}
        />
      )}
      
      {stats.strokes_gained_total && (
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-teal-400" />}
          label="Strokes Gained"
          value={stats.strokes_gained_total.toFixed(2)}
          delay={0.55}
        />
      )}
    </div>
  );
}
