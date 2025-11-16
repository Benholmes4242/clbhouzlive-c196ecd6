import React from 'react';
import { TrendingUp, TrendingDown, Target, BarChart3, Trophy } from 'lucide-react';
import { useUserAchievements } from '@/hooks/useUserAchievements';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface HandicapSummaryStatsProps {
  currentHandicap: number | null;
  bestHandicap?: number | null;
  threeRoundAverage?: number | null;
  totalRounds?: number;
  isLoading?: boolean;
  onAchievementsClick?: () => void;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  isLoading?: boolean;
  onClick?: () => void;
  isClickable?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  icon, 
  label, 
  value, 
  trend, 
  subtitle, 
  isLoading = false,
  onClick,
  isClickable = false
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-red-400" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-green-400" />;
      default:
        return null;
    }
  };

  return (
    <div 
      className={`bg-muted border border-border rounded-full px-6 py-4 min-h-[100px] flex flex-col justify-center transition-all ${
        isClickable ? 'cursor-pointer hover:bg-muted/80 hover:scale-105' : ''
      }`}
      onClick={isClickable ? onClick : undefined}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="text-primary/80">
          {icon}
        </div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
      </div>
      
      <div className="flex items-baseline gap-2">
        {isLoading ? (
          <div className="w-8 h-6 bg-muted-foreground/20 animate-pulse rounded"></div>
        ) : (
          <span className="text-2xl font-bold text-foreground">
            {value}
          </span>
        )}
        {trend && getTrendIcon()}
      </div>
      
      {subtitle && (
        <span className="text-xs text-muted-foreground mt-1">
          {subtitle}
        </span>
      )}
    </div>
  );
};

const HandicapSummaryStats: React.FC<HandicapSummaryStatsProps> = ({
  currentHandicap,
  bestHandicap,
  threeRoundAverage,
  totalRounds = 0,
  isLoading = false,
  onAchievementsClick
}) => {
  const { user } = useSupabaseSession();
  const { data: achievements = [] } = useUserAchievements(user?.id);
  const achievementsCount = achievements.length;

  return (
    <div className="space-y-4">
      {/* Top row - 4 stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Target className="h-4 w-4" />}
          label="Current Handicap"
          value={currentHandicap !== null ? currentHandicap.toFixed(1) : '--'}
          isLoading={isLoading}
        />
        
        <StatCard
          icon={<TrendingDown className="h-4 w-4" />}
          label="Best Handicap"
          value={bestHandicap !== null ? bestHandicap.toFixed(1) : '--'}
          subtitle="Personal best"
          isLoading={isLoading}
        />
        
        <StatCard
          icon={<BarChart3 className="h-4 w-4" />}
          label="3-Round Average"
          value={threeRoundAverage !== null ? threeRoundAverage.toFixed(1) : '--'}
          subtitle="Recent form"
          isLoading={isLoading}
        />
        
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Total Rounds"
          value={totalRounds}
          subtitle="Recorded rounds"
          isLoading={isLoading}
        />
      </div>

      {/* Bottom row - Achievements */}
      <div className="grid grid-cols-1 gap-4">
        <StatCard
          icon={<Trophy className="h-4 w-4" />}
          label="Achievements"
          value={achievementsCount}
          subtitle="Unlocked achievements"
          isLoading={isLoading}
          onClick={onAchievementsClick}
          isClickable={!!onAchievementsClick}
        />
      </div>
    </div>
  );
};

export default HandicapSummaryStats;