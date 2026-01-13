import React from 'react';
import { TrendingUp, Trophy, Star, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

type MomentumType = 'rising' | 'up-places' | 'new-top-10' | 'highest-rated';

interface CourseMomentumCalloutProps {
  type: MomentumType;
  value?: number; // e.g., "6" for "Up 6 places"
  region?: string;
  className?: string;
  onDismiss?: () => void;
}

/**
 * COURSE MOMENTUM CALLOUT
 * 
 * Inline, dismissible callouts for meaningful course movement
 * Editorial/observational tone - not personal achievements
 * 
 * Types:
 * - rising: "🔥 Rising fast this month"
 * - up-places: "⬆️ Up 6 places this week"
 * - new-top-10: "🏆 New Top 10 Global"
 * - highest-rated: "⭐ Highest rated in GB & Ireland"
 */
export function CourseMomentumCallout({ 
  type, 
  value,
  region,
  className,
  onDismiss 
}: CourseMomentumCalloutProps) {
  const config = (() => {
    switch (type) {
      case 'rising':
        return {
          icon: Flame,
          iconColor: 'text-orange-500',
          bgColor: 'bg-orange-50/80',
          borderColor: 'border-orange-100',
          text: 'Rising fast this month'
        };
      case 'up-places':
        return {
          icon: TrendingUp,
          iconColor: 'text-emerald-600',
          bgColor: 'bg-emerald-50/80',
          borderColor: 'border-emerald-100',
          text: `Up ${value || 0} places this week`
        };
      case 'new-top-10':
        return {
          icon: Trophy,
          iconColor: 'text-amber-600',
          bgColor: 'bg-amber-50/80',
          borderColor: 'border-amber-100',
          text: `New Top 10 ${region || 'Global'}`
        };
      case 'highest-rated':
        return {
          icon: Star,
          iconColor: 'text-slate-600',
          bgColor: 'bg-slate-50/80',
          borderColor: 'border-slate-200',
          text: `Highest rated in ${region || 'the world'}`
        };
      default:
        return {
          icon: TrendingUp,
          iconColor: 'text-slate-600',
          bgColor: 'bg-slate-50/80',
          borderColor: 'border-slate-200',
          text: 'Trending'
        };
    }
  })();

  const Icon = config.icon;

  return (
    <div 
      className={cn(
        'flex items-center gap-2.5 px-4 py-3 mx-4 rounded-sq-sm',
        'border shadow-sm',
        'animate-fade-in',
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <Icon className={cn('w-4 h-4 flex-shrink-0', config.iconColor)} />
      <span className="text-[13px] font-medium text-foreground flex-1">
        {config.text}
      </span>
      
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 -mr-1 rounded-sq-xs hover:bg-muted/50"
          aria-label="Dismiss"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
