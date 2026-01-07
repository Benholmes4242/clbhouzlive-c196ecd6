import React from 'react';
import { Check } from 'lucide-react';
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
  /** Which list context we're in - helps determine regional badge type */
  listSlug?: 'global' | 'gb-i' | 'usa' | 'europe';
  /** Whether the user has played this course */
  isPlayed?: boolean;
}

/**
 * Unified course card with image on top and white meta bar below.
 * Used across Explore, Top 100 tabs, and Top 100 list pages.
 */
export const CourseListCard: React.FC<CourseListCardProps> = ({
  course,
  onClick,
  listSlug,
  isPlayed,
}) => {
  // Derive regional rank from usa_rank or regional_rank
  const regionalRank = course.usa_rank ?? course.regional_rank ?? null;
  
  // Determine regional badge type based on available data
  const getRegionalBadgeSlug = (): 'usa' | 'gb-i' | 'europe' | null => {
    if (listSlug && listSlug !== 'global') return listSlug as 'usa' | 'gb-i' | 'europe';
    if (course.usa_rank) return 'usa';
    if (course.regional_rank) return 'gb-i'; // Default to GB&I for regional_rank
    return null;
  };

  const regionalBadgeSlug = getRegionalBadgeSlug();

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-none sm:rounded-sq-md overflow-hidden bg-card border-y sm:border border-border/60 text-left shadow-none sm:shadow-sm hover:sm:shadow-md transition-all"
    >
      {/* Hero image with rank badges */}
      <div className="relative w-full aspect-[1.77/1] overflow-hidden">
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
        
        {/* Rank badges - top-left, show both when available */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          {course.global_rank && (
            <Top100RankBadge listSlug="global" rank={course.global_rank} />
          )}
          {regionalRank && regionalBadgeSlug && (
            <Top100RankBadge listSlug={regionalBadgeSlug} rank={regionalRank} />
          )}
        </div>

        {/* Played/Unplayed status - top-right, slightly smaller than rank badges */}
        {isPlayed !== undefined && (
          <div className={`absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-sq-pill text-[9px] font-medium shadow-sm ${
            isPlayed 
              ? 'bg-emerald-500/90 text-white' 
              : 'bg-black/50 text-white/90'
          }`}>
            {isPlayed ? (
              <>
                <Check className="w-2.5 h-2.5" />
                <span>Played</span>
              </>
            ) : (
              <span>Unplayed</span>
            )}
          </div>
        )}
      </div>

      {/* Meta area - white bar */}
      <div className="px-4 py-3 bg-white space-y-0.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {course.name}
            </h3>
            
            <p className="text-xs text-muted-foreground truncate">
              {course.sub_country && `${course.sub_country}, `}
              {course.country}
            </p>
          </div>

          {course.average_rating != null && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <ClubhouseLogo className="h-4 w-4" />
              <span className="text-xs font-semibold text-foreground">
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
