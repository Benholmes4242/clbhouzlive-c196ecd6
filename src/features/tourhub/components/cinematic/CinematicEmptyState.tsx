/**
 * CinematicEmptyState - Premium empty and error states
 * Apple-grade feedback for missing or failed data
 */

import { motion } from 'framer-motion';
import { 
  Users, 
  Trophy, 
  Calendar, 
  BarChart3, 
  AlertCircle,
  RefreshCw,
  Search,
  Flag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type EmptyStateVariant = 
  | 'players' 
  | 'leaderboard' 
  | 'schedule' 
  | 'search' 
  | 'rankings'
  | 'tournament'
  | 'error';

interface CinematicEmptyStateProps {
  variant: EmptyStateVariant;
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

const variantConfig: Record<EmptyStateVariant, {
  icon: React.ElementType;
  defaultTitle: string;
  defaultDescription: string;
  iconBgClass: string;
  iconColorClass: string;
}> = {
  players: {
    icon: Users,
    defaultTitle: 'No Players Found',
    defaultDescription: 'Player data is loading or unavailable. Check back soon.',
    iconBgClass: 'bg-blue-50',
    iconColorClass: 'text-blue-500',
  },
  leaderboard: {
    icon: Trophy,
    defaultTitle: 'Leaderboard Unavailable',
    defaultDescription: 'Live scoring will appear here when the tournament begins.',
    iconBgClass: 'bg-amber-50',
    iconColorClass: 'text-amber-500',
  },
  schedule: {
    icon: Calendar,
    defaultTitle: 'No Events Scheduled',
    defaultDescription: 'There are no tournaments scheduled for this period.',
    iconBgClass: 'bg-emerald-50',
    iconColorClass: 'text-emerald-500',
  },
  search: {
    icon: Search,
    defaultTitle: 'No Results',
    defaultDescription: 'Try adjusting your search or filters.',
    iconBgClass: 'bg-slate-50',
    iconColorClass: 'text-slate-400',
  },
  rankings: {
    icon: BarChart3,
    defaultTitle: 'Rankings Loading',
    defaultDescription: 'Official world rankings data is being fetched.',
    iconBgClass: 'bg-purple-50',
    iconColorClass: 'text-purple-500',
  },
  tournament: {
    icon: Flag,
    defaultTitle: 'Tournament Not Found',
    defaultDescription: 'This tournament may have been removed or the link is invalid.',
    iconBgClass: 'bg-orange-50',
    iconColorClass: 'text-orange-500',
  },
  error: {
    icon: AlertCircle,
    defaultTitle: 'Something Went Wrong',
    defaultDescription: 'We couldn\'t load this data. Please try again.',
    iconBgClass: 'bg-red-50',
    iconColorClass: 'text-red-500',
  },
};

export function CinematicEmptyState({
  variant,
  title,
  description,
  onRetry,
  className,
}: CinematicEmptyStateProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;
  
  const displayTitle = title || config.defaultTitle;
  const displayDescription = description || config.defaultDescription;

  return (
    <motion.div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        "rounded-2xl bg-slate-50/50 border border-slate-200",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Icon */}
      <motion.div
        className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center mb-5",
          config.iconBgClass
        )}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, duration: 0.3, type: 'spring' }}
      >
        <Icon className={cn("w-8 h-8", config.iconColorClass)} />
      </motion.div>
      
      {/* Title */}
      <motion.h3
        className="text-lg font-semibold text-slate-800 mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
      >
        {displayTitle}
      </motion.h3>
      
      {/* Description */}
      <motion.p
        className="text-sm text-slate-500 max-w-xs leading-relaxed"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        {displayDescription}
      </motion.p>
      
      {/* Retry Button */}
      {onRetry && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <Button
            variant="outline"
            onClick={onRetry}
            className="mt-6 gap-2 rounded-full px-5 border-slate-300 text-slate-600 hover:bg-slate-100"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

// Inline empty state for smaller areas
export function InlineEmptyState({
  message,
  submessage,
  className,
}: {
  message: string;
  submessage?: string;
  className?: string;
}) {
  return (
    <motion.div
      className={cn(
        "text-center py-12 px-4 rounded-2xl bg-slate-50 border border-slate-200",
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <p className="text-sm text-slate-500">{message}</p>
      {submessage && (
        <p className="text-xs text-slate-400 mt-1">{submessage}</p>
      )}
    </motion.div>
  );
}

// Error boundary fallback
export function ErrorFallback({
  error,
  resetError,
}: {
  error?: Error;
  resetError?: () => void;
}) {
  return (
    <CinematicEmptyState
      variant="error"
      title="Oops, something broke"
      description={error?.message || 'An unexpected error occurred.'}
      onRetry={resetError}
    />
  );
}
