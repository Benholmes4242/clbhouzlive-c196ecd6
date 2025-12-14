/**
 * JourneyMapPath - Vertical journey path with chapter nodes
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Check, Lock, MapPin } from 'lucide-react';

export interface JourneyChapter {
  id: string;
  name: string;
  shortName: string;
  played: number;
  total: number;
  status: 'locked' | 'in-progress' | 'completed';
}

interface JourneyMapPathProps {
  chapters: JourneyChapter[];
  milestones: { threshold: number; name: string; isUnlocked: boolean }[];
  onChapterClick: (chapter: JourneyChapter) => void;
  onMilestoneClick: (milestone: { threshold: number; name: string }) => void;
}

// Chapter node component
const ChapterNode: React.FC<{
  chapter: JourneyChapter;
  isFirst: boolean;
  isLast: boolean;
  onClick: () => void;
}> = ({ chapter, isFirst, isLast, onClick }) => {
  const isCompleted = chapter.status === 'completed';
  const isInProgress = chapter.status === 'in-progress';
  const isLocked = chapter.status === 'locked';
  const progressPercent = chapter.total > 0 ? (chapter.played / chapter.total) * 100 : 0;

  return (
    <div className="relative flex items-center gap-4">
      {/* Connecting line (above) */}
      {!isFirst && (
        <div
          className="absolute left-5 bottom-full w-0.5 h-8"
          style={{
            background: isCompleted || isInProgress
              ? 'linear-gradient(to bottom, var(--dgp-accent-gold), var(--dgp-accent-green))'
              : 'var(--dgp-divider)',
            opacity: isCompleted ? 1 : 0.5,
          }}
        />
      )}

      {/* Node indicator */}
      <div
        className={cn(
          'relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500',
          isCompleted && 'ring-2 ring-offset-2 ring-offset-[#0B0F0D] ring-[#C8B06A]',
        )}
        style={{
          background: isCompleted
            ? 'var(--dgp-accent-gold)'
            : isInProgress
            ? 'var(--dgp-accent-green)'
            : 'var(--dgp-glass-surface)',
          border: `2px solid ${
            isCompleted
              ? 'var(--dgp-accent-gold)'
              : isInProgress
              ? 'var(--dgp-accent-green)'
              : 'var(--dgp-glass-stroke)'
          }`,
          boxShadow: isCompleted
            ? 'var(--dgp-shadow-glow-gold)'
            : isInProgress
            ? 'var(--dgp-shadow-glow-green)'
            : 'none',
        }}
      >
        {isCompleted ? (
          <Check className="w-5 h-5 text-black" />
        ) : isLocked ? (
          <Lock className="w-4 h-4" style={{ color: 'var(--dgp-text-muted)' }} />
        ) : (
          <MapPin className="w-4 h-4" style={{ color: 'var(--dgp-text-primary)' }} />
        )}
        
        {/* Pulse animation for in-progress */}
        {isInProgress && (
          <div
            className="absolute inset-0 rounded-full animate-ping"
            style={{
              background: 'var(--dgp-accent-green)',
              opacity: 0.3,
              animationDuration: '2s',
            }}
          />
        )}
      </div>

      {/* Chapter card */}
      <button
        onClick={onClick}
        className={cn(
          'flex-1 dgp-glass p-4 rounded-xl text-left transition-all duration-200',
          'hover:border-white/15 active:scale-[0.98]',
          isLocked && 'opacity-50',
        )}
        style={{
          boxShadow: isCompleted
            ? '0 0 20px rgba(200, 176, 106, 0.15)'
            : isInProgress
            ? '0 0 15px rgba(110, 146, 119, 0.15)'
            : 'none',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-sm font-semibold"
            style={{ color: 'var(--dgp-text-primary)' }}
          >
            {chapter.name}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background: isCompleted
                ? 'rgba(200, 176, 106, 0.2)'
                : isInProgress
                ? 'rgba(110, 146, 119, 0.2)'
                : 'var(--dgp-glass-surface)',
              color: isCompleted
                ? 'var(--dgp-accent-gold)'
                : isInProgress
                ? 'var(--dgp-accent-green)'
                : 'var(--dgp-text-muted)',
            }}
          >
            {isCompleted ? 'Complete' : isInProgress ? 'In Progress' : 'Locked'}
          </span>
        </div>

        <div className="flex items-baseline gap-1 mb-2">
          <span
            className="text-xl font-bold"
            style={{ color: 'var(--dgp-text-primary)' }}
          >
            {chapter.played}
          </span>
          <span className="text-sm" style={{ color: 'var(--dgp-text-muted)' }}>
            / {chapter.total}
          </span>
        </div>

        {/* Progress bar */}
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: 'var(--dgp-glass-surface)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPercent}%`,
              background: isCompleted
                ? 'var(--dgp-accent-gold)'
                : 'var(--dgp-accent-green)',
            }}
          />
        </div>
      </button>

      {/* Connecting line (below) */}
      {!isLast && (
        <div
          className="absolute left-5 top-full w-0.5 h-8"
          style={{
            background: isCompleted
              ? 'linear-gradient(to bottom, var(--dgp-accent-gold), var(--dgp-accent-green))'
              : 'var(--dgp-divider)',
            opacity: isCompleted ? 1 : 0.3,
          }}
        />
      )}
    </div>
  );
};

// Milestone checkpoint component with unlock animation
const MilestoneCheckpoint: React.FC<{
  milestone: { threshold: number; name: string; isUnlocked: boolean };
  onClick: () => void;
}> = ({ milestone, onClick }) => {
  const [hasAnimated, setHasAnimated] = React.useState(false);

  // Trigger one-time "lift" animation when unlocked
  React.useEffect(() => {
    if (milestone.isUnlocked && !hasAnimated) {
      const timer = setTimeout(() => setHasAnimated(true), 600);
      return () => clearTimeout(timer);
    }
  }, [milestone.isUnlocked, hasAnimated]);

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 py-2"
    >
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center ml-1 transition-all duration-500',
          milestone.isUnlocked && 'ring-2 ring-offset-1 ring-offset-[#0B0F0D] ring-[#C8B06A]',
          milestone.isUnlocked && !hasAnimated && 'scale-105',
        )}
        style={{
          background: milestone.isUnlocked
            ? 'var(--dgp-accent-gold)'
            : 'var(--dgp-glass-surface)',
          border: `1px solid ${
            milestone.isUnlocked ? 'var(--dgp-accent-gold)' : 'var(--dgp-glass-stroke)'
          }`,
          boxShadow: milestone.isUnlocked ? 'var(--dgp-shadow-glow-gold)' : 'none',
          opacity: milestone.isUnlocked ? 1 : 0.4,
        }}
      >
        <span
          className="text-xs font-bold"
          style={{ color: milestone.isUnlocked ? '#000' : 'var(--dgp-text-muted)' }}
        >
          {milestone.threshold}
        </span>
      </div>
      <span
        className="text-xs font-medium"
        style={{
          color: milestone.isUnlocked ? 'var(--dgp-accent-gold)' : 'var(--dgp-text-muted)',
        }}
      >
        {milestone.name}
      </span>
      {milestone.isUnlocked && (
        <Check className="w-3 h-3" style={{ color: 'var(--dgp-accent-gold)' }} />
      )}
    </button>
  );
};

export const JourneyMapPath: React.FC<JourneyMapPathProps> = ({
  chapters,
  milestones,
  onChapterClick,
  onMilestoneClick,
}) => {
  // Sort milestones and interleave with chapters
  const sortedMilestones = [...milestones].sort((a, b) => a.threshold - b.threshold);

  return (
    <div className="relative pl-2">
      {/* Background path line */}
      <div
        className="absolute left-7 top-0 bottom-0 w-0.5"
        style={{ background: 'var(--dgp-divider)' }}
      />

      <div className="space-y-4">
        {chapters.map((chapter, index) => (
          <React.Fragment key={chapter.id}>
            <ChapterNode
              chapter={chapter}
              isFirst={index === 0}
              isLast={index === chapters.length - 1}
              onClick={() => onChapterClick(chapter)}
            />
            
            {/* Insert milestones after each chapter based on threshold logic */}
            {sortedMilestones
              .filter((m) => {
                // Show milestone after chapter if threshold is near current progress
                const chapterProgress = chapter.played;
                return m.threshold <= chapterProgress + 10 && m.threshold > (chapters[index - 1]?.played ?? 0);
              })
              .slice(0, 1)
              .map((m) => (
                <MilestoneCheckpoint
                  key={m.threshold}
                  milestone={m}
                  onClick={() => onMilestoneClick(m)}
                />
              ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default JourneyMapPath;
