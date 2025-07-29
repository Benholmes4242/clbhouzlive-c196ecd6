import React, { useState } from 'react';
import DepthStackCarousel from './DepthStackCarousel';

interface HighlightVideo {
  id: string;
  courseId: string;
  courseName: string;
  location: string;
  rank: number;
  thumbnail: string;
  videoUrl?: string;
  caption: string;
  duration?: string;
}

interface LatestHighlightsProps {
  userId?: string;
  isOwnProfile?: boolean;
}

// Mock data - replace with actual data fetching
const mockHighlights: HighlightVideo[] = [
  {
    id: '1',
    courseId: 'pebble-beach',
    courseName: 'Pebble Beach Golf Links',
    location: 'California, USA',
    rank: 1,
    thumbnail: '/lovable-uploads/b5c44b64-e08d-4c79-b3d0-e15cad97b1b3.png',
    caption: 'Perfect approach shot on the iconic 18th hole with ocean views',
    duration: '0:45'
  },
  {
    id: '2',
    courseId: 'augusta-national',
    courseName: 'Augusta National Golf Club',
    location: 'Georgia, USA',
    rank: 2,
    thumbnail: '/lovable-uploads/2a145957-bebc-43ef-bd85-1f1343e05210.png',
    caption: 'Navigating the famous Amen Corner during morning round',
    duration: '1:12'
  },
  {
    id: '3',
    courseId: 'st-andrews',
    courseName: 'The Old Course at St Andrews',
    location: 'Scotland, UK',
    rank: 3,
    thumbnail: '/lovable-uploads/b5c44b64-e08d-4c79-b3d0-e15cad97b1b3.png',
    caption: 'Historic moment crossing the Swilcan Bridge',
    duration: '0:32'
  },
  {
    id: '4',
    courseId: 'cypress-point',
    courseName: 'Cypress Point Club',
    location: 'California, USA',
    rank: 4,
    thumbnail: '/lovable-uploads/2a145957-bebc-43ef-bd85-1f1343e05210.png',
    caption: 'Dramatic tee shot over the Pacific Ocean on 16th',
    duration: '0:58'
  },
  {
    id: '5',
    courseId: 'royal-county-down',
    courseName: 'Royal County Down',
    location: 'Northern Ireland, UK',
    rank: 8,
    thumbnail: '/lovable-uploads/b5c44b64-e08d-4c79-b3d0-e15cad97b1b3.png',
    caption: 'Challenging links golf with Mountains of Mourne backdrop',
    duration: '1:05'
  }
];

const LatestHighlights: React.FC<LatestHighlightsProps> = ({
  userId,
  isOwnProfile
}) => {
  const [highlights] = useState<HighlightVideo[]>(mockHighlights);

  const handleVideoPlay = (videoId: string) => {
    console.log('Playing video:', videoId);
    // Implement video modal or navigation to video page
  };

  if (!highlights.length) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Latest Highlights</h2>
        <div className="bg-white/5 backdrop-blur-2xl border border-white/20 rounded-xl p-8 text-center">
          <p className="text-white/60">No highlights available yet.</p>
          {isOwnProfile && (
            <p className="text-white/40 text-sm mt-2">
              Start playing top courses to create your highlight reel!
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4">
      <div className="mb-1">
        <h2 className="text-2xl font-bold text-white mb-2">Latest Highlights</h2>
        <p className="text-white/70">
          {isOwnProfile 
            ? "Your most memorable moments from the world's greatest courses"
            : "Recent highlights from top golf courses"
          }
        </p>
      </div>
      
      <DepthStackCarousel 
        highlights={highlights}
        onVideoPlay={handleVideoPlay}
      />
      
      {/* Additional stats or info */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm text-white/60">
        <span>{highlights.length} highlights</span>
        <span>•</span>
        <span>{new Set(highlights.map(h => h.courseId)).size} courses featured</span>
        <span>•</span>
        <span>Top {Math.min(...highlights.map(h => h.rank))} course played</span>
      </div>
    </div>
  );
};

export default LatestHighlights;