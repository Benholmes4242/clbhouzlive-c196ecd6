import React from 'react';
import { cn } from '@/lib/utils';
import { useSkillLevel } from '@/hooks/useSkillLevel';
import LearnIntro from './LearnIntro';
import SkillPathSelector from './SkillPathSelector';
import LearnRecommendedFeed from './LearnRecommendedFeed';
import SkillCollections from './SkillCollections';
import LongFormLearning from './LongFormLearning';

interface LearnTabProps {
  onVideoClick?: (id: string) => void;
  onCollectionClick?: (id: string) => void;
  className?: string;
}

/**
 * VideosTab - Main container for Videos experience (formerly Learn)
 * 
 * DATA RULE: Videos tab = long-form ONLY (≥3 min)
 * Shorts (<3 min) = Watch tab ONLY — NO crossover
 * 
 * ROUTING RULES:
 * - Watch tab: avatar/username taps → Profile Page
 * - Videos tab: avatar/username taps → Profile Page
 * 
 * Videos is intentionally:
 * - Quieter than Watch
 * - Slower and more deliberate
 * - More structured
 * 
 * If Watch answers "What's exciting?"
 * Videos answers "What should I work on next?"
 */
export const LearnTab: React.FC<LearnTabProps> = ({
  onVideoClick,
  onCollectionClick,
  className,
}) => {
  const { skillLevel } = useSkillLevel();

  const handleVideoClick = (id: string) => {
    console.log('Learn video clicked:', id);
    onVideoClick?.(id);
  };

  const handleCollectionClick = (id: string) => {
    console.log('Collection clicked:', id);
    onCollectionClick?.(id);
  };

  return (
    <div className={cn("min-h-screen", className)}>
      {/* Orientation / Intro */}
      <LearnIntro />

      {/* Skill Level Selector - Core Mechanic */}
      <SkillPathSelector />

      {/* Divider */}
      <div className="h-px bg-border/40 mx-5" />

      {/* Recommended for You - Primary Feed */}
      <LearnRecommendedFeed
        skillLevel={skillLevel}
        onVideoClick={handleVideoClick}
        className="pt-6"
      />

      {/* Skill Modules / Collections */}
      <SkillCollections
        skillLevel={skillLevel}
        onCollectionClick={handleCollectionClick}
      />

      {/* Divider */}
      <div className="h-px bg-border/40 mx-5 mt-8" />

      {/* Long-Form Learning */}
      <LongFormLearning
        skillLevel={skillLevel}
        onVideoClick={handleVideoClick}
      />
    </div>
  );
};

export default LearnTab;
