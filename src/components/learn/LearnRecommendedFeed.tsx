import React from 'react';
import { cn } from '@/lib/utils';
import { LearnVideoCard, LearnVideo } from './LearnVideoCard';
import { SkillLevel } from '@/hooks/useSkillLevel';

interface LearnRecommendedFeedProps {
  skillLevel: SkillLevel;
  onVideoClick?: (id: string) => void;
  className?: string;
}

// Mock data - replace with real API integration
const MOCK_VIDEOS: Record<SkillLevel, LearnVideo[]> = {
  beginner: [
    { id: 'b1', title: 'Golf Grip Fundamentals – The Foundation of Every Swing', creatorName: 'Rick Shiels', thumbnailUrl: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=640&q=80', duration: '8:24' },
    { id: 'b2', title: 'Your First Time at a Golf Course – What to Expect', creatorName: 'Golf Sidekick', thumbnailUrl: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=640&q=80', duration: '12:30' },
    { id: 'b3', title: 'How to Hit a Driver: Complete Beginner Guide', creatorName: 'Meandmygolf', thumbnailUrl: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=640&q=80', duration: '15:12' },
    { id: 'b4', title: 'Basic Putting Technique for New Golfers', creatorName: 'Golf with Aimee', thumbnailUrl: 'https://images.unsplash.com/photo-1592919505780-303950717480?w=640&q=80', duration: '6:45' },
  ],
  improver: [
    { id: 'i1', title: 'Stop Slicing Forever – The Fix That Actually Works', creatorName: 'Rick Shiels', thumbnailUrl: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=640&q=80', duration: '11:20' },
    { id: 'i2', title: 'Iron Contact Drills You Can Do at Home', creatorName: 'Athletic Motion Golf', thumbnailUrl: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=640&q=80', duration: '9:15' },
    { id: 'i3', title: 'Course Management to Break 100', creatorName: 'Golf Sidekick', thumbnailUrl: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=640&q=80', duration: '18:30' },
    { id: 'i4', title: 'Simple Pre-Shot Routine for Consistent Golf', creatorName: 'Meandmygolf', thumbnailUrl: 'https://images.unsplash.com/photo-1592919505780-303950717480?w=640&q=80', duration: '7:40' },
  ],
  confident: [
    { id: 'c1', title: 'Shaping Shots: How to Hit Draws and Fades on Command', creatorName: 'Athletic Motion Golf', thumbnailUrl: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=640&q=80', duration: '14:10' },
    { id: 'c2', title: 'Breaking 80: The Mental Game', creatorName: 'Golf Sidekick', thumbnailUrl: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=640&q=80', duration: '22:45' },
    { id: 'c3', title: 'Greenside Bunker Masterclass', creatorName: 'Meandmygolf', thumbnailUrl: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=640&q=80', duration: '16:20' },
    { id: 'c4', title: 'Distance Control with Your Wedges', creatorName: 'Rick Shiels', thumbnailUrl: 'https://images.unsplash.com/photo-1592919505780-303950717480?w=640&q=80', duration: '10:55' },
  ],
  competitive: [
    { id: 'co1', title: 'Tournament Preparation: Week Before Strategy', creatorName: 'Peter Finch', thumbnailUrl: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=640&q=80', duration: '19:30' },
    { id: 'co2', title: 'Reading Greens Like a Tour Pro', creatorName: 'AimPoint', thumbnailUrl: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=640&q=80', duration: '25:15' },
    { id: 'co3', title: 'Pressure Putting: Drills from the Tour', creatorName: 'Meandmygolf', thumbnailUrl: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=640&q=80', duration: '12:40' },
    { id: 'co4', title: 'Controlling Trajectory in the Wind', creatorName: 'Athletic Motion Golf', thumbnailUrl: 'https://images.unsplash.com/photo-1592919505780-303950717480?w=640&q=80', duration: '15:10' },
  ],
};

/**
 * LearnRecommendedFeed - Primary learning content feed
 * Instructional only, no memes, no promo graphics
 * Limited feed length (not infinite scroll chaos)
 */
export const LearnRecommendedFeed: React.FC<LearnRecommendedFeedProps> = ({
  skillLevel,
  onVideoClick,
  className,
}) => {
  const videos = MOCK_VIDEOS[skillLevel] || MOCK_VIDEOS.improver;

  return (
    <section className={cn("px-5", className)}>
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-4">
        Recommended for you
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {videos.map((video) => (
          <LearnVideoCard
            key={video.id}
            video={video}
            onClick={onVideoClick}
            variant="primary"
          />
        ))}
      </div>
    </section>
  );
};

export default LearnRecommendedFeed;
