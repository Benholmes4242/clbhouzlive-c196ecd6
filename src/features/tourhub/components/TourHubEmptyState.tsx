import { cn } from '@/lib/utils';
import { FileText, Clock, BarChart3, Globe } from 'lucide-react';

interface TourHubEmptyStateProps {
  variant: 'leaderboard' | 'tee-times' | 'hole-stats' | 'summary' | 'schedule' | 'players';
  className?: string;
}

const emptyStateConfig: Record<string, { 
  icon: typeof FileText; 
  title: string; 
  subline: string;
}> = {
  summary: {
    icon: FileText,
    title: "Tournament Summary",
    subline: "Tournament recaps, course context, and field summaries",
  },
  'tee-times': {
    icon: Clock,
    title: "Tee Times",
    subline: "Live and round-by-round pairings",
  },
  'hole-stats': {
    icon: BarChart3,
    title: "Hole-by-Hole Insights",
    subline: "Hole scoring trends and course analytics",
  },
  // Fallback variants
  leaderboard: {
    icon: BarChart3,
    title: "Live Leaderboard",
    subline: "Real-time tournament scoring",
  },
  schedule: {
    icon: Clock,
    title: "Tournament Schedule",
    subline: "Upcoming events and dates",
  },
  players: {
    icon: FileText,
    title: "Player Profiles",
    subline: "Tour roster and statistics",
  },
};

export function TourHubEmptyState({ variant, className }: TourHubEmptyStateProps) {
  const config = emptyStateConfig[variant] || emptyStateConfig.summary;
  const Icon = config.icon;
  
  return (
    <div className={cn("flex items-center justify-center py-16", className)}>
      <div 
        className="w-full max-w-[560px] mx-auto p-8 rounded-2xl bg-white border border-black/[0.04] text-center"
        style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}
      >
        {/* Top Icon */}
        <div className="w-10 h-10 mx-auto mb-4 rounded-full bg-black/[0.04] flex items-center justify-center">
          <Icon className="w-5 h-5 text-slate-500" />
        </div>
        
        {/* Title */}
        <h3 className="text-lg font-semibold text-foreground mb-1">
          {config.title}
        </h3>
        
        {/* Subline */}
        <p className="text-sm text-slate-500 mb-5">
          {config.subline}
        </p>
        
        {/* Body Copy */}
        <div className="max-w-[420px] mx-auto text-sm text-slate-600 leading-relaxed space-y-4">
          <p>
            We're currently expanding our Tour Hub data through an official integration with SportsRadar, the world's leading provider of professional golf statistics.
          </p>
          <p>
            As this partnership progresses, you'll see advanced features roll out here — including live tee times, tournament recaps, field insights, and detailed hole-by-hole performance data.
          </p>
          <p className="text-slate-500">
            Check back soon as new capabilities go live.
          </p>
        </div>
        
        {/* Partner Badge */}
        <div className="mt-6 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 text-xs text-slate-500">
          <Globe className="w-3 h-3" />
          <span>Powered by SportsRadar</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-400">integration in progress</span>
        </div>
      </div>
    </div>
  );
}
