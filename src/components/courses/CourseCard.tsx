import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CourseRankBadges from './CourseRankBadges';
import CourseCardBackground from './CourseCardBackground';
import CourseCardAIQuote from './CourseCardAIQuote';
import CourseCardLocation from './CourseCardLocation';
import { useMemoryMonitor } from '@/hooks/useMemoryMonitor';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

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
  badgesOnTop = false
}) => {
  const navigate = useNavigate();
  
  // Memory monitoring for this component
  useMemoryMonitor('CourseCard', process.env.NODE_ENV === 'development');

  const handleCardClick = useCallback(() => {
    if (!disableClick) {
      navigate(`/courses/${course.id}`);
    }
  }, [disableClick, navigate, course.id]);

  return (
    <>
      <div 
        className={`group hover:shadow-lg transition-all duration-200 ${disableClick ? 'cursor-default' : 'cursor-pointer'} overflow-hidden relative ${customHeight}`}
        style={{ borderRadius: '8px' }}
        onClick={handleCardClick}
      >
        <CourseCardBackground 
          thumbnailImage={course.thumbnail_image}
          courseName={course.name}
        />

        {/* Enhanced bottom gradient for better text readability when badges are on top */}
        {badgesOnTop && (
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 via-black/5 to-transparent pointer-events-none z-0" />
        )}

        {/* Course ranking badges - new split layout for badgesOnTop */}
        {badgesOnTop ? (
          <CourseRankBadges
            globalRank={course.global_rank}
            regionalRank={course.regional_rank}
            usaRank={course.usa_rank}
            country={course.country}
            viewContext={viewContext}
            userRating={userRating}
            showUserRating={showUserRating}
            averageRating={course.average_rating}
            showAverageRating={showAverageRating}
            splitBadges={true}
            xp={xp}
            showXP={showXP}
          />
        ) : (
          /* Original badge layout */
          !hideRankingBadges && !showRatingOnRight && (
            <CourseRankBadges
              globalRank={course.global_rank}
              regionalRank={course.regional_rank}
              usaRank={course.usa_rank}
              country={course.country}
              viewContext={viewContext}
              userRating={userRating}
              showUserRating={showUserRating}
              averageRating={course.average_rating}
              showAverageRating={showAverageRating}
              positioning="top-left"
              xp={xp}
              showXP={showXP}
            />
          )
        )}

        {/* Course Information Overlay */}
        <div className={badgesOnTop ? 
          "absolute bottom-0 left-0 right-0 p-4 z-10" : 
          "absolute bottom-0 left-0 right-0 p-4"
        }>
          {/* XP earned - show above course name for recently played cards */}
          {showXP && xp && !badgesOnTop && (
            <div className={`${mobileTextScale === 'small' ? 'text-lg md:text-2xl' : 'text-2xl'} text-white/90 leading-tight mb-1 drop-shadow-lg`}>
              {xp} XP
            </div>
          )}
          
          {/* Course Name - positioned at bottom when badgesOnTop is true */}
          <h3 
            className={`${mobileTextScale === 'small' ? 'text-xl md:text-3xl' : 'text-3xl'} text-white leading-tight ${showRatingOnRight ? 'mb-0' : 'mb-0'} drop-shadow-lg ${showXP && !badgesOnTop ? 'line-clamp-2 cursor-pointer' : ''}`}
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
                // Show ranking badges and average rating for Top 10 Rated cards
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                   <CourseRankBadges
                     globalRank={course.global_rank}
                     regionalRank={course.regional_rank}
                     usaRank={course.usa_rank}
                     country={course.country}
                     positioning="bottom-left"
                     showUserRating={false}
                     averageRating={course.average_rating}
                     showAverageRating={true}
                     showXP={false}
                   />
                 </div>
                  {/* User Rating in liquid glass container */}
                  {userRating && showUserRating && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span 
                            className="badge-compact shadow-lg shadow-black/20"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="truncate">{userRating}/10</span>
                          </span>
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
