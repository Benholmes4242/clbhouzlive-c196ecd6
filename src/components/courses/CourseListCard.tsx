import React from 'react';
import { Top100RankBadge } from '@/components/top100/Top100RankBadge';
import ClubhouseLogo from '@/components/ui/clubhouse-logo';

interface CourseListCardProps {
  course: {
    id: string;
    name: string;
    country: string;
    sub_country?: string | null;
    thumbnail_image?: string | null;
    global_rank?: number | null;
    regional_rank?: number | null;
    usa_rank?: number | null;
    average_rating?: number | null;
  };
  onClick?: () => void;
  showGlobalRank?: boolean;
  showRegionalRank?: boolean;
  showUsaRank?: boolean;
  /** Which list context we're in - determines which single badge to show */
  listSlug?: 'global' | 'gb-i' | 'usa' | 'europe';
}

/**
 * Unified course card with image on top and white meta bar below.
 * Used across Explore, Top 100 tabs, and Top 100 list pages.
 */
export const CourseListCard: React.FC<CourseListCardProps> = ({
  course,
  onClick,
  showGlobalRank = true,
  showRegionalRank = false,
  showUsaRank = false,
  listSlug,
}) => {
  // Determine which rank to show based on context
  const getRankForDisplay = () => {
    if (listSlug) {
      switch (listSlug) {
        case 'global':
          return course.global_rank;
        case 'usa':
          return course.usa_rank ?? course.regional_rank;
        case 'gb-i':
        case 'europe':
          return course.regional_rank;
        default:
          return course.global_rank;
      }
    }
    // Default behavior: show global rank if available
    if (showGlobalRank && course.global_rank) return course.global_rank;
    if (showUsaRank && course.usa_rank) return course.usa_rank;
    if (showRegionalRank && course.regional_rank) return course.regional_rank;
    return null;
  };

  const rankToShow = getRankForDisplay();
  const badgeSlug = listSlug || (course.global_rank ? 'global' : course.usa_rank ? 'usa' : 'gb-i');

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-none sm:rounded-sq-md overflow-hidden bg-card border-y sm:border border-border/60 text-left shadow-none sm:shadow-sm hover:sm:shadow-md transition-all"
    >
      {/* Hero image with rank badge */}
      <div className="relative w-full aspect-[1.6/1] overflow-hidden">
        <img
          src={course.thumbnail_image || '/placeholder.svg'}
          alt={course.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = '/placeholder.svg';
          }}
        />
        
        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
        
        {/* Rank badge - top-left */}
        {rankToShow && (
          <div className="absolute top-3 left-3">
            <Top100RankBadge listSlug={badgeSlug as 'global' | 'gb-i' | 'usa' | 'europe'} rank={rankToShow} />
          </div>
        )}
      </div>

      {/* Meta area - white bar */}
      <div className="px-4 py-3 bg-background space-y-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground truncate">
              {course.name}
            </h3>
            
            <p className="text-sm text-muted-foreground truncate">
              {course.sub_country && `${course.sub_country}, `}
              {course.country}
            </p>
          </div>

          {course.average_rating != null && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <ClubhouseLogo className="h-5 w-5" />
              <span className="text-sm font-semibold text-foreground">
                {course.average_rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

export default CourseListCard;
