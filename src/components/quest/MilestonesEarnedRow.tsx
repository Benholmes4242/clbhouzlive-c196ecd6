/**
 * MilestonesEarnedRow - Horizontal pill row with 3 visual states
 * States: Unlocked (gold), Active (shimmer ring), Locked (muted)
 */

import React, { useRef, useEffect, useState } from 'react';
import { Check, Lock, Target } from 'lucide-react';
import { CLUB_STEPS } from '@/lib/top100Club';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

interface MilestonesEarnedRowProps {
  totalPlayed: number;
  onMilestoneClick?: (milestone: { threshold: number; name: string }) => void;
}

type MilestoneState = 'unlocked' | 'active' | 'locked';

interface Milestone {
  threshold: number;
  name: string;
  state: MilestoneState;
}

export const MilestonesEarnedRow: React.FC<MilestonesEarnedRowProps> = ({ 
  totalPlayed,
  onMilestoneClick,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Build milestones with state
  const milestones: Milestone[] = CLUB_STEPS.map((step, index) => {
    const isUnlocked = totalPlayed >= step.threshold;
    const isNextTarget = !isUnlocked && (index === 0 || totalPlayed >= CLUB_STEPS[index - 1].threshold);
    
    return {
      threshold: step.threshold,
      name: `${step.threshold} Club`,
      state: isUnlocked ? 'unlocked' : isNextTarget ? 'active' : 'locked',
    };
  });

  // Scroll to active milestone on mount
  useEffect(() => {
    setIsVisible(true);
    
    if (activeRef.current && scrollRef.current) {
      const timeout = setTimeout(() => {
        activeRef.current?.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        });
      }, 600);
      return () => clearTimeout(timeout);
    }
  }, []);

  const handleClick = (milestone: Milestone) => {
    onMilestoneClick?.({ threshold: milestone.threshold, name: milestone.name });
  };

  return (
    <section 
      className={cn(
        "overflow-x-auto -mx-4 px-4 scrollbar-hide",
        isVisible && !prefersReducedMotion && "quest-animate-fade-up quest-delay-3"
      )}
    >
      <div 
        ref={scrollRef}
        className="flex items-center gap-2 pb-2"
      >
        {milestones.map((m) => (
          <button
            key={m.threshold}
            ref={m.state === 'active' ? activeRef : undefined}
            onClick={() => handleClick(m)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all duration-200",
              m.state === 'unlocked' && "quest-pill-unlocked",
              m.state === 'active' && "quest-pill-active",
              m.state === 'locked' && "quest-pill-locked"
            )}
          >
            {m.state === 'unlocked' && <Check className="w-3 h-3" />}
            {m.state === 'active' && <Target className="w-3 h-3" />}
            {m.state === 'locked' && <Lock className="w-2.5 h-2.5 opacity-50" />}
            {m.name}
          </button>
        ))}
      </div>
    </section>
  );
};

export default MilestonesEarnedRow;
