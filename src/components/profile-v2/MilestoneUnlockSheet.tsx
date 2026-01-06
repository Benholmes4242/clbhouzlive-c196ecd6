/**
 * MilestoneUnlockSheet - Quiet celebration for milestone unlocks
 * Shows once per milestone, stores seen state locally
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Trophy, Share2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MilestoneUnlockSheetProps {
  totalPlayed: number;
  onShare?: () => void;
}

interface Milestone {
  id: string;
  name: string;
  threshold: number;
  description: string;
}

const MILESTONES: Milestone[] = [
  { id: '5-club', name: '5 Club', threshold: 5, description: 'You have played 5 Top 100 courses' },
  { id: '10-club', name: '10 Club', threshold: 10, description: 'You have played 10 Top 100 courses' },
  { id: '20-club', name: '20 Club', threshold: 20, description: 'You have played 20 Top 100 courses' },
  { id: '50-club', name: '50 Club', threshold: 50, description: 'You have played 50 Top 100 courses' },
  { id: '100-club', name: 'Century Club', threshold: 100, description: 'You have completed the Top 100 Quest' },
];

const STORAGE_KEY = 'quest-milestones-seen';

function getSeenMilestones(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function markMilestoneSeen(id: string) {
  try {
    const seen = getSeenMilestones();
    seen.add(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]));
  } catch {
    // Ignore storage errors
  }
}

export const MilestoneUnlockSheet: React.FC<MilestoneUnlockSheetProps> = ({
  totalPlayed,
  onShare,
}) => {
  const [unlockedMilestone, setUnlockedMilestone] = useState<Milestone | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Find newly unlocked milestone
    const seen = getSeenMilestones();
    
    for (const milestone of MILESTONES) {
      if (totalPlayed >= milestone.threshold && !seen.has(milestone.id)) {
        setUnlockedMilestone(milestone);
        // Animate progress bar
        setTimeout(() => setProgress(100), 100);
        break;
      }
    }
  }, [totalPlayed]);

  const handleClose = useCallback(() => {
    if (unlockedMilestone) {
      markMilestoneSeen(unlockedMilestone.id);
    }
    setUnlockedMilestone(null);
    setProgress(0);
  }, [unlockedMilestone]);

  const handleShare = useCallback(() => {
    onShare?.();
    handleClose();
  }, [onShare, handleClose]);

  if (!unlockedMilestone) return null;

  return (
    <Sheet open={!!unlockedMilestone} onOpenChange={handleClose}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-t"
        style={{
          background: 'var(--dgp-bg-surface)',
          borderColor: 'var(--dgp-glass-stroke)',
        }}
      >
        <div className="py-6 text-center">
          {/* Icon with glow */}
          <div className="flex justify-center mb-6">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{
                background: 'rgba(200, 176, 106, 0.15)',
                border: '1px solid var(--dgp-accent-gold)',
                boxShadow: '0 0 40px rgba(200, 176, 106, 0.3)',
              }}
            >
              <Trophy className="w-10 h-10" style={{ color: 'var(--dgp-accent-gold)' }} />
            </div>
          </div>

          {/* Title */}
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--dgp-accent-gold)' }}
          >
            Milestone Unlocked
          </p>
          <h2
            className="text-2xl font-bold mb-2"
            style={{ color: 'var(--dgp-text-primary)' }}
          >
            {unlockedMilestone.name}
          </h2>
          <p
            className="text-sm mb-6"
            style={{ color: 'var(--dgp-text-secondary)' }}
          >
            {unlockedMilestone.description}
          </p>

          {/* Progress bar animation */}
          <div className="px-8 mb-8">
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: 'var(--dgp-glass-surface)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${progress}%`,
                  background: 'var(--dgp-accent-gold)',
                }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs" style={{ color: 'var(--dgp-text-muted)' }}>
                Progress
              </span>
              <span className="text-xs font-medium" style={{ color: 'var(--dgp-text-primary)' }}>
                {totalPlayed} / {unlockedMilestone.threshold}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 px-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleShare}
              style={{
                background: 'var(--dgp-glass-surface)',
                borderColor: 'var(--dgp-glass-stroke)',
                color: 'var(--dgp-text-primary)',
              }}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              className="flex-1"
              onClick={handleClose}
              style={{
                background: 'var(--dgp-accent-gold)',
                color: '#000',
              }}
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MilestoneUnlockSheet;
