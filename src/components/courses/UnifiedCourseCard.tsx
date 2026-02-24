import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Calendar } from 'lucide-react';
import { CourseCardModel } from '@/types/courseCard';
import { Top100RankBadge } from '@/components/top100/Top100RankBadge';
import { CourseCommunityRating } from './CourseCommunityRating';
import { format } from 'date-fns';

/**
 * UNIFIED COURSE CARD COMPONENT
 * 
 * This is the SINGLE SOURCE OF TRUTH for course card rendering.
 * All course cards in the app must use this component.
 * 
 * Variants:
 * - vertical: Image on top, meta bar below (default, used in Explore/Top 100/Leaderboard)
 * - horizontal: Thumbnail left, meta right (used in profile lists)
 */

// Standardized padding - matches CinematicCourseCard
const META_PADDING = 'px-4 py-3.5';
const META_PADDING_HORIZONTAL = 'p-3';

// Image aspect ratio - matches CinematicCourseCard (16:9)
const IMAGE_ASPECT = 'aspect-[16/9]';

interface UnifiedCourseCardProps {
  course: CourseCardModel;
  variant?: 'vertical' | 'horizontal';
  showRankBadges?: boolean;
  showRating?: boolean;
  showPlayedStatus?: boolean;
  showFriendsContext?: boolean;
  showLastPlayed?: boolean;
  hideLocation?: boolean;
  loggedDate?: string | Date | null;
  contextTag?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * Determine the regional badge slug based on available data
 */
function getRegionalBadgeSlug(course: CourseCardModel): 'usa' | 'gb-i' | 'europe' | null {
  if (course.ranks?.usa) return 'usa';
  if (course.ranks?.regional) {
    // Determine region based on country - check both individual countries and region names
    const gbCountries = [
      'England', 'Scotland', 'Wales', 'Ireland', 'Northern Ireland',
      'Britain & Ireland', 'Great Britain', 'United Kingdom', 'UK', 'GB'
    ];
    const country = course.country?.trim() || '';
    if (gbCountries.some(c => country.toLowerCase() === c.toLowerCase())) {
      return 'gb-i';
    }
    // Also check if locationText contains GB&I region indicators
    const locationText = course.locationText?.toLowerCase() || '';
    if (locationText.includes('britain') || locationText.includes('ireland') || 
        locationText.includes('scotland') || locationText.includes('england') ||
        locationText.includes('wales') || locationText.includes('northern ireland')) {
      return 'gb-i';
    }
    return 'europe';
  }
  return null;
}

export const UnifiedCourseCard: React.FC<UnifiedCourseCardProps> = ({
  course,
  variant = 'vertical',
  showRankBadges = true,
  showRating = true,
  showPlayedStatus = false,
  showFriendsContext = false,
  showLastPlayed = false,
  hideLocation = false,
  loggedDate,
  contextTag,
  onClick,
  className = '',
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/courses/${course.id}`);
    }
  };

  const regionalRank = course.ranks?.usa ?? course.ranks?.regional ?? null;
  const regionalBadgeSlug = getRegionalBadgeSlug(course);
  const isPlayed = course.context?.isPlayedByViewer;

  // ============ HORIZONTAL VARIANT ============
  if (variant === 'horizontal') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`group w-full bg-card border border-border/60 rounded-sq-sm overflow-hidden text-left hover:border-border hover:shadow-sm active:scale-[0.99] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 ${className}`}
      >
        <div className="flex">
          {/* Thumbnail */}
          <div className="relative flex-shrink-0">
            {course.imageUrl ? (
              <img
                src={course.imageUrl}
                alt={course.name}
                className="w-20 h-20 object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            ) : (
              <div className="w-20 h-20 bg-muted" />
            )}
          </div>

          {/* Content */}
          <div className={`flex-1 ${META_PADDING_HORIZONTAL} flex flex-col justify-center min-w-0`}>
            <div className="font-semibold text-sm text-foreground truncate">
              {course.name}
            </div>
            {!hideLocation && (
              <div className="text-xs text-muted-foreground truncate">
                {course.locationText}
              </div>
            )}
            {showLastPlayed && course.context?.lastPlayedAt && (
              <div className="flex items-center gap-1 mt-1.5">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(course.context.lastPlayedAt), 'd MMM yyyy')}
                </span>
              </div>
            )}
          </div>

          {/* Rating */}
          {showRating && course.communityRating != null && (
            <div className="flex items-center px-3">
              <CourseCommunityRating rating={course.communityRating} size="lg" />
            </div>
          )}
        </div>
      </button>
    );
  }

  // ============ VERTICAL VARIANT (DEFAULT) ============
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`View ${course.name}`}
      className={`group w-full rounded-none sm:rounded-sq-md overflow-hidden bg-card sm:border sm:border-border/50 text-left shadow-none sm:shadow-sm hover:sm:shadow-lg hover:sm:scale-[1.005] active:scale-[0.98] sm:active:scale-[0.995] transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 ${className}`}
    >
      {/* Hero image with badges */}
      <div className={`relative w-full ${IMAGE_ASPECT} overflow-hidden`}>
        {course.imageUrl ? (
          <img
            src={course.imageUrl}
            alt={course.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}

        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />

        {/* Rank badges - top-left */}
        {showRankBadges && (
          <div className="absolute top-3 left-3 flex items-center gap-2">
            {course.ranks?.global && (
              <Top100RankBadge listSlug="global" rank={course.ranks.global} />
            )}
            {regionalRank && regionalBadgeSlug && (
              <Top100RankBadge listSlug={regionalBadgeSlug} rank={regionalRank} />
            )}
          </div>
        )}

        {/* Played status - top-right */}
        {showPlayedStatus && isPlayed !== undefined && (
          <div
            className={`absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-sq-pill text-[9px] font-medium shadow-sm ${
              isPlayed
                ? 'bg-emerald-500/90 text-white'
                : 'bg-black/50 text-white/90'
            }`}
          >
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

        {/* Context tag - top-right (when no played status) */}
        {contextTag && !showPlayedStatus && (
          <div className="absolute top-3 right-3">
            <span className="text-[10px] font-medium bg-black/60 text-white px-2 py-1 rounded-sq-xs backdrop-blur-sm">
              {contextTag}
            </span>
          </div>
        )}
      </div>

      {/* Meta area - standardized padding */}
      <div className={`${META_PADDING} bg-card`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1">
            {/* Course name */}
            <h3 className="text-[15px] font-semibold text-foreground truncate" style={{ letterSpacing: '-0.2px' }} title={course.name}>
              {course.name}
            </h3>

            {/* Logged date pill - aligned with course name */}
            {loggedDate && (
              <div className="inline-block text-[9px] font-medium text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full">
                Logged: {format(new Date(loggedDate), 'd MMM yyyy')}
              </div>
            )}

            {/* Location - increased spacing from title */}
            {!hideLocation && (
              <p className="text-xs text-muted-foreground truncate">
                {course.locationText}
              </p>
            )}

            {/* Rating count / members */}
            {course.ratingCount && course.ratingCount > 0 && (
              <p className="text-[11px] text-muted-foreground">
                Rated by {course.ratingCount} member{course.ratingCount === 1 ? '' : 's'}
              </p>
            )}

            {/* Friends context */}
            {showFriendsContext && course.context?.friendsPlayedCount != null && (
              <p className="text-xs text-muted-foreground">
                {course.context.friendsPlayedCount > 0 ? (
                  <>Played by {course.context.friendsPlayedCount} friend{course.context.friendsPlayedCount === 1 ? '' : 's'}</>
                ) : (
                  <span className="text-muted-foreground/60">No friends have played yet</span>
                )}
              </p>
            )}
          </div>

          {/* Community rating - fixed width container for alignment lock */}
          {showRating && course.communityRating != null && (
            <div className="flex-shrink-0 min-w-[56px] flex items-center justify-end self-center">
              <CourseCommunityRating rating={course.communityRating} size="lg" showLogo forceNeutral />
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

export default UnifiedCourseCard;
