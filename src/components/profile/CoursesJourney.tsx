import React, { useState, useEffect, useMemo } from 'react';
import { useTop100CoursesData } from '@/hooks/useTop100CoursesData';
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

  // Define the four regional achievements in order: Left → Right
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
    <div className={`w-full mb-6 md:mb-8 pt-0 ${className}`}>
      <div className="md:max-w-[1150px] md:mx-auto">
        {/* Course highlights section removed */}

        {/* Controls Section moved - now appears above depth stack carousel */}

        {/* Progress Rings Section */}
        <div className="relative py-16">
          {/* Desktop: Single row */}
          <div className="hidden md:flex gap-8 justify-center px-4">{/* Reduced gap and added padding */}
            {achievementRings.map((achievement, index) => {
              const progress = getProgressData(achievement.region);
              const animationDelay = index * 0.2;
              const completedAngle = (progress.percentage / 100) * 283; // 283 is circumference for strokeDasharray
              const remainingAngle = 283 - completedAngle;
              
              return (
                <div key={achievement.id} className="flex flex-col items-center cursor-pointer group">
                  <div className="w-44 h-44 relative transition-all duration-300 group-hover:scale-105">
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
                            <div className="text-2xl text-black font-semibold leading-none">
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
                            <div className="text-2xl text-black font-semibold leading-none">
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
                            <div className="text-2xl text-black font-semibold leading-none">
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
                            <div className="text-2xl text-black font-semibold leading-none">
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
                          <div className="text-2xl text-black font-semibold leading-none">
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
                  
                   {/* Achievement info below ring - reduced gap and larger text size */}
                   <div className="mt-0.5 text-center max-w-[200px]">
                     <div className="text-xl text-foreground font-semibold">
                       {achievement.title}
                     </div>
                   </div>
                </div>
              );
            })}
          </div>

          {/* Mobile: Swipeable carousel */}
          <div className="md:hidden">
            <div className="flex gap-8 overflow-x-auto scrollbar-hide pb-4 px-4"
                 style={{
                   scrollbarWidth: 'none',
                   msOverflowStyle: 'none',
                   WebkitOverflowScrolling: 'touch',
                   scrollSnapType: 'x mandatory'
                 }}>
              {achievementRings.map((achievement, index) => {
                const progress = getProgressData(achievement.region);
                const isLast = index === achievementRings.length - 1;
                const animationDelay = index * 0.15;
                const completedAngle = (progress.percentage / 100) * 283;
                
                return (
                  <div 
                    key={achievement.id} 
                    className={`flex-shrink-0 flex flex-col items-center cursor-pointer ${isLast ? 'pr-4' : ''}`}
                    style={{ scrollSnapAlign: 'start' }}
                  >
                    <div className="w-32 h-32 relative transition-all duration-300">
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
                          <div className="relative w-24 h-24 rounded-full overflow-hidden flex flex-col items-center justify-center">
                            {/* USA Map Background */}
                            <img
                              src="/lovable-uploads/6152bbaa-1d05-4eab-bbde-08d43b96a693.png"
                              alt="USA map background"
                              className="absolute inset-0 w-full h-full object-contain opacity-20"
                            />
                            {/* Overlay content */}
                            <div className="relative z-10 text-center">
                              <div className="text-xl text-foreground leading-none">
                                <span>{progress.played}</span>
                                <span className="text-muted-foreground"> / {progress.total}</span>
                              </div>
                               <div className="text-lg text-muted-foreground mt-1">
                                 {progress.played * 120} XP
                               </div>
                            </div>
                          </div>
                        ) : achievement.region === 'europe' ? (
                          <div className="relative w-24 h-24 rounded-full overflow-hidden flex flex-col items-center justify-center">
                            {/* Continental Europe Map Background */}
                            <img
                              src="/lovable-uploads/793041de-0d8b-4c78-8256-3447ad57dc44.png"
                              alt="Continental Europe map background"
                              className="absolute inset-0 w-full h-full object-contain opacity-20"
                            />
                            {/* Overlay content */}
                            <div className="relative z-10 text-center">
                              <div className="text-xl text-foreground leading-none">
                                <span>{progress.played}</span>
                                <span className="text-muted-foreground"> / {progress.total}</span>
                              </div>
                               <div className="text-lg text-muted-foreground mt-1">
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
                              className="absolute inset-0 w-full h-full object-contain opacity-20"
                            />
                            {/* Overlay content */}
                            <div className="relative z-10 text-center">
                              <div className="text-xl text-foreground leading-none">
                                <span>{progress.played}</span>
                                <span className="text-muted-foreground"> / {progress.total}</span>
                              </div>
                               <div className="text-lg text-muted-foreground mt-1">
                                 {progress.played * 120} XP
                               </div>
                            </div>
                          </div>
                        ) : achievement.region === 'global' ? (
                          <div className="relative w-24 h-24 rounded-full overflow-hidden flex flex-col items-center justify-center">
                            {/* World Map Background */}
                            <img
                              src="/lovable-uploads/c0ba76eb-90e6-404b-8df7-f9f34a43b606.png"
                              alt="World map background"
                              className="absolute inset-0 w-full h-full object-contain opacity-20"
                            />
                            {/* Overlay content */}
                            <div className="relative z-10 text-center">
                              <div className="text-xl text-foreground leading-none">
                                <span>{progress.played}</span>
                                <span className="text-muted-foreground"> / {progress.total}</span>
                              </div>
                               <div className="text-lg text-muted-foreground mt-1">
                                 {progress.played * 120} XP
                               </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="text-xl text-foreground leading-none">
                              <span>{progress.played}</span>
                              <span className="text-muted-foreground"> / {progress.total}</span>
                            </div>
                             <div className="text-lg text-muted-foreground mt-1">
                               {progress.played * 120} XP
                             </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                     {/* Achievement info */}
                     <div className="mt-1 text-center max-w-[140px]">
                       <div className="text-base text-foreground">
                         {achievement.title}
                       </div>
                     </div>
                  </div>
                );
              })}
              
              {/* Peek indicator for mobile */}
              <div className="flex-shrink-0 w-4"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recently Played Section - Copy of Courses Played */}
      <RecentlyPlayedSection userId={userId} isOwnProfile={isOwnProfile} />
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
  console.log('Sorting user courses in RecentlyPlayed:', userCourses.map(c => ({ 
    name: c.golf_courses?.name, 
    rating: c.rating 
  })));
  
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
  
  console.log('Final sorted order in RecentlyPlayed:', sortedCourses.map(c => ({ 
    name: c.golf_courses?.name, 
    rating: c.rating 
  })));
  
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
  const cardsPerView = 2; // Show 2 cards at a time

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
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  return (
    <div className="w-full px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-foreground">
            Recently Played
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevSlide}
              disabled={currentIndex === 0}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={nextSlide}
              disabled={currentIndex >= maxIndex}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="relative space-y-6">
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
            <div ref={swipeRef} className="overflow-hidden">
              <div 
                className="flex transition-transform duration-300 ease-in-out gap-6"
                style={{ 
                  transform: `translateX(-${currentIndex * (50)}%)` // Move by half container width to show 2 cards
                }}
              >
                {filteredCourses.map((userCourse) => (
                  <div 
                    key={userCourse.id} 
                    className="flex-shrink-0 w-[calc(50%-12px)]" // Half width minus gap
                  >
                    <CourseCard 
                      course={userCourse.golf_courses}
                      viewingUserId={userId}
                      viewContext="global"
                      userRating={userCourse.rating}
                      isReadOnly={!isOwnProfile}
                      showUserRating={true}
                      isFromUserCoursesPage={true}
                    />
                  </div>
                ))}
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

export default CoursesJourney;