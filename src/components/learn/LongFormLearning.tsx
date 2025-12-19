import React from 'react';
import { cn } from '@/lib/utils';
import { LearnVideoCard, LearnVideo } from './LearnVideoCard';
import { SkillLevel } from '@/hooks/useSkillLevel';

interface LongFormLearningProps {
  skillLevel: SkillLevel;
  onVideoClick?: (id: string) => void;
  className?: string;
}

// Mock long-form content - 2-4 items max
const LONG_FORM_VIDEOS: Record<SkillLevel, LearnVideo[]> = {
  beginner: [
    { id: 'lf-b1', title: 'Complete Golf Fundamentals Course – From Grip to Full Swing', creatorName: 'Meandmygolf', thumbnailUrl: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=640&q=80', duration: '45:00' },
    { id: 'lf-b2', title: 'Understanding Your First Set of Clubs', creatorName: 'TXG', thumbnailUrl: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=640&q=80', duration: '32:15' },
  ],
  improver: [
    { id: 'lf-i1', title: 'The Swing Plane Explained – Full Technical Deep Dive', creatorName: 'Athletic Motion Golf', thumbnailUrl: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=640&q=80', duration: '52:30' },
    { id: 'lf-i2', title: 'On-Course Playing Lesson: Course Management Masterclass', creatorName: 'Golf Sidekick', thumbnailUrl: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=640&q=80', duration: '1:15:00' },
    { id: 'lf-i3', title: 'Complete Practice Plan for Breaking 90', creatorName: 'Meandmygolf', thumbnailUrl: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=640&q=80', duration: '38:45' },
  ],
  confident: [
    { id: 'lf-c1', title: 'The Physics of Ball Flight – Why Your Ball Does What It Does', creatorName: 'Trackman', thumbnailUrl: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=640&q=80', duration: '48:20' },
    { id: 'lf-c2', title: 'Tour-Level Short Game: Full Practice Session', creatorName: 'James Robinson Golf', thumbnailUrl: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=640&q=80', duration: '55:10' },
  ],
  competitive: [
    { id: 'lf-co1', title: 'Mental Game Mastery: A Sports Psychologist\'s Complete Guide', creatorName: 'Dr. Bob Rotella', thumbnailUrl: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=640&q=80', duration: '1:22:00' },
    { id: 'lf-co2', title: 'Elite Wedge Play: Full Distance Control System', creatorName: 'James Ridyard', thumbnailUrl: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=640&q=80', duration: '42:30' },
    { id: 'lf-co3', title: 'Tournament Preparation: 7-Day Protocol', creatorName: 'Peter Finch', thumbnailUrl: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=640&q=80', duration: '35:15' },
  ],
};

/**
 * LongFormLearning - Deeper learning without overwhelming
 * 2-4 items only, clear duration, calm spacing
 * Editorial feel, avoids YouTube overload
 */
export const LongFormLearning: React.FC<LongFormLearningProps> = ({
  skillLevel,
  onVideoClick,
  className,
}) => {
  const videos = LONG_FORM_VIDEOS[skillLevel] || LONG_FORM_VIDEOS.improver;

  return (
    <section className={cn("px-5 pt-10 pb-8", className)}>
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
        When you have time
      </h2>
      <p className="text-sm text-muted-foreground/70 mb-5">
        Deeper dives for focused practice sessions
      </p>
      <div className="space-y-5">
        {videos.slice(0, 3).map((video) => (
          <LearnVideoCard
            key={video.id}
            video={video}
            onClick={onVideoClick}
            variant="compact"
          />
        ))}
      </div>
    </section>
  );
};

export default LongFormLearning;
