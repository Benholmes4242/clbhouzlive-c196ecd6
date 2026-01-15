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
import { useCarouselNavigation } from '@/hooks/useCarouselNavigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import EnhancedRegionalCoursesModal from './EnhancedRegionalCoursesModal';
import { useDragScroll } from '@/hooks/useDragScroll';
import { useSyncRatedHeightVar } from '@/hooks/useSyncRatedHeightVar';
import { usePlayedCoursesWithRatings } from '@/hooks/usePlayedCoursesWithRatings';
import { useSectionLoader } from '@/hooks/useSectionLoader';
import SkeletonRow from '@/components/ui/SkeletonRow';
import HighlightsCarousel from './HighlightsCarousel';
import { HorizontalCarousel } from '@/components/ui/HorizontalCarousel';
import { CarouselItem } from '@/components/ui/CarouselItem';
import TopTenCoursesRatedByYou from '@/components/TopTenCoursesRatedByYou';
import ProfileModalRouter from './ProfileModalRouter';


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
  const [topTenModalOpen, setTopTenModalOpen] = useState(false);

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
  const regions = ['global', 'usa', 'britain-ireland', 'europe'] as const;
  
  // Build a stable key of the inputs that actually matter
  const progressKey = useMemo(() => {
    const payload = regions.map((r) => {
      const p = regionProgress?.[r] || { played: 0, total: 0 };
      return [r, p.played, p.total];
    });
    return JSON.stringify(payload);
  }, [regionProgress]);

  const inFlightRef = useRef(false);

  useEffect(() => {
    if (isLoading) return;           // don't run while loading
    if (inFlightRef.current) return; // prevent overlap

    const run = async () => {
      try {
        inFlightRef.current = true;

        const messages: Record<string, string> = {};
        for (const region of regions) {
          const progress = regionProgress?.[region];
          if (!progress || progress.total <= 0) continue;

          try {
            const message = await generateMotivation(
              region,
              progress.played,
              progress.total
            );
            messages[region] = message;
          } catch (err) {
            console.error(`Error generating motivation for ${region}:`, err);
          }
        }

        setMotivationalMessages(messages);
      } finally {
        inFlightRef.current = false;
      }
    };

    if (regionProgress && Object.keys(regionProgress).length > 0) {
      run();
    }
    // deps: only re-run when the numeric progress changes, or when the memoized function identity changes
  }, [progressKey, isLoading, generateMotivation]);

  return (
    <div className={`w-full pt-8 ${className}`}>
      <div className="md:max-w-[1150px] md:mx-auto">
        {/* Course highlights section removed */}

        {/* Controls Section moved - now appears above depth stack carousel */}

        {/* Top 10 Courses Rated by You Section - mirrors Your Top 10 bar */}
        <TopTenCoursesRatedByYou
          isOwnProfile={isOwnProfile}
          userDisplayName={userDisplayName}
          onOpenModal={() => setTopTenModalOpen(true)} // Opens worldwide modal
          userId={userId}
        />

        {/* Recently Played Section - Copy of Courses Played */}
        <RecentlyPlayedSection userId={userId} isOwnProfile={isOwnProfile} />

        {/* Highlights From My Journey Section */}
        <div className="w-full px-4 pt-4 pb-3">
          <div className="max-w-6xl mx-auto">
            <HighlightsCarousel userId={userId} className="mb-0" />
          </div>
        </div>

        {/* Courses by Region title */}
        <div className="w-full px-4 pt-3 pb-0">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-0">
              <h3 className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-2xl text-foreground mb-0">
                Courses by Region
              </h3>
            </div>
          </div>
        </div>

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
                               <div className="text-lg text-black leading-none">
                                 <span>{progress.played}</span>
                                 <span className="text-black/60"> / {progress.total}</span>
                               </div>
                                <div className="text-xs text-black mt-0.5">
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
                               <div className="text-lg text-black leading-none">
                                 <span>{progress.played}</span>
                                 <span className="text-black/60"> / {progress.total}</span>
                               </div>
                                <div className="text-xs text-black mt-0.5">
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
                               <div className="text-lg text-black leading-none">
                                 <span>{progress.played}</span>
                                 <span className="text-black/60"> / {progress.total}</span>
                               </div>
                                <div className="text-xs text-black mt-0.5">
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
                               <div className="text-lg text-black leading-none">
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
                             <div className="text-lg text-black leading-none">
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
                    
                     {/* Achievement info below ring - mobile size */}
                     <div className="mt-0.5 text-center max-w-[80px]">
                       <div className="text-xs text-foreground leading-tight">
                         {achievement.title === 'Great Britain & Ireland' ? (
                           <>
                             <div>Great Britain</div>
                             <div>& Ireland</div>
                           </>
                         ) : achievement.title === 'Continental Europe' ? (
                           <>
                             <div>Continental</div>
                             <div>Europe</div>
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

        {/* Courses by Region Section */}
        <div className="mt-1.5"> {/* 6px spacing */}
          <CoursesbyRegionSection userId={userId} isOwnProfile={isOwnProfile} userDisplayName={userDisplayName} />
        </div>

        {/* Top 10 Modal - Reusing Worldwide modal for editing Top 10 */}
        <EnhancedRegionalCoursesModal
          isOpen={topTenModalOpen}
          onClose={() => setTopTenModalOpen(false)}
          regionName="Worldwide"
          courses={[]} // Will be loaded by the modal
          isOwnProfile={isOwnProfile}
          userId={userId}
        />
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
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  
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

  // Use section loader for consistent loading states
  const recentlyPlayedLoader = useSectionLoader(useCallback(async () => {
    if (!userId) return [];

    // RATINGS-ONLY: Get courses from course_ratings table only
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
      .order('created_at', { ascending: false });

    if (ratedError) throw ratedError;

    // Map to expected format with played_date from created_at
    const rawCourses = (ratedData || []).map(course => ({
      ...course,
      played_date: course.created_at,
    }));
    
    // Apply sorting here to ensure proper order
    return getSortedUserCourses(rawCourses, 'recent');
  }, [userId]));

  // Filter and sort courses based on active filter and sort option
  const filteredCourses = useMemo(() => {
    let coursesToFilter = recentlyPlayedLoader.data;
    
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
  }, [recentlyPlayedLoader.data, activeFilter, sortBy]);

  // Use carousel navigation for touch/swipe and mouse drag scrolling
  const { carouselRef, canScrollLeft, canScrollRight, scroll, isMobile } = useCarouselNavigation(filteredCourses.length);

  // Only render section if loading or has data (hide entirely when empty)
  if (recentlyPlayedLoader.isEmpty) {
    return null;
  }

  return (
    <section className="w-full fullbleed md:mx-auto md:px-0 pt-4 pb-4" data-section="recently-rated">
      <div className="max-w-none md:max-w-6xl md:mx-auto">
        <div className="flex items-center justify-between px-4 md:px-0">
          <h3 className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-2xl text-foreground">
            Recently Rated
          </h3>
          <div className="flex gap-2">
            {canScrollLeft && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => scroll('left')}
                className="h-12 w-12 p-0 hover:bg-transparent focus:outline-none focus:ring-0 focus:border-0"
              >
                <ChevronLeft className="h-10 w-10" />
              </Button>
            )}
            {canScrollRight && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => scroll('right')}
                className="h-12 w-12 p-0 hover:bg-transparent focus:outline-none focus:ring-0 focus:border-0"
              >
                <ChevronRight className="h-10 w-10" />
              </Button>
            )}
          </div>
        </div>
        
        <div className="relative">
          {recentlyPlayedLoader.loading && <SkeletonRow count={6} />}
          {recentlyPlayedLoader.hasData && (
            <div
              ref={carouselRef}
              className="
                flex overflow-x-auto no-scrollbar
                gap-1 sm:gap-2 md:gap-3 lg:gap-3 xl:gap-4
              "
            >
                {filteredCourses.map((userCourse, index) => {

                  return (
                    <article 
                      key={`recently-played-${userCourse.course_id || userCourse.golf_courses?.id || userCourse.id}-${index}`}
                      className="
                        shrink-0
                        basis-[calc(100vw/2.6)]
                        md:basis-[calc((100%-((var(--g,1rem)*(var(--cards,4)-1))))/var(--cards,4))]
                      "
                    >
                      <div className="relative w-[calc(100vw/2.6)] md:w-full aspect-[4/5] overflow-hidden">
                        <div className="absolute inset-0 w-full h-full">
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
                            showXP={false}
                            hideRankingBadges={true}
                            mobileTextScale={windowWidth < 768 ? 'small' : 'small'}
                            mobileFlagSize={windowWidth < 768 ? 'md' : 'md'}
                          />
                        </div>
                      </div>
                    </article>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </section>
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
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  
  // Track window width for responsive breakpoints
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Query to get courses from user's ratings (ratings-only: single source of truth)
  const { data: allPlayedCourses = [] } = useQuery({
    queryKey: ['highlightReelCourses', userId],
    queryFn: async () => {
      if (!userId) return [];

      // RATINGS-ONLY: Get courses from course_ratings table
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('course_ratings')
        .select(`
          course_id,
          created_at,
          rating,
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
        .not('rating', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

      if (ratingsError) throw ratingsError;

      // Transform to course format
      return (ratingsData || []).map(rating => ({
        course_id: rating.course_id,
        played_date: rating.created_at,
        rating: rating.rating,
        id: `course-${rating.course_id}`,
        golf_courses: rating.golf_courses
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

  // Use carousel navigation with proper item count and combined ref
  const {
    carouselRef: combinedRef,
    canScrollLeft,
    canScrollRight,
    scroll
  } = useCarouselNavigation(filteredCourses.length);

  // Combine with swipe gestures
  const swipeRef = useSwipeGesture({
    onSwipeLeft: () => scroll('right'),
    onSwipeRight: () => scroll('left'),
    threshold: 50
  });

  // Combined ref callback for both carousel and swipe functionality
  const highlightReelRefCallback = useCallback((node: HTMLDivElement | null) => {
    combinedRef(node);
    swipeRef.current = node;
  }, [combinedRef, swipeRef]);

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
            {canScrollLeft && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => scroll('left')}
                className="h-12 w-12 p-0 hover:bg-transparent focus:outline-none focus:ring-0 focus:border-0"
              >
                <ChevronLeft className="h-10 w-10" />
              </Button>
            )}
            {canScrollRight && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => scroll('right')}
                className="h-12 w-12 p-0 hover:bg-transparent focus:outline-none focus:ring-0 focus:border-0"
              >
                <ChevronRight className="h-10 w-10" />
              </Button>
            )}
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
                 className="
                    flex overflow-x-auto no-scrollbar gap-1 sm:gap-2 md:gap-3 lg:gap-3 xl:gap-4
                   [--cards:2.5] md:[--cards:4.5] lg:[--cards:4.5] xl:[--cards:4.5]
                   [--g:0.5rem] sm:[--g:0.75rem] md:[--g:1rem] lg:[--g:1.25rem] xl:[--g:1.5rem]
                 "
               >
                 {filteredCourses.map((userCourse, index) => {

                  // Use static image from course data
                  const imageUrl = userCourse.golf_courses.thumbnail_image;
                  
                  // Skip if no valid image URL
                  if (!imageUrl) {
                    return null;
                  }

                   return (
                     <div 
                       key={userCourse.id}
                       className="shrink-0 basis-[calc((100%-((var(--g)*(var(--cards)-1))))/var(--cards))] data-card"
                    >
                      <div className="aspect-[4/5] w-full relative group">
                        {/* Static Image Element */}
                        <img
                          src={imageUrl}
                          alt={userCourse.golf_courses.name}
                          className="w-full h-full object-cover rounded-none"
                        />

                        {/* Course Info Overlay - removed course name and location */}
                      </div>
                     </div>
                  );
                })}
               </div>
          ) : activeFilter ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No courses found in the selected region.
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {isOwnProfile ? "No highlights to show yet. Play some courses to see them here!" : "No highlights available."}
              </p>
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
  const { user: currentUser } = useSupabaseSession();
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  
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

  // Use section loader for consistent loading states
  const topRatedLoader = useSectionLoader(useCallback(async () => {
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
      .from('course_rating_aggregates')
      .select('course_id, avg_overall_score')
      .in('course_id', courseIds);

    if (statsError) throw statsError;

    // Create a map for quick lookup
    const statsMap = new Map();
    (statsData || []).forEach(stat => {
      statsMap.set(stat.course_id, stat.avg_overall_score);
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
  }, [userId]));

  // Use carousel navigation with proper item count and combined ref
  const {
    carouselRef: combinedRef,
    canScrollLeft,
    canScrollRight,
    scroll
  } = useCarouselNavigation(topRatedLoader.data.length);

  // Native touch scrolling only - no programmatic swipe paging
  const topRatedRefCallback = useCallback((node: HTMLDivElement | null) => {
    combinedRef(node);
  }, [combinedRef]);

  return (
      <div className="w-full px-4 pt-0 pb-0">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-0">
            <h3 className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-2xl text-foreground">
              Top 10 Rated by You
            </h3>
          <div className="flex gap-2">
            {canScrollLeft && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => scroll('left')}
                className="h-12 w-12 p-0 hover:bg-transparent focus:outline-none focus:ring-0 focus:border-0"
              >
                <ChevronLeft className="h-10 w-10" />
              </Button>
            )}
            {canScrollRight && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => scroll('right')}
                className="h-12 w-12 p-0 hover:bg-transparent focus:outline-none focus:ring-0 focus:border-0"
              >
                <ChevronRight className="h-10 w-10" />
              </Button>
            )}
          </div>
        </div>
        
        <div className="relative">
          {topRatedLoader.loading && <SkeletonRow count={6} />}
          {topRatedLoader.hasData && (
            <div
              ref={topRatedRefCallback}
              className="
                 flex overflow-x-auto no-scrollbar gap-1 sm:gap-2 md:gap-3 lg:gap-3 xl:gap-4
                [--cards:2.5] md:[--cards:4.5] lg:[--cards:4.5] xl:[--cards:4.5]
                [--g:0.5rem] sm:[--g:0.75rem] md:[--g:1rem] lg:[--g:1.25rem] xl:[--g:1.5rem]
              "
            >
                 {topRatedLoader.data.map((userCourse, index) => {
                   // Define premium styling for top 3
                    const getTopAccentGradient = (position: number) => {
                      switch (position) {
                        case 0: return 'bg-gradient-to-r from-transparent via-yellow-500 to-transparent'; // Gold
                        case 1: return 'bg-gradient-to-r from-transparent via-gray-400 to-transparent'; // Silver
                        case 2: return 'bg-gradient-to-r from-transparent via-amber-700 to-transparent'; // Bronze
                        default: return '';
                      }
                    };

                    const getRankBadgeGradient = (position: number) => {
                      switch (position) {
                        case 0: return 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600'; // Gold metallic
                        case 1: return 'bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500'; // Silver metallic
                        case 2: return 'bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800'; // Bronze metallic
                        default: return 'bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm border border-white/30'; // Liquid glass for 4-10
                      }
                    };

                   const getCardShadow = (position: number) => {
                     return position < 3 ? 'shadow-xl shadow-black/20' : 'shadow-lg';
                   };

                   const isTopThree = index < 3;

                   return (
                     <div 
                       key={userCourse.id}
                       className="shrink-0 basis-[calc((100%-((var(--g)*(var(--cards)-1))))/var(--cards))] relative"
                     >
                        <div className={`${index === 0 ? 'rated-card ' : ''}w-full aspect-[4/5] relative overflow-hidden rounded-none ${getCardShadow(index)}`}>
                              {/* Top Edge Gradient Accent for Top 3 */}
                              {isTopThree && (
                                <div className={`absolute top-0 left-0 right-0 h-1 z-10 ${getTopAccentGradient(index)}`} />
                              )}
                              
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
                               hideRankingBadges={true}
                                mobileTextScale={windowWidth < 768 ? 'small' : 'small'}
                                mobileFlagSize={windowWidth < 768 ? 'md' : 'md'}
                              />
                              
                              {/* Premium Rank Badge - Top Left */}
                              <div className="absolute top-3 left-3 z-20">
                                <div className={`
                                  w-8 h-8 rounded-full flex items-center justify-center
                                  ${getRankBadgeGradient(index)}
                                  ${isTopThree ? 'shadow-lg shadow-black/25' : 'shadow-md'}
                                  ${isTopThree ? 'ring-1 ring-white/20' : ''}
                                `}>
                                  <span className={`
                                    text-white font-medium text-sm leading-none
                                    ${isTopThree ? 'drop-shadow-sm' : ''}
                                  `}>
                                    {index + 1}
                                  </span>
                                </div>
                              </div>
                        </div>
                     </div>
                   );
                 })}
            </div>
          )}
          {topRatedLoader.isEmpty && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                You haven't rated any courses yet.
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
    <section className="w-full fullbleed md:mx-auto md:px-0 pt-0 pb-8 mb-0" data-section="courses-by-region">
      <div className="max-w-none md:max-w-6xl md:mx-auto">
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
    </section>
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

  // Same query as the main section to get the data for the modal (ratings-only)
  const { data: gbIrelandCourses = [] } = useQuery({
    queryKey: ['gbIrelandCourses', userId],
    queryFn: async () => {
      if (!userId) return [];

      // RATINGS-ONLY: Get only from course_ratings
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
        .not('rating', 'is', null);

      if (ratedError) throw ratedError;

      const coursesWithFormat = (ratedData || []).map(course => ({
        ...course,
        played_date: course.created_at,
        id: `rating-${course.course_id}`
      }));

      const gbIrelandCourses = coursesWithFormat.filter((userCourse) => {
        const course = userCourse.golf_courses;
        return course && course.country === 'Britain & Ireland';
      });

      const uniqueCoursesMap = new Map();
      
      gbIrelandCourses.forEach(course => {
        const courseId = course.course_id;
        if (!uniqueCoursesMap.has(courseId)) {
          uniqueCoursesMap.set(courseId, course);
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
      <EnhancedRegionalCoursesModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        regionName="Great Britain & Ireland"
        courses={gbIrelandCourses}
        isOwnProfile={isOwnProfile}
        userId={userId}
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
  
  // Track window width for responsive breakpoints
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: gbIrelandCourses = [], isLoading: gbIrelandLoading } = usePlayedCoursesWithRatings(userId || '', 'gb_i');

  const { isHydrated } = useViewPreference();

  // Use carousel navigation with proper item count and combined ref
  const {
    carouselRef: combinedRef,
    canScrollLeft,
    canScrollRight,
    scroll
  } = useCarouselNavigation(gbIrelandCourses.length);

  // Native touch scrolling only - no programmatic swipe paging
  const gbIrelandRefCallback = useCallback((node: HTMLDivElement | null) => {
    combinedRef(node);
  }, [combinedRef]);

  // Calculate card dimensions - match Recently Played sizing exactly
  const getCardWidth = () => {
    if (windowWidth >= 1200) return 'calc(25% - 9px)'; // Desktop: 4 cards to match Recently Played
    if (windowWidth >= 1024) return 'calc(33.333% - 8px)'; // Laptop: 3 cards to match Recently Played  
    if (windowWidth >= 768) return 'calc(50% - 6px)'; // Tablet: 2 cards
    return `calc(40vw - 5px)`; // Mobile: 2.5 cards visible
  };

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
                 ref={gbIrelandRefCallback}
                 className="
                    flex overflow-x-auto no-scrollbar gap-1 sm:gap-2 md:gap-3 lg:gap-3 xl:gap-4
                   [--cards:2.5] md:[--cards:4.5] lg:[--cards:4.5] xl:[--cards:4.5]
                   [--g:0.5rem] sm:[--g:0.75rem] md:[--g:1rem] lg:[--g:1.25rem] xl:[--g:1.5rem]
                 "
              >
                {gbIrelandCourses.map((userCourse, index) => (
                  <div 
                    key={userCourse.id}
                    className="shrink-0 basis-[calc((100%-((var(--g)*(var(--cards)-1))))/var(--cards))]"
                  >
                      <div className="w-full overflow-hidden rounded-none relative aspect-[4/5]">
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
                          mobileTextScale={windowWidth < 768 ? 'small' : 'small'}
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

      // RATINGS-ONLY: Get only from course_ratings
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
        .not('rating', 'is', null);

      if (ratedError) throw ratedError;

      const coursesWithFormat = (ratedData || []).map(course => ({
        ...course,
        played_date: course.created_at,
        id: `rating-${course.course_id}`,
        golf_courses: {
          ...course.golf_courses,
          average_rating: null
        }
      }));

      // Filter for courses with global ranking (worldwide)
      const worldwideCourses = coursesWithFormat.filter((userCourse) => {
        const course = userCourse.golf_courses;
        return course && course.global_rank && course.global_rank <= 100;
      });

      const uniqueCoursesMap = new Map();
      
      worldwideCourses.forEach(course => {
        const courseId = course.course_id;
        if (!uniqueCoursesMap.has(courseId)) {
          uniqueCoursesMap.set(courseId, course);
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
      <EnhancedRegionalCoursesModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        regionName="Worldwide"
        courses={worldwideCourses}
        isOwnProfile={isOwnProfile}
        userId={userId}
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
  
  // Track window width for responsive breakpoints
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: worldwideCourses = [], isLoading: worldwideLoading } = usePlayedCoursesWithRatings(userId || '', 'worldwide');

  const { isHydrated } = useViewPreference();

  // Use carousel navigation with proper item count and combined ref
  const {
    carouselRef: combinedRef,
    canScrollLeft,
    canScrollRight,
    scroll
  } = useCarouselNavigation(worldwideCourses.length);

  // Native touch scrolling only - no programmatic swipe paging
  const worldwideRefCallback = useCallback((node: HTMLDivElement | null) => {
    combinedRef(node);
  }, [combinedRef]);

  // Calculate card dimensions - match Recently Played sizing exactly
  const getCardWidth = () => {
    if (windowWidth >= 1200) return 'calc(25% - 9px)'; // Desktop: 4 cards to match Recently Played
    if (windowWidth >= 1024) return 'calc(33.333% - 8px)'; // Laptop: 3 cards to match Recently Played  
    if (windowWidth >= 768) return 'calc(50% - 6px)'; // Tablet: 2 cards
    return `calc(40vw - 5px)`; // Mobile: 2.5 cards visible
  };

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
                 className="
                    flex overflow-x-auto no-scrollbar gap-1 sm:gap-2 md:gap-3 lg:gap-3 xl:gap-4
                   [--cards:2.5] md:[--cards:4.5] lg:[--cards:4.5] xl:[--cards:4.5]
                   [--g:0.5rem] sm:[--g:0.75rem] md:[--g:1rem] lg:[--g:1.25rem] xl:[--g:1.5rem]
                 "
              >
                {worldwideCourses.map((userCourse, index) => (
                <div 
                  key={userCourse.id}
                  className="shrink-0 basis-[calc((100%-((var(--g)*(var(--cards)-1))))/var(--cards))]"
                >
                    <div className="w-full overflow-hidden rounded-none relative aspect-[4/5]">
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
                          mobileTextScale={windowWidth < 768 ? 'small' : 'small'}
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

      // RATINGS-ONLY: Get only from course_ratings
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
            course_rating_aggregates(avg_overall_score, review_count)
          )
        `)
        .eq('user_id', userId)
        .not('rating', 'is', null);

      if (ratedError) throw ratedError;

      const coursesWithFormat = (ratedData || []).map(course => ({
        ...course,
        played_date: course.created_at,
        id: `rating-${course.course_id}`,
        averageRating: course.golf_courses?.course_rating_aggregates?.[0]?.avg_overall_score || null,
        userRating: course.rating
      }));

      // Filter for USA courses only
      const usaCourses = coursesWithFormat.filter((userCourse) => {
        const course = userCourse.golf_courses;
        return course && course.country === 'USA';
      });

      // Remove duplicates based on course_id
      const uniqueCoursesMap = new Map();
      
      usaCourses.forEach(course => {
        const courseId = course.course_id;
        if (!uniqueCoursesMap.has(courseId)) {
          uniqueCoursesMap.set(courseId, course);
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
      <EnhancedRegionalCoursesModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        regionName="USA"
        courses={usaCourses}
        isOwnProfile={isOwnProfile}
        userId={userId}
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
  
  // Track window width for responsive breakpoints
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: usaCourses = [], isLoading: usaLoading } = usePlayedCoursesWithRatings(userId || '', 'usa');

  const { isHydrated } = useViewPreference();

  // Use carousel navigation with proper item count and combined ref
  const {
    carouselRef: combinedRef,
    canScrollLeft,
    canScrollRight,
    scroll
  } = useCarouselNavigation(usaCourses.length);

  // Native touch scrolling only - no programmatic swipe paging
  const usaRefCallback = useCallback((node: HTMLDivElement | null) => {
    combinedRef(node);
  }, [combinedRef]);

  // Calculate card dimensions - match Recently Played sizing exactly
  const getCardWidth = () => {
    if (windowWidth >= 1200) return 'calc(25% - 9px)'; // Desktop: 4 cards to match Recently Played
    if (windowWidth >= 1024) return 'calc(33.333% - 8px)'; // Laptop: 3 cards to match Recently Played  
    if (windowWidth >= 768) return 'calc(50% - 6px)'; // Tablet: 2 cards
    return `calc(40vw - 5px)`; // Mobile: 2.5 cards visible
  };

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
                 ref={usaRefCallback}
                 className="
                    flex overflow-x-auto no-scrollbar gap-1 sm:gap-2 md:gap-3 lg:gap-3 xl:gap-4
                   [--cards:2.5] md:[--cards:4.5] lg:[--cards:4.5] xl:[--cards:4.5]
                   [--g:0.5rem] sm:[--g:0.75rem] md:[--g:1rem] lg:[--g:1.25rem] xl:[--g:1.5rem]
                 "
              >
                {usaCourses.map((userCourse, index) => (
                  <div 
                    key={userCourse.id}
                    className="shrink-0 basis-[calc((100%-((var(--g)*(var(--cards)-1))))/var(--cards))]"
                  >
                      <div className="w-full overflow-hidden rounded-none relative aspect-[4/5]">
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
                          mobileTextScale={windowWidth < 768 ? 'small' : 'small'}
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
      
      <EnhancedRegionalCoursesModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        regionName="Continental Europe"
        courses={europeCourses}
        isOwnProfile={isOwnProfile}
        userId={userId}
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
  
  // Track window width for responsive breakpoints
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: europeCourses = [], isLoading: europeLoading } = usePlayedCoursesWithRatings(userId || '', 'europe');

  const { isHydrated } = useViewPreference();

  // Use carousel navigation with proper item count and combined ref
  const {
    carouselRef: combinedRef,
    canScrollLeft,
    canScrollRight,
    scroll
  } = useCarouselNavigation(europeCourses.length);

  // Native touch scrolling only - no programmatic swipe paging
  const europeRefCallback = useCallback((node: HTMLDivElement | null) => {
    combinedRef(node);
  }, [combinedRef]);

  // Calculate card dimensions - match Recently Played sizing exactly
  const getCardWidth = () => {
    if (windowWidth >= 1200) return 'calc(25% - 9px)'; // Desktop: 4 cards to match Recently Played
    if (windowWidth >= 1024) return 'calc(33.333% - 8px)'; // Laptop: 3 cards to match Recently Played  
    if (windowWidth >= 768) return 'calc(50% - 6px)'; // Tablet: 2 cards
    return `calc(40vw - 5px)`; // Mobile: 2.5 cards visible
  };

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
                 ref={europeRefCallback}
                 className="
                   flex overflow-x-auto no-scrollbar gap-1 sm:gap-2 md:gap-3 lg:gap-3 xl:gap-4
                   [--cards:2.5] md:[--cards:4.5] lg:[--cards:4.5] xl:[--cards:4.5]
                   [--g:0.5rem] sm:[--g:0.75rem] md:[--g:1rem] lg:[--g:1.25rem] xl:[--g:1.5rem]
                 "
              >
                {europeCourses.map((userCourse, index) => (
                  <div 
                    key={userCourse.id}
                    className="shrink-0 basis-[calc((100%-((var(--g)*(var(--cards)-1))))/var(--cards))]"
                  >
                     <div className="w-full overflow-hidden rounded-none relative aspect-[4/5]">
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
                            mobileTextScale={windowWidth < 768 ? 'small' : 'small'}
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

      // RATINGS-ONLY: Get only from course_ratings
      const { data: ratedData, error: ratedError } = await supabase
        .from('course_ratings')
        .select(`golf_courses!inner(global_rank)`)
        .eq('user_id', userId)
        .not('rating', 'is', null)
        .not('golf_courses.global_rank', 'is', null)
        .lte('golf_courses.global_rank', 100);

      if (ratedError) throw ratedError;

      return ratedData || [];
    },
    enabled: !!userId,
  });

  return (
    <>
      <div className="w-full pt-1.5">
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
      
      // RATINGS-ONLY: Get only from course_ratings
      const { data: ratedData, error: ratedError } = await supabase
        .from('course_ratings')
        .select(`golf_courses!inner(country)`)
        .eq('user_id', userId)
        .not('rating', 'is', null)
        .eq('golf_courses.country', 'USA');

      if (ratedError) throw ratedError;

      return ratedData || [];
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
      
      // RATINGS-ONLY: Get only from course_ratings
      const { data: ratedData, error: ratedError } = await supabase
        .from('course_ratings')
        .select(`golf_courses!inner(country)`)
        .eq('user_id', userId)
        .not('rating', 'is', null)
        .eq('golf_courses.country', 'Britain & Ireland');

      if (ratedError) throw ratedError;

      return ratedData || [];
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

      {/* Modal Router removed - now handled at profile page level */}
    </>
  );
};

export default CoursesJourney;