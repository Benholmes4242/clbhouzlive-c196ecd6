import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Calendar, Star } from 'lucide-react';
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
  showRateChip?: boolean;
  showFriendsContext?: boolean;
  showLastPlayed?: boolean;
  hideLocation?: boolean;
  loggedDate?: string | Date | null;
  contextTag?: string;
  activeListSlug?: string | null;
  onClick?: () => void;
  className?: string;
}

/**
 * Determine the regional badge slug based on available data
 */
function getRegionalBadgeSlug(course: CourseCardModel): 'usa' | 'gb-i' | 'europe' | null {
  if (course.ranks?.usa) return 'usa';
  if (course.ranks?.regional) {
    const gbCountries = [
      'England', 'Scotland', 'Wales', 'Ireland', 'Northern Ireland',
      'Britain & Ireland', 'Great Britain', 'United Kingdom', 'UK', 'GB'
    ];
    const country = course.country?.trim() || '';
    if (gbCountries.some(c => country.toLowerCase() === c.toLowerCase())) {
      return 'gb-i';
    }
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
  showRateChip = false,
  showFriendsContext = false,
  showLastPlayed = false,
  hideLocation = false,
  loggedDate,
  contextTag,
  activeListSlug = null,
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
        className={`group w-full bg-card border border-border/60 rounded-sq-sm overflow-hidden text-left active:scale-[0.99] transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 ${className}`}
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
      className={`group w-full overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 ${className}`}
      style={{ display: 'block', background: 'transparent' }}
    >
      {/* Full-bleed image — name/location/rating all overlaid inside */}
      <div className={`relative w-full ${IMAGE_ASPECT} overflow-hidden`}>
        {course.imageUrl ? (
          <img
            src={course.imageUrl}
            alt={course.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-active:scale-[1.02]"
            onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
          />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}

        {/* Gradient scrim — strong at bottom for text legibility */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.28) 45%, rgba(0,0,0,0.04) 100%)',
          }}
        />

        {/* Rank badges — top-left, stacked vertically */}
        {showRankBadges && (
          <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
            {(!activeListSlug || activeListSlug === 'global') && course.ranks?.global && (
              <Top100RankBadge listSlug="global" rank={course.ranks.global} />
            )}
            {(!activeListSlug || activeListSlug === regionalBadgeSlug) && regionalRank && regionalBadgeSlug && (
              <Top100RankBadge listSlug={regionalBadgeSlug} rank={regionalRank} />
            )}
          </div>
        )}

        {/* Played / Rate chip — top-right */}
        {showRateChip ? (
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/courses/${course.id}/rate`); }}
            style={{
              position: 'absolute', top: 10, right: 10,
              display: 'flex', alignItems: 'center', gap: 4,
              background: '#F59E0B',
              borderRadius: 7, padding: '4px 9px', border: 'none', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(245,158,11,0.40)',
            }}
          >
            <Star size={10} fill="white" color="white" />
            <span style={{ fontSize: 10, fontWeight: 700, color: 'white' }}>Rate</span>
          </button>
        ) : showPlayedStatus && isPlayed !== undefined ? (
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
        ) : null}

        {/* Context tag — top-right when no played status */}
        {contextTag && !showPlayedStatus && (
          <div className="absolute top-3 right-3">
            <span className="text-[10px] font-medium bg-black/60 text-white px-2 py-1 rounded-sq-xs backdrop-blur-sm">
              {contextTag}
            </span>
          </div>
        )}

        {/* Bottom row — name/location left, rating right — all inside image */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5 pt-2 flex items-end justify-between gap-3">

          {/* Left: name + location */}
          <div className="flex-1 min-w-0">
            <h3
              className="text-[13px] font-bold text-white truncate leading-tight"
              style={{ textShadow: '0 1px 5px rgba(0,0,0,0.55)' }}
              title={course.name}
            >
              {course.name}
            </h3>
            {!hideLocation && (
              <p
                className="text-[10px] truncate mt-0.5"
                style={{ color: 'rgba(255,255,255,0.68)', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
              >
                {course.locationText}
              </p>
            )}
            {/* Logged date if present */}
            {loggedDate && (
              <div className="inline-block text-[9px] font-medium text-white/60 mt-0.5">
                Logged: {format(new Date(loggedDate), 'd MMM yyyy')}
              </div>
            )}
            {/* Friends context */}
            {showFriendsContext && course.context?.friendsPlayedCount != null && (
              <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {course.context.friendsPlayedCount > 0
                  ? `${course.context.friendsPlayedCount} friend${course.context.friendsPlayedCount === 1 ? '' : 's'} played`
                  : 'No friends played yet'}
              </p>
            )}
          </div>

          {/* Right: community rating pill — only when data exists */}
          {showRating && course.communityRating != null && (
            <div className="glass-badge-tight [--badge-w:auto]">
              <img
                src="/assets/logomark-orange.png"
                alt=""
                className="w-4 h-4 object-contain"
                aria-hidden="true"
              />
              <span className="text-white">
                {course.communityRating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Hairline separator — replaces the grey spacer block */}
      <div style={{ height: '0.5px', background: 'rgba(0,0,0,0.08)' }} />
    </button>
  );
};

export default UnifiedCourseCard;
