import { Calendar, Users, BarChart3, Trophy } from 'lucide-react';
import { useTourSeason, useTourTournaments, useTourPlayerStatistics } from '../../hooks/useTourHubData';
import { useMemo } from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  subLabel?: string;
}

function StatCard({ icon, value, label, subLabel }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 text-center">
      <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-primary/10 flex items-center justify-center">
        {icon}
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
      {subLabel && (
        <div className="text-[10px] text-muted-foreground/70 mt-0.5">{subLabel}</div>
      )}
    </div>
  );
}

export function SeasonSnapshot() {
  const { data: season } = useTourSeason();
  const { data: tournaments, isLoading: tournamentsLoading } = useTourTournaments(season?.id);
  const { data: playerStats, isLoading: statsLoading } = useTourPlayerStatistics(season?.id);

  const stats = useMemo(() => {
    if (!tournaments) return { total: 0, completed: 0, remaining: 0 };
    
    const completed = tournaments.filter(t => t.status === 'closed').length;
    const remaining = tournaments.length - completed;
    
    return {
      total: tournaments.length,
      completed,
      remaining,
    };
  }, [tournaments]);

  const playerCount = useMemo(() => {
    if (!playerStats) return 0;
    return playerStats.length;
  }, [playerStats]);

  // Count unique stat categories available
  const statCategoriesCount = useMemo(() => {
    if (!playerStats || playerStats.length === 0) return 0;
    
    // Check what stats are available in raw_data
    const firstWithRawData = playerStats.find(p => (p as any).raw_data?.statistics);
    if (!firstWithRawData) return 6; // Default count
    
    const rawStats = (firstWithRawData as any).raw_data?.statistics || {};
    return Object.keys(rawStats).filter(key => rawStats[key] !== null).length;
  }, [playerStats]);

  if (tournamentsLoading || statsLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-muted rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground px-1">Season at a Glance</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<Calendar className="w-5 h-5 text-primary" />}
          value={stats.total}
          label="Total Events"
          subLabel={`${stats.completed} played`}
        />
        <StatCard
          icon={<Users className="w-5 h-5 text-primary" />}
          value={playerCount}
          label="Players"
        />
        <StatCard
          icon={<BarChart3 className="w-5 h-5 text-primary" />}
          value={statCategoriesCount}
          label="Stat Categories"
        />
        <StatCard
          icon={<Trophy className="w-5 h-5 text-primary" />}
          value={stats.remaining}
          label="Events Left"
        />
      </div>
    </div>
  );
}
