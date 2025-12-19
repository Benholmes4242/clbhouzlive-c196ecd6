import React from 'react';
import { cn } from '@/lib/utils';
import { MapPin, Play } from 'lucide-react';

interface CourseContent {
  id: string;
  courseName: string;
  courseLocation?: string;
  mediaType: 'video' | 'image';
  mediaUrl?: string;
  creatorName?: string;
  creatorAvatar?: string;
}

// Sample content - course-led, not creator-led
const SAMPLE_CONTENT: CourseContent[] = [
  {
    id: '1',
    courseName: 'Royal County Down',
    courseLocation: 'Northern Ireland',
    mediaType: 'image',
    creatorName: 'Golf Monthly',
  },
  {
    id: '2',
    courseName: 'Pebble Beach',
    courseLocation: 'California, USA',
    mediaType: 'video',
    creatorName: 'PGA Tour',
  },
  {
    id: '3',
    courseName: 'St Andrews Old Course',
    courseLocation: 'Scotland',
    mediaType: 'image',
    creatorName: 'R&A',
  },
  {
    id: '4',
    courseName: 'Royal Melbourne',
    courseLocation: 'Australia',
    mediaType: 'video',
    creatorName: 'Golf Digest',
  },
];

interface CourseDiscoveryFeedProps {
  className?: string;
  onItemClick?: (item: CourseContent) => void;
}

/**
 * CourseDiscoveryFeed - Course-Led Discovery Feed
 * 
 * Rules:
 * - Every item must reference a course
 * - Course name is the PRIMARY label
 * - Creator is secondary context only
 * - Mix of video, photography, moments
 * 
 * This differentiates Explore from Watch immediately.
 */
export const CourseDiscoveryFeed: React.FC<CourseDiscoveryFeedProps> = ({
  className,
  onItemClick,
}) => {
  return (
    <div className={cn("py-6", className)}>
      {/* Section Header */}
      <div className="px-5 mb-4">
        <h3 className="text-lg font-serif text-foreground">Discover Courses</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Moments from the world's great courses
        </p>
      </div>
      
      {/* Feed Grid - 2 columns on mobile, more on larger screens */}
      <div className="px-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {SAMPLE_CONTENT.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemClick?.(item)}
            className="group text-left"
          >
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-surface-alt">
              {/* Placeholder gradient - replace with actual media */}
              <div className={cn(
                "absolute inset-0",
                item.id === '1' && "bg-gradient-to-br from-emerald-800 via-slate-700 to-slate-900",
                item.id === '2' && "bg-gradient-to-br from-blue-700 via-slate-600 to-slate-900",
                item.id === '3' && "bg-gradient-to-br from-amber-700 via-slate-600 to-slate-900",
                item.id === '4' && "bg-gradient-to-br from-teal-700 via-slate-600 to-slate-900",
              )} />
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              
              {/* Bottom gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              
              {/* Video indicator */}
              {item.mediaType === 'video' && (
                <div className="absolute top-3 right-3">
                  <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                    <Play className="w-4 h-4 text-white fill-white" />
                  </div>
                </div>
              )}
              
              {/* Content - Course is PRIMARY */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h4 className="text-sm font-medium text-white line-clamp-2">
                  {item.courseName}
                </h4>
                
                {item.courseLocation && (
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-white/60" />
                    <span className="text-xs text-white/60">{item.courseLocation}</span>
                  </div>
                )}
                
                {/* Creator - Secondary context */}
                {item.creatorName && (
                  <p className="mt-2 text-xs text-white/50">
                    via {item.creatorName}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CourseDiscoveryFeed;
