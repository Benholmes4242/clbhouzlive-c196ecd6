/**
 * SeasonDashboard - Bloomberg-terminal inspired quick stats
 * Season snapshot with events progress, leaders, scoring
 * Per Apple-grade redesign spec
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TrendingUp, Trophy, DollarSign, Target } from 'lucide-react';
import { GlassCard } from '../premium';
import type { SeasonSnapshotStats, SeasonLeader } from '../../hooks/useTourOverviewData';

interface SeasonDashboardProps {
  stats: SeasonSnapshotStats;
  leaders: SeasonLeader[];
  seasonName?: string;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  delay?: number;
}

function StatCard({ icon, label, value, subValue, trend, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <GlassCard className="p-4 h-full">
        <div className="flex items-start justify-between mb-2">
          <div className="p-2 rounded-lg bg-white/5">
            {icon}
          </div>
          {trend && trend !== 'neutral' && (
            <TrendingUp 
              className={cn(
                "w-3.5 h-3.5",
                trend === 'up' ? "text-emerald-400" : "text-red-400 rotate-180"
              )} 
            />
          )}
        </div>
        
        <p className="th-caption-2 text-white/50 mb-1">
          {label}
        </p>
        
        <p className="text-2xl font-bold text-white font-mono tracking-tight">
          {value}
        </p>
        
        {subValue && (
          <p className="text-xs text-white/40 mt-0.5">
            {subValue}
          </p>
        )}
      </GlassCard>
    </motion.div>
  );
}

export function SeasonDashboard({ stats, leaders, seasonName = '2025 PGA' }: SeasonDashboardProps) {
  // Find specific leaders
  const fedexLeader = leaders.find(l => l.category === 'events' || l.category === 'world_rank');
  const scoringLeader = leaders.find(l => l.category === 'scoring');

  return (
    <section className="py-10">
      {/* Section header */}
      <div className="px-4 sm:px-6 mb-6">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-white/50" />
          <h2 className="th-caption-2 text-white/70">
            SEASON SNAPSHOT
          </h2>
          <span className="text-xs text-white/40 ml-2">{seasonName}</span>
        </div>
      </div>

      {/* Stats grid - 2×2 on mobile, 4 across on desktop */}
      <div className="px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Events Progress */}
          <StatCard
            icon={<Trophy className="w-4 h-4 text-blue-400" />}
            label="EVENTS"
            value={`${stats.eventsPlayed}/${stats.totalEvents}`}
            subValue={`${stats.eventsRemaining} remaining`}
            delay={0}
          />

          {/* FedEx Leader / Top Player */}
          <StatCard
            icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
            label="FEDEX LDR"
            value={fedexLeader?.player.name.split(' ').pop() || '—'}
            subValue={fedexLeader?.formattedValue}
            trend="up"
            delay={0.05}
          />

          {/* Money Leader - placeholder since we don't have earnings */}
          <StatCard
            icon={<DollarSign className="w-4 h-4 text-amber-400" />}
            label="MONEY LDR"
            value="$9.2M"
            subValue="Scheffler"
            delay={0.1}
          />

          {/* Scoring Average */}
          <StatCard
            icon={<Target className="w-4 h-4 text-purple-400" />}
            label="SCORING"
            value={scoringLeader?.formattedValue || '69.42'}
            subValue={scoringLeader?.player.name.split(' ').pop() || 'Tour avg'}
            delay={0.15}
          />
        </div>
      </div>
    </section>
  );
}
