/**
 * FavouritesCarousel - Apple-style premium carousel for Top 10 Rated Courses
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Plus, Share2, ChevronRight } from 'lucide-react';
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
  const [activeIndex, setActiveIndex] = useState(0);

  const { data: privacyData } = useQuery({
    queryKey: ['top-ten-privacy', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('top_ten_comments_privacy')
        .eq('id', userId)
        .single();
      return (data?.top_ten_comments_privacy ?? 'followers') as 'open' | 'followers' | 'off';
    },
    staleTime: 5 * 60_000,
  });

  const courseIdsNeedingRatings = React.useMemo(() => 
    topTen
      .filter(c => c.is_pinned && c.rating == null)
      .map(c => c.course_id)
      .sort(), 
    [topTen]
  );

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

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const { scrollLeft } = container;
    const firstCard = container.firstElementChild as HTMLElement | null;
    const cardWidth = firstCard?.offsetWidth ?? 227;
    const gap = parseFloat(getComputedStyle(container).gap) || 16;
    const stepWidth = cardWidth + gap;
    const newIndex = stepWidth > 0 ? Math.round(scrollLeft / stepWidth) : 0;
    setActiveIndex(Math.max(0, Math.min(newIndex, topTen.length - 1)));
  }, [topTen.length]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const handleShare = () => {
    toast.info('Coming soon');
  };

  const firstName = displayName?.split(' ')[0] || 'Their';
  const getTitle = () => {
    if (isOwnProfile) return "Your Personal Top 10";
    return `${firstName}'s Top 10`;
  };

  const getSubtitle = () => {
    if (isOwnProfile) return "The very best you've played";
    return `The very best ${firstName} has played`;
  };

  if (isLoading) {
    return (
      <section className={cn("w-full", className)}>
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
            <div>
              <div className="h-5 w-36 bg-muted rounded mb-1.5 animate-pulse" />
              <div className="h-4 w-28 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="flex gap-4 overflow-hidden px-4">
          {[1, 2].map((i) => (
             <div 
              key={i} 
              className="flex-shrink-0 w-[245px] h-[315px] bg-muted rounded-[24px] animate-pulse" 
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
              <Trophy className="w-5 h-5" style={{ color: '#F7931E' }} />
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
            className="relative w-full max-w-[320px] h-[280px] rounded-[24px] flex items-center justify-center mx-auto border-2 border-dashed"
            style={{ background: 'rgba(15,23,42,0.04)', borderColor: 'rgba(15,23,42,0.12)' }}
          >
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(15,23,42,0.05)' }}>
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
                  className="px-6 py-2.5 text-white text-sm font-medium rounded-full transition-all shadow-sm min-h-[44px] active:scale-[0.98]"
                  style={{ backgroundColor: '#F7931E' }}
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
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
            }}
          >
            <Trophy className="w-5 h-5" style={{ color: '#F7931E' }} />
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
        
        {isOwnProfile && onManage ? (
          <button 
            onClick={onManage}
            className="flex items-center gap-0.5 text-[0.8125rem] font-medium text-muted-foreground min-h-[44px] active:scale-95 transition-transform"
          >
            Manage
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </button>
        ) : (
          <span className="text-muted-foreground text-xs">{courseCount}/10</span>
        )}
      </div>
      
      {/* Carousel */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-4 pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {topTen.map((course) => {
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
                privacySetting={privacyData ?? 'followers'}
              />
            </div>
          );
        })}
        
        {/* Empty slot cards */}
        {isOwnProfile && courseCount < 10 && courseCount > 0 && (
          <>
            {Array.from({ length: Math.min(10 - courseCount, 2) }).map((_, index) => (
              <div 
                key={`empty-${index}`}
                onClick={onManage}
                className="relative w-[245px] h-[315px] rounded-[24px] flex-shrink-0 snap-center flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-[0.99] active:scale-[0.97] border-2 border-dashed"
                style={{ background: 'rgba(15,23,42,0.04)', borderColor: 'rgba(15,23,42,0.12)' }}
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
        <div className="flex justify-center items-center gap-1 mt-4">
          {Array.from({ length: courseCount }).map((_, i) => {
            const isActive = i === activeIndex;
            return (
              <div
                key={i}
                className={cn(
                  "rounded-full transition-all duration-300",
                  isActive ? "w-5 h-1.5" : "w-1.5 h-1.5"
                )}
                style={{ backgroundColor: isActive ? '#0F172A' : 'rgba(15,23,42,0.20)' }}
              />
            );
          })}
        </div>
      )}
      
      {/* Footer - Share CTA */}
      {isOwnProfile && courseCount >= 3 && (
        <div className="pt-4 px-4">
          <button
            onClick={handleShare}
            className="w-full py-2.5 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 min-h-[44px] active:scale-[0.97]"
            style={{ color: '#F7931E', background: 'rgba(247,147,30,0.08)', border: '1px solid rgba(247,147,30,0.25)' }}
          >
            <Share2 className="w-4 h-4" />
            Share your Top 10
          </button>
        </div>
      )}
    </section>
  );
};
