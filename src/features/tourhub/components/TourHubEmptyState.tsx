import { cn } from '@/lib/utils';
import { LucideIcon, Trophy, Calendar, Clock, BarChart3, Users, FileText } from 'lucide-react';

interface TourHubEmptyStateProps {
  variant: 'leaderboard' | 'tee-times' | 'hole-stats' | 'summary' | 'schedule' | 'players';
  className?: string;
}

const emptyStateConfig: Record<string, { icon: LucideIcon; title: string; description: string }> = {
  leaderboard: {
    icon: Trophy,
    title: "Live leaderboards aren't available yet",
    description: "Real-time tournament scoring will appear here once live tour feeds are enabled.",
  },
  'tee-times': {
    icon: Clock,
    title: "Tee times not available",
    description: "Round-by-round pairings will appear here once live data is enabled.",
  },
  'hole-stats': {
    icon: BarChart3,
    title: "Hole performance stats coming soon",
    description: "Detailed hole-by-hole scoring averages will be available when supported.",
  },
  summary: {
    icon: FileText,
    title: "Tournament summaries coming soon",
    description: "Course layouts, field details, and conditions will be shown here when available.",
  },
  schedule: {
    icon: Calendar,
    title: "No tournaments scheduled",
    description: "The tournament schedule will appear here once data is synced.",
  },
  players: {
    icon: Users,
    title: "No players available",
    description: "Player profiles will appear here once data is synced.",
  },
};

export function TourHubEmptyState({ variant, className }: TourHubEmptyStateProps) {
  const config = emptyStateConfig[variant] || emptyStateConfig.schedule;
  const Icon = config.icon;
  
  return (
    <div className={cn(
      "bg-surface-card border border-border-subtle rounded-sq-lg p-12 text-center",
      className
    )}>
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {config.title}
      </h3>
      
      <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
        {config.description}
      </p>
      
      <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/30 text-xs text-muted-foreground">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500/70" />
        Data feed pending
      </div>
    </div>
  );
}
