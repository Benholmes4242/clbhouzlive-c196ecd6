import React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { CourseCardModel } from '@/types/courseCard';
import { CourseCommunityRating } from './CourseCommunityRating';
import { FlagChip } from './FlagChip';
import { YourStatsChip } from './YourStatsChip';
import { useUserStatsRoundsForCourse } from '@/contexts/UserStatsCoursesContext';
import { formatDayMonthYearShortGB } from '@/i18n/format';
import { getOptimizedImageUrl, generateImageSrcSet } from '@/utils/enhancedImageOptimization';
import { SCRIM_STANDOUT } from '@/styles/photoScrim';

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

// Image aspect ratio - slightly taller than 16:9
const IMAGE_ASPECT = 'aspect-[16/9.5]';

interface UnifiedCourseCardProps {
  course: CourseCardModel;
  variant?: 'vertical' | 'horizontal';
  showRankBadges?: boolean;
  showRating?: boolean;
  showGhostRank?: boolean;
  showFriendsContext?: boolean;
  showLastPlayed?: boolean;
  hideLocation?: boolean;
  loggedDate?: string | Date | null;
  contextTag?: string;
  activeListSlug?: string | null;
  /** Glass stat capsule rendered top-right of the image (stat browse). */
  statChip?: { value: string; unit: string } | null;
  /** Small sample line under the location line, with optional early-data flag. */
  statLine?: { text: string; earlyData?: boolean } | null;
  /**
   * Viewer's relationship to this course, rendered as a small pill inside the
   * rank capsule. 'rated' outranks 'played' — a rating implies a visit.
   */
  viewerStatus?: 'rated' | 'played' | null;
  onClick?: () => void;
  className?: string;
}


/**
 * Determine the regional badge slug based on available data
 */
export function getRegionalBadgeSlug(course: CourseCardModel): 'usa' | 'gb-i' | 'europe' | null {
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

const UnifiedCourseCardImpl: React.FC<UnifiedCourseCardProps> = ({
  course,
  variant = 'vertical',
  showRankBadges = true,
  showRating = true,
  showGhostRank = false,
  showFriendsContext = false,
  showLastPlayed = false,
  hideLocation = false,
  loggedDate,
  contextTag,
  activeListSlug = null,
  statChip = null,
  statLine = null,
  viewerStatus = null,


  onClick,
  className = '',
}) => {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const yourStatsRounds = useUserStatsRoundsForCourse(course.id);


  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/courses/${course.id}`);
    }
  };

  const regionalRank = course.ranks?.usa ?? course.ranks?.regional ?? null;
  const regionalBadgeSlug = getRegionalBadgeSlug(course);

  // ============ HORIZONTAL VARIANT ============
  if (variant === 'horizontal') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`group w-full rounded-sq-sm overflow-hidden text-left active:scale-[0.99] transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 ${className}`}
        style={{ background: '#1B1E27', border: '1px solid rgba(255,255,255,0.10)' }}
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
              <div className="w-20 h-20" style={{ background: 'rgba(255,255,255,0.06)' }} />
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
                <span className="text-[11px] text-muted-foreground">
                  {formatDayMonthYearShortGB(course.context.lastPlayedAt)}
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
            src={getOptimizedImageUrl(course.imageUrl, { width: 640 })}
            srcSet={generateImageSrcSet(course.imageUrl, [
              { width: 400 },
              { width: 640 },
              { width: 800 },
            ])}
            sizes="(min-width: 1024px) 340px, (min-width: 768px) 384px, 100vw"
            alt={course.name}
            loading="lazy"
            decoding="async"
            width={640}
            height={380}
            className="w-full h-full object-cover transition-transform duration-500 group-active:scale-[1.02]"
            onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
          />
        ) : (
          <div className="w-full h-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
        )}

        {/* Gradient scrim — strong at bottom for text legibility */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: SCRIM_STANDOUT,
          }}
        />

        {/* Ghost rank number — Top 100. Prefers displayRank (list position) when provided, falls back to global editorial rank. */}
        {(() => {
          const ghostValue = course.displayRank ?? course.ranks?.global;
          if (!showGhostRank || !ghostValue) return null;
          return (
            <div
              style={{
                position: 'absolute',
                bottom: -4,
                left: 10,
                lineHeight: 1,
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            >
              <span
                style={{
                  fontSize: 84,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.16)',
                  letterSpacing: '-0.04em',
                  filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.45)) drop-shadow(0 1px 3px rgba(0,0,0,0.30))',
                }}
              >
                {ghostValue}
              </span>
            </div>
          );
        })()}

        {/* Combined rank pill — single horizontal capsule with internal divider */}
        {/* Capsule renders on status alone: most non-Top-100 courses are unranked. */}
        {showRankBadges && (course.ranks?.global || regionalRank || viewerStatus) && (

          <div className="absolute top-3 left-3">
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                 background: 'rgba(0,0,0,0.62)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '0.5px solid rgba(255,255,255,0.12)',
                padding: '5px 10px',
                borderRadius: 9999,
                fontSize: 11, fontWeight: 700, color: '#fff',
                letterSpacing: '-0.005em',
              }}
            >
              {(!activeListSlug || activeListSlug === 'global') && course.ranks?.global && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <FlagChip slug="global" size={10} />
                  <span>#{course.ranks.global}</span>
                </span>
              )}
              {!activeListSlug && course.ranks?.global && regionalRank && regionalBadgeSlug && (
                <span style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.20)' }} />
              )}
              {(!activeListSlug || activeListSlug === regionalBadgeSlug) && regionalRank && regionalBadgeSlug && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <FlagChip slug={regionalBadgeSlug} size={10} />
                  <span>#{regionalRank}</span>
                </span>
              )}
              {viewerStatus && (
                <>
                  {/* Divider collapses when the capsule holds the status alone. */}
                  {(((!activeListSlug || activeListSlug === 'global') && course.ranks?.global) ||
                    ((!activeListSlug || activeListSlug === regionalBadgeSlug) &&
                      regionalRank &&
                      regionalBadgeSlug)) && (
                    <span style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.20)' }} />
                  )}

                  <span
                    style={{
                      /* READ floor — RATED / PLAYED are words, not ticks.
                         8.5 -> 11 inside the absolutely-positioned overlay
                         capsule, so no card height moves with it. */
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.10em',
                      textTransform: 'uppercase',
                      color: viewerStatus === 'rated' ? '#F7931E' : 'rgba(255,255,255,0.82)',
                    }}
                  >
                    {viewerStatus === 'rated' ? t('card.rated') : t('card.played')}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Stat browse chip — top-right glass capsule (value over unit) */}
        {statChip && (
          <div
            className="absolute top-3 right-3 text-right"
            style={{
              background: 'rgba(12,18,14,0.58)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 9999,
              padding: '5px 11px',
              lineHeight: 1.05,
            }}
          >
            <div
              style={{
                fontSize: 17, fontWeight: 700, color: '#fff',
                fontVariantNumeric: 'tabular-nums lining-nums',
                letterSpacing: '-0.015em',
              }}
            >
              {statChip.value}
            </div>
            <div
              style={{
                /* READ floor — the chip's unit names the figure. 9 -> 11. */
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.10em', color: 'rgba(255,255,255,0.75)',
              }}
            >
              {statChip.unit}
            </div>
          </div>
        )}

        {/* Context tag — top-right */}
        {contextTag && (
          <div className="absolute top-3 right-3">
            <span className="text-[11px] font-medium bg-black/60 text-white px-2 py-1 rounded-sq-xs backdrop-blur-sm">
              {contextTag}
            </span>
          </div>
        )}


        {/* Bottom row — name/location left, rating right — all inside image */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5 pt-2 flex items-end justify-between gap-3">

          {/* Left: name + location */}
          <div className="flex-1 min-w-0">
            {/* Phase E: "Your stats {DOT} N" chip — sits above the course name,
                deep-links to the Analytics (holes) tab. stopPropagation so the
                card's own onClick to /courses/:id (About) does not win. */}
            {yourStatsRounds != null && (
              <div style={{ marginBottom: 6 }}>
                <YourStatsChip
                  count={yourStatsRounds}
                  tone="dark"
                  ariaLabel={`View your analytics for ${course.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/courses/${course.id}?tab=holes`);
                  }}
                />
              </div>
            )}
            <h3
              className="text-[15px] font-bold text-white truncate leading-tight"
              style={{ textShadow: '0 1px 5px rgba(0,0,0,0.55)' }}
              title={course.name}
            >
              {course.name}
            </h3>
            {!hideLocation && (
              <p
                className="text-[11.5px] truncate mt-0.5"
                style={{ color: 'rgba(255,255,255,0.68)', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
              >
                {course.locationText}
              </p>
            )}
            {/* Sample line — how much data sits behind the ranking */}
            {statLine && (
              <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                <span
                  className="text-[11.5px] truncate"
                  style={{ color: 'rgba(255,255,255,0.82)', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
                >
                  {statLine.text}
                </span>
                {statLine.earlyData && (
                  <span
                    className="flex-shrink-0"
                    style={{
                      /* READ floor — the "Early data" chip. 9 -> 11. */
                      fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.10em', borderRadius: 9999,
                      padding: '2px 6px',
                      background: 'rgba(255,255,255,0.2)',
                      color: 'rgba(255,255,255,0.9)',
                    }}
                  >
                    {t('statBrowse.earlyData')}
                  </span>
                )}
              </div>
            )}

            {/* Logged date if present */}
            {loggedDate && (
              <div className="inline-block text-[11px] font-medium text-white/60 mt-0.5">
                {t('card.logged', { date: formatDayMonthYearShortGB(loggedDate) })}
              </div>
            )}
            {/* Friends context */}
            {showFriendsContext && course.context?.friendsPlayedCount != null && (
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {course.context.friendsPlayedCount > 0
                  ? t('card.friendsPlayedCount', { count: course.context.friendsPlayedCount })
                  : t('card.noFriendsPlayed')}
              </p>
            )}
          </div>

          {/* Right: community rating pill — Clbhouz logomark + score */}
          {showRating && course.communityRating != null && (
            <div
              className="flex items-center flex-shrink-0 gap-1.5"
              style={{
                background: 'rgba(12,18,14,0.58)',
                border: '1px solid rgba(255,255,255,0.18)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderRadius: 9999,
                padding: '5px 11px',
              }}
            >
              <img
                src="/assets/logomark-orange.png"
                alt=""
                aria-hidden="true"
                style={{ width: 12, height: 12, objectFit: 'contain', display: 'block' }}
              />
              <span
                style={{
                  fontSize: 15, fontWeight: 700, color: '#fff',
                  lineHeight: 1, letterSpacing: '-0.015em',
                  fontVariantNumeric: 'tabular-nums lining-nums',
                }}
              >
                {course.communityRating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

export const UnifiedCourseCard = React.memo(UnifiedCourseCardImpl);

export default UnifiedCourseCard;
