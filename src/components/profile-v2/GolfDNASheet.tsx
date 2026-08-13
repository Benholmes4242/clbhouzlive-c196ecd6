/**
 * GolfDNASheet - Expanded stats bottom sheet
 */

import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { TrendingUp, TrendingDown, Minus, Flag, MapPin, Trophy, Target } from 'lucide-react';
import { GolfDNAStats } from './types';

interface GolfDNASheetProps {
  isOpen: boolean;
  onClose: () => void;
  stats: GolfDNAStats;
  displayName: string;
}

// Larger sparkline for the sheet
const LargeSparkline: React.FC<{ data: number[] }> = ({ data }) => {
  if (!data || data.length < 2) {
    return (
      <div className="h-24 flex items-center justify-center" style={{ color: 'var(--dgp-text-muted)' }}>
        <span className="text-sm">No trend data yet</span>
      </div>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const width = 280;
  const height = 80;
  const padding = 8;
  
  const points = data.map((value, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  // Calculate trend
  const trend = data[data.length - 1] - data[0];
  const trendIcon = trend < 0 ? (
    <TrendingDown className="w-4 h-4 text-green-400" />
  ) : trend > 0 ? (
    <TrendingUp className="w-4 h-4 text-red-400" />
  ) : (
    <Minus className="w-4 h-4" style={{ color: 'var(--dgp-text-muted)' }} />
  );

  return (
    <div className="space-y-2">
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="large-sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--dgp-accent-green)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--dgp-accent-green)" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        <polygon
          points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
          fill="url(#large-sparkline-gradient)"
        />
        
        <polyline
          points={points}
          fill="none"
          stroke="var(--dgp-accent-green)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      
      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--dgp-text-muted)' }}>
        <span>12 weeks ago</span>
        <div className="flex items-center gap-1">
          {trendIcon}
          <span>{Math.abs(trend).toFixed(1)} {trend < 0 ? 'improvement' : trend > 0 ? 'increase' : 'steady'}</span>
        </div>
        <span>Now</span>
      </div>
    </div>
  );
};

const StatRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
}> = ({ icon, label, value, subtext }) => (
  <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--dgp-divider)' }}>
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: 'var(--dgp-glass-surface)' }}
      >
        {icon}
      </div>
      <span style={{ color: 'var(--dgp-text-primary)' }}>{label}</span>
    </div>
    <div className="text-right">
      <span className="font-semibold" style={{ color: 'var(--dgp-text-primary)' }}>
        {value}
      </span>
      {subtext && (
        <span className="block text-xs" style={{ color: 'var(--dgp-text-muted)' }}>
          {subtext}
        </span>
      )}
    </div>
  </div>
);

export const GolfDNASheet: React.FC<GolfDNASheetProps> = ({
  isOpen,
  onClose,
  stats,
  displayName,
}) => {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl max-h-[95dvh] overflow-y-auto"
        style={{ background: 'var(--dgp-bg-surface)' }}
      >
        <SheetHeader className="pb-4">
          <SheetTitle style={{ color: 'var(--dgp-text-primary)' }}>
            {displayName}'s Golf DNA
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 pb-8">
          {/* Handicap Trend Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span
                className="text-sm font-medium uppercase tracking-wide"
                style={{ color: 'var(--dgp-text-secondary)' }}
              >
                Handicap Trend
              </span>
              {stats.currentHandicap !== undefined && (
                <span
                  className="text-2xl font-semibold"
                  style={{ color: 'var(--dgp-text-primary)' }}
                >
                  {stats.currentHandicap.toFixed(1)}
                </span>
              )}
            </div>
            <LargeSparkline data={stats.handicapTrend} />
          </div>

          {/* Recent Form */}
          {stats.recentForm && stats.recentForm.length > 0 && (
            <div className="space-y-2">
              <span
                className="text-sm font-medium uppercase tracking-wide"
                style={{ color: 'var(--dgp-text-secondary)' }}
              >
                Recent Form
              </span>
              <div className="flex gap-2">
                {stats.recentForm.map((score, i) => (
                  <span
                    key={i}
                    className="flex-1 py-2 text-center rounded-xl text-sm font-medium"
                    style={{
                      background: 'var(--dgp-glass-surface)',
                      color: 'var(--dgp-text-primary)',
                    }}
                  >
                    {score}
                  </span>
                ))}
              </div>
              <span className="text-xs" style={{ color: 'var(--dgp-text-muted)' }}>
                Last 5 rounds
              </span>
            </div>
          )}

          {/* Stats List */}
          <div>
            <StatRow
              icon={<Flag className="w-5 h-5" style={{ color: 'var(--dgp-accent-green)' }} />}
              label="Rounds This Year"
              value={stats.roundsThisYear}
            />
            <StatRow
              icon={<MapPin className="w-5 h-5" style={{ color: 'var(--dgp-accent-blue)' }} />}
              label="Courses Played"
              value={stats.coursesPlayed}
            />
            <StatRow
              icon={<Trophy className="w-5 h-5" style={{ color: 'var(--dgp-accent-gold)' }} />}
              label="Top 100 Progress"
              value={`${stats.top100Progress}/100`}
              subtext={`${Math.round(stats.top100Progress)}% complete`}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default GolfDNASheet;
