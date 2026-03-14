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
          background: 'hsl(var(--muted) / 0.5)',
          backdropFilter: 'blur(8px)',
          border: '1px solid hsl(var(--border))',
          borderLeft: '3px solid hsl(var(--accent-amber) / 0.6)',
        }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-1.5">
          <CheckCircle className="w-4 h-4" style={{ color: 'hsl(var(--accent-amber) / 0.8)' }} />
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'hsl(var(--foreground))' }}>
            Final
          </span>
        </div>
        <div className="h-4 w-px" style={{ backgroundColor: 'hsl(var(--border))' }} />
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
          background: 'hsl(var(--accent-amber) / 0.08)',
          backdropFilter: 'blur(8px)',
          border: '1px solid hsl(var(--accent-amber) / 0.15)',
          borderLeft: '3px solid hsl(var(--accent-amber) / 0.7)',
        }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" style={{ color: 'hsl(var(--accent-amber))' }} />
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'hsl(var(--accent-amber))' }}>
            Upcoming
          </span>
        </div>
        <div className="h-4 w-px" style={{ backgroundColor: 'hsl(var(--accent-amber) / 0.3)' }} />
        <span style={{ fontSize: '12px', color: 'hsl(var(--accent-amber) / 0.8)' }}>
          {countdownText || 'Tournament has not started'}
        </span>
      </motion.div>
    );
  }

  // Live variant — green is semantically correct for "live" status
  return (
    <motion.div
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-2xl",
        className
      )}
      style={{
        background: 'rgba(34, 197, 94, 0.06)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(34, 197, 94, 0.15)',
        borderLeft: '3px solid rgb(34, 197, 94)',
      }}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: 'rgb(34, 197, 94)' }} />
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: 'rgb(34, 197, 94)' }} />
        </span>
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'rgb(34, 197, 94)' }}>
          Live
        </span>
      </div>

      {leaderName && (
        <>
          <span style={{ color: 'hsl(var(--muted-foreground) / 0.4)' }}>·</span>
          <span style={{ fontSize: '12px', fontWeight: 500, color: 'hsl(var(--foreground))' }} className="truncate">
            {leaderName}{leaderScore ? ` at ${leaderScore}` : ''}
          </span>
        </>
      )}

      {lastUpdatedText && !leaderName && (
        <>
          <div className="h-4 w-px" style={{ backgroundColor: 'rgba(34, 197, 94, 0.3)' }} />
          <span style={{ fontSize: '12px', color: 'rgb(34, 197, 94)' }}>
            Updated {lastUpdatedText}
          </span>
        </>
      )}

      {lastUpdatedText && leaderName && (
        <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground) / 0.5)', marginLeft: 'auto' }}>
          {lastUpdatedText}
        </span>
      )}

      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className={cn(
            "ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium",
            "active:scale-[0.95] active:opacity-70 transition-all duration-200",
            isRefreshing && "opacity-50 cursor-not-allowed"
          )}
          style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'rgb(34, 197, 94)' }}
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