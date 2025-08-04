import React from 'react';
import { TrendingUp, TrendingDown, Target, BarChart3 } from 'lucide-react';

interface HandicapSummaryStatsProps {
  currentHandicap: number | null;
  bestHandicap?: number | null;
  threeRoundAverage?: number | null;
  totalRounds?: number;
  isLoading?: boolean;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  icon, 
  label, 
  value, 
  trend, 
  subtitle, 
  isLoading = false 
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
    <div className="bg-muted border border-border rounded-lg p-4 min-h-[100px] flex flex-col justify-center">
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
  isLoading = false
}) => {
  return (
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
  );
};

export default HandicapSummaryStats;