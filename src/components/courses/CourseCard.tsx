import React, { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOpenCourseModal } from '@/hooks/useOpenCourseModal';
import { useParallax } from '@/hooks/useParallax';
import CourseRankBadges from './CourseRankBadges';
import CourseCardBackground from './CourseCardBackground';
import { extractRanksFromMemberships } from '@/utils/rankingUtils';
import CourseCardAIQuote from './CourseCardAIQuote';
import CourseCardLocation from './CourseCardLocation';
import { useMemoryMonitor } from '@/hooks/useMemoryMonitor';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import CountryFlag from '@/components/ui/country-flag';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Course {
  id: string;
  name: string;
  country: string;
  region?: string;
  sub_country?: string;
  continent?: string;
  global_rank?: number | null;
  regional_rank?: number | null;
  usa_rank?: number | null;
  description?: string;
  thumbnail_image?: string;
  latitude?: number | null;
  longitude?: number | null;
  website_url?: string | null;
  average_rating?: number | null;
}

interface CourseCardProps {
  course: Course;
  viewContext?: 'global' | 'regional' | 'usa' | 'europe';
  viewingUserId?: string;
  userRating?: number | null;
  isReadOnly?: boolean;
  showUserRating?: boolean;
  showAverageRating?: boolean;
  isFromUserCoursesPage?: boolean;
  xp?: number;
  showXP?: boolean;
  customHeight?: string;
  hideRankingBadges?: boolean;
  showCountryWithFlag?: boolean;
  showAIQuote?: boolean;
  disableClick?: boolean;
  mobileTextScale?: 'small' | 'normal';
  mobileFlagSize?: 'sm' | 'md' | 'lg';
  showRatingOnRight?: boolean;
  currentUserId?: string;
  profileOwnerFirstName?: string;
  badgesOnTop?: boolean;
  
  // New context-aware props for unified card design
  contextTag?: string;
  secondaryText?: string;
  showRankBadge?: boolean;
  friendsMeta?: {
    count: number;
    avatars: Array<{
      id: string;
      initials: string;
      profile_photo_url?: string | null;
    }>;
  };
  onClick?: () => void;
}


const CourseCard: React.FC<CourseCardProps> = ({ 
  course, 
  viewContext = 'global', 
  viewingUserId,
  userRating,
  isReadOnly = false,
  showUserRating = false,
  showAverageRating = false,
  isFromUserCoursesPage = false,
  xp,
  showXP = false,
  customHeight = "h-64",
  hideRankingBadges = false,
  showCountryWithFlag = false,
  showAIQuote = false,
  disableClick = false,
  mobileTextScale = 'normal',
  mobileFlagSize = 'lg',
  showRatingOnRight = false,
  currentUserId,
  profileOwnerFirstName,
  badgesOnTop = false,
  contextTag,
  secondaryText,
  showRankBadge,
  friendsMeta,
  onClick
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const openCourseModal = useOpenCourseModal();
  const { ref: parallaxRef, offset: parallaxOffset } = useParallax(18);
  
  // Memory monitoring for this component
  useMemoryMonitor('CourseCard', import.meta.env.DEV);

  // Check if we're on a profile page to determine modal vs direct navigation
  const isProfilePage = location.pathname.includes('/profile');

  const handleCardClick = useCallback(() => {
    // Call custom onClick handler if provided (for scroll position tracking, etc.)
    if (onClick) {
      onClick();
    }
    
    if (!disableClick) {
      if (isProfilePage) {
        // On profile pages, open in modal
        const source = isFromUserCoursesPage ? 'user-courses' : 'profile-courses';
        openCourseModal(course.id, source);
      } else {
        // On other pages, navigate directly
        navigate(`/courses/${course.id}`);
      }
    }
  }, [onClick, disableClick, navigate, course.id, isProfilePage, openCourseModal, isFromUserCoursesPage]);

  // Compact list card mode (for Explore, Top 100, Friends' Courses)
  const isCompactMode = contextTag !== undefined || friendsMeta !== undefined;
  
  if (isCompactMode) {
    return (
      <div
        className="rounded-sq-md border border-border/70 bg-card/80 hover:bg-card transition-all duration-motion-medium ease-standard shadow-sm hover:shadow-[var(--shadow-medium)] hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary-accent)] p-4 space-y-3 cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col space-y-1 min-w-0 flex-1">
            <div className="text-heading-md font-semibold leading-snug truncate">
              {course.name}
            </div>
            <div className="text-body-sm text-muted-foreground truncate">
              {course.sub_country || course.country || 'Location unknown'}
            </div>
            {secondaryText && (
              <div className="text-body-sm text-muted-foreground/80 mt-1">
                {secondaryText}
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            {contextTag && (
              <span className="inline-flex items-center rounded-full bg-muted/40 px-2 py-0.5 text-meta font-medium text-muted-foreground whitespace-nowrap">
                {contextTag}
              </span>
            )}
          </div>
        </div>

        {/* Bottom row: friends avatars */}
        {friendsMeta && friendsMeta.count > 0 && (
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex -space-x-2">
              {friendsMeta.avatars.slice(0, 3).map((friend) => (
                <Avatar
                  key={friend.id}
                  className="h-6 w-6 border border-background pointer-events-none"
                >
                  {friend.profile_photo_url ? (
                    <AvatarImage src={friend.profile_photo_url} alt={friend.initials} />
                  ) : (
                    <AvatarFallback className="text-meta">
                      {friend.initials}
                    </AvatarFallback>
                  )}
                </Avatar>
              ))}
              {friendsMeta.count > 3 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-muted/80 text-meta text-muted-foreground pointer-events-none">
                  +{friendsMeta.count - 3}
                </div>
              )}
            </div>
            <div className="text-meta text-muted-foreground">
              Played by {friendsMeta.count} friend{friendsMeta.count !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Original complex card rendering

  return (
    <>
      <div 
        className={`group transition-all duration-200 ${disableClick ? 'cursor-default' : 'cursor-pointer'} overflow-hidden relative aspect-[1.77/1] rounded-none shadow-none sm:rounded-sq-md sm:shadow-md md:shadow-lg border border-border/60 sm:border-border/40 animate-fadeIn`}
        onClick={handleCardClick}
      >
        <div
          ref={parallaxRef}
          className="absolute inset-0 will-change-transform"
          style={{
            transform: `translateY(${parallaxOffset}px)`,
            transition: 'transform 120ms ease-out',
          }}
        >
          <CourseCardBackground 
            thumbnailImage={course.thumbnail_image}
            courseName={course.name}
            disableLazyLoading={isFromUserCoursesPage}
          />
        </div>

        {/* Enhanced bottom gradient for better text readability */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none z-0" />

        {/* Frosted glass ranking badges */}
        {!hideRankingBadges && !badgesOnTop && (
          <CourseRankBadges 
            globalRank={course.global_rank ?? null}
            regionalRank={course.regional_rank ?? null}
            usaRank={course.usa_rank ?? null}
            country={course.country}
            viewContext={viewContext}
            userRating={userRating}
            showUserRating={showUserRating}
            averageRating={course.average_rating}
            showAverageRating={showAverageRating}
            positioning={showRatingOnRight ? 'top-right' : 'top-left'}
            xp={xp}
            showXP={showXP}
            splitBadges={showRatingOnRight}
          />
        )}

        {/* User rating, average rating, and XP badges - separate from rankings */}
        {(showUserRating || showAverageRating || showXP) && (
          <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5">
            {showXP && xp && (
              <div className="bg-white/16 backdrop-blur-[18px] border border-white/45 text-white shadow-[0_0_12px_rgba(0,0,0,0.35)] text-meta font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                {xp} XP
              </div>
            )}
            {showUserRating && userRating && (
              <div className="bg-white/16 backdrop-blur-[18px] border border-white/45 text-white shadow-[0_0_12px_rgba(0,0,0,0.35)] text-meta font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                Your: {userRating}
              </div>
            )}
            {showAverageRating && course.average_rating && (
              <div className="bg-white/16 backdrop-blur-[18px] border border-white/45 text-white shadow-[0_0_12px_rgba(0,0,0,0.35)] text-meta font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                Avg: {course.average_rating}
              </div>
            )}
          </div>
        )}

        {/* Course Information Overlay */}
        <div className={badgesOnTop ? 
          "absolute bottom-0 left-0 right-0 p-4 z-10" : 
          "absolute bottom-0 left-0 right-0 p-4"
        }>
          {/* XP earned - show above course name for recently played cards */}
          {showXP && xp && !badgesOnTop && (
            <div className={`${mobileTextScale === 'small' ? 'text-base md:text-lg' : 'text-lg md:text-xl'} text-white/90 leading-tight mb-1 drop-shadow-lg`}>
              {xp} XP
            </div>
          )}
          
          {/* Course Name - positioned at bottom when badgesOnTop is true */}
          <h3 
            className={`${mobileTextScale === 'small' ? 'text-lg md:text-xl' : 'text-xl md:text-2xl'} text-white leading-tight ${showRatingOnRight ? 'mb-0' : 'mb-0'} drop-shadow-lg transform-gpu ${showXP && !badgesOnTop ? (isFromUserCoursesPage ? 'max-h-[3.5rem] overflow-hidden break-words cursor-pointer' : 'line-clamp-2 cursor-pointer') : ''} ${!hideRankingBadges && !badgesOnTop ? 'mt-[20px]' : ''}`}
            title={showXP && !badgesOnTop ? course.name : undefined}
          >
            {course.name}
          </h3>
          
          {/* Content below course name - hide when badgesOnTop to keep title at bottom edge */}
          {!badgesOnTop && (
            <>
              {/* AI Quote or Location or Ranking Badges */}
              {showAIQuote ? (
                <CourseCardAIQuote 
                  courseName={course.name}
                  country={course.country}
                  enabled={showAIQuote}
                  mobileTextScale={mobileTextScale}
                />
              ) : showRatingOnRight ? (
                // Show average rating for Top 10 Rated cards
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {/* Average rating badge */}
                    {course.average_rating && (
                      <div className="bg-muted border-border text-foreground text-meta font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                        Avg: {course.average_rating}
                      </div>
                    )}
                  </div>
                  {/* User Rating in liquid glass container */}
                  {userRating && showUserRating && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div 
                            className="relative flex items-center justify-between badge-standard-width h-8 md:h-9 px-2.5 py-1.5 rounded-none shadow-lg shadow-black/20 overflow-hidden backdrop-blur-md border border-white/20" 
                            style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="relative z-10 flex items-center justify-between w-full">
                              <span className="text-sm font-bold text-white">{userRating}</span>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {currentUserId === viewingUserId ? 'Your rating' : `${profileOwnerFirstName || 'User'}'s rating`}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
               </div>
              ) : (
                showCountryWithFlag && (
                  <CourseCardLocation 
                    course={course}
                    mobileTextScale={mobileTextScale}
                    mobileFlagSize={mobileFlagSize}
                  />
                )
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default React.memo(CourseCard);
