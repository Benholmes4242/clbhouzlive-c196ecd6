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
import { ChevronLeft, ChevronRight, Volume2, VolumeX, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HLSVideoCard from '@/components/ui/HLSVideoCard';


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
                  <div className="w-44 h-44 relative transition-all duration-300">
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
                        <div className="relative w-32 h-32 rounded-full overflow-hidden flex flex-col items-center justify-center">
                          {/* USA Map Background */}
                          <img
                            src="/lovable-uploads/6152bbaa-1d05-4eab-bbde-08d43b96a693.png"
                            alt="USA map background"
                            className="absolute inset-0 w-full h-full object-contain opacity-20"
                          />
                          {/* Overlay content */}
                          <div className="relative z-10 text-center">
                            <div className="text-2xl text-black leading-none">
                              <span>{progress.played}</span>
                              <span className="text-black/60"> / {progress.total}</span>
                            </div>
                             <div className="text-xl text-black mt-1">
                               {progress.played * 120} XP
                             </div>
                          </div>
                        </div>
                      ) : achievement.region === 'europe' ? (
                        <div className="relative w-32 h-32 rounded-full overflow-hidden flex flex-col items-center justify-center">
                          {/* Continental Europe Map Background */}
                          <img
                            src="/lovable-uploads/793041de-0d8b-4c78-8256-3447ad57dc44.png"
                            alt="Continental Europe map background"
                            className="absolute inset-0 w-full h-full object-contain opacity-20"
                          />
                          {/* Overlay content */}
                          <div className="relative z-10 text-center">
                            <div className="text-2xl text-black leading-none">
                              <span>{progress.played}</span>
                              <span className="text-black/60"> / {progress.total}</span>
                            </div>
                             <div className="text-xl text-black mt-1">
                               {progress.played * 120} XP
                             </div>
                          </div>
                        </div>
                      ) : achievement.region === 'britain-ireland' ? (
                        <div className="relative w-40 h-40 rounded-full overflow-hidden flex flex-col items-center justify-center">
                          {/* UK & Ireland Map Background */}
                          <img
                            src="/lovable-uploads/dc0f671b-b75f-4121-8ebd-18dd7f9b67c3.png"
                            alt="UK & Ireland map background"
                            className="absolute inset-0 w-full h-full object-contain opacity-20"
                          />
                          {/* Overlay content */}
                          <div className="relative z-10 text-center">
                            <div className="text-2xl text-black leading-none">
                              <span>{progress.played}</span>
                              <span className="text-black/60"> / {progress.total}</span>
                            </div>
                             <div className="text-xl text-black mt-1">
                               {progress.played * 120} XP
                             </div>
                          </div>
                        </div>
                      ) : achievement.region === 'global' ? (
                        <div className="relative w-32 h-32 rounded-full overflow-hidden flex flex-col items-center justify-center">
                          {/* World Map Background */}
                          <img
                            src="/lovable-uploads/c0ba76eb-90e6-404b-8df7-f9f34a43b606.png"
                            alt="World map background"
                            className="absolute inset-0 w-full h-full object-contain opacity-20"
                          />
                          {/* Overlay content */}
                          <div className="relative z-10 text-center">
                            <div className="text-2xl text-black leading-none">
                              <span>{progress.played}</span>
                              <span className="text-black/60"> / {progress.total}</span>
                            </div>
                             <div className="text-xl text-black mt-1">
                               {progress.played * 120} XP
                             </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="text-2xl text-black leading-none">
                            <span>{progress.played}</span>
                            <span className="text-black/60"> / {progress.total}</span>
                          </div>
                           <div className="text-xl text-black mt-1">
                             {progress.played * 120} XP
                           </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                   {/* Achievement info below ring - desktop size */}
                   <div className="mt-0.5 text-center max-w-[200px]">
                     <div className="text-xl text-foreground">
                       {achievement.title}
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
                    <div className="w-24 h-24 relative transition-all duration-300">
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
                          <div className="relative w-16 h-16 rounded-full overflow-hidden flex flex-col items-center justify-center">
                            {/* USA Map Background */}
                            <img
                              src="/lovable-uploads/6152bbaa-1d05-4eab-bbde-08d43b96a693.png"
                              alt="USA map background"
                              className="absolute inset-0 w-full h-full object-contain opacity-25"
                            />
                            {/* Overlay content */}
                            <div className="relative z-10 text-center">
                              <div className="text-sm text-black leading-none">
                                <span>{progress.played}</span>
                                <span className="text-black/60"> / {progress.total}</span>
                              </div>
                               <div className="text-xs text-black mt-0.5">
                                 {progress.played * 120} XP
                               </div>
                            </div>
                          </div>
                        ) : achievement.region === 'europe' ? (
                          <div className="relative w-16 h-16 rounded-full overflow-hidden flex flex-col items-center justify-center">
                            {/* Continental Europe Map Background */}
                            <img
                              src="/lovable-uploads/793041de-0d8b-4c78-8256-3447ad57dc44.png"
                              alt="Continental Europe map background"
                              className="absolute inset-0 w-full h-full object-contain opacity-25"
                            />
                            {/* Overlay content */}
                            <div className="relative z-10 text-center">
                              <div className="text-sm text-black leading-none">
                                <span>{progress.played}</span>
                                <span className="text-black/60"> / {progress.total}</span>
                              </div>
                               <div className="text-xs text-black mt-0.5">
                                 {progress.played * 120} XP
                               </div>
                            </div>
                          </div>
                        ) : achievement.region === 'britain-ireland' ? (
                          <div className="relative w-20 h-20 rounded-full overflow-hidden flex flex-col items-center justify-center">
                            {/* UK & Ireland Map Background */}
                            <img
                              src="/lovable-uploads/dc0f671b-b75f-4121-8ebd-18dd7f9b67c3.png"
                              alt="UK & Ireland map background"
                              className="absolute inset-0 w-full h-full object-contain opacity-25"
                            />
                            {/* Overlay content */}
                            <div className="relative z-10 text-center">
                              <div className="text-sm text-black leading-none">
                                <span>{progress.played}</span>
                                <span className="text-black/60"> / {progress.total}</span>
                              </div>
                               <div className="text-xs text-black mt-0.5">
                                 {progress.played * 120} XP
                               </div>
                            </div>
                          </div>
                        ) : achievement.region === 'global' ? (
                          <div className="relative w-16 h-16 rounded-full overflow-hidden flex flex-col items-center justify-center">
                            {/* World Map Background */}
                            <img
                              src="/lovable-uploads/c0ba76eb-90e6-404b-8df7-f9f34a43b606.png"
                              alt="World map background"
                              className="absolute inset-0 w-full h-full object-contain opacity-25"
                            />
                            {/* Overlay content */}
                            <div className="relative z-10 text-center">
                              <div className="text-sm text-black leading-none">
                                <span>{progress.played}</span>
                                <span className="text-black/60"> / {progress.total}</span>
                              </div>
                               <div className="text-xs text-black mt-0.5">
                                 {progress.played * 120} XP
                               </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="text-sm text-black leading-none">
                              <span>{progress.played}</span>
                              <span className="text-black/60"> / {progress.total}</span>
                            </div>
                             <div className="text-xs text-black mt-0.5">
                               {progress.played * 120} XP
                             </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                     {/* Achievement info */}
                     <div className="mt-1 text-center">
                       <div className="text-base text-foreground leading-tight">
                         {achievement.title}
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


      {/* Regional Carousels */}
      <RegionalCarouselsSection userId={userId} isOwnProfile={isOwnProfile} />
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
      console.log('Raw combined courses before sorting in RecentlyPlayed:', rawCourses.map(c => ({ 
        name: c.golf_courses?.name, 
        rating: c.rating 
      })));
      
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
    
    console.log('Final filtered and sorted courses in RecentlyPlayed:', sortedCourses.map(c => ({ 
      name: c.golf_courses?.name, 
      rating: c.rating,
      sortBy 
    })));
    
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
                      key={userCourse.id} 
                      data-card
                      className="flex-shrink-0"
                      style={{ 
                        width: getCardWidth(),
                        scrollSnapAlign: 'start',
                        scrollSnapStop: 'always'
                      }}
                    >
                      <div className={`w-full ${windowWidth >= 768 ? 'aspect-[3/4]' : 'aspect-[3/3.5]'}`}>
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
  
// Enhanced video element interface for HLS videos
interface HLSVideoElement extends HTMLVideoElement {
  attachHLS?: () => Promise<void>;
}

// Video state management for exclusive playback
  const [videoMuteStates, setVideoMuteStates] = useState<Map<string, boolean>>(new Map()); // Individual mute state per video
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [firstCardId, setFirstCardId] = useState<string | null>(null);
  const [userInitiated, setUserInitiated] = useState(false);
  const videoRefs = useRef<Map<string, HLSVideoElement>>(new Map());
  const videoCleanupRefs = useRef<Map<string, () => void>>(new Map());
  
  // Track window width for responsive breakpoints
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track window width for responsive breakpoints
  useEffect(() => {
    if (firstCardId && !userInitiated) {
      console.log('🎥 Auto-playing first card:', firstCardId);
      playExclusive(firstCardId, false);
    }
  }, [firstCardId]);

  // Helper function to get mute state for a video (default to muted)
  const getVideoMuteState = useCallback((videoId: string) => {
    return videoMuteStates.get(videoId) ?? true; // Default to muted
  }, [videoMuteStates]);

  // Helper function to set mute state for a video
  const setVideoMuteState = useCallback((videoId: string, isMuted: boolean) => {
    setVideoMuteStates(prev => new Map(prev.set(videoId, isMuted)));
  }, []);

  // Video management functions
  const toggleMute = useCallback((videoId: string) => {
    const currentMuted = getVideoMuteState(videoId);
    const newMuted = !currentMuted;
    console.log('🎥 Toggling mute for video', videoId, 'from', currentMuted, 'to', newMuted);
    
    setVideoMuteState(videoId, newMuted);
    
    // Update the actual video element if it exists
    const video = videoRefs.current.get(videoId);
    if (video) {
      video.muted = newMuted;
    }
  }, [getVideoMuteState, setVideoMuteState]);

  const pauseAllVideos = useCallback(() => {
    console.log('🎥 Pausing all videos');
    videoRefs.current.forEach((video, videoId) => {
      if (!video.paused) {
        video.pause();
      }
      video.muted = true; // Ensure all non-active videos are muted
      // Reset stored mute state to muted for paused videos
      setVideoMuteState(videoId, true);
    });
  }, [setVideoMuteState]);

  const playExclusive = useCallback((videoId: string, isUserInitiated = true) => {
    console.log('🎥 Playing exclusive:', videoId, 'User initiated:', isUserInitiated);
    const targetVideo = videoRefs.current.get(videoId);
    if (!targetVideo) {
      console.log('🎥 Video not found:', videoId);
      return;
    }

    // If user-initiated and there's a currently playing video, transfer its audio state
    let shouldTransferAudio = false;
    let transferredMuteState = true; // default to muted
    
    if (isUserInitiated && playingVideoId && playingVideoId !== videoId) {
      const currentPlayingVideo = videoRefs.current.get(playingVideoId);
      if (currentPlayingVideo) {
        // Transfer the current audio state to the new video
        transferredMuteState = !currentPlayingVideo.muted; // invert because we want to transfer the unmuted state
        shouldTransferAudio = true;
        console.log('🎥 Transferring audio state from', playingVideoId, 'to', videoId, '- unmuted:', !transferredMuteState);
      }
    }

    // Pause all other videos first (this will mute them)
    pauseAllVideos();

    // Set state
    setPlayingVideoId(videoId);
    setUserInitiated(isUserInitiated);

    // Attach HLS if needed and play
    const playVideo = async () => {
      try {
        if (targetVideo.attachHLS) {
          await targetVideo.attachHLS();
        }
        
        // Configure mute state - use transferred state if applicable, otherwise use stored state
        let videoMuted;
        if (shouldTransferAudio) {
          videoMuted = transferredMuteState;
          // Update the stored mute state for this video
          setVideoMuteState(videoId, transferredMuteState);
        } else {
          videoMuted = getVideoMuteState(videoId);
        }
        
        targetVideo.muted = videoMuted;
        targetVideo.loop = true;
        await targetVideo.play();
        
        console.log('🎥 Video playing with muted state:', videoMuted);
      } catch (error) {
        console.error('🎥 Failed to play video:', videoId, error);
      }
    };

    playVideo();
  }, [pauseAllVideos, getVideoMuteState, setVideoMuteState, playingVideoId]);

  const pauseVideo = useCallback((videoId: string) => {
    console.log('🎥 Pausing video:', videoId);
    const targetVideo = videoRefs.current.get(videoId);
    if (targetVideo && !targetVideo.paused) {
      targetVideo.pause();
    }
    
    if (playingVideoId === videoId) {
      setPlayingVideoId(null);
      setUserInitiated(false);
      
      // Resume first card autoplay if available
      if (firstCardId && firstCardId !== videoId) {
        console.log('🎥 Resuming first card autoplay:', firstCardId);
        setTimeout(() => playExclusive(firstCardId, false), 100);
      }
    }
  }, [playingVideoId, firstCardId, playExclusive]);

  const registerVideo = useCallback((videoId: string, video: HLSVideoElement) => {
    // Prevent duplicate registration
    if (videoRefs.current.has(videoId)) {
      return () => {}; // Return empty cleanup silently
    }
    
    console.log('🎥 Registering video:', videoId);
    
    // Ensure video is a valid HTMLVideoElement
    if (!video || typeof video.addEventListener !== 'function') {
      console.error('🎥 Invalid video element:', video);
      return () => {}; // Return empty cleanup function
    }
    
    videoRefs.current.set(videoId, video);
    
    // Set initial mute state (default to muted)
    const videoMuted = getVideoMuteState(videoId);
    video.muted = videoMuted;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'metadata';
    
    // Attach HLS source if video has attachHLS method
    if (video.attachHLS) {
      video.attachHLS().catch(console.error);
    }
    
    // Set up event listeners
    const handleEnded = () => {
      console.log('🎥 Video ended:', videoId);
      if (playingVideoId === videoId) {
        if (videoId === firstCardId) {
          // First card ended, restart it
          video.currentTime = 0;
          video.play().catch(console.error);
        } else {
          // Non-first card ended, resume first card
          setPlayingVideoId(null);
          setUserInitiated(false);
          if (firstCardId) {
            setTimeout(() => playExclusive(firstCardId, false), 100);
          }
        }
      }
    };

    const handlePlay = () => {
      console.log('🎥 Video started playing:', videoId);
      // Ensure exclusivity when any video starts playing
      if (playingVideoId && playingVideoId !== videoId) {
        pauseAllVideos();
      }
      setPlayingVideoId(videoId);
    };

    const handlePause = () => {
      console.log('🎥 Video paused:', videoId);
    };

    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    
    return () => {
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      videoRefs.current.delete(videoId);
      console.log('🎥 Unregistered video:', videoId);
    };
  }, [getVideoMuteState, playingVideoId, firstCardId, playExclusive, pauseAllVideos]);

  
  // Calculate cards per view for Highlight Reel
  const getCardsPerView = () => {
    if (windowWidth >= 1200) return 3; // Desktop: 3 cards
    if (windowWidth >= 1024) return 3; // Laptop: 3 cards  
    if (windowWidth >= 768) return 2;  // Tablet: 2 cards
    return 1; // Mobile: 1 with peek
  };
  
  const cardsPerView = getCardsPerView();

  // Query to get courses from videos tagged at top 100 courses
  const { data: allPlayedCourses = [] } = useQuery({
    queryKey: ['highlightReelCourses', userId],
    queryFn: async () => {
      console.log('Highlight Reel - Starting query for userId:', userId);
      if (!userId) {
        console.log('Highlight Reel - No userId provided');
        return [];
      }

      // Get all posts with video media
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          post_media!inner (
            id,
            media_type,
            media_url
          )
        `)
        .eq('user_id', userId)
        .eq('post_media.media_type', 'video')
        .order('created_at', { ascending: false });

      console.log('Highlight Reel - Found posts with videos:', posts?.length);
      console.log('Highlight Reel - Sample post:', posts?.[0]);
      
      if (!posts || posts.length === 0) {
        console.log('Highlight Reel - No posts found, returning empty array');
        return [];
      }

      // Get post tags for these posts
      const postIds = posts.map(p => p.id);
      const { data: tags, error: tagsError } = await supabase
        .from('post_tags')
        .select(`
          post_id,
          taggable_entities!inner (
            entity_type,
            entity_id,
            name
          )
        `)
        .in('post_id', postIds)
        .eq('taggable_entities.entity_type', 'golf_club');

      if (tagsError) throw tagsError;

      // Get golf course details for tagged courses
      const courseIds = tags?.map(tag => tag.taggable_entities.entity_id) || [];
      if (courseIds.length === 0) {
        return [];
      }

      const { data: courses, error: coursesError } = await supabase
        .from('golf_courses')
        .select(`
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
        `)
        .in('id', courseIds)
        .or('global_rank.not.is.null,regional_rank.not.is.null,usa_rank.not.is.null'); // Only top 100 courses

      if (coursesError) throw coursesError;
      console.log('Highlight Reel - Sample course:', courses?.[0]);

    // Transform posts into course format for existing card structure
      const courseData = posts
        .map(post => {
          // Find the tag for this post
          const postTag = tags?.find(tag => tag.post_id === post.id);
          if (!postTag) return null;

          // Find the course details
          const course = courses?.find(c => c.id === postTag.taggable_entities.entity_id);
          if (!course) return null;

          // Get video URL from post media (keep original for video playback)
          const videoMedia = post.post_media?.[0];
          const videoUrl = videoMedia?.media_url; // Keep original URL for video playback
          let videoThumbnail = videoUrl;
          
          // For videos, try to get thumbnail by modifying the URL for display purposes only
          if (videoMedia?.media_type === 'video' && videoUrl) {
            // If it's a Cloudflare Stream video, we can generate thumbnail URL for poster
            if (videoUrl.includes('customer-') && videoUrl.includes('cloudflarestream.com')) {
              // Extract video ID from URLs like: https://customer-4ah4gni80ytefpck.cloudflarestream.com/bfaa2b729eed40d2b3292f40035e8231/manifest/video.m3u8
              const matches = videoUrl.match(/customer-[^\/]+\.cloudflarestream\.com\/([^\/]+)/);
              if (matches && matches[1]) {
                const videoId = matches[1];
                videoThumbnail = `https://customer-4ah4gni80ytefpck.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg`;
              }
            }
          }
          
          console.log('Processing post:', post.id, 'Video URL:', videoUrl, 'Thumbnail URL:', videoThumbnail);
          console.log('Video media details:', videoMedia);

          return {
            id: `video-${post.id}`,
            course_id: course.id,
            played_date: post.created_at,
            created_at: post.created_at,
            rating: null,
            videoThumbnail: videoThumbnail,
            videoUrl: videoUrl, // Store the actual video URL for playback
            golf_courses: {
              ...course,
              thumbnail_image: videoThumbnail || course.thumbnail_image // Use video thumbnail as course image for display
            }
          };
        })
        .filter(Boolean);

      console.log('Highlight Reel - Final course data:', courseData.length, courseData);

      // Apply sorting here to ensure proper order
      return getSortedUserCourses(courseData, 'recent');
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

  // Update first card ID and trigger autoplay when current index changes
  useEffect(() => {
    if (filteredCourses.length > 0) {
      const newFirstCardId = `video-${filteredCourses[currentIndex]?.id}`;
      if (newFirstCardId !== firstCardId) {
        console.log('🎥 First card changed from', firstCardId, 'to', newFirstCardId);
        setFirstCardId(newFirstCardId);
      }
    }
  }, [filteredCourses, currentIndex, firstCardId]);

  // Auto-play first card when it changes and no user interaction
  useEffect(() => {
    if (firstCardId && !userInitiated && videoRefs.current.has(firstCardId)) {
      console.log('🎥 Auto-playing first card:', firstCardId);
      setTimeout(() => playExclusive(firstCardId, false), 100);
    }
  }, [firstCardId, userInitiated, playExclusive]);

  // Cleanup effect for video registrations
  useEffect(() => {
    return () => {
      // Clean up all video registrations when component unmounts
      videoCleanupRefs.current.forEach(cleanup => cleanup());
      videoCleanupRefs.current.clear();
      videoRefs.current.clear();
    };
  }, []);

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

  // Hide section if no video highlights available
  if (isHydrated && filteredCourses.length === 0) {
    console.log('Highlight Reel - No filtered courses, hiding section');
    return null;
  }

  return (
    <div className="w-full px-4 pb-4" style={{ paddingTop: '16px' }}>
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
                  // Calculate responsive width for Highlight Reel (slightly shorter than Recently Played, but wider cards)
                  const getCardWidth = () => {
                    if (windowWidth >= 1200) return 'calc(33.333% - 8px)'; // Desktop: 3 cards, 2 gaps of 12px = 24px / 3 = 8px per card
                    if (windowWidth >= 1024) return 'calc(33.333% - 8px)'; // Laptop: 3 cards, 2 gaps of 12px = 24px / 3 = 8px per card
                    if (windowWidth >= 768) return 'calc(50% - 6px)'; // Tablet: 2 cards, 1 gap of 12px = 12px / 2 = 6px per card
                    return 'calc(40vw - 0.5rem)'; // Mobile: 2.5 cards visible
                  };

                  const isSlotOne = index === currentIndex; // The card in slot one is the one at currentIndex
                  const videoId = userCourse.id; // userCourse.id already has 'video-' prefix from line 1147
                  const videoUrl = (userCourse as any).videoUrl || userCourse.golf_courses.thumbnail_image;
                  
                  // Skip if no valid video URL
                  if (!videoUrl) {
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
                      <div className="aspect-[5/4] w-full relative group">
                        {/* Video Element - Use HLSVideoCard with external management */}
                        <HLSVideoCard
                          key={videoId} // Add key to ensure proper remounting
                          ref={(videoElement: HTMLVideoElement | null) => {
                            if (videoElement && !videoRefs.current.has(videoId)) {
                              const cleanup = registerVideo(videoId, videoElement as HLSVideoElement);
                              videoCleanupRefs.current.set(videoId, cleanup);
                            }
                          }}
                          hlsUrl={videoUrl}
                          className="w-full h-full object-cover rounded-lg cursor-pointer"
                          loop={true}
                          muted={getVideoMuteState(videoId)}
                          autoplay={false}
                          externallyManaged={true}
                          showMuteButton={false}
                          onClick={() => {
                            if (playingVideoId === videoId) {
                              pauseVideo(videoId);
                            } else {
                              playExclusive(videoId, true);
                            }
                          }}
                        />

                         {/* Video Play Icon - Bottom Right - Hide for playing videos */}
                         {(playingVideoId !== videoId || isSlotOne) && (
                           <div className="absolute bottom-3 right-3 z-10 transition-opacity group-hover:opacity-80">
                             <div className="rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 w-5 h-5 md:w-7 md:h-7 flex items-center justify-center">
                               <Play className="w-3 h-3 md:w-4 md:h-4 text-white ml-0.5" fill="currentColor" />
                             </div>
                           </div>
                         )}

                         {/* Mute/Unmute Button - Top Right */}
                         <div className="absolute top-3 right-3 z-10">
                           <div className="rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 w-5 h-5 md:w-7 md:h-7 flex items-center justify-center cursor-pointer" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleMute(videoId);
                                }}>
                             {getVideoMuteState(videoId) ? (
                               <VolumeX className="w-3 h-3 md:w-4 md:h-4 text-white" fill="currentColor" />
                             ) : (
                               <Volume2 className="w-3 h-3 md:w-4 md:h-4 text-white" fill="currentColor" />
                             )}
                           </div>
                         </div>

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const topRatedSwipeRef = useRef<HTMLDivElement>(null);
  
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
                       <div className={`w-full ${windowWidth >= 768 ? 'aspect-[2.5/0.6]' : 'aspect-[2.5/1.2]'}`}>
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


// Regional Carousels Section Component
interface RegionalCarouselsSectionProps {
  userId?: string;
  isOwnProfile?: boolean;
}

const RegionalCarouselsSection: React.FC<RegionalCarouselsSectionProps> = ({ 
  userId,
  isOwnProfile = false
}) => {
  return (
    <div className="w-full px-4 pt-4 pb-8 mb-0">      
      {/* Worldwide Section */}
      <RegionalCarousel 
        userId={userId} 
        isOwnProfile={isOwnProfile} 
        region="worldwide"
        title="Worldwide"
      />
      
      {/* Great Britain & Ireland Section */}
      <RegionalCarousel 
        userId={userId} 
        isOwnProfile={isOwnProfile} 
        region="britain-ireland"
        title="Great Britain & Ireland"
      />
      
      {/* Continental Europe Section */}
      <RegionalCarousel 
        userId={userId} 
        isOwnProfile={isOwnProfile} 
        region="europe"
        title="Continental Europe"
      />
      
      {/* USA Section */}
      <RegionalCarousel 
        userId={userId} 
        isOwnProfile={isOwnProfile} 
        region="usa"
        title="USA"
      />
    </div>
  );
};

// Regional Carousel Component
interface RegionalCarouselProps {
  userId?: string;
  isOwnProfile?: boolean;
  region: 'worldwide' | 'britain-ireland' | 'europe' | 'usa';
  title: string;
}

const RegionalCarousel: React.FC<RegionalCarouselProps> = ({ 
  userId,
  isOwnProfile = false,
  region,
  title
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const carouselRef = useRef<HTMLDivElement>(null);
  
  // Track window width for responsive breakpoints
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const getCardsPerView = () => {
    if (windowWidth >= 1200) return 4; // Desktop: 4 cards
    if (windowWidth >= 1024) return 3; // Laptop: 3 cards  
    if (windowWidth >= 768) return 2;  // Tablet: 2 cards
    return 1; // Mobile: 1 with peek
  };
  
  const cardsPerView = getCardsPerView();

  // Query to get regional courses
  const { data: regionalCourses = [] } = useQuery({
    queryKey: [`${region}Courses`, userId],
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

      // Combine courses
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

      // Filter by region
      const filteredCourses = combinedCourses.filter((userCourse) => {
        const course = userCourse.golf_courses;
        if (!course) return false;

        switch (region) {
          case 'britain-ireland':
            return course.country === 'Britain & Ireland';
          case 'europe':
            return course.country === 'Continental Europe';
          case 'usa':
            return course.country === 'USA';
          case 'worldwide':
            return course.global_rank && course.global_rank <= 100;
          default:
            return false;
        }
      });

      // Remove duplicates based on course_id, preferring rated courses
      const uniqueCoursesMap = new Map();
      
      filteredCourses.forEach(course => {
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
      // Sort by rating (highest first) - default order
      return rawCourses.sort((a, b) => {
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        if (ratingA !== ratingB) return ratingB - ratingA;
        
        // Secondary sort by played date (most recent first)
        const dateA = new Date(a.played_date || 0).getTime();
        const dateB = new Date(b.played_date || 0).getTime();
        return dateB - dateA;
      });
    },
    enabled: !!userId,
  });

  const maxIndex = Math.max(0, regionalCourses.length - cardsPerView);

  const nextSlide = () => {
    const container = carouselRef.current;
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
    const container = carouselRef.current;
    if (container) {
      const cards = container.querySelectorAll('[data-card]');
      const prevIndex = Math.max(currentIndex - 1, 0);
      const targetCard = cards[prevIndex] as HTMLElement;
      if (targetCard) {
        container.scrollTo({ left: targetCard.offsetLeft, behavior: 'smooth' });
      }
    }
  };

  // Don't render if no courses
  if (regionalCourses.length === 0) return null;

  return (
    <div className="w-full px-4 pt-4 pb-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-0">
          <h3 className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-2xl text-foreground">
            {title}
          </h3>
          <div className="flex gap-2 items-center">
            {/* View All button */}
            <Button
              variant="ghost"
              size="sm"  
              className="text-muted-foreground hover:text-foreground h-8 px-2 text-sm"
            >
              View All ›
            </Button>
            
            {/* Navigation buttons */}
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
          <div 
            ref={carouselRef}
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
              {regionalCourses.map((userCourse, index) => {
                // Calculate responsive width based on exact breakpoints
                const getCardWidth = () => {
                  if (windowWidth >= 1200) return 'calc(25% - 9px)'; // Desktop: 4 cards
                  if (windowWidth >= 1024) return 'calc(33.333% - 8px)'; // Laptop: 3 cards
                  if (windowWidth >= 768) return 'calc(50% - 6px)'; // Tablet: 2 cards
                  return 'calc(100% - 6px)'; // Mobile: 1 card
                };

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
                    <div className={`w-full ${windowWidth >= 768 ? 'aspect-[3/4]' : 'aspect-[3/3.5]'}`}>
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
        </div>
      </div>
    </div>
  );
};

export default CoursesJourney;