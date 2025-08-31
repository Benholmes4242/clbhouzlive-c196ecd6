import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useTop100CoursesData } from '@/hooks/useTop100CoursesData.tsx';
import { useProgressMotivation } from '@/hooks/useProgressMotivation';
import CountryFlag from '@/components/ui/country-flag';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import CourseCard from '@/components/courses/CourseCard';
import CourseListItem from '@/components/courses/CourseListItem';
import { EmptyTop100State } from '@/components/courses/user/UserCoursesEmptyStates';
import CoursesControls from '@/components/profile/CoursesControls';
import { useViewPreference } from '@/hooks/useViewPreference';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import RegionalCoursesModal from './RegionalCoursesModal';
import { useDragScroll } from '@/hooks/useDragScroll';
import { useSyncRatedHeightVar } from '@/hooks/useSyncRatedHeightVar';
import { usePlayedCoursesWithRatings } from '@/hooks/usePlayedCoursesWithRatings';


interface CoursesJourneyProps {
  className?: string;
  userId?: string;
  userDisplayName?: string;
  isOwnProfile?: boolean;
}


const CoursesJourney: React.FC<CoursesJourneyProps> = ({ 
  className = '', 
  userId = '', 
  userDisplayName = 'User',
  isOwnProfile = false 
}) => {
  const { regionProgress, isLoading } = useTop100CoursesData(userId || '', isOwnProfile);
  const { generateMotivation } = useProgressMotivation(userId, userDisplayName, isOwnProfile);
  const [motivationalMessages, setMotivationalMessages] = useState<{[key: string]: string}>({});

  // Sync the rated card height to CSS variable
  useSyncRatedHeightVar();

  // Define the four regional achievements in order: Worldwide → USA → Great Britain & Ireland → Continental Europe
  const achievementRings = [
    {
      id: 'legends-club',
      title: 'Worldwide',
      subtitle: 'Top 100 Worldwide Courses',
      region: 'global',
      color: '#DAA520', // Rustic goldenrod for worldwide
      colorLight: '#F5DEB3', // Wheat for remaining
      gradient: 'from-yellow-600 to-yellow-700'
    },
    {
      id: 'stars-stripes',
      title: 'USA',
      subtitle: 'Top 100 USA Courses',
      region: 'usa',
      color: '#B22222', // Rustic fire brick red for USA
      colorLight: '#F5C6C6', // Light rustic red for remaining
      gradient: 'from-red-600 to-red-800'
    },
    {
      id: 'links-legend',
      title: 'Great Britain & Ireland',
      subtitle: 'Top 100 Great Britain & Ireland Courses',
      region: 'britain-ireland',
      color: '#228B22', // Masters Augusta forest green for Britain & Ireland
      colorLight: '#D4E5D4', // Light forest green for remaining
      gradient: 'from-green-600 to-green-800'
    },
    {
      id: 'continental-swinger',
      title: 'Continental Europe',
      subtitle: 'Top 100 Continental Europe Courses',
      region: 'europe',
      color: '#4682B4', // Rustic steel blue for Continental Europe
      colorLight: '#E1EBEF', // Light steel blue for remaining
      gradient: 'from-blue-600 to-blue-800'
    }
  ];

  const getProgressData = (region: string) => {
    const data = regionProgress[region] || { played: 0, total: 100 };
    const percentage = data.total > 0 ? (data.played / data.total) * 100 : 0;
    const remaining = Math.max(0, data.total - data.played);
    
    return {
      played: data.played,
      total: data.total,
      percentage: Math.min(percentage, 100),
      remaining
    };
  };

  // Generate motivational messages for all regions
  useEffect(() => {
    const generateAllMotivations = async () => {
      const regions = ['global', 'usa', 'britain-ireland', 'europe'];
      const messages: {[key: string]: string} = {};
      
      for (const region of regions) {
        const progress = getProgressData(region);
        if (progress.total > 0) {
          try {
            const message = await generateMotivation(region, progress.played, progress.total);
            messages[region] = message;
          } catch (error) {
            console.error(`Error generating motivation for ${region}:`, error);
          }
        }
      }
      
      setMotivationalMessages(messages);
    };

    if (regionProgress && Object.keys(regionProgress).length > 0) {
      generateAllMotivations();
    }
  }, [regionProgress, generateMotivation]);

  return (
    <div className={`w-full pt-8 ${className}`}>
      <div className="md:max-w-[1150px] md:mx-auto">
        {/* Course highlights section removed */}

        {/* Controls Section moved - now appears above depth stack carousel */}

        {/* Progress Rings Section */}
        <div className="relative">
          {/* Desktop: Single row */}
          <div className="hidden md:flex gap-8 justify-center px-4">{/* Reduced gap and added padding */}
            {achievementRings.map((achievement, index) => {
              const progress = getProgressData(achievement.region);
              const animationDelay = index * 0.2;
              const completedAngle = (progress.percentage / 100) * 283; // 283 is circumference for strokeDasharray
              const remainingAngle = 283 - completedAngle;
              
              return (
                  <div key={achievement.id} className="flex flex-col items-center cursor-pointer group">
                    <div className="w-52 h-52 relative transition-all duration-300">{/* Increased from w-44 h-44 to w-52 h-52 */}
                    {/* Progress Ring with Full Circle */}
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                      {/* Gradient Definitions */}
                      <defs>
                        <linearGradient id={`gradient-${achievement.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={achievement.color} stopOpacity="0.9" />
                          <stop offset="100%" stopColor={achievement.color} stopOpacity="0.7" />
                        </linearGradient>
                        <linearGradient id={`bg-gradient-${achievement.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={achievement.color} stopOpacity="0.08" />
                          <stop offset="100%" stopColor={achievement.color} stopOpacity="0.04" />
                        </linearGradient>
                      </defs>
                      
                      
                      {/* Remaining portion (full ring) */}
                      <circle
                        cx="60"
                        cy="60"
                        r="45"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="6"
                        strokeLinecap="round"
                      />
                      
                      {/* Completed portion with animated sweep */}
                      <circle
                        cx="60"
                        cy="60"
                        r="45"
                        fill="none"
                        stroke={achievement.color}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray="283"
                        strokeDashoffset={283 - completedAngle}
                        className="transition-all duration-1000 ease-out"
                        style={{
                          filter: `drop-shadow(0 0 15px ${achievement.color}50)`,
                          animationDelay: `${animationDelay}s`
                        }}
                      />
                    </svg>
                    
                    {/* Center content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      {achievement.region === 'usa' ? (
                        <div className="relative w-36 h-36 rounded-full overflow-hidden flex flex-col items-center justify-center">
                          {/* USA Map Background */}
                          <img
                            src="/lovable-uploads/6152bbaa-1d05-4eab-bbde-08d43b96a693.png"
                            alt="USA map background"
                            className="absolute inset-0 w-full h-full object-contain opacity-20"
                          />
                          {/* Overlay content */}
                          <div className="relative z-10 text-center">
                             <div className="text-3xl text-black leading-none">
                               <span>{progress.played}</span>
                               <span className="text-black/60"> / {progress.total}</span>
                             </div>
                              <div className="text-2xl text-black mt-1">
                                {progress.played * 120} XP
                              </div>
                          </div>
                        </div>
                      ) : achievement.region === 'europe' ? (
                        <div className="relative w-36 h-36 rounded-full overflow-hidden flex flex-col items-center justify-center">
                          {/* Continental Europe Map Background */}
                          <img
                            src="/lovable-uploads/793041de-0d8b-4c78-8256-3447ad57dc44.png"
                            alt="Continental Europe map background"
                            className="absolute inset-0 w-full h-full object-contain opacity-20"
                          />
                          {/* Overlay content */}
                          <div className="relative z-10 text-center">
                             <div className="text-3xl text-black leading-none">
                               <span>{progress.played}</span>
                               <span className="text-black/60"> / {progress.total}</span>
                             </div>
                              <div className="text-2xl text-black mt-1">
                                {progress.played * 120} XP
                              </div>
                          </div>
                        </div>
                      ) : achievement.region === 'britain-ireland' ? (
                        <div className="relative w-44 h-44 rounded-full overflow-hidden flex flex-col items-center justify-center">
                          {/* UK & Ireland Map Background */}
                          <img
                            src="/lovable-uploads/dc0f671b-b75f-4121-8ebd-18dd7f9b67c3.png"
                            alt="UK & Ireland map background"
                            className="absolute inset-0 w-full h-full object-contain opacity-20"
                          />
                          {/* Overlay content */}
                          <div className="relative z-10 text-center">
                             <div className="text-3xl text-black leading-none">
                               <span>{progress.played}</span>
                               <span className="text-black/60"> / {progress.total}</span>
                             </div>
                              <div className="text-2xl text-black mt-1">
                                {progress.played * 120} XP
                              </div>
                          </div>
                        </div>
                      ) : achievement.region === 'global' ? (
                        <div className="relative w-36 h-36 rounded-full overflow-hidden flex flex-col items-center justify-center">
                          {/* World Map Background */}
                          <img
                            src="/lovable-uploads/c0ba76eb-90e6-404b-8df7-f9f34a43b606.png"
                            alt="World map background"
                            className="absolute inset-0 w-full h-full object-contain opacity-20"
                          />
                          {/* Overlay content */}
                          <div className="relative z-10 text-center">
                             <div className="text-3xl text-black leading-none">
                               <span>{progress.played}</span>
                               <span className="text-black/60"> / {progress.total}</span>
                             </div>
                              <div className="text-2xl text-black mt-1">
                                {progress.played * 120} XP
                              </div>
                          </div>
                        </div>
                      ) : (
                        <>
                           <div className="text-3xl text-black leading-none">
                             <span>{progress.played}</span>
                             <span className="text-black/60"> / {progress.total}</span>
                           </div>
                            <div className="text-2xl text-black mt-1">
                              {progress.played * 120} XP
                            </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                   {/* Achievement info below ring - desktop size */}
                   <div className="mt-0.5 text-center max-w-[200px]">
                     <div className="text-xl text-foreground">
                       {achievement.title === 'Great Britain & Ireland' ? (
                         <>
                           <div>Great Britain</div>
                           <div>& Ireland</div>
                         </>
                       ) : (
                         achievement.title
                       )}
                     </div>
                   </div>
                </div>
              );
            })}
          </div>

          {/* Mobile: Grid layout - single row */}
          <div className="md:hidden">
            <div className="grid grid-cols-4 gap-0.5 px-2">
              {achievementRings.map((achievement, index) => {
                const progress = getProgressData(achievement.region);
                const animationDelay = index * 0.15;
                const completedAngle = (progress.percentage / 100) * 283;
                
                return (
                  <div 
                    key={achievement.id} 
                    className="flex flex-col items-center cursor-pointer"
                  >
                    <div className="w-28 h-28 relative transition-all duration-300">{/* Increased from w-24 h-24 to w-28 h-28 */}
                      {/* Progress Ring with Full Circle */}
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                        {/* Gradient Definitions */}
                        <defs>
                          <linearGradient id={`mobile-gradient-${achievement.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={achievement.color} stopOpacity="0.9" />
                            <stop offset="100%" stopColor={achievement.color} stopOpacity="0.7" />
                          </linearGradient>
                          <linearGradient id={`mobile-bg-gradient-${achievement.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={achievement.color} stopOpacity="0.08" />
                            <stop offset="100%" stopColor={achievement.color} stopOpacity="0.04" />
                          </linearGradient>
                        </defs>
                        
                        {/* Remaining portion (full ring) */}
                        <circle
                          cx="60"
                          cy="60"
                          r="45"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="6"
                          strokeLinecap="round"
                        />
                        
                        {/* Completed portion with animated sweep */}
                        <circle
                          cx="60"
                          cy="60"
                          r="45"
                          fill="none"
                          stroke={achievement.color}
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray="283"
                          strokeDashoffset={283 - completedAngle}
                          className="transition-all duration-1000 ease-out"
                          style={{
                            filter: `drop-shadow(0 0 10px ${achievement.color}50)`,
                            animationDelay: `${animationDelay}s`
                          }}
                        />
                      </svg>
                      
                      {/* Center content */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        {achievement.region === 'usa' ? (
                          <div className="relative w-20 h-20 rounded-full overflow-hidden flex flex-col items-center justify-center">
                            {/* USA Map Background */}
                            <img
                              src="/lovable-uploads/6152bbaa-1d05-4eab-bbde-08d43b96a693.png"
                              alt="USA map background"
                              className="absolute inset-0 w-full h-full object-contain opacity-25"
                            />
                            {/* Overlay content */}
                            <div className="relative z-10 text-center">
                               <div className="text-base text-black leading-none">
                                 <span>{progress.played}</span>
                                 <span className="text-black/60"> / {progress.total}</span>
                               </div>
                                <div className="text-sm text-black mt-0.5">
                                  {progress.played * 120} XP
                                </div>
                            </div>
                          </div>
                        ) : achievement.region === 'europe' ? (
                          <div className="relative w-20 h-20 rounded-full overflow-hidden flex flex-col items-center justify-center">
                            {/* Continental Europe Map Background */}
                            <img
                              src="/lovable-uploads/793041de-0d8b-4c78-8256-3447ad57dc44.png"
                              alt="Continental Europe map background"
                              className="absolute inset-0 w-full h-full object-contain opacity-25"
                            />
                            {/* Overlay content */}
                            <div className="relative z-10 text-center">
                               <div className="text-base text-black leading-none">
                                 <span>{progress.played}</span>
                                 <span className="text-black/60"> / {progress.total}</span>
                               </div>
                                <div className="text-sm text-black mt-0.5">
                                  {progress.played * 120} XP
                                </div>
                            </div>
                          </div>
                        ) : achievement.region === 'britain-ireland' ? (
                          <div className="relative w-24 h-24 rounded-full overflow-hidden flex flex-col items-center justify-center">
                            {/* UK & Ireland Map Background */}
                            <img
                              src="/lovable-uploads/dc0f671b-b75f-4121-8ebd-18dd7f9b67c3.png"
                              alt="UK & Ireland map background"
                              className="absolute inset-0 w-full h-full object-contain opacity-25"
                            />
                            {/* Overlay content */}
                            <div className="relative z-10 text-center">
                               <div className="text-base text-black leading-none">
                                 <span>{progress.played}</span>
                                 <span className="text-black/60"> / {progress.total}</span>
                               </div>
                                <div className="text-sm text-black mt-0.5">
                                  {progress.played * 120} XP
                                </div>
                            </div>
                          </div>
                        ) : achievement.region === 'global' ? (
                          <div className="relative w-20 h-20 rounded-full overflow-hidden flex flex-col items-center justify-center">
                            {/* World Map Background */}
                            <img
                              src="/lovable-uploads/c0ba76eb-90e6-404b-8df7-f9f34a43b606.png"
                              alt="World map background"
                              className="absolute inset-0 w-full h-full object-contain opacity-25"
                            />
                            {/* Overlay content */}
                            <div className="relative z-10 text-center">
                               <div className="text-base text-black leading-none">
                                 <span>{progress.played}</span>
                                 <span className="text-black/60"> / {progress.total}</span>
                               </div>
                                <div className="text-sm text-black mt-0.5">
                                  {progress.played * 120} XP
                                </div>
                            </div>
                          </div>
                        ) : (
                          <>
                             <div className="text-base text-black leading-none">
                               <span>{progress.played}</span>
                               <span className="text-black/60"> / {progress.total}</span>
                             </div>
                              <div className="text-sm text-black mt-0.5">
                                {progress.played * 120} XP
                              </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                     {/* Achievement info */}
                     <div className="mt-1 text-center">
                       <div className="text-base text-foreground leading-tight">
                         {achievement.title === 'Great Britain & Ireland' ? (
                           <>
                             <div>Great Britain</div>
                             <div>& Ireland</div>
                           </>
                         ) : (
                           achievement.title
                         )}
                       </div>
                     </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recently Played Section - Copy of Courses Played */}
      <RecentlyPlayedSection userId={userId} isOwnProfile={isOwnProfile} />

      {/* Top 10 Rated by You Section */}
      <TopRatedSection userId={userId} isOwnProfile={isOwnProfile} />

      {/* Highlight Reel Section */}
      <HighlightReelSection userId={userId} isOwnProfile={isOwnProfile} />


      {/* Courses by Region Section - 16px below Highlights */}
      <div className="mt-2"> {/* 8px spacing */}
        <CoursesbyRegionSection userId={userId} isOwnProfile={isOwnProfile} userDisplayName={userDisplayName} />
      </div>
    </div>
  );
};

// Recently Played Section Component - Exact copy of UserCoursesContent logic
interface RecentlyPlayedSectionProps {
  userId?: string;
  isOwnProfile?: boolean;
}

// Helper function to get the best ranking for sorting
const getCourseRanking = (course: any) => {
  if (course.regional_rank) return course.regional_rank;
  if (course.global_rank) return course.global_rank;
  return 9999;
};

// Regional sorting function - sorts by regional rank only (ascending order: #1, #2, #3...)
const getRegionalSortedCourses = (userCourses: any[]) => {
  return userCourses.sort((a, b) => {
    const aRegionalRank = a.golf_courses?.regional_rank || 9999;
    const bRegionalRank = b.golf_courses?.regional_rank || 9999;
    
    // Sort by regional rank ascending (lowest number first)
    return aRegionalRank - bRegionalRank;
  });
};

// Custom sorting function for user courses with different sort options
const getSortedUserCourses = (userCourses: any[], sortBy: string) => {
  
  const sortedCourses = userCourses.sort((a, b) => {
    switch (sortBy) {
      case 'rank-desc':
      case 'rating-high-low':
        // Sort by rating descending (10, 9, 8, ...)
        const aRating = a.rating;
        const bRating = b.rating;
        
        if (aRating !== null && aRating !== undefined && bRating !== null && bRating !== undefined) {
          return bRating - aRating;
        }
        if (aRating !== null && aRating !== undefined) return -1;
        if (bRating !== null && bRating !== undefined) return 1;
        
        // If neither has a rating, sort by official ranking
        const aRank = getCourseRanking(a.golf_courses);
        const bRank = getCourseRanking(b.golf_courses);
        return aRank - bRank;
        
      case 'rank-asc':
      case 'rating-low-high':
        // Sort by rating ascending (0.5, 1, 2, ...)
        const aRatingLow = a.rating;
        const bRatingLow = b.rating;
        
        if (aRatingLow !== null && aRatingLow !== undefined && bRatingLow !== null && bRatingLow !== undefined) {
          return aRatingLow - bRatingLow;
        }
        if (aRatingLow !== null && aRatingLow !== undefined) return -1;
        if (bRatingLow !== null && bRatingLow !== undefined) return 1;
        
        // If neither has a rating, sort by official ranking
        const aRankLow = getCourseRanking(a.golf_courses);
        const bRankLow = getCourseRanking(b.golf_courses);
        return aRankLow - bRankLow;
        
      case 'recent':
      case 'recently-played':
      default:
        // Sort by most recent date (played_date or created_at for ratings)
        const aDate = new Date(a.played_date || a.created_at || 0);
        const bDate = new Date(b.played_date || b.created_at || 0);
        return bDate.getTime() - aDate.getTime();
    }
  });
  
  
  return sortedCourses;
};

const RecentlyPlayedSection: React.FC<RecentlyPlayedSectionProps> = ({ 
  userId,
  isOwnProfile = false
}) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('recent'); // Default to recent for "Recently Played"
  const { viewType, setViewType, isHydrated } = useViewPreference();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const recentlyPlayedSwipeRef = useRef<HTMLDivElement>(null);
  
  // Track window width for responsive breakpoints
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Calculate cards per view based on exact breakpoints
  const getCardsPerView = () => {
    if (windowWidth >= 1200) return 4; // Desktop
    if (windowWidth >= 1024) return 3; // Laptop  
    if (windowWidth >= 768) return 2;  // Tablet
    return 1; // Mobile
  };
  
  const cardsPerView = getCardsPerView();

  // Query to get all played courses (from both tables) for filtering
  const { data: allPlayedCourses = [] } = useQuery({
    queryKey: ['recentlyPlayedCourses', userId],
    queryFn: async () => {
      if (!userId) return [];

      // Get courses from user_top100_courses table
      const { data: top100Data, error: top100Error } = await supabase
        .from('user_top100_courses')
        .select(`
          course_id,
          played_date,
          golf_courses (
            id,
            name,
            country,
            region,
            sub_country,
            continent,
            global_rank,
            regional_rank,
            usa_rank,
            description,
            thumbnail_image
          )
        `)
        .eq('user_id', userId)
        .eq('played', true);

      if (top100Error) throw top100Error;

      // Get courses from course_ratings table
      const { data: ratedData, error: ratedError } = await supabase
        .from('course_ratings')
        .select(`
          course_id,
          rating,
          created_at,
          golf_courses (
            id,
            name,
            country,
            region,
            sub_country,
            continent,
            global_rank,
            regional_rank,
            usa_rank,
            description,
            thumbnail_image
          )
        `)
        .eq('user_id', userId);

      if (ratedError) throw ratedError;

      // Combine and deduplicate, ensuring consistent structure
      const combinedCourses = [
        ...(top100Data || []).map(course => ({
          ...course,
          rating: null, // Add rating field for consistency
          id: `top100-${course.course_id}` // Unique ID for deduplication
        })),
        ...(ratedData || []).map(course => ({
          ...course,
          played_date: course.created_at, // Use rating date as played date
          id: `rating-${course.course_id}` // Unique ID for deduplication
        }))
      ];

      // Remove duplicates based on course_id, preferring rated courses over top100 courses
      const uniqueCoursesMap = new Map();
      
      combinedCourses.forEach(course => {
        const courseId = course.course_id;
        const existing = uniqueCoursesMap.get(courseId);
        
        if (!existing) {
          uniqueCoursesMap.set(courseId, course);
        } else {
          // Prefer courses with ratings over those without
          if (course.rating !== null && course.rating !== undefined && 
              (existing.rating === null || existing.rating === undefined)) {
            uniqueCoursesMap.set(courseId, course);
          }
        }
      });

      const rawCourses = Array.from(uniqueCoursesMap.values());
      
      // Apply sorting here to ensure proper order
      return getSortedUserCourses(rawCourses, 'recent');
    },
    enabled: !!userId,
  });

  // Filter and sort courses based on active filter and sort option
  const filteredCourses = useMemo(() => {
    let coursesToFilter = allPlayedCourses;
    
    // First apply regional filtering if active
    if (activeFilter) {
      coursesToFilter = coursesToFilter.filter((userCourse) => {
        const course = userCourse.golf_courses;
        if (!course) return false;

        switch (activeFilter) {
          case 'britain-ireland':
            return course.country === 'Britain & Ireland' && course.regional_rank && course.regional_rank <= 100;
          case 'europe':
            return course.country === 'Continental Europe' && course.regional_rank && course.regional_rank <= 100;
          case 'usa':
            return course.country === 'USA' && course.regional_rank && course.regional_rank <= 100;
          case 'global':
            return course.global_rank && course.global_rank <= 100;
          default:
            return true;
        }
      });
    }
    
    // Then apply sorting
    const sortedCourses = getSortedUserCourses(coursesToFilter, sortBy);
    
    return sortedCourses;
  }, [allPlayedCourses, activeFilter, sortBy]);

  const maxIndex = Math.max(0, filteredCourses.length - cardsPerView);

  const swipeRef = useSwipeGesture({
    onSwipeLeft: () => setCurrentIndex(prev => Math.min(prev + 1, maxIndex)),
    onSwipeRight: () => setCurrentIndex(prev => Math.max(prev - 1, 0)),
    threshold: 50
  });

  const nextSlide = () => {
    const container = recentlyPlayedSwipeRef.current;
    if (container) {
      const cards = container.querySelectorAll('[data-card]');
      const nextIndex = Math.min(currentIndex + 1, cards.length - 1);
      const targetCard = cards[nextIndex] as HTMLElement;
      if (targetCard) {
        container.scrollTo({ left: targetCard.offsetLeft, behavior: 'smooth' });
      }
    }
  };

  const prevSlide = () => {
    const container = recentlyPlayedSwipeRef.current;
    if (container) {
      const cards = container.querySelectorAll('[data-card]');
      const prevIndex = Math.max(currentIndex - 1, 0);
      const targetCard = cards[prevIndex] as HTMLElement;
      if (targetCard) {
        container.scrollTo({ left: targetCard.offsetLeft, behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="w-full px-4 pt-4 pb-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-2xl text-foreground">
            Recently Played
          </h3>
          <div className="flex gap-2">
            {currentIndex > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={prevSlide}
                className="h-12 w-12 p-0 hover:bg-transparent focus:outline-none focus:ring-0 focus:border-0"
              >
                <ChevronLeft className="h-10 w-10" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={nextSlide}
              disabled={currentIndex >= maxIndex}
              className="h-12 w-12 p-0 hover:bg-transparent focus:outline-none focus:ring-0 focus:border-0"
            >
              <ChevronRight className="h-10 w-10" />
            </Button>
          </div>
        </div>
        
        <div className="relative">
          {!isHydrated ? (
            <div className="text-center py-8">
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-muted-foreground">
                  Loading preferences...
                </span>
              </div>
            </div>
          ) : filteredCourses.length > 0 ? (
            <div 
              ref={recentlyPlayedSwipeRef}
              className="overflow-x-auto scrollbar-hide"
              style={{
                scrollSnapType: 'x mandatory',
                scrollPaddingLeft: '0px',
                scrollPaddingRight: '0px'
              }}
              onScroll={(e) => {
                const container = e.target as HTMLElement;
                const cards = container.querySelectorAll('[data-card]');
                if (cards.length > 0) {
                  const cardWidth = (cards[0] as HTMLElement).offsetWidth;
                  const gap = 12;
                  const newIndex = Math.round(container.scrollLeft / (cardWidth + gap));
                  if (newIndex !== currentIndex && newIndex >= 0 && newIndex < cards.length) {
                    setCurrentIndex(newIndex);
                  }
                }
              }}
            >
              <div 
                className="flex"
                style={{ 
                  gap: '12px',
                  paddingLeft: windowWidth < 768 ? '0px' : '0px', // Remove extra left padding to align with sections below
                  paddingRight: windowWidth < 768 ? '10px' : '0px'  // Keep right padding for proper spacing
                }}
              >
                {filteredCourses.map((userCourse, index) => {
                   // Calculate responsive width based on exact breakpoints
                   const getCardWidth = () => {
                     if (windowWidth >= 1200) return 'calc(25% - 9px)'; // Desktop: 4 cards, 3 gaps of 12px = 36px / 4 = 9px per card
                     if (windowWidth >= 1024) return 'calc(33.333% - 8px)'; // Laptop: 3 cards, 2 gaps of 12px = 24px / 3 = 8px per card
                     if (windowWidth >= 768) return 'calc(50% - 6px)'; // Tablet: 2 cards, 1 gap of 12px = 12px / 2 = 6px per card
                     return 'calc(40vw - 5px)'; // Mobile: 2.5 cards visible (40% width per card)
                   };

                  return (
                    <div 
                      key={`recently-played-${userCourse.course_id || userCourse.golf_courses?.id || userCourse.id}-${index}`} 
                      data-card
                      className="flex-shrink-0"
                      style={{ 
                        width: getCardWidth(),
                        scrollSnapAlign: 'start',
                        scrollSnapStop: 'always'
                      }}
                    >
                      <div className={`w-full ${windowWidth >= 768 ? 'aspect-[4/5]' : 'aspect-[4/5]'}`}>
                          <CourseCard 
                            course={userCourse.golf_courses}
                            viewingUserId={userId}
                            viewContext="global"
                            userRating={userCourse.rating}
                            isReadOnly={!isOwnProfile}
                            showUserRating={false}
                            showAverageRating={false}
                            isFromUserCoursesPage={true}
                            customHeight="h-full"
                            showCountryWithFlag={true}
                            xp={120}
                            showXP={true}
                            hideRankingBadges={true}
                            mobileTextScale={windowWidth < 768 ? 'small' : 'normal'}
                            mobileFlagSize={windowWidth < 768 ? 'md' : 'lg'}
                         />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : activeFilter ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No courses found in the selected region.
              </p>
            </div>
          ) : (
            <EmptyTop100State isOwnProfile={isOwnProfile} displayName="" />
          )}
        </div>
      </div>
    </div>
  );
};

// Highlight Reel Section Component - Uses video logic but keeps original layout
interface HighlightReelSectionProps {
  userId?: string;
  isOwnProfile?: boolean;
}

const HighlightReelSection: React.FC<HighlightReelSectionProps> = ({ 
  userId,
  isOwnProfile = false
}) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('recent'); // Default to recent for "Highlight Reel"
  const { viewType, setViewType, isHydrated } = useViewPreference();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const highlightReelSwipeRef = useRef<HTMLDivElement>(null);
  
  // Track window width for responsive breakpoints
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  
  // Calculate cards per view for Highlight Reel to match Recently Played
  const getCardsPerView = () => {
    if (windowWidth >= 1200) return 4; // Desktop: 4 cards (matches Recently Played)
    if (windowWidth >= 1024) return 3; // Laptop: 3 cards  
    if (windowWidth >= 768) return 2;  // Tablet: 2 cards
    return 1; // Mobile: 1 with peek
  };
  
  const cardsPerView = getCardsPerView();

  // Query to get courses from user's top 100 courses
  const { data: allPlayedCourses = [] } = useQuery({
    queryKey: ['highlightReelCourses', userId],
    queryFn: async () => {
      if (!userId) return [];

      // Get courses from user_top100_courses table
      const { data: top100Data, error: top100Error } = await supabase
        .from('user_top100_courses')
        .select(`
          course_id,
          played_date,
          golf_courses (
            id,
            name,
            country,
            region,
            sub_country,
            continent,
            global_rank,
            regional_rank,
            usa_rank,
            description,
            thumbnail_image
          )
        `)
        .eq('user_id', userId)
        .eq('played', true)
        .order('played_date', { ascending: false })
        .limit(10);

      if (top100Error) throw top100Error;

      // Transform to course format
      return (top100Data || []).map(course => ({
        ...course,
        id: `course-${course.course_id}`,
        golf_courses: course.golf_courses
      }));
    },
    enabled: !!userId,
  });
  // Filter and sort courses based on active filter and sort option
  const filteredCourses = useMemo(() => {
    let coursesToFilter = allPlayedCourses;
    
    // First apply regional filtering if active
    if (activeFilter) {
      coursesToFilter = coursesToFilter.filter((userCourse) => {
        const course = userCourse.golf_courses;
        if (!course) return false;

        switch (activeFilter) {
          case 'britain-ireland':
            return course.country === 'Britain & Ireland' && course.regional_rank && course.regional_rank <= 100;
          case 'europe':
            return course.country === 'Continental Europe' && course.regional_rank && course.regional_rank <= 100;
          case 'usa':
            return course.country === 'USA' && course.regional_rank && course.regional_rank <= 100;
          case 'global':
            return course.global_rank && course.global_rank <= 100;
          default:
            return true;
        }
      });
    }
    
    // Then apply sorting
    const sortedCourses = getSortedUserCourses(coursesToFilter, sortBy);
    
    return sortedCourses;
  }, [allPlayedCourses, activeFilter, sortBy]);

  const maxIndex = Math.max(0, filteredCourses.length - cardsPerView);

  const swipeRef = useSwipeGesture({
    onSwipeLeft: () => setCurrentIndex(prev => Math.min(prev + 1, maxIndex)),
    onSwipeRight: () => setCurrentIndex(prev => Math.max(prev - 1, 0)),
    threshold: 50
  });

  const nextSlide = () => {
    const container = highlightReelSwipeRef.current;
    if (container) {
      const cards = container.querySelectorAll('[data-card]');
      const nextIndex = Math.min(currentIndex + 1, cards.length - 1);
      const targetCard = cards[nextIndex] as HTMLElement;
      if (targetCard) {
        container.scrollTo({ left: targetCard.offsetLeft, behavior: 'smooth' });
      }
    }
  };

  const prevSlide = () => {
    const container = highlightReelSwipeRef.current;
    if (container) {
      const cards = container.querySelectorAll('[data-card]');
      const prevIndex = Math.max(currentIndex - 1, 0);
      const targetCard = cards[prevIndex] as HTMLElement;
      if (targetCard) {
        container.scrollTo({ left: targetCard.offsetLeft, behavior: 'smooth' });
      }
    }
  };

  // Hide section if no highlights available
  if (isHydrated && filteredCourses.length === 0) {
    return null;
  }

  return (
    <div className="w-full px-4 pb-2" style={{ paddingTop: '16px' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-0">
          <h3 className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-2xl text-foreground">
            Highlights From My Journey
          </h3>
          <div className="flex gap-2">
            {currentIndex > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={prevSlide}
                className="h-12 w-12 p-0 hover:bg-transparent focus:outline-none focus:ring-0 focus:border-0"
              >
                <ChevronLeft className="h-10 w-10" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={nextSlide}
              disabled={currentIndex >= maxIndex}
              className="h-12 w-12 p-0 hover:bg-transparent focus:outline-none focus:ring-0 focus:border-0"
            >
              <ChevronRight className="h-10 w-10" />
            </Button>
          </div>
        </div>
        
        <div className="relative">
          {!isHydrated ? (
            <div className="text-center py-8">
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-muted-foreground">
                  Loading preferences...
                </span>
              </div>
            </div>
          ) : filteredCourses.length > 0 ? (
            <div 
              ref={highlightReelSwipeRef}
              className="overflow-x-auto scrollbar-hide"
              style={{
                scrollSnapType: 'x mandatory',
                scrollPaddingLeft: '0px',
                scrollPaddingRight: '0px'
              }}
              onScroll={(e) => {
                const container = e.target as HTMLElement;
                const cards = container.querySelectorAll('[data-card]');
                if (cards.length > 0) {
                  const cardWidth = (cards[0] as HTMLElement).offsetWidth;
                  const gap = 12;
                  const newIndex = Math.round(container.scrollLeft / (cardWidth + gap));
                  if (newIndex !== currentIndex && newIndex >= 0 && newIndex < cards.length) {
                    setCurrentIndex(newIndex);
                  }
                }
              }}
            >
              <div 
                className="flex"
                style={{ 
                  gap: '12px'
                }}
              >
                 {filteredCourses.map((userCourse, index) => {
                  // Calculate responsive width to match Recently Played cards exactly
                  const getCardWidth = () => {
                    if (windowWidth >= 1200) return 'calc(25% - 9px)'; // Desktop: 4 cards, 3 gaps of 12px = 36px / 4 = 9px per card
                    if (windowWidth >= 1024) return 'calc(33.333% - 8px)'; // Laptop: 3 cards, 2 gaps of 12px = 24px / 3 = 8px per card
                    if (windowWidth >= 768) return 'calc(50% - 6px)'; // Tablet: 2 cards, 1 gap of 12px = 12px / 2 = 6px per card
                    return 'calc(51vw - 5px)'; // Mobile: ~1.96 cards visible
                  };

                  // Use static image from course data
                  const imageUrl = userCourse.golf_courses.thumbnail_image;
                  
                  // Skip if no valid image URL
                  if (!imageUrl) {
                    return null;
                  }

                  return (
                    <div 
                      key={userCourse.id} 
                      data-card
                      className="flex-shrink-0"
                      style={{ 
                        width: getCardWidth(),
                        scrollSnapAlign: 'start',
                        scrollSnapStop: 'always'
                      }}
                    >
                      <div className="aspect-[4/5] w-full relative group">
                        {/* Static Image Element */}
                        <img
                          src={imageUrl}
                          alt={userCourse.golf_courses.name}
                          className="w-full h-full object-cover rounded-lg"
                        />

                        {/* Course Info Overlay - removed course name and location */}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : activeFilter ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No courses found in the selected region.
              </p>
            </div>
          ) : (
            <EmptyTop100State isOwnProfile={isOwnProfile} displayName="" />
          )}
        </div>
      </div>
    </div>
  );
}

// Top 10 Rated by You Section Component
interface TopRatedSectionProps {
  userId?: string;
  isOwnProfile?: boolean;
}

const TopRatedSection: React.FC<TopRatedSectionProps> = ({ 
  userId,
  isOwnProfile = false
}) => {
  const { user: currentUser } = useSupabaseSession();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const topRatedSwipeRef = useRef<HTMLDivElement>(null);
  
  // Get profile owner's first name for tooltip
  const { data: profileOwner } = useQuery({
    queryKey: ['profileOwner', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId
  });
  
  // Track window width for responsive breakpoints
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Top 10 Rated always shows 1 card with peek at all breakpoints
  const cardsPerView = 1;

  // Query to get top rated courses by the user
  const { data: topRatedCourses = [] } = useQuery({
    queryKey: ['topRatedCourses', userId],
    queryFn: async () => {
      if (!userId) return [];

      // Get courses from course_ratings table ordered by rating desc
      const { data: ratedData, error: ratedError } = await supabase
        .from('course_ratings')
        .select(`
          course_id,
          rating,
          created_at,
          golf_courses!inner (
            id,
            name,
            country,
            region,
            sub_country,
            continent,
            global_rank,
            regional_rank,
            usa_rank,
            description,
            thumbnail_image
          )
        `)
        .eq('user_id', userId)
        .order('rating', { ascending: false })
        .limit(10);

      if (ratedError) throw ratedError;

      // Now get the course rating stats separately
      const courseIds = (ratedData || []).map(course => course.course_id);
      
      const { data: statsData, error: statsError } = await supabase
        .from('course_rating_stats')
        .select('course_id, average_rating')
        .in('course_id', courseIds);

      if (statsError) throw statsError;

      // Create a map for quick lookup
      const statsMap = new Map();
      (statsData || []).forEach(stat => {
        statsMap.set(stat.course_id, stat.average_rating);
      });

      return (ratedData || []).map(course => ({
        ...course,
        played_date: course.created_at, // Use rating date as played date
        id: `rating-${course.course_id}`, // Unique ID
        golf_courses: {
          ...course.golf_courses,
          average_rating: statsMap.get(course.course_id) || null
        }
      }));
    },
    enabled: !!userId,
  });

  const { isHydrated } = useViewPreference();

  const maxIndex = Math.max(0, topRatedCourses.length - cardsPerView);

  const swipeRef = useSwipeGesture({
    onSwipeLeft: () => setCurrentIndex(prev => Math.min(prev + 1, maxIndex)),
    onSwipeRight: () => setCurrentIndex(prev => Math.max(prev - 1, 0)),
    threshold: 50
  });

  const nextSlide = () => {
    const container = topRatedSwipeRef.current;
    if (container) {
      const cardWidth = container.scrollWidth / topRatedCourses.length;
      const nextIndex = Math.min(currentIndex + 1, topRatedCourses.length - 1);
      const scrollPosition = nextIndex * cardWidth;
      container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    }
  };

  const prevSlide = () => {
    const container = topRatedSwipeRef.current;
    if (container) {
      const cardWidth = container.scrollWidth / topRatedCourses.length;
      const prevIndex = Math.max(currentIndex - 1, 0);
      const scrollPosition = prevIndex * cardWidth;
      container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    }
  };

  return (
      <div className="w-full px-4 pt-0 pb-0">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-0">
            <h3 className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-2xl text-foreground">
              Top 10 Rated by You
            </h3>
          <div className="flex gap-2">
            {currentIndex > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={prevSlide}
                className="h-12 w-12 p-0 hover:bg-transparent focus:outline-none focus:ring-0 focus:border-0"
              >
                <ChevronLeft className="h-10 w-10" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={nextSlide}
              disabled={currentIndex >= maxIndex}
              className="h-12 w-12 p-0 hover:bg-transparent focus:outline-none focus:ring-0 focus:border-0"
            >
              <ChevronRight className="h-10 w-10" />
            </Button>
          </div>
        </div>
        
        <div className="relative">
          {!isHydrated ? (
            <div className="text-center py-8">
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-muted-foreground">
                  Loading preferences...
                </span>
              </div>
            </div>
          ) : topRatedCourses.length > 0 ? (
            <div 
              ref={topRatedSwipeRef} 
              className="overflow-x-auto scrollbar-hide"
              style={{
                scrollSnapType: 'x mandatory',
                scrollPaddingLeft: '0px',
                scrollPaddingRight: '0px'
              }}
              onScroll={(e) => {
                const container = e.target as HTMLElement;
                const cardWidth = container.scrollWidth / topRatedCourses.length;
                const newIndex = Math.round(container.scrollLeft / cardWidth);
                if (newIndex !== currentIndex) {
                  setCurrentIndex(newIndex);
                }
              }}
            >
              <div 
                className="flex"
                style={{ 
                  gap: '12px'
                }}
              >
                {topRatedCourses.map((userCourse, index) => {
                  // Calculate responsive width for Top 10 Rated (wide feature cards with specific peek percentages)
                  const getCardWidth = () => {
                    if (windowWidth >= 1200) return 'calc(80vw - 6rem)'; // Desktop: 80% width (20% peek)
                    if (windowWidth >= 1024) return 'calc(90vw - 5rem)'; // Laptop: 90% width (10% peek)
                    if (windowWidth >= 768) return 'calc(92vw - 4rem)'; // Tablet: 92% width (8% peek)
                    return 'calc(92vw - 2rem)'; // Mobile: 92% width (8% peek)
                  };

                  return (
                    <div 
                      key={userCourse.id} 
                      className="flex-shrink-0"
                      style={{ 
                        width: getCardWidth(),
                        scrollSnapAlign: 'start',
                        scrollSnapStop: 'always'
                      }}
                    >
                       <div className={`${index === 0 ? 'rated-card ' : ''}w-full ${windowWidth >= 768 ? 'aspect-[2.5/0.6]' : 'aspect-[2.5/1.2]'}`}>
                            <CourseCard 
                              course={userCourse.golf_courses}
                              viewingUserId={userId}
                              viewContext="global"
                              userRating={userCourse.rating}
                              isReadOnly={!isOwnProfile}
                              showUserRating={true}
                              showAverageRating={true}
                              isFromUserCoursesPage={true}
                              customHeight="h-full"
                              hideRankingBadges={true}
                              showAIQuote={false}
                              showRatingOnRight={true}
                              currentUserId={currentUser?.id}
                              profileOwnerFirstName={profileOwner?.display_name}
                              badgesOnTop={true}
                            />
                       </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {isOwnProfile ? "You haven't rated any courses yet." : "No rated courses found."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// Courses by Region Section Component
interface CoursesbyRegionSectionProps {
  userId?: string;
  isOwnProfile?: boolean;
  userDisplayName?: string;
}

const CoursesbyRegionSection: React.FC<CoursesbyRegionSectionProps> = ({ 
  userId,
  isOwnProfile = false,
  userDisplayName
}) => {
  return (
    <div className="w-full px-4 pt-2 pb-8 mb-0">
      <div className="max-w-6xl mx-auto">
        {/* Courses by Region title - matches Top 10 Rated by You style */}
        <div className="flex items-center justify-between mb-0">
          <h3 className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-2xl text-foreground">
            Courses by Region
          </h3>
        </div>
      </div>
      
      {/* Reordered sections: Worldwide, USA, Great Britain & Ireland, Continental Europe */}
      
      {/* Worldwide Section */}
      <WorldwideConditionalSection userId={userId} isOwnProfile={isOwnProfile} userDisplayName={userDisplayName} />
      
      {/* USA Section */}
      <USAConditionalSection userId={userId} isOwnProfile={isOwnProfile} userDisplayName={userDisplayName} />
      
      {/* Great Britain & Ireland Section */}
      <GreatBritainIrelandConditionalSection userId={userId} isOwnProfile={isOwnProfile} userDisplayName={userDisplayName} />
      
      {/* Continental Europe Section */}
      <ContinentalEuropeConditionalSection userId={userId} isOwnProfile={isOwnProfile} userDisplayName={userDisplayName} />
    </div>
  );
};

// Navigation component for Great Britain & Ireland section
interface GreatBritainIrelandNavigationProps {
  userId?: string;
  isOwnProfile?: boolean;
}

const GreatBritainIrelandNavigation: React.FC<GreatBritainIrelandNavigationProps> = ({ 
  userId,
  isOwnProfile = false
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  // Same query as the main section to get the data for the modal
  const { data: gbIrelandCourses = [] } = useQuery({
    queryKey: ['gbIrelandCourses', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data: top100Data, error: top100Error } = await supabase
        .from('user_top100_courses')
        .select(`
          course_id,
          played_date,
          golf_courses (
            id,
            name,
            country,
            region,
            sub_country,
            continent,
            global_rank,
            regional_rank,
            usa_rank,
            description,
            thumbnail_image
          )
        `)
        .eq('user_id', userId)
        .eq('played', true);

      if (top100Error) throw top100Error;

      const { data: ratedData, error: ratedError } = await supabase
        .from('course_ratings')
        .select(`
          course_id,
          rating,
          created_at,
          golf_courses (
            id,
            name,
            country,
            region,
            sub_country,
            continent,
            global_rank,
            regional_rank,
            usa_rank,
            description,
            thumbnail_image
          )
        `)
        .eq('user_id', userId);

      if (ratedError) throw ratedError;

      const combinedCourses = [
        ...(top100Data || []).map(course => ({
          ...course,
          rating: null,
          id: `top100-${course.course_id}`
        })),
        ...(ratedData || []).map(course => ({
          ...course,
          played_date: course.created_at,
          id: `rating-${course.course_id}`
        }))
      ];

      const gbIrelandCourses = combinedCourses.filter((userCourse) => {
        const course = userCourse.golf_courses;
        return course && course.country === 'Britain & Ireland';
      });

      const uniqueCoursesMap = new Map();
      
      gbIrelandCourses.forEach(course => {
        const courseId = course.course_id;
        const existing = uniqueCoursesMap.get(courseId);
        
        if (!existing) {
          uniqueCoursesMap.set(courseId, course);
        } else {
          if (course.rating !== null && course.rating !== undefined && 
              (existing.rating === null || existing.rating === undefined)) {
            uniqueCoursesMap.set(courseId, course);
          }
        }
      });

      const rawCourses = Array.from(uniqueCoursesMap.values());
      return getRegionalSortedCourses(rawCourses);
    },
    enabled: !!userId,
  });

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setModalOpen(true)}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        See All
      </Button>
      <RegionalCoursesModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        regionName="Great Britain & Ireland"
        courses={gbIrelandCourses}
        isOwnProfile={isOwnProfile}
      />
    </>
  );
};

// Great Britain & Ireland Section Component
interface GreatBritainIrelandSectionProps {
  userId?: string;
  isOwnProfile?: boolean;
  userDisplayName?: string;
}

const GreatBritainIrelandSection: React.FC<GreatBritainIrelandSectionProps> = ({ 
  userId,
  isOwnProfile = false,
  userDisplayName
}) => {
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track window width for responsive breakpoints
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Drag scroll functionality
  const dragScrollRef = useDragScroll({ 
    enabled: true,
    direction: 'horizontal'
  });

  const { data: gbIrelandCourses = [], isLoading: gbIrelandLoading } = usePlayedCoursesWithRatings(userId || '', 'gb_i');

  const { isHydrated } = useViewPreference();

  // Keyboard navigation - only setup when gbIrelandCourses is available
  useEffect(() => {
    if (gbIrelandCourses.length === 0) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current) return;
      
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const container = containerRef.current;
        const cardWidth = container.scrollWidth / gbIrelandCourses.length;
        const scrollAmount = e.key === 'ArrowLeft' ? -cardWidth : cardWidth;
        
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gbIrelandCourses.length]);

  // Calculate card dimensions  
  const getCardWidth = () => {
    if (windowWidth >= 768) {
      // Desktop: 3.2 cards visible (3 full + 0.2 peek)
      return `calc(31.25% - 3.75px)`; // 100% / 3.2 = 31.25%, gap adjustment: 12px / 3.2 = 3.75px
    } else {
      // Mobile: 1.1 cards visible (1 full + 0.1 peek)  
      return `calc(90.9% - 1.1px)`; // 100% / 1.1 = 90.9%, gap adjustment: 1.2px / 1.1 = 1.1px
    }
  };

  const combinedRef = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;
    if (dragScrollRef) dragScrollRef(node);
  }, [dragScrollRef]);

  return (
    <div className="w-full pt-0 pb-2">
      <div className="max-w-6xl mx-auto">
        
        <div className="relative">
          {!isHydrated ? (
            <div className="text-center py-8">
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-muted-foreground">
                  Loading preferences...
                </span>
              </div>
            </div>
          ) : gbIrelandCourses.length > 0 ? (
            <div className="relative">
              {/* Edge padding for title alignment */}
              <div 
                ref={combinedRef}
                className="flex overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory"
                style={{
                  gap: '12px',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch',
                  scrollSnapType: 'x mandatory',
                  scrollPaddingLeft: '0px',
                  scrollPaddingRight: '0px'
                }}
                tabIndex={0}
              >
                {gbIrelandCourses.map((userCourse, index) => (
                  <div 
                    key={userCourse.id} 
                    className="flex-shrink-0 snap-start snap-always"
                    style={{ width: getCardWidth() }}
                  >
                     <div 
                       className="w-full overflow-hidden rounded-lg relative" 
                       style={{ height: 'var(--rated-card-h, 240px)' }}
                     >
                       <CourseCard 
                         course={{
                           ...userCourse.golf_courses,
                           average_rating: userCourse.averageRating
                         }}
                         viewingUserId={userId}
                         viewContext="global"
                         userRating={userCourse.userRating}
                         isReadOnly={!isOwnProfile}
                         showUserRating={true}
                         showAverageRating={true}
                         showRatingOnRight={true}
                         isFromUserCoursesPage={true}
                         customHeight="h-full"
                         currentUserId={userId}
                         profileOwnerFirstName={isOwnProfile ? "You" : "User"}
                         badgesOnTop={true}
                       />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {isOwnProfile 
                  ? "You haven't played any Great Britain & Ireland courses yet." 
                  : `${userDisplayName || 'User'} hasn't played any Great Britain & Ireland courses yet.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Worldwide Navigation Component
interface WorldwideNavigationProps {
  userId?: string;
  isOwnProfile?: boolean;
}

const WorldwideNavigation: React.FC<WorldwideNavigationProps> = ({ 
  userId,
  isOwnProfile = false
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  const { data: worldwideCourses = [] } = useQuery({
    queryKey: ['worldwideCourses', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data: top100Data, error: top100Error } = await supabase
        .from('user_top100_courses')
        .select(`
          course_id,
          played_date,
          golf_courses (
            id,
            name,
            country,
            region,
            sub_country,
            continent,
            global_rank,
            regional_rank,
            usa_rank,
            description,
            thumbnail_image,
            course_rating_stats(average_rating)
          )
        `)
        .eq('user_id', userId)
        .eq('played', true);

      if (top100Error) throw top100Error;

      const { data: ratedData, error: ratedError } = await supabase
        .from('course_ratings')
        .select(`
          course_id,
          rating,
          created_at,
          golf_courses (
            id,
            name,
            country,
            region,
            sub_country,
            continent,
            global_rank,
            regional_rank,
            usa_rank,
            description,
            thumbnail_image
          )
        `)
        .eq('user_id', userId);

      if (ratedError) throw ratedError;

      const combinedCourses = [
        ...(top100Data || []).map(course => ({
          ...course,
          rating: null,
          id: `top100-${course.course_id}`,
          golf_courses: {
            ...course.golf_courses,
            average_rating: null
          }
        })),
        ...(ratedData || []).map(course => ({
          ...course,
          played_date: course.created_at,
          id: `rating-${course.course_id}`,
          golf_courses: {
            ...course.golf_courses,
            average_rating: null
          }
        }))
      ];

      // Filter for courses with global ranking (worldwide)
      const worldwideCourses = combinedCourses.filter((userCourse) => {
        const course = userCourse.golf_courses;
        return course && course.global_rank && course.global_rank <= 100;
      });

      const uniqueCoursesMap = new Map();
      
      worldwideCourses.forEach(course => {
        const courseId = course.course_id;
        const existing = uniqueCoursesMap.get(courseId);
        
        if (!existing) {
          uniqueCoursesMap.set(courseId, course);
        } else {
          if (course.rating !== null && course.rating !== undefined && 
              (existing.rating === null || existing.rating === undefined)) {
            uniqueCoursesMap.set(courseId, course);
          }
        }
      });

      const rawCourses = Array.from(uniqueCoursesMap.values());
      return getRegionalSortedCourses(rawCourses);
    },
    enabled: !!userId,
  });

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setModalOpen(true)}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        See All
      </Button>
      <RegionalCoursesModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        regionName="Worldwide"
        courses={worldwideCourses}
        isOwnProfile={isOwnProfile}
      />
    </>
  );
};

// Worldwide Section Component
interface WorldwideSectionProps {
  userId?: string;
  isOwnProfile?: boolean;
  userDisplayName?: string;
}

const WorldwideSection: React.FC<WorldwideSectionProps> = ({ 
  userId,
  isOwnProfile = false,
  userDisplayName
}) => {
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track window width for responsive breakpoints
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Drag scroll functionality
  const dragScrollRef = useDragScroll({ 
    enabled: true,
    direction: 'horizontal'
  });

  const { data: worldwideCourses = [], isLoading: worldwideLoading } = usePlayedCoursesWithRatings(userId || '', 'worldwide');

  const { isHydrated } = useViewPreference();

  // Keyboard navigation - only setup when worldwideCourses is available
  useEffect(() => {
    if (worldwideCourses.length === 0) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current) return;
      
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const container = containerRef.current;
        const cardWidth = container.scrollWidth / worldwideCourses.length;
        const scrollAmount = e.key === 'ArrowLeft' ? -cardWidth : cardWidth;
        
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [worldwideCourses.length]);

  // Calculate card dimensions
  const getCardWidth = () => {
    if (windowWidth >= 768) {
      // Desktop: 3.2 cards visible (3 full + 0.2 peek)
      return `calc(31.25% - 3.75px)`; // 100% / 3.2 = 31.25%, gap adjustment: 12px / 3.2 = 3.75px
    } else {
      // Mobile: 1.1 cards visible (1 full + 0.1 peek)
      return `calc(90.9% - 1.1px)`; // 100% / 1.1 = 90.9%, gap adjustment: 1.2px / 1.1 = 1.1px
    }
  };

  const combinedRef = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;
    if (dragScrollRef) dragScrollRef(node);
  }, [dragScrollRef]);

  return (
    <div className="w-full pt-0 pb-2">
      <div className="max-w-6xl mx-auto">
        <div className="relative">
          {!isHydrated ? (
            <div className="text-center py-8">
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-muted-foreground">
                  Loading preferences...
                </span>
              </div>
            </div>
          ) : worldwideCourses.length > 0 ? (
            <div className="relative">
              {/* Edge padding for title alignment */}
              <div 
                ref={combinedRef}
                className="flex overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory"
                style={{
                  gap: '12px',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch',
                  scrollSnapType: 'x mandatory',
                  scrollPaddingLeft: '0px',
                  scrollPaddingRight: '0px'
                }}
                tabIndex={0}
              >
                {worldwideCourses.map((userCourse, index) => (
                  <div 
                    key={userCourse.id} 
                    className="flex-shrink-0 snap-start snap-always"
                    style={{ width: getCardWidth() }}
                  >
                     <div 
                       className="w-full overflow-hidden rounded-lg relative" 
                       style={{ height: 'var(--rated-card-h, 240px)' }}
                     >
                       <CourseCard 
                         course={{
                           ...userCourse.golf_courses,
                           average_rating: userCourse.averageRating
                         }}
                         viewingUserId={userId}
                         viewContext="global"
                         userRating={userCourse.userRating}
                         isReadOnly={!isOwnProfile}
                         showUserRating={true}
                         showAverageRating={true}
                         showRatingOnRight={true}
                         isFromUserCoursesPage={true}
                         customHeight="h-full"
                         currentUserId={userId}
                         profileOwnerFirstName={isOwnProfile ? "You" : "User"}
                         badgesOnTop={true}
                       />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {isOwnProfile 
                  ? "You haven't played any worldwide courses yet." 
                  : `${userDisplayName || 'User'} hasn't played any worldwide courses yet.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// USA Navigation Component
interface USANavigationProps {
  userId?: string;
  isOwnProfile?: boolean;
}

const USANavigation: React.FC<USANavigationProps> = ({ 
  userId,
  isOwnProfile = false
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  const { data: usaCourses = [] } = useQuery({
    queryKey: ['usaCourses', userId],
    queryFn: async () => {
      if (!userId) return [];

      // Get courses from user_top100_courses table for USA
      const { data: top100Data, error: top100Error } = await supabase
        .from('user_top100_courses')
        .select(`
          course_id,
          played_date,
          golf_courses (
            id,
            name,
            country,
            region,
            sub_country,
            continent,
            global_rank,
            regional_rank,
            usa_rank,
            description,
            thumbnail_image,
            course_rating_stats(average_rating)
          )
        `)
        .eq('user_id', userId)
        .eq('played', true);

      if (top100Error) throw top100Error;

      // Get courses from course_ratings table for USA
      const { data: ratedData, error: ratedError } = await supabase
        .from('course_ratings')
        .select(`
          course_id,
          rating,
          created_at,
          golf_courses (
            id,
            name,
            country,
            region,
            sub_country,
            continent,
            global_rank,
            regional_rank,
            usa_rank,
            description,
            thumbnail_image,
            course_rating_stats(average_rating)
          )
        `)
        .eq('user_id', userId);

      if (ratedError) throw ratedError;

      // Combine and deduplicate courses
      const combinedCourses = [
        ...(top100Data || []).map(course => ({
          ...course,
          rating: null,
          id: `top100-${course.course_id}`,
          averageRating: course.golf_courses?.course_rating_stats?.[0]?.average_rating || null,
          userRating: null
        })),
        ...(ratedData || []).map(course => ({
          ...course,
          played_date: course.created_at,
          id: `rating-${course.course_id}`,
          averageRating: course.golf_courses?.course_rating_stats?.[0]?.average_rating || null,
          userRating: course.rating
        }))
      ];

      // Filter for USA courses only
      const usaCourses = combinedCourses.filter((userCourse) => {
        const course = userCourse.golf_courses;
        return course && course.country === 'USA';
      });

      // Remove duplicates based on course_id, preferring rated courses
      const uniqueCoursesMap = new Map();
      
      usaCourses.forEach(course => {
        const courseId = course.course_id;
        const existing = uniqueCoursesMap.get(courseId);
        
        if (!existing) {
          uniqueCoursesMap.set(courseId, course);
        } else {
          // Prefer courses with user ratings
          if (course.userRating !== null && course.userRating !== undefined && 
              (existing.userRating === null || existing.userRating === undefined)) {
            uniqueCoursesMap.set(courseId, course);
          }
        }
      });

      const rawCourses = Array.from(uniqueCoursesMap.values());
      return getRegionalSortedCourses(rawCourses);
    },
    enabled: !!userId,
  });

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setModalOpen(true)}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        See All
      </Button>
      <RegionalCoursesModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        regionName="USA"
        courses={usaCourses}
        isOwnProfile={isOwnProfile}
      />
    </>
  );
};

// USA Section Component
interface USASectionProps {
  userId?: string;
  isOwnProfile?: boolean;
  userDisplayName?: string;
}

const USASection: React.FC<USASectionProps> = ({ 
  userId,
  isOwnProfile = false,
  userDisplayName
}) => {
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track window width for responsive breakpoints
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Drag scroll functionality
  const dragScrollRef = useDragScroll({ 
    enabled: true,
    direction: 'horizontal'
  });

  const { data: usaCourses = [], isLoading: usaLoading } = usePlayedCoursesWithRatings(userId || '', 'usa');

  const { isHydrated } = useViewPreference();

  // Keyboard navigation - only setup when usaCourses is available
  useEffect(() => {
    if (usaCourses.length === 0) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current) return;
      
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const container = containerRef.current;
        const cardWidth = container.scrollWidth / usaCourses.length;
        const scrollAmount = e.key === 'ArrowLeft' ? -cardWidth : cardWidth;
        
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [usaCourses.length]);

  // Calculate card dimensions
  const getCardWidth = () => {
    if (windowWidth >= 768) {
      // Desktop: 3.2 cards visible (3 full + 0.2 peek)
      return `calc(31.25% - 3.75px)`; // 100% / 3.2 = 31.25%, gap adjustment: 12px / 3.2 = 3.75px
    } else {
      // Mobile: 1.1 cards visible (1 full + 0.1 peek)
      return `calc(90.9% - 1.1px)`; // 100% / 1.1 = 90.9%, gap adjustment: 1.2px / 1.1 = 1.1px
    }
  };

  const combinedRef = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;
    if (dragScrollRef) dragScrollRef(node);
  }, [dragScrollRef]);

  return (
    <div className="w-full pt-0">
      <div className="max-w-6xl mx-auto">
        <div className="relative">
          {!isHydrated ? (
            <div className="text-center py-8">
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-muted-foreground">
                  Loading preferences...
                </span>
              </div>
            </div>
          ) : usaCourses.length > 0 ? (
            <div className="relative">
              {/* Edge padding for title alignment */}
              <div 
                ref={combinedRef}
                className="flex overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory"
                style={{
                  gap: '12px',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch',
                  scrollSnapType: 'x mandatory',
                  scrollPaddingLeft: '0px',
                  scrollPaddingRight: '0px'
                }}
                tabIndex={0}
              >
                {usaCourses.map((userCourse, index) => (
                  <div 
                    key={userCourse.id} 
                    className="flex-shrink-0 snap-start snap-always"
                    style={{ width: getCardWidth() }}
                  >
                     <div 
                       className="w-full overflow-hidden rounded-lg relative" 
                       style={{ height: 'var(--rated-card-h, 240px)' }}
                     >
                       <CourseCard 
                         course={{
                           ...userCourse.golf_courses,
                           average_rating: userCourse.averageRating
                         }}
                         viewingUserId={userId}
                         viewContext="global"
                         userRating={userCourse.userRating}
                         isReadOnly={!isOwnProfile}
                         showUserRating={true}
                         showAverageRating={true}
                         showRatingOnRight={true}
                         isFromUserCoursesPage={true}
                         customHeight="h-full"
                         currentUserId={userId}
                         profileOwnerFirstName={isOwnProfile ? "You" : "User"}
                         badgesOnTop={true}
                       />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {isOwnProfile 
                  ? "You haven't played any USA courses yet." 
                  : `${userDisplayName || 'User'} hasn't played any USA courses yet.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Continental Europe Navigation Component
interface ContinentalEuropeNavigationProps {
  userId?: string;
  isOwnProfile?: boolean;
}

const ContinentalEuropeNavigation: React.FC<ContinentalEuropeNavigationProps> = ({ 
  userId,
  isOwnProfile = false
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  // Use the same shared hook as the ContinentalEuropeSection for consistency
  const { data: europeCourses = [] } = usePlayedCoursesWithRatings(userId || '', 'europe');

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setModalOpen(true)}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        See All
      </Button>
      
      <RegionalCoursesModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        regionName="Continental Europe"
        courses={europeCourses.map(course => ({
          ...course.golf_courses,
          average_rating: course.averageRating
        }))}
        isOwnProfile={isOwnProfile}
      />
    </>
  );
};

// Continental Europe Section Component
interface ContinentalEuropeSectionProps {
  userId?: string;
  isOwnProfile?: boolean;
  userDisplayName?: string;
}

const ContinentalEuropeSection: React.FC<ContinentalEuropeSectionProps> = ({ 
  userId,
  isOwnProfile = false,
  userDisplayName
}) => {
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track window width for responsive breakpoints
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Drag scroll functionality
  const dragScrollRef = useDragScroll({ 
    enabled: true,
    direction: 'horizontal'
  });

  const { data: europeCourses = [], isLoading: europeLoading } = usePlayedCoursesWithRatings(userId || '', 'europe');

  const { isHydrated } = useViewPreference();

  // Keyboard navigation - only setup when europeCourses is available
  useEffect(() => {
    if (europeCourses.length === 0) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current) return;
      
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const container = containerRef.current;
        const cardWidth = container.scrollWidth / europeCourses.length;
        const scrollAmount = e.key === 'ArrowLeft' ? -cardWidth : cardWidth;
        
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [europeCourses.length]);

  // Calculate card dimensions
  const getCardWidth = () => {
    if (windowWidth >= 768) {
      // Desktop: 3.2 cards visible (3 full + 0.2 peek)
      return `calc(31.25% - 3.75px)`; // 100% / 3.2 = 31.25%, gap adjustment: 12px / 3.2 = 3.75px
    } else {
      // Mobile: 1.1 cards visible (1 full + 0.1 peek)
      return `calc(90.9% - 1.1px)`; // 100% / 1.1 = 90.9%, gap adjustment: 1.2px / 1.1 = 1.1px
    }
  };

  const combinedRef = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;
    if (dragScrollRef) dragScrollRef(node);
  }, [dragScrollRef]);

  return (
    <div className="w-full pt-0">
      <div className="max-w-6xl mx-auto">
        <div className="relative">
          {!isHydrated ? (
            <div className="text-center py-8">
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-muted-foreground">
                  Loading preferences...
                </span>
              </div>
            </div>
          ) : europeCourses.length > 0 ? (
            <div className="relative">
              {/* Edge padding for title alignment */}
              <div 
                ref={combinedRef}
                className="flex overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory"
                style={{
                  gap: '12px',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch',
                  scrollSnapType: 'x mandatory',
                  scrollPaddingLeft: '0px',
                  scrollPaddingRight: '0px'
                }}
                tabIndex={0}
              >
                {europeCourses.map((userCourse, index) => (
                  <div 
                    key={userCourse.id} 
                    className="flex-shrink-0 snap-start snap-always"
                    style={{ width: getCardWidth() }}
                  >
                     <div 
                       className="w-full overflow-hidden rounded-lg relative" 
                       style={{ height: 'var(--rated-card-h, 240px)' }}
                     >
                        <CourseCard 
                          course={{
                            ...userCourse.golf_courses,
                            average_rating: userCourse.averageRating
                          }}
                          viewingUserId={userId}
                          viewContext="global"
                          userRating={userCourse.userRating}
                          isReadOnly={!isOwnProfile}
                          showUserRating={true}
                          showAverageRating={true}
                          showRatingOnRight={true}
                          isFromUserCoursesPage={true}
                          customHeight="h-full"
                          currentUserId={userId}
                          profileOwnerFirstName={userDisplayName?.split(' ')[0] || 'User'}
                          badgesOnTop={true}
                        />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {isOwnProfile 
                  ? "You haven't played any Continental Europe courses yet." 
                  : `${userDisplayName || 'User'} hasn't played any Continental Europe courses yet.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Conditional Section Wrappers - Only render if courses exist
interface ConditionalSectionProps {
  userId?: string;
  isOwnProfile?: boolean;
  userDisplayName?: string;
}

const WorldwideConditionalSection: React.FC<ConditionalSectionProps> = ({ userId, isOwnProfile, userDisplayName }) => {
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['worldwideCoursesCheck', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data: top100Data, error: top100Error } = await supabase
        .from('user_top100_courses')
        .select(`golf_courses!inner(global_rank)`)
        .eq('user_id', userId)
        .eq('played', true)
        .not('golf_courses.global_rank', 'is', null)
        .lte('golf_courses.global_rank', 100);

      if (top100Error) throw top100Error;

      const { data: ratedData, error: ratedError } = await supabase
        .from('course_ratings')
        .select(`golf_courses!inner(global_rank)`)
        .eq('user_id', userId)
        .not('golf_courses.global_rank', 'is', null)
        .lte('golf_courses.global_rank', 100);

      if (ratedError) throw ratedError;

      const combinedCourses = [
        ...(top100Data || []),
        ...(ratedData || [])
      ];

      return combinedCourses;
    },
    enabled: !!userId,
  });

  return (
    <>
      <div className="w-full pt-2">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-0">
            <h4 className="text-xl text-muted-foreground mb-0">Worldwide</h4>
            <div className="flex gap-2">
              <WorldwideNavigation userId={userId} isOwnProfile={isOwnProfile} />
            </div>
          </div>
        </div>
      </div>
      {!isLoading && courses.length > 0 ? (
        <WorldwideSection userId={userId} isOwnProfile={isOwnProfile} userDisplayName={userDisplayName} />
      ) : !isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {isOwnProfile 
              ? "You haven't played any worldwide courses yet." 
              : `${userDisplayName?.split(' ')[0] || 'User'} hasn't played any worldwide courses yet.`}
          </p>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      )}
    </>
  );
};

const USAConditionalSection: React.FC<ConditionalSectionProps> = ({ userId, isOwnProfile, userDisplayName }) => {
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['usaCoursesCheck', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data: top100Data, error: top100Error } = await supabase
        .from('user_top100_courses')
        .select(`golf_courses!inner(country)`)
        .eq('user_id', userId)
        .eq('played', true)
        .eq('golf_courses.country', 'USA');

      if (top100Error) throw top100Error;

      const { data: ratedData, error: ratedError } = await supabase
        .from('course_ratings')
        .select(`golf_courses!inner(country)`)
        .eq('user_id', userId)
        .eq('golf_courses.country', 'USA');

      if (ratedError) throw ratedError;

      const combinedCourses = [
        ...(top100Data || []),
        ...(ratedData || [])
      ];

      return combinedCourses;
    },
    enabled: !!userId,
  });

  return (
    <>
      <div className="w-full pt-2">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-0">
            <h4 className="text-xl text-muted-foreground mb-0">USA</h4>
            <div className="flex gap-2">
              <USANavigation userId={userId} isOwnProfile={isOwnProfile} />
            </div>
          </div>
        </div>
      </div>
      {!isLoading && courses.length > 0 ? (
        <USASection userId={userId} isOwnProfile={isOwnProfile} userDisplayName={userDisplayName} />
      ) : !isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {isOwnProfile 
              ? "You haven't played any USA courses yet." 
              : `${userDisplayName?.split(' ')[0] || 'User'} hasn't played any USA courses yet.`}
          </p>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      )}
    </>
  );
};

const GreatBritainIrelandConditionalSection: React.FC<ConditionalSectionProps> = ({ userId, isOwnProfile, userDisplayName }) => {
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['gbIrelandCoursesCheck', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data: top100Data, error: top100Error } = await supabase
        .from('user_top100_courses')
        .select(`golf_courses!inner(country)`)
        .eq('user_id', userId)
        .eq('played', true)
        .eq('golf_courses.country', 'Britain & Ireland');

      if (top100Error) throw top100Error;

      const { data: ratedData, error: ratedError } = await supabase
        .from('course_ratings')
        .select(`golf_courses!inner(country)`)
        .eq('user_id', userId)
        .eq('golf_courses.country', 'Britain & Ireland');

      if (ratedError) throw ratedError;

      const combinedCourses = [
        ...(top100Data || []),
        ...(ratedData || [])
      ];

      return combinedCourses;
    },
    enabled: !!userId,
  });

  return (
    <>
      <div className="w-full pt-2">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-0">
            <h4 className="text-xl text-muted-foreground mb-0">Great Britain & Ireland</h4>
            <div className="flex gap-2">
              <GreatBritainIrelandNavigation userId={userId} isOwnProfile={isOwnProfile} />
            </div>
          </div>
        </div>
      </div>
      {!isLoading && courses.length > 0 ? (
        <GreatBritainIrelandSection userId={userId} isOwnProfile={isOwnProfile} userDisplayName={userDisplayName} />
      ) : !isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {isOwnProfile 
              ? "You haven't played any Great Britain & Ireland courses yet." 
              : `${userDisplayName?.split(' ')[0] || 'User'} hasn't played any Great Britain & Ireland courses yet.`}
          </p>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      )}
    </>
  );
};

const ContinentalEuropeConditionalSection: React.FC<ConditionalSectionProps> = ({ userId, isOwnProfile, userDisplayName }) => {
  // Use the same shared hook as other regions for consistency
  const { data: courses = [], isLoading } = usePlayedCoursesWithRatings(userId || '', 'europe');

  return (
    <>
      <div className="w-full pt-2">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xl text-muted-foreground mb-0">Continental Europe</h4>
            <div className="flex gap-2">
              <ContinentalEuropeNavigation userId={userId} isOwnProfile={isOwnProfile} />
            </div>
          </div>
        </div>
      </div>
      {!isLoading && courses.length > 0 ? (
        <ContinentalEuropeSection userId={userId} isOwnProfile={isOwnProfile} userDisplayName={userDisplayName} />
      ) : !isLoading && courses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {isOwnProfile 
              ? "You haven't played any Continental Europe courses yet." 
              : `${userDisplayName?.split(' ')[0] || 'User'} hasn't played any Continental Europe courses yet.`}
          </p>
        </div>
      ) : isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : null}
    </>
  );
};

export default CoursesJourney;