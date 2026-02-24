import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Timeframe } from '@/lib/timeWindow';

interface NetworkStatsBarProps {
  totalRounds: number;
  totalCourses: number;
  averageRating: number | null;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
}

const TIMEFRAME_OPTIONS: { value: Timeframe; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '12m', label: 'Last 12 months' },
  { value: 'all', label: 'All time' },
];

const SHORT_LABELS: Record<string, string> = {
  '7d': '7 days',
  '30d': '30 days',
  '90d': '90 days',
  '12m': '12 months',
  'all': 'All time',
};

const NetworkStatsBar: React.FC<NetworkStatsBarProps> = ({
  totalRounds,
  totalCourses,
  averageRating,
  timeframe,
  onTimeframeChange,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flex items-center justify-between px-4 py-2"
    >
      {/* Stats */}
      <div className="flex items-center gap-1.5 text-sm">
        <span className="font-semibold text-foreground">{totalRounds}</span>
        <span className="text-muted-foreground">rounds</span>
        <span className="text-muted-foreground/40 mx-0.5">·</span>
        <span className="font-semibold text-foreground">{totalCourses}</span>
        <span className="text-muted-foreground">courses</span>
        {averageRating != null && (
          <>
            <span className="text-muted-foreground/40 mx-0.5">·</span>
            <span className="font-semibold text-foreground">{averageRating.toFixed(1)}</span>
            <span className="text-muted-foreground">avg</span>
          </>
        )}
      </div>

      {/* Time filter dropdown */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-muted-foreground"
          style={{ background: 'rgba(0,0,0,0.04)' }}
        >
          {SHORT_LABELS[timeframe]}
          <ChevronDown className="w-3 h-3" />
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[160px]">
            {TIMEFRAME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onTimeframeChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  timeframe === opt.value
                    ? 'font-semibold text-foreground bg-muted/50'
                    : 'text-muted-foreground hover:bg-muted/30'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default NetworkStatsBar;
