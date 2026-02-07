import { cn } from '@/lib/utils';
import { FileText, Clock, BarChart3 } from 'lucide-react';

interface TourHubEmptyStateProps {
  variant: 'leaderboard' | 'schedule' | 'players';
  className?: string;
}

const fallbackConfig: Record<string, { 
  icon: typeof FileText; 
  title: string; 
  message: string;
}> = {
  leaderboard: {
    icon: BarChart3,
    title: 'No Leaderboard Available',
    message: 'Leaderboard data will appear once scoring begins.',
  },
  schedule: {
    icon: Clock,
    title: 'No Events Scheduled',
    message: 'Tournament schedule will appear as events are announced.',
  },
  players: {
    icon: FileText,
    title: 'No Players Found',
    message: 'Player data is being loaded.',
  },
};

export function TourHubEmptyState({ variant, className }: TourHubEmptyStateProps) {
  const config = fallbackConfig[variant] || fallbackConfig.players;
  const Icon = config.icon;
  
  return (
    <div className={cn("flex items-center justify-center py-16", className)}>
      <div className="text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
          <Icon className="w-6 h-6 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-medium text-foreground">{config.title}</h3>
          <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
            {config.message}
          </p>
        </div>
      </div>
    </div>
  );
}
