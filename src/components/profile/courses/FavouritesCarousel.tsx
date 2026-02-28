/**
 * FavouritesCarousel - Apple-style premium carousel for Top 10 Rated Courses
 * 
 * Features:
 * - Refined section header with trophy icon
 * - Full-bleed premium cards (280x360px)
 * - Minimal scroll indicator (progress bar)
 * - Empty state cards for incomplete Top 10
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Plus, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserTopTenCourses, TopTenCourse } from '@/hooks/useUserTopTenCourses';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Top10CourseCard } from './Top10CourseCard';
import { toast } from 'sonner';

interface FavouritesCarouselProps {
  userId: string;
  isOwnProfile: boolean;
  className?: string;
  onManage?: () => void;
  displayName?: string;
}

export const FavouritesCarousel: React.FC<FavouritesCarouselProps> = ({
  userId,
  isOwnProfile,
  className,
  onManage,
  displayName,
}) => {
  const navigate = useNavigate();
  const { topTen, isLoading } = useUserTopTenCourses(userId);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Stable sorted course IDs for consistent query key (only for pinned courses without ratings)
  const courseIdsNeedingRatings = React.useMemo(() => 
    topTen
      .filter(c => c.is_pinned && c.rating == null)
      .map(c => c.course_id)
      .sort(), 
    [topTen]
  );

  // Fetch user ratings with breakdown scores (for pinned courses that don't have ratings)
  const { data: ratingsMap = {} } = useQuery({
    queryKey: ['user-course-ratings-breakdown', userId, courseIdsNeedingRatings],
    enabled: !!userId && courseIdsNeedingRatings.length > 0,
    queryFn: async () => {
      if (courseIdsNeedingRatings.length === 0) return {};
      
      const { data, error } = await supabase
        .from('course_ratings')
        .select('course_id, rating, design_score, condition_score, facilities_score, clubhouse_score')
        .eq('user_id', userId)
        .in('course_id', courseIdsNeedingRatings);

      if (error) throw error;
      return (data || []).reduce((acc: Record<string, {
        rating: number;
        design_score: number | null;
        condition_score: number | null;
        facilities_score: number | null;
        clubhouse_score: number | null;
      }>, r) => {
        acc[r.course_id] = {
          rating: r.rating,
          design_score: r.design_score,
          condition_score: r.condition_score,
          facilities_score: r.facilities_score,
          clubhouse_score: r.clubhouse_score,
        };
        return acc;
      }, {});
    },
    staleTime: 60_000,
  });

  // Handle scroll progress
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll > 0) {
      setScrollProgress(scrollLeft / maxScroll);
    }
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Handle share
  const handleShare = () => {
    toast.info('Coming soon');
  };

  // Dynamic title
  const firstName = displayName?.split(' ')[0] || 'Their';
  const getTitle = () => {
    if (isOwnProfile) {
      return "Your Personal Top 10";
    }
    return `${firstName}'s Top 10`;
  };

  // Dynamic subtitle
  const getSubtitle = () => {
    if (isOwnProfile) {
      return "The very best you've played";
    }
    return `The very best ${firstName} has played`;
  };

  if (isLoading) {
    return (
      <section className={cn("w-full", className)}>
        {/* Header skeleton */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
            <div>
              <div className="h-5 w-36 bg-muted rounded mb-1.5 animate-pulse" />
              <div className="h-4 w-28 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
        {/* Cards skeleton */}
        <div className="flex gap-4 overflow-hidden px-4">
          {[1, 2].map((i) => (
             <div 
              key={i} 
              className="flex-shrink-0 w-[227px] h-[292px] bg-muted rounded-[22px] animate-pulse" 
            />
          ))}
        </div>
      </section>
    );
  }

  const courseCount = topTen.length;

  // Empty state
  if (courseCount === 0) {
    return (
      <section className={cn("w-full", className)}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
              }}
            >
              <Trophy className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {getTitle()}
              </h2>
              <p className="text-sm text-muted-foreground">
                {getSubtitle()}
              </p>
            </div>
          </div>
        </div>
        
        {/* Empty Content Card */}
        <div className="px-4">
          <div 
            className="relative w-full max-w-[320px] h-[280px] rounded-[24px] flex items-center justify-center mx-auto bg-muted border-2 border-dashed border-border"
          >
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-7 h-7 text-muted-foreground/40" />
              </div>
              
              <h3 className="text-base font-semibold text-foreground mb-1">
                {isOwnProfile ? "Build Your Top 10" : "No Top 10 Yet"}
              </h3>
              
              <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">
                {isOwnProfile 
                  ? "Curate your all-time favourite courses and share your taste"
                  : "This golfer hasn't picked their top 10 yet."}
              </p>
              
              {isOwnProfile && onManage && (
                <button
                  onClick={onManage}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-sm font-medium rounded-full hover:from-amber-500 hover:to-amber-600 transition-all shadow-sm min-h-[44px] active:scale-[0.98]"
                >
                  Start Building
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={cn("w-full", className)}>
      {/* Refined Header */}
      <div className="flex items-center justify-between mb-4 px-4">
        <div className="flex items-center gap-3">
          {/* Trophy icon - subtle gold tint */}
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
            }}
          >
            <Trophy className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {getTitle()}
            </h2>
            <p className="text-sm text-muted-foreground">
              {getSubtitle()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">{courseCount}/10</span>
          {isOwnProfile && onManage && (
            <button 
              onClick={onManage}
              className="text-sm font-medium text-amber-600 min-h-[44px] flex items-center active:scale-[0.98]"
            >
              Manage
            </button>
          )}
        </div>
      </div>
      
      {/* Carousel - snap scroll with gap */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-4 pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {topTen.map((course) => {
          // Use rating from course if available (auto-populated), otherwise from ratingsMap (pinned)
          const ratingData = ratingsMap[course.course_id];
          const displayRating = course.rating ?? ratingData?.rating;
          
          return (
            <div key={course.id} className="snap-center flex-shrink-0">
              <Top10CourseCard
                course={course}
                position={course.position}
                rating={displayRating}
                isOwnProfile={isOwnProfile}
                userId={userId}
              />
            </div>
          );
        })}
        
        {/* Empty slot cards - show up to 2 */}
        {isOwnProfile && courseCount < 10 && courseCount > 0 && (
          <>
            {Array.from({ length: Math.min(10 - courseCount, 2) }).map((_, index) => (
              <div 
                key={`empty-${index}`}
                onClick={onManage}
                className="relative w-[227px] h-[292px] rounded-[22px] flex-shrink-0 snap-center flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-[0.99] active:scale-[0.97] bg-muted border-2 border-dashed border-border"
              >
                <div className="text-center p-6">
                  <Plus className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">
                    Add #{courseCount + index + 1}
                  </p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Minimal scroll indicator */}
      {courseCount > 1 && (
        <div className="flex justify-center mt-4">
          <div className="h-1 w-16 rounded-full bg-muted overflow-hidden">
            <div 
              className="h-full bg-foreground rounded-full transition-all duration-300"
              style={{ width: `${Math.max(10, scrollProgress * 100)}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Footer - Share CTA */}
      {isOwnProfile && courseCount >= 3 && (
        <div className="pt-4 px-4">
          <button
            onClick={handleShare}
            className="w-full py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground bg-background hover:bg-muted rounded-xl border border-border shadow-sm transition-colors flex items-center justify-center gap-2 min-h-[44px] active:scale-[0.98]"
          >
            <Share2 className="w-4 h-4" />
            Share your Top 10
          </button>
        </div>
      )}
    </section>
  );
};