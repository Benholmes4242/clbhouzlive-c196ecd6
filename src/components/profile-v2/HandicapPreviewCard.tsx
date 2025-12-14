/**
 * HandicapPreviewCard - Glass card preview for Handicap on Profile
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface HandicapPreviewCardProps {
  handicapIndex?: number;
  trendData?: number[];
  roundsThisYear?: number;
  bestRound?: number;
  onOpenCockpit: () => void;
  className?: string;
}

// Mini sparkline for the trend
const MiniSparkline: React.FC<{ data: number[]; className?: string }> = ({ data, className }) => {
  if (!data || data.length < 2) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <div className="w-16 h-6 border border-dashed rounded" style={{ borderColor: 'var(--dgp-text-muted)' }} />
        <span className="text-xs" style={{ color: 'var(--dgp-text-muted)' }}>
          Log rounds
        </span>
      </div>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const width = 64;
  const height = 24;
  const padding = 2;
  
  const points = data.map((value, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  // Determine trend direction
  const startAvg = data.slice(0, Math.floor(data.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(data.length / 2);
  const endAvg = data.slice(Math.floor(data.length / 2)).reduce((a, b) => a + b, 0) / (data.length - Math.floor(data.length / 2));
  const isImproving = endAvg < startAvg; // Lower handicap = improving

  return (
    <svg
      width={width}
      height={height}
      className={className}
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        <linearGradient id="mini-sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isImproving ? 'var(--dgp-accent-green)' : 'var(--dgp-danger)'} stopOpacity="0.3" />
          <stop offset="100%" stopColor={isImproving ? 'var(--dgp-accent-green)' : 'var(--dgp-danger)'} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
        fill="url(#mini-sparkline-gradient)"
      />
      <polyline
        points={points}
        fill="none"
        stroke={isImproving ? 'var(--dgp-accent-green)' : 'var(--dgp-danger)'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const HandicapPreviewCard: React.FC<HandicapPreviewCardProps> = ({
  handicapIndex,
  trendData = [],
  roundsThisYear = 0,
  bestRound,
  onOpenCockpit,
  className,
}) => {
  const hasHandicap = typeof handicapIndex === 'number';
  
  return (
    <button
      onClick={onOpenCockpit}
      className={cn(
        'w-full dgp-glass p-5 text-left',
        'transition-all duration-200',
        'hover:border-white/15 active:scale-[0.99]',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: 'var(--dgp-accent-blue)' }}
          />
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--dgp-text-secondary)' }}
          >
            Handicap
          </span>
        </div>
        <div className="flex items-center gap-1" style={{ color: 'var(--dgp-accent-green)' }}>
          <span className="text-xs font-medium">Open Cockpit</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      {/* Main content */}
      <div className="flex items-start justify-between">
        {/* Left side - HCP value */}
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-3">
            <span
              className="text-3xl font-bold"
              style={{ color: 'var(--dgp-text-primary)' }}
            >
              {hasHandicap ? `HCP ${handicapIndex.toFixed(1)}` : 'HCP --'}
            </span>
          </div>

          {/* Sparkline */}
          <div className="mb-3">
            <MiniSparkline data={trendData} />
          </div>

          {/* Stats lines */}
          <div className="space-y-1">
            <p className="text-xs" style={{ color: 'var(--dgp-text-muted)' }}>
              Rounds this year: <span style={{ color: 'var(--dgp-text-secondary)' }}>{roundsThisYear}</span>
            </p>
            {bestRound !== undefined && (
              <p className="text-xs" style={{ color: 'var(--dgp-text-muted)' }}>
                Best this season: <span style={{ color: 'var(--dgp-text-secondary)' }}>{bestRound}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

export default HandicapPreviewCard;
