import React from 'react';
import { Check, HelpCircle, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type RsvpStatus = 'going' | 'maybe' | 'declined';

interface RsvpButtonStripProps {
  currentStatus: RsvpStatus | undefined;
  onStatusChange: (status: RsvpStatus) => void;
  isUpdating: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const RSVP_CONFIG: Record<RsvpStatus, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  activeClass: string;
  activeBg: string;
}> = {
  going: {
    label: 'Going',
    icon: Check,
    activeClass: 'text-green-700 border-green-500',
    activeBg: 'bg-green-100',
  },
  maybe: {
    label: 'Maybe',
    icon: HelpCircle,
    activeClass: 'text-amber-700 border-amber-500',
    activeBg: 'bg-amber-100',
  },
  declined: {
    label: "Can't go",
    icon: X,
    activeClass: 'text-gray-700 border-gray-400',
    activeBg: 'bg-gray-100',
  },
};

export function RsvpButtonStrip({
  currentStatus,
  onStatusChange,
  isUpdating,
  disabled = false,
  size = 'md',
}: RsvpButtonStripProps) {
  const sizeClasses = {
    sm: 'py-2 text-xs gap-1',
    md: 'py-3 text-sm gap-2',
    lg: 'py-4 text-base gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className="flex gap-2">
      {(Object.keys(RSVP_CONFIG) as RsvpStatus[]).map((status) => {
        const config = RSVP_CONFIG[status];
        const Icon = config.icon;
        const isActive = currentStatus === status;
        const isThisUpdating = isUpdating && isActive;

        return (
          <motion.button
            key={status}
            onClick={() => onStatusChange(status)}
            disabled={disabled || isUpdating}
            className={cn(
              'flex-1 flex items-center justify-center rounded-xl font-medium transition-all border-2',
              sizeClasses[size],
              isActive 
                ? cn(config.activeBg, config.activeClass)
                : 'bg-muted/50 border-transparent text-muted-foreground hover:bg-muted',
              (disabled || isUpdating) && 'opacity-50 cursor-not-allowed'
            )}
            whileTap={{ scale: 0.97 }}
            layout
          >
            <AnimatePresence mode="wait">
              {isThisUpdating ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
                </motion.div>
              ) : (
                <motion.div
                  key="icon"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1.5"
                >
                  {isActive && <Icon className={iconSizes[size]} />}
                  <span>{config.label}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}

// Compact version for cards
export function RsvpChip({
  status,
  size = 'sm',
}: {
  status: RsvpStatus | undefined;
  size?: 'sm' | 'md';
}) {
  if (!status) return null;

  const config = RSVP_CONFIG[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
  };

  return (
    <span className={cn(
      'inline-flex items-center rounded-full font-medium',
      config.activeBg,
      config.activeClass.split(' ')[0], // Just the text color
      sizeClasses[size]
    )}>
      <Icon className={iconSizes[size]} />
      {config.label}
    </span>
  );
}
