/**
 * SeasonDashboard - Bloomberg-style stats grid with metrics
 * High-density data visualization for tour season overview
 */

import { motion } from 'framer-motion';
import { 
  Trophy, 
  Calendar, 
  Users, 
  DollarSign, 
  Target, 
  TrendingUp,
  Flag,
  Award,
  BarChart3,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTourHubDataStatus } from '../../hooks/useTourHubData';
import { useWorldRankings } from '../../hooks/useWorldRankings';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  highlight?: boolean;
  delay?: number;
}

function StatCard({ icon: Icon, label, value, subtext, trend, highlight, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      className={cn(
        "rounded-2xl border p-4 transition-colors",
        highlight 
          ? "bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20" 
          : "bg-white/5 border-white/10 hover:bg-white/[0.07]"
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Icon & Label */}
      <div className="flex items-center gap-2 mb-3">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          highlight ? "bg-amber-500/20" : "bg-white/10"
        )}>
          <Icon className={cn(
            "h-4 w-4",
            highlight ? "text-amber-400" : "text-white/60"
          )} />
        </div>
        <span className="text-xs font-medium text-white/50 uppercase tracking-wide">
          {label}
        </span>
      </div>
      
      {/* Value */}
      <div className="flex items-baseline gap-2">
        <span className={cn(
          "text-2xl font-bold tabular-nums",
          highlight ? "text-amber-400" : "text-white"
        )}>
          {value}
        </span>
        {trend && trend !== 'neutral' && (
          <TrendingUp className={cn(
            "h-4 w-4",
            trend === 'up' ? "text-emerald-400" : "text-red-400 rotate-180"
          )} />
        )}
      </div>
      
      {/* Subtext */}
      {subtext && (
        <p className="text-xs text-white/40 mt-1">{subtext}</p>
      )}
    </motion.div>
  );
}

export function SeasonDashboard() {
  const { data: dataStatus, isLoading: statusLoading } = useTourHubDataStatus();
  const { rankedOnly, isLoading: rankingsLoading } = useWorldRankings();
  
  const isLoading = statusLoading || rankingsLoading;
  
  // Calculate stats
  const totalTournaments = dataStatus?.tournaments || 0;
  const totalPlayers = dataStatus?.players || 0;
  const rankedPlayers = rankedOnly.length;
  
  // Get #1 player info
  const worldNo1 = rankedOnly[0];
  
  // Estimate season earnings (sum of top 50)
  const top50Earnings = rankedOnly.slice(0, 50).reduce((sum, p) => sum + (p.earnings || 0), 0);
  const formattedEarnings = top50Earnings > 0 
    ? `$${(top50Earnings / 1000000000).toFixed(2)}B` 
    : '$0';

  if (isLoading) {
    return (
      <section className="py-8 px-4" style={{ background: 'var(--th-bg-canvas, #000)' }}>
        <div className="h-6 w-40 bg-white/10 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-28 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 px-4" style={{ background: 'var(--th-bg-canvas, #000)' }}>
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-xs font-bold text-white/50 tracking-widest uppercase mb-1">
          2025 Season Dashboard
        </h2>
        <p className="text-white text-lg font-semibold">Season at a Glance</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* World #1 - Highlighted */}
        <StatCard
          icon={Trophy}
          label="World No. 1"
          value={worldNo1?.playerName.split(' ').pop() || '—'}
          subtext={worldNo1 ? `${worldNo1.playerName.split(' ')[0]}` : undefined}
          highlight
          delay={0}
        />
        
        {/* Total Tournaments */}
        <StatCard
          icon={Calendar}
          label="Tournaments"
          value={totalTournaments}
          subtext="This season"
          delay={1}
        />
        
        {/* Ranked Players */}
        <StatCard
          icon={Users}
          label="Ranked Players"
          value={rankedPlayers}
          subtext={`of ${totalPlayers} total`}
          delay={2}
        />
        
        {/* Season Earnings */}
        <StatCard
          icon={DollarSign}
          label="Top 50 Earnings"
          value={formattedEarnings}
          subtext="Combined"
          delay={3}
        />
        
        {/* Leaderboard Data */}
        <StatCard
          icon={Target}
          label="Leaderboards"
          value={dataStatus?.leaderboards || 0}
          subtext="Active entries"
          delay={4}
        />
        
        {/* Courses/Venues */}
        <StatCard
          icon={MapPin}
          label="Tour Venues"
          value={totalTournaments}
          subtext="Unique courses"
          delay={5}
        />
      </div>
      
      {/* Data Status Indicators */}
      <div className="mt-6 flex flex-wrap gap-2">
        <DataStatusPill 
          label="Rankings" 
          active={rankedPlayers > 0} 
        />
        <DataStatusPill 
          label="Leaderboards" 
          active={(dataStatus?.leaderboards || 0) > 0} 
        />
        <DataStatusPill 
          label="Tee Times" 
          active={(dataStatus?.teeTimes || 0) > 0} 
        />
        <DataStatusPill 
          label="Hole Stats" 
          active={(dataStatus?.holeStats || 0) > 0} 
        />
      </div>
    </section>
  );
}

function DataStatusPill({ label, active }: { label: string; active: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
      active 
        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
        : "bg-white/5 text-white/40 border border-white/10"
    )}>
      <div className={cn(
        "w-1.5 h-1.5 rounded-full",
        active ? "bg-emerald-400" : "bg-white/30"
      )} />
      {label}
    </div>
  );
}
