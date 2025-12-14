/**
 * GolfDNACard - Premium stats module with 2x2 grid
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, TrendingUp, Trophy, MapPin, Flag } from 'lucide-react';
import { GolfDNAStats } from './types';

interface GolfDNACardProps {
  stats: GolfDNAStats;
  onExpand?: () => void;
  className?: string;
}

// Simple sparkline component
const Sparkline: React.FC<{ data: number[]; className?: string }> = ({ data, className }) => {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const width = 80;
  const height = 32;
  const padding = 2;
  
  const points = data.map((value, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg
      width={width}
      height={height}
      className={className}
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--dgp-accent-green)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--dgp-accent-green)" stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* Area fill */}
      <polygon
        points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
        fill="url(#sparkline-gradient)"
      />
      
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke="var(--dgp-accent-green)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const StatBlock: React.FC<{
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  sparkline?: number[];
}> = ({ value, label, icon, sparkline }) => (
  <div className="dgp-dna-stat">
    <div className="flex items-center gap-2">
      {icon && (
        <div style={{ color: 'var(--dgp-text-muted)' }}>
          {icon}
        </div>
      )}
      {sparkline ? (
        <Sparkline data={sparkline} />
      ) : (
        <span className="dgp-dna-stat-value">{value}</span>
      )}
    </div>
    <span className="dgp-dna-stat-label">{label}</span>
  </div>
);

export const GolfDNACard: React.FC<GolfDNACardProps> = ({
  stats,
  onExpand,
  className,
}) => {
  return (
    <button
      onClick={onExpand}
      className={cn(
        'w-full dgp-dna-card p-5 text-left',
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
            style={{ background: 'var(--dgp-accent-green)' }}
          />
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--dgp-text-secondary)' }}
          >
            Golf DNA
          </span>
        </div>
        <ChevronRight
          className="w-4 h-4"
          style={{ color: 'var(--dgp-text-muted)' }}
        />
      </div>

      {/* 2x2 Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <StatBlock
          value=""
          label="Handicap Trend"
          sparkline={stats.handicapTrend}
        />
        
        <StatBlock
          value={stats.roundsThisYear}
          label="Rounds This Year"
          icon={<Flag className="w-4 h-4" />}
        />
        
        <StatBlock
          value={stats.coursesPlayed}
          label="Courses Played"
          icon={<MapPin className="w-4 h-4" />}
        />
        
        <StatBlock
          value={`${stats.top100Progress}/100`}
          label="Top 100 Progress"
          icon={<Trophy className="w-4 h-4" />}
        />
      </div>
    </button>
  );
};

export default GolfDNACard;
