import React, { useState, useEffect, useMemo, useRef } from 'react';
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
    <div className={`w-full pt-8 ${className}`}>
      <div className="md:max-w-[1150px] md:mx-auto">
        {/* Progress Rings Section */}
        <div className="relative">
          {/* Desktop: Single row */}
          <div className="hidden md:flex gap-8 justify-center px-4">
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
                      
                      {/* Center content - similar logic as desktop but smaller */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <div className="text-lg text-black leading-none">
                          <span>{progress.played}</span>
                          <span className="text-black/60 text-base"> / {progress.total}</span>
                        </div>
                        <div className="text-base text-black mt-0.5">
                          {progress.played * 120} XP
                        </div>
                      </div>
                    </div>
                    
                    {/* Achievement info below ring - mobile size */}
                    <div className="mt-1 text-center max-w-[90px]">
                      <div className="text-sm text-foreground font-medium leading-tight">
                        {achievement.title}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recently Played Section */}
        <RecentlyPlayedSection userId={userId} isOwnProfile={isOwnProfile} />

        {/* Top 10 Rated by You Section */}
        <TopRatedSection userId={userId} isOwnProfile={isOwnProfile} />

        {/* Courses by Region Section */}
        <CoursesbyRegionSection userId={userId} isOwnProfile={isOwnProfile} />
      </div>
    </div>
  );
};

// Recently Played Section Component - Exact copy of UserCoursesContent logic
interface RecentlyPlayedSectionProps {
  userId?: string;
  isOwnProfile?: boolean;
}

const RecentlyPlayedSection: React.FC<RecentlyPlayedSectionProps> = ({ 
  userId,
  isOwnProfile = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardsPerView = 2; // Show 2 cards at a time

  // Query to get recently played courses
  const { data: recentlyPlayedCourses = [] } = useQuery({
    queryKey: ['recentlyPlayedCourses', userId],
    queryFn: async () => {
      if (!userId) return [];

      // Get all played courses from Top 100 with timestamps
      const { data: top100Courses, error: top100Error } = await supabase
        .from('user_top100_courses')
        .select(`
          id,
          course_id,
          user_id,
          created_at,
          golf_courses (
            id,
            name,
            country,
            region,
            sub_country,
            global_rank,
            regional_rank,
            usa_rank,
            thumbnail_image
          )
        `)
        .eq('user_id', userId)
        .eq('played', true)
        .order('created_at', { ascending: false });

      if (top100Error) throw top100Error;

      // Get all rated courses with timestamps
      const { data: ratedCourses, error: ratedError } = await supabase
        .from('course_ratings')
        .select(`
          id,
          course_id,
          user_id,
          rating,
          created_at,
          golf_courses (
            id,
            name,
            country,
            region,
            sub_country,
            global_rank,
            regional_rank,
            usa_rank,
            thumbnail_image
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (ratedError) throw ratedError;

      // Combine and deduplicate
      const allCourses = [...(top100Courses || []), ...(ratedCourses || [])];
      const uniqueCourses = allCourses.filter((course, index, self) => 
        index === self.findIndex(c => c.course_id === course.course_id)
      );

      // Sort by created_at descending and take first 6
      return uniqueCourses
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
        .slice(0, 6);
    },
    enabled: !!userId,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });


  // Navigation helpers
  const maxIndex = Math.max(0, recentlyPlayedCourses.length - cardsPerView);
  
  const nextSlide = () => {
    if (currentIndex < maxIndex) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (recentlyPlayedCourses.length === 0) {
    return null;
  }

  return (
    <div className="w-full px-4 pt-8 pb-4">
      <div className="max-w-6xl mx-auto">
        {/* Recently Played title */}
        <div className="flex items-center justify-between mb-6">
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
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-300 ease-in-out gap-6"
              style={{ 
                transform: `translateX(-${currentIndex * (100 / cardsPerView)}%)` 
              }}
            >
              {recentlyPlayedCourses.map((userCourse) => (
                <div 
                  key={userCourse.id} 
                  className="flex-shrink-0 w-[calc(50%-12px)]"
                >
                  <CourseCard 
                    course={userCourse.golf_courses}
                    viewingUserId={userId}
                    viewContext="global"
                    userRating={null}
                    isReadOnly={!isOwnProfile}
                    showUserRating={true}
                    isFromUserCoursesPage={true}
                    customHeight="h-[400px]"
                    hideRankingBadges={true}
                    showCountryWithFlag={true}
                    showXP={true}
                    xp={100}
                    disableClick={true}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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

      const { data, error } = await supabase
        .from('course_ratings')
        .select(`
          id,
          course_id,
          user_id,
          rating,
          created_at,
          golf_courses (
            id,
            name,
            country,
            region,
            sub_country,
            global_rank,
            regional_rank,
            usa_rank,
            thumbnail_image
          )
        `)
        .eq('user_id', userId)
        .gte('rating', 8) // Only show ratings of 8 or higher
        .order('rating', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });


  // Navigation helpers
  const maxIndex = Math.max(0, topRatedCourses.length - cardsPerView);
  
  const nextSlide = () => {
    if (currentIndex < maxIndex) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (topRatedCourses.length === 0) {
    return null;
  }

  return (
    <div className="w-full px-4 pt-8 pb-4">
      <div className="max-w-6xl mx-auto">
        {/* Top 10 Rated by You title */}
        <div className="flex items-center justify-between mb-6">
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
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-300 ease-in-out gap-6"
              style={{ 
                transform: `translateX(-${currentIndex * (100 / cardsPerView)}%)` 
              }}
            >
              {topRatedCourses.map((courseRating) => (
                <div 
                  key={courseRating.id} 
                  className="flex-shrink-0 w-[calc(50%-12px)]"
                >
                  <CourseCard 
                    course={courseRating.golf_courses}
                    viewingUserId={userId}
                    viewContext="global"
                    userRating={courseRating.rating}
                    isReadOnly={!isOwnProfile}
                    showUserRating={true}
                    isFromUserCoursesPage={true}
                    customHeight="h-[400px]"
                    hideRankingBadges={true}
                    showCountryWithFlag={true}
                    showXP={true}
                    xp={100}
                    disableClick={true}
                  />
                </div>
              ))}
            </div>
          </div>
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
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('rank');
  const { viewType, setViewType, isHydrated } = useViewPreference();
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardsPerView = 2; // Show 2 cards at a time

  // Query to get courses by region
  const { data: allPlayedCourses = [] } = useQuery({
    queryKey: ['allPlayedCourses', userId],
    queryFn: async () => {
      if (!userId) return [];

      // Get all played courses from Top 100 with ratings
      const { data: top100Courses, error: top100Error } = await supabase
        .from('user_top100_courses')
        .select(`
          id,
          course_id,
          user_id,
          created_at,
          golf_courses (
            id,
            name,
            country,
            region,
            sub_country,
            global_rank,
            regional_rank,
            usa_rank,
            thumbnail_image
          )
        `)
        .eq('user_id', userId)
        .eq('played', true);

      if (top100Error) throw top100Error;

      // Get all rated courses
      const { data: ratedCourses, error: ratedError } = await supabase
        .from('course_ratings')
        .select(`
          id,
          course_id,
          user_id,
          rating,
          created_at,
          golf_courses (
            id,
            name,
            country,
            region,
            sub_country,
            global_rank,
            regional_rank,
            usa_rank,
            thumbnail_image
          )
        `)
        .eq('user_id', userId);

      if (ratedError) throw ratedError;

      // Combine and deduplicate, preferring ratings from course_ratings table
      const coursesMap = new Map();
      
      // Add Top 100 courses first
      top100Courses?.forEach(course => {
        coursesMap.set(course.course_id, course);
      });
      
      // Override with ratings from course_ratings table if available
      ratedCourses?.forEach(course => {
        coursesMap.set(course.course_id, course);
      });

      return Array.from(coursesMap.values());
    },
    enabled: !!userId,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    let courses = [...allPlayedCourses];
    
    // Apply regional filter if selected
    if (activeFilter) {
      courses = courses.filter(course => {
        const golfCourse = course.golf_courses;
        if (!golfCourse) return false;

        if (activeFilter === 'britain-ireland') {
          return golfCourse.country === 'Britain & Ireland';
        } else if (activeFilter === 'continental-europe') {
          return golfCourse.country === 'Continental Europe';
        } else if (activeFilter === 'usa') {
          return golfCourse.country === 'USA';
        }
        return true;
      });
    }

    // Sort courses
    if (sortBy === 'recent') {
      courses.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    } else if (sortBy === 'rating') {
      courses.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'rank') {
      courses.sort((a, b) => {
        const rankA = a.golf_courses?.global_rank || a.golf_courses?.regional_rank || a.golf_courses?.usa_rank || 9999;
        const rankB = b.golf_courses?.global_rank || b.golf_courses?.regional_rank || b.golf_courses?.usa_rank || 9999;
        return rankA - rankB;
      });
    }

    return courses;
  }, [allPlayedCourses, activeFilter, sortBy]);


  // Navigation helpers
  const maxIndex = Math.max(0, filteredCourses.length - cardsPerView);
  
  const nextSlide = () => {
    if (currentIndex < maxIndex) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (filteredCourses.length === 0) {
    return null;
  }

  return (
    <div className="w-full px-4 pt-8 pb-4">
      <div className="max-w-6xl mx-auto">
        {/* Courses by Region title */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-3xl text-foreground">
            Courses by Region
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
            <div className="overflow-hidden">
              <div 
                className="flex transition-transform duration-300 ease-in-out gap-6"
                style={{ 
                  transform: `translateX(-${currentIndex * (100 / cardsPerView)}%)` 
                }}
              >
                {filteredCourses.map((userCourse) => (
                  <div 
                    key={userCourse.id} 
                    className="flex-shrink-0 w-[calc(50%-12px)]"
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
                      disableClick={true}
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