import React from 'react';
import { cn } from '@/lib/utils';
import { MapPin, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useExploreFeaturedCourses, useTrendingCourses } from '@/hooks/useExploreData';

interface CourseDiscoveryFeedProps {
  className?: string;
  onItemClick?: (item: any) => void;
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
  const navigate = useNavigate();
  const { data: featuredCourses, isLoading: loadingFeatured } = useExploreFeaturedCourses();
  const { data: trendingCourses, isLoading: loadingTrending } = useTrendingCourses(8);

  const isLoading = loadingFeatured || loadingTrending;

  // Combine featured courses with trending courses for fallback
  const displayItems = React.useMemo(() => {
    // If we have featured courses, use them
    if (featuredCourses?.length) {
      return featuredCourses.map(fc => ({
        id: fc.id,
        courseId: fc.course_id,
        courseName: fc.course?.name || 'Unknown Course',
        courseLocation: fc.course?.sub_country 
          ? `${fc.course.sub_country}, ${fc.course.country}`
          : fc.course?.country,
        mediaType: fc.card_type,
        mediaUrl: fc.card_media_url,
        creatorName: fc.source_label,
        playUrl: fc.play_url,
      }));
    }
    
    // Fallback to trending courses
    if (trendingCourses?.length) {
      return trendingCourses.slice(0, 4).map(course => ({
        id: course.id,
        courseId: course.id,
        courseName: course.name,
        courseLocation: course.sub_country 
          ? `${course.sub_country}, ${course.country}`
          : course.country,
        mediaType: 'image' as const,
        mediaUrl: course.thumbnail_image,
        creatorName: course.global_rank ? `Top 100 World #${course.global_rank}` : undefined,
      }));
    }

    return [];
  }, [featuredCourses, trendingCourses]);

  const handleItemClick = (item: any) => {
    onItemClick?.(item);
    navigate(`/courses/${item.courseId}`);
  };

  if (isLoading) {
    return (
      <div className={cn("py-6", className)}>
        <div className="px-5 mb-4">
          <div className="h-6 w-40 bg-muted animate-pulse rounded" />
          <div className="h-4 w-56 bg-muted animate-pulse rounded mt-2" />
        </div>
        <div className="px-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="aspect-[3/4] rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!displayItems.length) {
    return (
      <div className={cn("py-6", className)}>
        <div className="px-5 mb-4">
          <h3 className="text-lg font-serif text-foreground">Discover Courses</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Moments from the world's great courses
          </p>
        </div>
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Featured courses coming soon.
          </p>
        </div>
      </div>
    );
  }

  // Gradient colors for items without images
  const gradients = [
    "bg-gradient-to-br from-emerald-800 via-slate-700 to-slate-900",
    "bg-gradient-to-br from-blue-700 via-slate-600 to-slate-900",
    "bg-gradient-to-br from-amber-700 via-slate-600 to-slate-900",
    "bg-gradient-to-br from-teal-700 via-slate-600 to-slate-900",
  ];

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
        {displayItems.map((item, index) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item)}
            className="group text-left"
          >
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-surface-alt">
              {/* Background image or gradient */}
              {item.mediaUrl ? (
                <img 
                  src={item.mediaUrl} 
                  alt={item.courseName}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className={cn("absolute inset-0", gradients[index % gradients.length])} />
              )}
              
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
