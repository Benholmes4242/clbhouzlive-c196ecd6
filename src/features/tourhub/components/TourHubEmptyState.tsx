/**
 * TourHubEmptyState - Empty/pending states for Tour Hub
 * Dark theme compatible with cinematic design system
 */

import { cn } from '@/lib/utils';
import { FileText, Clock, BarChart3, Users, Calendar, Flag } from 'lucide-react';
import { TourDataPendingState } from './TourDataPendingState';
import { GlassCard } from './premium';

interface TourHubEmptyStateProps {
  variant: 'leaderboard' | 'tee-times' | 'hole-stats' | 'summary' | 'schedule' | 'players';
  className?: string;
}

// Feature-specific config for the premium pending state
const pendingStateConfig: Partial<Record<string, { title: string; description: string }>> = {
  summary: {
    title: 'Tournament Summary',
    description: 'Tournament recaps, course context, and field summaries.',
  },
  'tee-times': {
    title: 'Tee Times',
    description: 'Live and round-by-round pairings for every tournament.',
  },
  'hole-stats': {
    title: 'Hole-by-Hole Insights',
    description: 'Hole scoring trends, difficulty ratings, and course analytics.',
  },
};

// Simple fallback config for truly empty states
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
    icon: Calendar,
    title: 'No Events Scheduled',
    message: 'Tournament schedule will appear as events are announced.',
  },
  players: {
    icon: Users,
    title: 'No Players Found',
    message: 'Player data is being loaded.',
  },
};

export function TourHubEmptyState({ variant, className }: TourHubEmptyStateProps) {
  // Use premium pending state for data integration features
  const pendingConfig = pendingStateConfig[variant];
  if (pendingConfig) {
    return (
      <TourDataPendingState 
        featureTitle={pendingConfig.title}
        featureDescription={pendingConfig.description}
        className={className}
      />
    );
  }
  
  // Simple fallback for other variants - glass style for dark theme
  const config = fallbackConfig[variant] || fallbackConfig.players;
  const Icon = config.icon;
  
  return (
    <div className={cn("flex items-center justify-center py-16 px-4", className)}>
      <GlassCard className="p-8 text-center max-w-sm">
        <div className="w-12 h-12 mx-auto rounded-full bg-white/10 flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-white/50" />
        </div>
        <h3 className="text-base font-semibold text-white mb-2">{config.title}</h3>
        <p className="text-sm text-white/60">
          {config.message}
        </p>
      </GlassCard>
    </div>
  );
}
