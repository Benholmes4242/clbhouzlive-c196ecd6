/**
 * SeasonDashboardV3 - Premium stat cards with real data
 */

import { motion } from 'framer-motion';
import { 
  Trophy, 
  Calendar, 
  Users, 
  Target, 
  MapPin,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOverviewStats } from '../../hooks/useOverviewData';
import CountryFlag from '@/components/ui/country-flag';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  highlight?: boolean;
  delay?: number;
  extraContent?: React.ReactNode;
}

function StatCard({ icon: Icon, label, value, subtext, highlight, delay = 0, extraContent }: StatCardProps) {
  return (
    <motion.div
      className={cn(
        "rounded-2xl border p-4 transition-all hover:shadow-lg",
        highlight 
          ? "bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200 ring-2 ring-amber-300/30" 
          : "bg-white border-slate-200 hover:border-slate-300"
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Icon & Label */}
      <div className="flex items-center gap-2 mb-3">
        <div className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center",
          highlight ? "bg-amber-200/60" : "bg-slate-100"
        )}>
          <Icon className={cn(
            "h-4.5 w-4.5",
            highlight ? "text-amber-600" : "text-slate-500"
          )} />
        </div>
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          {label}
        </span>
      </div>
      
      {/* Value */}
      <div className="flex items-baseline gap-2">
        <span className={cn(
          "text-2xl font-bold tabular-nums",
          highlight ? "text-amber-700" : "text-slate-800"
        )}>
          {value}
        </span>
      </div>
      
      {/* Subtext */}
      {subtext && (
        <p className="text-xs text-slate-400 mt-1">{subtext}</p>
      )}

      {/* Extra content */}
      {extraContent}
    </motion.div>
  );
}

export function SeasonDashboardV3() {
  const { data: stats, isLoading } = useOverviewStats();

  if (isLoading) {
    return (
      <section className="py-6 px-4 bg-[#F8FAFC]">
        <div className="h-6 w-48 bg-slate-200 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  const worldNo1 = stats?.worldNo1;

  return (
    <section className="py-6 px-4 bg-[#F8FAFC]">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-0.5">
          2025 Season Dashboard
        </h2>
        <p className="text-slate-800 text-lg font-semibold">Season at a Glance</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* World #1 - Highlighted */}
        <StatCard
          icon={Trophy}
          label="World No. 1"
          value={worldNo1?.lastName || '—'}
          subtext={worldNo1?.firstName}
          highlight
          delay={0}
          extraContent={
            worldNo1?.country && (
              <div className="flex items-center gap-1.5 mt-2">
                <CountryFlag country={worldNo1.country} size="sm" />
                {worldNo1.avgPoints && (
                  <span className="text-xs text-amber-600 font-medium">
                    {worldNo1.avgPoints.toFixed(2)} pts
                  </span>
                )}
              </div>
            )
          }
        />
        
        {/* Total Tournaments */}
        <StatCard
          icon={Calendar}
          label="Tournaments"
          value={stats?.totalTournaments || 0}
          subtext="All tours combined"
          delay={1}
        />
        
        {/* Ranked Players */}
        <StatCard
          icon={Users}
          label="World Ranked"
          value={stats?.rankedPlayers || 0}
          subtext={`of ${stats?.totalPlayers || 0} total players`}
          delay={2}
        />
        
        {/* Live Tournaments */}
        <StatCard
          icon={Target}
          label="Live Now"
          value={stats?.liveTournaments || 0}
          subtext="Active tournaments"
          delay={3}
          extraContent={
            (stats?.liveTournaments || 0) > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
                <span className="text-xs text-red-500 font-medium">Live</span>
              </div>
            )
          }
        />
        
        {/* Unique Courses */}
        <StatCard
          icon={MapPin}
          label="Tour Venues"
          value={stats?.uniqueCourses || 0}
          subtext="Unique courses"
          delay={4}
        />
        
        {/* Season Progress */}
        <StatCard
          icon={TrendingUp}
          label="Data Points"
          value="15M+"
          subtext="SportRadar synced"
          delay={5}
        />
      </div>
    </section>
  );
}
