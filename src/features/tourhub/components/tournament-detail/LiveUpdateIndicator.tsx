/**
 * LiveUpdateIndicator - Shows last updated time and refresh button for live tournaments
 */

import { RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LiveUpdateIndicatorProps {
  lastUpdatedText: string | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  className?: string;
}

export function LiveUpdateIndicator({
  lastUpdatedText,
  isRefreshing,
  onRefresh,
  className,
}: LiveUpdateIndicatorProps) {
  return (
    <motion.div
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-xl bg-emerald-50/80 border border-emerald-100",
        className
      )}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Live pulse */}
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
          Live
        </span>
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-emerald-200" />

      {/* Last updated */}
      {lastUpdatedText && (
        <span className="text-xs text-emerald-600">
          Updated {lastUpdatedText}
        </span>
      )}

      {/* Refresh button */}
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className={cn(
          "ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium",
          "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
          "transition-all duration-200",
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
    </motion.div>
  );
}
