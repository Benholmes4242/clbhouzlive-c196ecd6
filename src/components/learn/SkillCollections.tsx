import React from 'react';
import { cn } from '@/lib/utils';
import { LearningCollectionCard, LearningCollection } from './LearningCollectionCard';
import { SkillLevel } from '@/hooks/useSkillLevel';

interface SkillCollectionsProps {
  skillLevel: SkillLevel;
  onCollectionClick?: (id: string) => void;
  className?: string;
}

// Mock data - outcome-based collections
const COLLECTIONS: Record<SkillLevel, LearningCollection[]> = {
  beginner: [
    { id: 'col-b1', title: 'Your First 9 Holes', description: 'Everything you need to feel confident stepping onto a course for the first time.', lessonCount: 5 },
    { id: 'col-b2', title: 'Grip, Stance, Swing', description: 'Master the three fundamentals that every great golfer builds upon.', lessonCount: 4 },
    { id: 'col-b3', title: 'Golf Etiquette 101', description: 'Unwritten rules that will help you fit in anywhere you play.', lessonCount: 3 },
  ],
  improver: [
    { id: 'col-i1', title: 'Fix Your Slice', description: 'A step-by-step system to straighten out your most frustrating miss.', lessonCount: 6 },
    { id: 'col-i2', title: 'Break 100', description: 'The strategies and techniques to get your score under triple digits.', lessonCount: 8 },
    { id: 'col-i3', title: 'Better Iron Contact', description: 'Stop hitting it thin and fat with these proven drills.', lessonCount: 5 },
  ],
  confident: [
    { id: 'col-c1', title: 'Break 90', description: 'Course management and shot selection to consistently shoot in the 80s.', lessonCount: 7 },
    { id: 'col-c2', title: 'Short Game Scoring', description: 'Get up and down more often with better chipping and putting.', lessonCount: 6 },
    { id: 'col-c3', title: 'Play Better in the Wind', description: 'Shot shapes and strategies for when conditions get tough.', lessonCount: 4 },
  ],
  competitive: [
    { id: 'col-co1', title: 'Tournament Ready', description: 'Mental game, preparation, and in-round strategy for competition.', lessonCount: 9 },
    { id: 'col-co2', title: 'Scoring Zone Mastery', description: 'Wedge distance control and green reading at an elite level.', lessonCount: 7 },
    { id: 'col-co3', title: 'Pressure Performance', description: 'How to execute when it matters most.', lessonCount: 5 },
  ],
};

/**
 * SkillCollections - Outcome-based learning modules
 * These build trust, not dopamine
 * Clear promises with lesson counts
 */
export const SkillCollections: React.FC<SkillCollectionsProps> = ({
  skillLevel,
  onCollectionClick,
  className,
}) => {
  const collections = COLLECTIONS[skillLevel] || COLLECTIONS.improver;

  return (
    <section className={cn("px-5 pt-8", className)}>
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-4">
        Skill Modules
      </h2>
      <div className="space-y-3">
        {collections.map((collection) => (
          <LearningCollectionCard
            key={collection.id}
            collection={collection}
            onClick={onCollectionClick}
          />
        ))}
      </div>
    </section>
  );
};

export default SkillCollections;
