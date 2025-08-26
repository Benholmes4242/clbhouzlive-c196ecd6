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
import LatestHighlights from '@/components/courses/highlights/LatestHighlights';

interface CoursesJourneyProps {
  className?: string;
  userId?: string;
  userDisplayName?: string;
  isOwnProfile?: boolean;
}

// My Highlights Section Component
interface MyHighlightsSectionProps {
  userId?: string;
  isOwnProfile?: boolean;
  userFirstName?: string;
}

const MyHighlightsSection: React.FC<MyHighlightsSectionProps> = ({ 
  userId,
  isOwnProfile = false,
  userFirstName = 'User'
}) => {
  return (
    <div className="w-full px-4 pt-0 pb-8">
      <div className="max-w-6xl mx-auto">
        {/* Highlights From My Journey title - matches Top 10 Rated by You exact structure */}
        <div className="flex items-center justify-between mb-0">
          <h3 className="text-3xl text-foreground">
            Highlights From My Journey
          </h3>
          <div className="flex gap-2">
            {/* Empty div to maintain same height as Top 10 section with buttons */}
          </div>
        </div>
        
        <LatestHighlights 
          userId={userId || ''} 
          isOwnProfile={isOwnProfile}
          userFirstName={userFirstName}
        />
      </div>
    </div>
  );
};

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

          {/* Mobile: Swipeable carousel */}
          <div className="md:hidden">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-4 px-0"
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
                    className={`flex-shrink-0 flex flex-col items-center cursor-pointer ${isLast ? 'pr-0' : ''}`}
                    style={{ scrollSnapAlign: 'start', minWidth: '24vw' }}
                  >
                    <div className="w-28 h-28 relative transition-all duration-300">
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
                              className="absolute inset-0 w-full h-full object-contain opacity-20"
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
                              className="absolute inset-0 w-full h-full object-contain opacity-20"
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
                          <div className="relative w-16 h-16 rounded-full overflow-hidden flex flex-col items-center justify-center">
                            {/* UK & Ireland Map Background */}
                            <img
                              src="/lovable-uploads/dc0f671b-b75f-4121-8ebd-18dd7f9b67c3.png"
                              alt="UK & Ireland map background"
                              className="absolute inset-0 w-full h-full object-contain opacity-20"
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
                              className="absolute inset-0 w-full h-full object-contain opacity-20"
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
                     <div className="mt-1 text-center max-w-[80px]">
                       <div className="text-xs text-foreground leading-tight">
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

      {/* Top 10 Rated by You Section */}
      <TopRatedSection userId={userId} isOwnProfile={isOwnProfile} />

      {/* Highlight Reel Section */}
      <HighlightReelSection userId={userId} isOwnProfile={isOwnProfile} />

      {/* My Highlights Section */}
      <MyHighlightsSection userId={userId} isOwnProfile={isOwnProfile} userFirstName={userDisplayName?.split(' ')[0] || 'User'} />

      {/* Courses by Region Section */}
      <CoursesbyRegionSection userId={userId} isOwnProfile={isOwnProfile} />
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
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  return (
    <div className="w-full px-4 pt-4 pb-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-3xl text-foreground">
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
            <div ref={swipeRef} className="overflow-hidden">
              <div 
                className="flex transition-transform duration-300 ease-in-out gap-3"
                style={{ 
                  transform: `translateX(-${currentIndex * (50)}%)` // Move by half container width to show 2 cards
                }}
              >
                {filteredCourses.map((userCourse) => (
                  <div 
                    key={userCourse.id} 
                    className="flex-shrink-0 w-[calc(27%-12px)]" // Reduced width by another 10% (from 30% to 27%)
                  >
                    <CourseCard 
                      course={userCourse.golf_courses}
                      viewingUserId={userId}
                      viewContext="global"
                      userRating={userCourse.rating}
                      isReadOnly={!isOwnProfile}
                      showUserRating={true}
                      isFromUserCoursesPage={true}
                      customHeight="h-[400px]"
                      hideRankingBadges={true}
                      showCountryWithFlag={true}
                      showXP={true}
                      xp={100}
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

// Highlight Reel Section Component - Uses same video logic as Highlights From My Journey
interface HighlightReelSectionProps {
  userId?: string;
  isOwnProfile?: boolean;
}

interface HighlightVideo {
  id: string;
  courseId: string;
  courseName: string;
  location: string;
  thumbnail: string;
  videoUrl?: string;
  caption: string;
  duration?: string;
  created_at: string;
  globalRank?: number | null;
  regionalRank?: number | null;
  usaRank?: number | null;
  country: string;
  averageRating?: number | null;
}

const HighlightReelSection: React.FC<HighlightReelSectionProps> = ({ 
  userId,
  isOwnProfile = false
}) => {
  const [highlights, setHighlights] = useState<HighlightVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardsPerView = 2; // Show 2 cards at a time

  useEffect(() => {
    const fetchUserVideoHighlights = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        
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

        if (postsError) {
          console.error('Error fetching posts:', postsError);
          return;
        }

        if (!posts || posts.length === 0) {
          setHighlights([]);
          return;
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

        if (tagsError) {
          console.error('Error fetching tags:', tagsError);
          return;
        }

        // Get golf course details for tagged courses
        const courseIds = tags?.map(tag => tag.taggable_entities.entity_id) || [];
        if (courseIds.length === 0) {
          setHighlights([]);
          return;
        }

        const { data: courses, error: coursesError } = await supabase
          .from('golf_courses')
          .select(`
            id,
            name,
            country,
            sub_country,
            region,
            global_rank,
            regional_rank,
            usa_rank,
            thumbnail_image
          `)
          .in('id', courseIds)
          .or('global_rank.not.is.null,regional_rank.not.is.null,usa_rank.not.is.null'); // Only top 100 courses

        if (coursesError) {
          console.error('Error fetching courses:', coursesError);
          return;
        }

        // Get average ratings for these courses
        const { data: ratingStats, error: ratingsError } = await supabase
          .from('course_rating_stats')
          .select('course_id, average_rating')
          .in('course_id', courseIds);

        if (ratingsError) {
          console.error('Error fetching course ratings:', ratingsError);
        }

        // Combine the data and filter for posts that have golf course tags
        const transformedHighlights: HighlightVideo[] = posts
          .map(post => {
            // Find the tag for this post
            const postTag = tags?.find(tag => tag.post_id === post.id);
            if (!postTag) return null;

            // Find the course details
            const course = courses?.find(c => c.id === postTag.taggable_entities.entity_id);
            if (!course) return null;

            const media = post.post_media[0];

            // Format location
            const getLocation = () => {
              const baseLocation = course.country || course.sub_country || course.region || 'Unknown Location';
              if (course.regional_rank) {
                return `${baseLocation} #${course.regional_rank}`;
              }
              return baseLocation;
            };

            // Find the course rating stats
            const courseRating = ratingStats?.find(r => r.course_id === course.id);

            const highlight: HighlightVideo = {
              id: post.id,
              courseId: course.id,
              courseName: course.name,
              location: getLocation(),
              thumbnail: media?.media_url || course.thumbnail_image || '/placeholder.svg',
              videoUrl: media?.media_url,
              caption: post.content || 'Golf moment at this amazing course',
              created_at: post.created_at,
              globalRank: course.global_rank,
              regionalRank: course.regional_rank,
              usaRank: course.usa_rank,
              country: course.country,
              averageRating: courseRating?.average_rating ? Math.round(courseRating.average_rating * 10) / 10 : null
            };

            return highlight;
          })
          .filter((highlight: HighlightVideo | null): highlight is HighlightVideo => highlight !== null);

        setHighlights(transformedHighlights);
      } catch (error) {
        console.error('Error fetching video highlights:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserVideoHighlights();
  }, [userId]);

  const maxIndex = Math.max(0, highlights.length - cardsPerView);

  const nextSlide = () => {
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  // Hide section if no highlights available
  if (!loading && highlights.length === 0) {
    return null;
  }

  return (
    <div className="w-full px-4 pt-4 pb-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-3xl text-foreground">
            Highlight Reel
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
          {loading ? (
            <div className="text-center py-8">
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-muted-foreground">
                  Loading highlights...
                </span>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden">
              <div 
                className="flex transition-transform duration-300 ease-in-out gap-3"
                style={{ 
                  transform: `translateX(-${currentIndex * (50)}%)` // Move by half container width to show 2 cards
                }}
              >
                {highlights.map((highlight) => (
                  <div 
                    key={highlight.id} 
                    className="flex-shrink-0 w-[calc(50%-6px)]" // Show 2 cards with gap
                  >
                    <div className="bg-card rounded-lg overflow-hidden h-[400px] relative">
                      {/* Video thumbnail */}
                      <div className="relative h-64 bg-gray-200">
                        <img
                          src={highlight.thumbnail}
                          alt={highlight.courseName}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <div className="w-0 h-0 border-l-[8px] border-l-white border-y-[6px] border-y-transparent ml-1"></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Course info */}
                      <div className="p-4">
                        <h4 className="font-semibold text-lg text-foreground mb-1">
                          {highlight.courseName}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {highlight.location}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {highlight.caption}
                        </p>
                        
                        {/* Ranking badges */}
                        <div className="flex gap-2 mt-3">
                          {highlight.globalRank && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                              Global #{highlight.globalRank}
                            </span>
                          )}
                          {highlight.regionalRank && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                              Regional #{highlight.regionalRank}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
  const cardsPerView = 2; // Show 2 cards at a time

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
        .order('rating', { ascending: false })
        .limit(10);

      if (ratedError) throw ratedError;

      return (ratedData || []).map(course => ({
        ...course,
        played_date: course.created_at, // Use rating date as played date
        id: `rating-${course.course_id}` // Unique ID
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
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  return (
    <div className="w-full px-4 pt-0 pb-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-0">
          <h3 className="text-3xl text-foreground">
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
            <div ref={swipeRef} className="overflow-hidden">
              <div 
                className="flex transition-transform duration-300 ease-in-out gap-3"
                style={{ 
                  transform: `translateX(-${currentIndex * (50)}%)` // Move by half container width to show 2 cards
                }}
              >
                {topRatedCourses.map((userCourse) => (
                  <div 
                    key={userCourse.id} 
                     className="flex-shrink-0 w-[calc(84%-12px)]" // Increased width by another 20% (from 70% to 84%)
                   >
                     <CourseCard 
                       course={userCourse.golf_courses}
                       viewingUserId={userId}
                       viewContext="global"
                       userRating={userCourse.rating}
                       isReadOnly={!isOwnProfile}
                       showUserRating={true}
                       isFromUserCoursesPage={true}
                       customHeight="h-[266px]" // Reduced height by 20% (from 333px to 266px)
                       hideRankingBadges={true}
                       showAIQuote={true}
                     />
                   </div>
                ))}
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
}

const CoursesbyRegionSection: React.FC<CoursesbyRegionSectionProps> = ({ 
  userId,
  isOwnProfile = false
}) => {
  return (
    <div className="w-full px-4 pt-4 pb-8 mb-0">
      <div className="max-w-6xl mx-auto">
        {/* Courses by Region title - matches Top 10 Rated by You style */}
        <div className="flex items-center justify-between mb-0">
          <h3 className="text-3xl text-foreground">
            Courses by Region
          </h3>
          <div className="flex gap-2">
            {/* Navigation buttons moved here from Great Britain section */}
            <GreatBritainIrelandNavigation userId={userId} isOwnProfile={isOwnProfile} />
          </div>
        </div>
        
        {/* Great Britain & Ireland subtitle */}
        <h4 className="text-xl text-muted-foreground mb-0">
          Great Britain & Ireland
        </h4>
      </div>
      
      {/* Great Britain & Ireland Courses Section - no gap */}
      <GreatBritainIrelandSection userId={userId} isOwnProfile={isOwnProfile} />
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
  // Use the same state management pattern as the main section
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardsPerView = 2;

  // Same query as the main section to get the data for navigation
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
      return getSortedUserCourses(rawCourses, 'recent');
    },
    enabled: !!userId,
  });

  const maxIndex = Math.max(0, gbIrelandCourses.length - cardsPerView);

  const nextSlide = () => {
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
    // Trigger the same navigation in the main section
    window.dispatchEvent(new CustomEvent('gbireland-nav', { detail: { action: 'next' } }));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
    // Trigger the same navigation in the main section
    window.dispatchEvent(new CustomEvent('gbireland-nav', { detail: { action: 'prev' } }));
  };

  return (
    <>
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
    </>
  );
};

// Great Britain & Ireland Section Component
interface GreatBritainIrelandSectionProps {
  userId?: string;
  isOwnProfile?: boolean;
}

const GreatBritainIrelandSection: React.FC<GreatBritainIrelandSectionProps> = ({ 
  userId,
  isOwnProfile = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardsPerView = 2; // Show 2 cards at a time

  // Query to get Great Britain & Ireland courses
  const { data: gbIrelandCourses = [] } = useQuery({
    queryKey: ['gbIrelandCourses', userId],
    queryFn: async () => {
      if (!userId) return [];

      // Get courses from user_top100_courses table for GB&I
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

      // Get courses from course_ratings table for GB&I
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

      // Combine and filter for Great Britain & Ireland only
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

      // Filter for Great Britain & Ireland courses only
      const gbIrelandCourses = combinedCourses.filter((userCourse) => {
        const course = userCourse.golf_courses;
        return course && course.country === 'Britain & Ireland';
      });

      // Remove duplicates based on course_id, preferring rated courses over top100 courses
      const uniqueCoursesMap = new Map();
      
      gbIrelandCourses.forEach(course => {
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
      
      // Apply sorting by recent play date
      return getSortedUserCourses(rawCourses, 'recent');
    },
    enabled: !!userId,
  });

  const { isHydrated } = useViewPreference();

  const maxIndex = Math.max(0, gbIrelandCourses.length - cardsPerView);

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

  // Listen for navigation events from the navigation component
  useEffect(() => {
    const handleNavigation = (event: any) => {
      if (event.detail.action === 'next') {
        nextSlide();
      } else if (event.detail.action === 'prev') {
        prevSlide();
      }
    };

    window.addEventListener('gbireland-nav', handleNavigation);
    return () => window.removeEventListener('gbireland-nav', handleNavigation);
  }, []);

  return (
    <div className="w-full px-4 pt-0">
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
            <div ref={swipeRef} className="overflow-hidden">
              <div 
                className="flex transition-transform duration-300 ease-in-out gap-6"
                style={{ 
                  transform: `translateX(-${currentIndex * (50)}%)` // Move by half container width to show 2 cards
                }}
              >
                {gbIrelandCourses.map((userCourse) => (
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
                      customHeight="h-[333px]"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {isOwnProfile ? "You haven't played any Great Britain & Ireland courses yet." : "No Great Britain & Ireland courses found."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoursesJourney;