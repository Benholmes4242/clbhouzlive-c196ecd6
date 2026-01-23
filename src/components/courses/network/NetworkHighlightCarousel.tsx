import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { NetworkCourseHighlight } from '@/hooks/useNetworkActivity';

interface NetworkHighlightCarouselProps {
  highlights: NetworkCourseHighlight[];
  className?: string;
}

/**
 * Horizontal carousel of network course highlights.
 * Full-bleed images with gradient overlay and social proof badges.
 */
export const NetworkHighlightCarousel: React.FC<NetworkHighlightCarouselProps> = ({
  highlights,
  className,
}) => {
  const navigate = useNavigate();

  // Minimum 3 tiles required
  if (highlights.length === 0) return null;

  const handleCourseClick = (courseId: string) => {
    navigate(`/course/${courseId}`);
  };

  const getBadgeLabel = (highlight: NetworkCourseHighlight): string | null => {
    switch (highlight.badge_type) {
      case 'played_by_friends':
        return `Played by ${highlight.friends_played_count} friends`;
      case 'new_for_network':
        return 'New for your network';
      case 'top_rated':
        return 'Top rated';
      case 'trending':
        return 'Trending';
      default:
        return null;
    }
  };

  return (
    <div className={cn('mt-4', className)}>
      <div 
        className="flex gap-3 overflow-x-auto scrollbar-hide pr-4"
        style={{ 
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth',
        }}
      >
        {highlights.map((highlight) => {
          const badgeLabel = getBadgeLabel(highlight);
          
          return (
            <button
              key={highlight.course_id}
              onClick={() => handleCourseClick(highlight.course_id)}
              className="flex-shrink-0 relative overflow-hidden rounded-xl transition-all duration-200 hover:brightness-105 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/30"
              style={{
                width: 'calc(45% - 6px)',
                minWidth: '160px',
                maxWidth: '200px',
                height: '180px',
                scrollSnapAlign: 'start',
              }}
              aria-label={`View ${highlight.course_name}`}
            >
              {/* Full-bleed course image */}
              {highlight.image_url ? (
                <img
                  src={highlight.image_url}
                  alt={highlight.course_name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                  <span className="text-4xl">⛳</span>
                </div>
              )}

              {/* Gradient overlay */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)',
                }}
              />

              {/* Social proof badge */}
              {badgeLabel && (
                <div 
                  className="absolute top-2 right-2 px-2 py-1 text-xs font-medium text-white rounded-full backdrop-blur-sm"
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                  }}
                >
                  {badgeLabel}
                </div>
              )}

              {/* Text overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                <h3 className="text-base font-semibold text-white line-clamp-1">
                  {highlight.course_name}
                </h3>
                {highlight.subline_text && (
                  <p className="text-xs text-white/80 mt-0.5 line-clamp-1">
                    {highlight.subline_text}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default NetworkHighlightCarousel;
