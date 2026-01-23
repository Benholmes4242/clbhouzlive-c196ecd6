import React from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, Target, TrendingUp } from 'lucide-react';

type FeedbackType = 'encouragement' | 'milestone' | 'challenge';

interface ChampionshipFeedbackProps {
  type: FeedbackType;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const FEEDBACK_CONFIG: Record<FeedbackType, {
  icon: typeof Sparkles;
  bgClass: string;
  iconClass: string;
}> = {
  encouragement: {
    icon: Sparkles,
    bgClass: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800',
    iconClass: 'text-purple-500',
  },
  milestone: {
    icon: Target,
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
    iconClass: 'text-emerald-500',
  },
  challenge: {
    icon: TrendingUp,
    bgClass: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
    iconClass: 'text-amber-500',
  },
};

/**
 * ChampionshipFeedback - Contextual feedback messages for motivation.
 */
export function ChampionshipFeedback({
  type,
  message,
  action,
  className,
}: ChampionshipFeedbackProps) {
  const config = FEEDBACK_CONFIG[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'mx-4 p-4 rounded-xl border flex items-start gap-3',
        config.bgClass,
        className
      )}
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', config.iconClass)} />
      
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">{message}</p>
        
        {action && (
          <button
            onClick={action.onClick}
            className="mt-2 text-sm font-medium text-primary hover:underline"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}

// Pre-built feedback messages
export function getContextualFeedback(
  rank: number,
  coursesLogged: number,
  daysRemaining: number,
  zone: string | null
): { type: FeedbackType; message: string } | null {
  // Promotion zone feedback
  if (zone === 'promotion') {
    return {
      type: 'milestone',
      message: `You're in the promotion zone! Maintain your pace to advance next season.`,
    };
  }

  // Relegation warning
  if (zone === 'relegation') {
    return {
      type: 'challenge',
      message: `You're in the relegation zone. Log ${Math.ceil(daysRemaining / 7)} more courses to stay safe.`,
    };
  }

  // New player encouragement
  if (coursesLogged < 3) {
    return {
      type: 'encouragement',
      message: `Great start! Log ${3 - coursesLogged} more courses to unlock your division badge.`,
    };
  }

  // End of season push
  if (daysRemaining <= 7 && daysRemaining > 0) {
    return {
      type: 'challenge',
      message: `Final week! Every course counts in the championship push.`,
    };
  }

  // Top 10 celebration
  if (rank <= 10) {
    return {
      type: 'milestone',
      message: `You're in the Top 10! Keep pushing to hold your position.`,
    };
  }

  return null;
}
