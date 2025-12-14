/**
 * QuestPreviewCard - Glass card preview for Top 100 Quest on Profile
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, Trophy } from 'lucide-react';

interface RegionProgress {
  name: string;
  shortName: string;
  played: number;
  total?: number;
}

interface QuestPreviewCardProps {
  totalPlayed: number;
  totalTarget?: number;
  regions: RegionProgress[];
  nextMilestone?: string;
  showNudge?: boolean;
  onContinue: () => void;
  className?: string;
}

const RegionPill: React.FC<{ region: RegionProgress }> = ({ region }) => (
  <div
    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
    style={{
      background: 'var(--dgp-glass-surface)',
      border: '1px solid var(--dgp-glass-stroke)',
    }}
  >
    <span style={{ color: 'var(--dgp-text-secondary)' }}>{region.shortName}</span>
    <span style={{ color: 'var(--dgp-text-primary)' }} className="font-medium">
      {region.played}
    </span>
  </div>
);

export const QuestPreviewCard: React.FC<QuestPreviewCardProps> = ({
  totalPlayed,
  totalTarget = 100,
  regions,
  nextMilestone,
  showNudge,
  onContinue,
  className,
}) => {
  return (
    <button
      onClick={onContinue}
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
          <Trophy className="w-4 h-4" style={{ color: 'var(--dgp-accent-gold)' }} />
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--dgp-text-secondary)' }}
          >
            The Quest
          </span>
        </div>
        <div className="flex items-center gap-1" style={{ color: 'var(--dgp-accent-green)' }}>
          <span className="text-xs font-medium">Continue</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      {/* Progress display */}
      <div className="mb-4">
        <div className="flex items-baseline gap-1">
          <span
            className="text-3xl font-bold"
            style={{ color: 'var(--dgp-text-primary)' }}
          >
            {totalPlayed}
          </span>
          <span
            className="text-lg font-medium"
            style={{ color: 'var(--dgp-text-muted)' }}
          >
            / {totalTarget}
          </span>
        </div>
        <p className="text-xs mt-1" style={{ color: 'var(--dgp-text-muted)' }}>
          Top 100 Courses Played
        </p>
      </div>

      {/* Region pills */}
      <div className="flex flex-wrap gap-2 mb-3">
        {regions.slice(0, 4).map((region) => (
          <RegionPill key={region.name} region={region} />
        ))}
      </div>

      {/* Next milestone */}
      {nextMilestone && (
        <p className="text-xs" style={{ color: 'var(--dgp-text-muted)' }}>
          Next unlock: <span style={{ color: 'var(--dgp-accent-gold)' }}>{nextMilestone}</span>
        </p>
      )}

      {/* Nudge for users who left without acting */}
      {showNudge && totalPlayed === 0 && (
        <p
          className="text-xs mt-2"
          style={{ color: 'var(--dgp-accent-green)', fontStyle: 'italic' }}
        >
          Start your Quest by marking your first course
        </p>
      )}
    </button>
  );
};

export default QuestPreviewCard;
