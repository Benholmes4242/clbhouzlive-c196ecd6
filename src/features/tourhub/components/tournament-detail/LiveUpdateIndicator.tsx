/**
 * LiveUpdateIndicator - Status bar with left accent border
 */

import { RefreshCw, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LiveUpdateIndicatorProps {
  lastUpdatedText: string | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  className?: string;
}

interface StatusBarProps {
  variant: 'live' | 'final' | 'upcoming';
  lastUpdatedText?: string | null;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  countdownText?: string;
  leaderName?: string | null;
  leaderScore?: string | null;
  className?: string;
}

export function StatusBar({
  variant,
  lastUpdatedText,
  isRefreshing,
  onRefresh,
  countdownText,
  leaderName,
  leaderScore,
  className,
}: StatusBarProps) {
  if (variant === 'final') {
    return (
      <motion.div
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-2xl",
          className
        )}
        style={{
          background: 'rgba(var(--muted-rgb, 241, 245, 249), 0.7)',
          backdropFilter: 'blur(8px)',
          border: '1px solid hsl(var(--border))',
          borderLeft: '3px solid hsl(var(--border))',
        }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-1.5">
          <CheckCircle className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
            Final
          </span>
        </div>
        <div className="h-4 w-px bg-border" />
        <span className="text-xs text-muted-foreground">Official results</span>
      </motion.div>
    );
  }

  if (variant === 'upcoming') {
    return (
      <motion.div
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-2xl",
          className
        )}
        style={{
          background: 'rgba(255, 251, 235, 0.7)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(245, 158, 11, 0.15)',
          borderLeft: '3px solid rgb(217, 119, 6)',
        }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
            Upcoming
          </span>
        </div>
        <div className="h-4 w-px bg-amber-200/60" />
        <span className="text-xs text-amber-600">
          {countdownText || 'Tournament has not started'}
        </span>
      </motion.div>
    );
  }

  // Live variant
  return (
    <motion.div
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-2xl",
        className
      )}
      style={{
        background: 'rgba(236, 253, 245, 0.7)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(34, 197, 94, 0.15)',
        borderLeft: '3px solid #22C55E',
      }}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
          Live
        </span>
      </div>

      {leaderName && (
        <>
          <span className="text-xs text-emerald-600/60">·</span>
          <span className="text-xs font-medium text-emerald-700 truncate">
            {leaderName}{leaderScore ? ` at ${leaderScore}` : ''}
          </span>
        </>
      )}

      {lastUpdatedText && !leaderName && (
        <>
          <div className="h-4 w-px bg-emerald-200/60" />
          <span className="text-xs text-emerald-600">
            Updated {lastUpdatedText}
          </span>
        </>
      )}

      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className={cn(
            "ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium",
            "bg-emerald-100/80 text-emerald-700 hover:bg-emerald-200/80",
            "transition-all duration-200 active:scale-[0.95]",
            isRefreshing && "opacity-50 cursor-not-allowed"
          )}
        >
          <RefreshCw 
            className={cn(
              "w-3.5 h-3.5",
              isRefreshing && "animate-spin"
            )} 
          />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      )}
    </motion.div>
  );
}

export function LiveUpdateIndicator({
  lastUpdatedText,
  isRefreshing,
  onRefresh,
  className,
}: LiveUpdateIndicatorProps) {
  return (
    <StatusBar
      variant="live"
      lastUpdatedText={lastUpdatedText}
      isRefreshing={isRefreshing}
      onRefresh={onRefresh}
      className={className}
    />
  );
}
