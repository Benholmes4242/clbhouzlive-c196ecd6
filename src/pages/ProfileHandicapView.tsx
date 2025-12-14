/**
 * ProfileHandicapView - Fullscreen Handicap Cockpit
 * Dark glass premium experience
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Target, Medal, Flag, Zap } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile.tsx';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

// Milestone types
interface HandicapMilestone {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  isUnlocked: boolean;
  unlockedDate?: string;
  checkFn: (handicap: number, rounds: number, bestRound?: number) => boolean;
}

// Time range for chart
type TimeRange = '1M' | '3M' | '12M' | 'All';

// Trend chart component
const TrendChart: React.FC<{
  data: { date: string; value: number }[];
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}> = ({ data, timeRange, onTimeRangeChange }) => {
  const ranges: TimeRange[] = ['1M', '3M', '12M', 'All'];

  if (!data || data.length < 2) {
    return (
      <div className="dgp-glass p-5 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--dgp-text-secondary)' }}>
            Handicap Trend
          </h3>
          <div className="flex gap-1">
            {ranges.map((r) => (
              <button
                key={r}
                onClick={() => onTimeRangeChange(r)}
                className="px-2 py-1 text-xs rounded-md transition-colors"
                style={{
                  background: timeRange === r ? 'var(--dgp-accent-green)' : 'transparent',
                  color: timeRange === r ? '#000' : 'var(--dgp-text-muted)',
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div
          className="h-32 flex items-center justify-center border border-dashed rounded-lg"
          style={{ borderColor: 'var(--dgp-text-muted)' }}
        >
          <p className="text-sm" style={{ color: 'var(--dgp-text-muted)' }}>
            Log rounds to populate trend
          </p>
        </div>
      </div>
    );
  }

  const min = Math.min(...data.map((d) => d.value));
  const max = Math.max(...data.map((d) => d.value));
  const range = max - min || 1;

  const width = 300;
  const height = 120;
  const padding = 16;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((d.value - min) / range) * (height - padding * 2);
    return { x, y, value: d.value };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

  return (
    <div className="dgp-glass p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--dgp-text-secondary)' }}>
          Handicap Trend
        </h3>
        <div className="flex gap-1">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => onTimeRangeChange(r)}
              className="px-2 py-1 text-xs rounded-md transition-colors"
              style={{
                background: timeRange === r ? 'var(--dgp-accent-green)' : 'transparent',
                color: timeRange === r ? '#000' : 'var(--dgp-text-muted)',
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32">
        <defs>
          <linearGradient id="trend-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--dgp-accent-green)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--dgp-accent-green)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#trend-gradient)" />
        <path d={pathD} fill="none" stroke="var(--dgp-accent-green)" strokeWidth="2" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--dgp-accent-green)" />
        ))}
      </svg>
    </div>
  );
};

// Form snapshot tile
const FormTile: React.FC<{
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}> = ({ label, value, icon }) => (
  <div
    className="dgp-glass p-4 rounded-xl flex-1 min-w-0"
    style={{ background: 'var(--dgp-glass-surface)' }}
  >
    <div className="flex items-center gap-2 mb-1">
      {icon}
      <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--dgp-text-muted)' }}>
        {label}
      </span>
    </div>
    <span className="text-xl font-bold" style={{ color: 'var(--dgp-text-primary)' }}>
      {value}
    </span>
  </div>
);

// Milestone item component
const MilestoneItem: React.FC<{
  milestone: HandicapMilestone;
  onClick: () => void;
}> = ({ milestone, onClick }) => (
  <button
    onClick={onClick}
    className="dgp-trophy flex-shrink-0"
    style={{ opacity: milestone.isUnlocked ? 1 : 0.35 }}
  >
    <div
      className="dgp-trophy-icon"
      style={{
        boxShadow: milestone.isUnlocked ? 'var(--dgp-shadow-glow-green)' : 'none',
      }}
    >
      {milestone.icon}
    </div>
    <span className="dgp-trophy-label">{milestone.name}</span>
  </button>
);

const ProfileHandicapView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { data: profile } = useUserProfile(user?.id);

  const [timeRange, setTimeRange] = useState<TimeRange>('All');
  const [selectedMilestone, setSelectedMilestone] = useState<HandicapMilestone | null>(null);

  // Demo/placeholder data
  const handicapIndex = profile?.eg_handicap_index ?? undefined;
  const hasHandicap = typeof handicapIndex === 'number';
  const roundsCount = 24; // Placeholder
  const bestRound = 72; // Placeholder
  const lastUpdated = 'Dec 10, 2024'; // Placeholder

  // Generate demo trend data
  const trendData = useMemo(() => {
    if (!hasHandicap) return [];
    const base = handicapIndex;
    return Array.from({ length: 12 }, (_, i) => ({
      date: `2024-${(i + 1).toString().padStart(2, '0')}-01`,
      value: base + (Math.random() - 0.5) * 2,
    }));
  }, [hasHandicap, handicapIndex]);

  // Compute form stats
  const avgLast5 = hasHandicap ? (handicapIndex + 0.3).toFixed(1) : '--';
  const form: 'Up' | 'Down' | 'Stable' = useMemo(() => {
    if (!hasHandicap) return 'Stable';
    // Simple demo logic
    return handicapIndex < 15 ? 'Up' : 'Stable';
  }, [hasHandicap, handicapIndex]);

  // Milestones
  const milestones: HandicapMilestone[] = useMemo(() => [
    {
      id: 'single-figure',
      name: 'Single Figure',
      description: 'Achieve a handicap index below 10',
      icon: <Target className="w-5 h-5" style={{ color: 'var(--dgp-accent-green)' }} />,
      isUnlocked: hasHandicap && handicapIndex < 10,
      checkFn: (hcp) => hcp < 10,
    },
    {
      id: 'scratch-watch',
      name: 'Scratch Watch',
      description: 'Achieve a handicap index below 5',
      icon: <Zap className="w-5 h-5" style={{ color: 'var(--dgp-accent-gold)' }} />,
      isUnlocked: hasHandicap && handicapIndex < 5,
      checkFn: (hcp) => hcp < 5,
    },
    {
      id: 'rounds-10',
      name: 'Rounds Logged 10',
      description: 'Log at least 10 rounds',
      icon: <Flag className="w-5 h-5" style={{ color: 'var(--dgp-accent-blue)' }} />,
      isUnlocked: roundsCount >= 10,
      checkFn: (_, rounds) => rounds >= 10,
    },
    {
      id: 'rounds-25',
      name: 'Rounds Logged 25',
      description: 'Log at least 25 rounds',
      icon: <Flag className="w-5 h-5" style={{ color: 'var(--dgp-accent-green)' }} />,
      isUnlocked: roundsCount >= 25,
      checkFn: (_, rounds) => rounds >= 25,
    },
    {
      id: 'new-pb',
      name: 'New PB Round',
      description: 'Set a personal best round score',
      icon: <Medal className="w-5 h-5" style={{ color: 'var(--dgp-accent-gold)' }} />,
      isUnlocked: bestRound !== undefined,
      checkFn: (_, __, best) => best !== undefined,
    },
  ], [hasHandicap, handicapIndex, roundsCount, bestRound]);

  return (
    <PageRoot className="dgp-page">
      {/* Header */}
      <div className="sticky top-0 z-50 safe-top">
        <div className="flex items-center gap-4 p-4">
          <button
            onClick={() => navigate(-1)}
            className="dgp-nav-button"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1
            className="text-lg font-semibold"
            style={{ color: 'var(--dgp-text-primary)' }}
          >
            Handicap Cockpit
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-32 space-y-6">
        {/* Hero Metric */}
        <section className="text-center py-8">
          <p
            className="text-sm uppercase tracking-wider mb-2"
            style={{ color: 'var(--dgp-text-muted)' }}
          >
            Handicap Index
          </p>
          <p
            className="text-6xl font-bold"
            style={{ color: 'var(--dgp-text-primary)' }}
          >
            {hasHandicap ? handicapIndex.toFixed(1) : '--'}
          </p>
          {lastUpdated && (
            <p
              className="text-xs mt-2"
              style={{ color: 'var(--dgp-text-muted)' }}
            >
              Updated {lastUpdated}
            </p>
          )}
        </section>

        {/* Trend Graph */}
        <TrendChart
          data={trendData}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />

        {/* Form Snapshot Row */}
        <section className="flex gap-3">
          <FormTile label="Last 5 avg" value={avgLast5} />
          <FormTile label="Best round" value={bestRound ?? '--'} />
          <FormTile
            label="Form"
            value={form}
            icon={
              form === 'Up' ? (
                <TrendingUp className="w-4 h-4" style={{ color: 'var(--dgp-accent-green)' }} />
              ) : form === 'Down' as string ? (
                <TrendingDown className="w-4 h-4" style={{ color: 'var(--dgp-danger)' }} />
              ) : (
                <Minus className="w-4 h-4" style={{ color: 'var(--dgp-text-muted)' }} />
              )
            }
          />
        </section>

        {/* Milestones Shelf */}
        <section>
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-4 px-1"
            style={{ color: 'var(--dgp-text-secondary)' }}
          >
            Milestones
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {milestones.map((m) => (
              <MilestoneItem
                key={m.id}
                milestone={m}
                onClick={() => setSelectedMilestone(m)}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Milestone Detail Sheet */}
      <Sheet open={!!selectedMilestone} onOpenChange={() => setSelectedMilestone(null)}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl border-t"
          style={{
            background: 'var(--dgp-bg-surface)',
            borderColor: 'var(--dgp-glass-stroke)',
          }}
        >
          {selectedMilestone && (
            <>
              <SheetHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{
                      background: 'var(--dgp-glass-surface)',
                      border: '1px solid var(--dgp-glass-stroke)',
                      boxShadow: selectedMilestone.isUnlocked ? 'var(--dgp-shadow-glow-green)' : 'none',
                      opacity: selectedMilestone.isUnlocked ? 1 : 0.4,
                    }}
                  >
                    {selectedMilestone.icon}
                  </div>
                </div>
                <SheetTitle style={{ color: 'var(--dgp-text-primary)' }}>
                  {selectedMilestone.name}
                </SheetTitle>
              </SheetHeader>
              <div className="text-center space-y-4 pb-8">
                <p style={{ color: 'var(--dgp-text-secondary)' }}>
                  {selectedMilestone.description}
                </p>
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm"
                  style={{
                    background: selectedMilestone.isUnlocked
                      ? 'rgba(110, 146, 119, 0.2)'
                      : 'var(--dgp-glass-surface)',
                    color: selectedMilestone.isUnlocked
                      ? 'var(--dgp-accent-green)'
                      : 'var(--dgp-text-muted)',
                  }}
                >
                  {selectedMilestone.isUnlocked ? '✓ Unlocked' : 'Locked'}
                </div>
                {selectedMilestone.unlockedDate && (
                  <p className="text-xs" style={{ color: 'var(--dgp-text-muted)' }}>
                    Earned on {selectedMilestone.unlockedDate}
                  </p>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </PageRoot>
  );
};

export default ProfileHandicapView;
