/**
 * MilestonesEarnedRow - Horizontal row showing unlocked milestone clubs
 * Premium trophy display with snap-scroll and fade hints
 */

import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { CLUB_STEPS } from '@/lib/top100Club';
import { AchievementBadgeCard, type AchievementTier } from '@/components/achievements/AchievementBadgeCard';
import { getRingColorForThreshold } from '@/lib/globalAchievementMilestoneSystem';

interface MilestonesEarnedRowProps {
  totalPlayed: number;
}

export const MilestonesEarnedRow: React.FC<MilestonesEarnedRowProps> = ({ totalPlayed }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showRightFade, setShowRightFade] = useState(false);
  const [showLeftFade, setShowLeftFade] = useState(false);

  // Get all milestones up to 400
  const milestones = CLUB_STEPS.map(step => ({
    threshold: step.threshold,
    name: `${step.threshold} Club`,
    tierName: step.tierName,
    isUnlocked: totalPlayed >= step.threshold,
  }));

  const unlockedMilestones = milestones.filter(m => m.isUnlocked);
  const nextMilestone = milestones.find(m => !m.isUnlocked);

  // Track scroll position for fade hints
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    const handleScroll = () => {
      setShowLeftFade(el.scrollLeft > 10);
      setShowRightFade(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    };
    
    handleScroll();
    el.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    
    return () => {
      el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [unlockedMilestones.length]);

  // Show empty state if no milestones
  if (unlockedMilestones.length === 0 && !nextMilestone) return null;

  return (
    <div className="relative">
      {/* Left fade gradient */}
      {showLeftFade && (
        <div 
          className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, var(--quest-page, #F4F5F7) 0%, transparent 100%)',
          }}
        />
      )}

      {/* Right fade gradient - scroll hint */}
      {showRightFade && (
        <div 
          className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(270deg, var(--quest-page, #F4F5F7) 0%, transparent 100%)',
          }}
        />
      )}

      <div 
        ref={scrollRef}
        className="overflow-x-auto -mx-4 px-4 scroll-smooth snap-x snap-mandatory"
        style={{ scrollbarWidth: 'thin' }}
      >
        <div className="flex items-stretch gap-4 pb-3">
          {/* Unlocked milestones with trophy styling */}
          {unlockedMilestones.map((m, index) => {
            const accentColor = getRingColorForThreshold(m.threshold);
            
            return (
              <motion.div 
                key={m.threshold}
                className="flex-shrink-0 snap-start relative"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                {/* Top edge tier accent highlight */}
                <div 
                  className="absolute -top-1 left-2 right-2 h-1 rounded-full z-20"
                  style={{
                    background: `linear-gradient(90deg, ${accentColor}80, ${accentColor}, ${accentColor}80)`,
                    boxShadow: `0 0 8px ${accentColor}50`,
                  }}
                />
                
                {/* Earned chip overlay */}
                <div 
                  className="absolute -top-2 right-2 z-30 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide"
                  style={{
                    background: `${accentColor}25`,
                    border: `1px solid ${accentColor}50`,
                    color: accentColor,
                    boxShadow: `0 2px 6px ${accentColor}20`,
                  }}
                >
                  <Check className="w-2.5 h-2.5" strokeWidth={3} />
                  Earned
                </div>
                
                <AchievementBadgeCard
                  tier={String(m.threshold) as AchievementTier}
                  title={m.name}
                  subtitle={m.tierName}
                  unlocked={true}
                  status="UNLOCKED"
                  totalTop100Played={totalPlayed}
                />
              </motion.div>
            );
          })}
          
          {/* Show next locked milestone as ghost */}
          {nextMilestone && (
            <div className="flex-shrink-0 snap-start">
              <AchievementBadgeCard
                tier={String(nextMilestone.threshold) as AchievementTier}
                title={nextMilestone.name}
                subtitle={nextMilestone.tierName}
                unlocked={false}
                isGhost={true}
                remaining={nextMilestone.threshold - totalPlayed}
                totalTop100Played={totalPlayed}
              />
            </div>
          )}
          
          {/* Spacer for scroll padding */}
          <div className="w-4 flex-shrink-0" />
        </div>
      </div>
    </div>
  );
};

export default MilestonesEarnedRow;
