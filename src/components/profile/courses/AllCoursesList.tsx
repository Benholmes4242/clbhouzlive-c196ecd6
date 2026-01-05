import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserCourseActivity } from '@/hooks/useUserCourseActivity';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TieredCourseCard, CourseCardData } from './TieredCourseCard';
import { StickyFilterBar, CourseFilterType } from './StickyFilterBar';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { scrollToTop } from '@/utils/scrollToTop';

interface AllCoursesListProps {
  userId: string;
  isOwnProfile: boolean;
}

const PAGE_SIZE = 20;

export const AllCoursesList: React.FC<AllCoursesListProps> = ({ 
  userId,
  isOwnProfile 
}) => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<CourseFilterType>('all');
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [isSticky, setIsSticky] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { data: userActivity = [] } = useUserCourseActivity(userId);

  // Fetch course details
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['user-played-courses-full', userId],
    enabled: !!userId && userActivity.length > 0,
    queryFn: async () => {
      const courseIds = userActivity.map(a => a.course_id);
      
      const { data, error } = await supabase
        .from('golf_courses')
        .select('id, name, country, sub_country, thumbnail_image')
        .in('id', courseIds);

      if (error) throw error;

      return (data || []).map(course => {
        const activity = userActivity.find(a => a.course_id === course.id);
        return {
          ...course,
          is_top100: activity?.is_top100 || false,
          last_played_at: activity?.last_played_at || null,
          rating_value: activity?.rating_value || null,
          has_rating: activity?.has_rating || false,
        } as CourseCardData;
      });
    },
    staleTime: 60_000,
  });

  // Calculate filter counts
  const filterCounts = useMemo(() => ({
    top100: courses.filter(c => c.is_top100).length,
    rated: courses.filter(c => c.has_rating).length,
    unrated: courses.filter(c => !c.has_rating).length,
  }), [courses]);

  // Apply filters and sorting
  const filteredCourses = useMemo(() => {
    let filtered = [...courses];

    switch (filter) {
      case 'rated':
        filtered = filtered.filter(c => c.has_rating);
        break;
      case 'unrated':
        filtered = filtered.filter(c => !c.has_rating);
        break;
      case 'top100':
        filtered = filtered.filter(c => c.is_top100);
        break;
      case 'highest-rated':
        filtered = filtered
          .filter(c => c.has_rating && c.rating_value)
          .sort((a, b) => (b.rating_value || 0) - (a.rating_value || 0));
        break;
      case 'recently-played':
        filtered = filtered.sort((a, b) => {
          const dateA = a.last_played_at ? new Date(a.last_played_at).getTime() : 0;
          const dateB = b.last_played_at ? new Date(b.last_played_at).getTime() : 0;
          return dateB - dateA;
        });
        break;
      case 'travel':
        // Would need user's home country for proper filtering
        break;
      default:
        // Default sort: most recent first
        filtered.sort((a, b) => {
          const dateA = a.last_played_at ? new Date(a.last_played_at).getTime() : 0;
          const dateB = b.last_played_at ? new Date(b.last_played_at).getTime() : 0;
          return dateB - dateA;
        });
    }

    return filtered;
  }, [courses, filter]);

  // Reset display count when filter changes
  useEffect(() => {
    setDisplayCount(PAGE_SIZE);
  }, [filter]);

  // Sticky filter detection
  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        setIsSticky(rect.top <= 56); // Header height
      }
    };

    const scrollContainer = document.getElementById('root');
    scrollContainer?.addEventListener('scroll', handleScroll);
    return () => scrollContainer?.removeEventListener('scroll', handleScroll);
  }, []);

  const displayedCourses = filteredCourses.slice(0, displayCount);
  const hasMore = displayCount < filteredCourses.length;
  const remainingCount = Math.min(PAGE_SIZE, filteredCourses.length - displayCount);
  const totalFiltered = filteredCourses.length;

  // Load more handler matching Explore page pattern
  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;
    
    setIsLoadingMore(true);
    
    // Simulate loading delay for smooth UX
    setTimeout(() => {
      setDisplayCount(prev => Math.min(prev + PAGE_SIZE, filteredCourses.length));
      setIsLoadingMore(false);
    }, 300);
  }, [hasMore, isLoadingMore, filteredCourses.length]);

  // Empty state messages
  const getEmptyMessage = () => {
    switch (filter) {
      case 'rated':
        return "You haven't rated any courses yet. Rate a course to unlock insights.";
      case 'unrated':
        return "All your courses are rated. Keep playing to add more.";
      case 'top100':
        return "You haven't played any Top 100 courses yet.";
      case 'highest-rated':
        return "Rate some courses to see your highest rated.";
      default:
        return "You haven't logged any courses yet. Add your first course to start your journey.";
    }
  };

  if (isLoading) {
    return (
      <div ref={sectionRef} className="py-4">
        <h3 className="text-base font-semibold text-foreground mb-3 px-1">All Courses Played</h3>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-18 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={sectionRef} className="py-4">
      {/* Section divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-5" />

      {/* Section header */}
      <div className="flex items-start justify-between mb-3 px-1">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            All Courses Played
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your complete journey
          </p>
        </div>
      </div>

      {/* Sticky filter bar */}
      <div className={isSticky ? 'sticky top-14 z-10' : ''}>
        <StickyFilterBar
          activeFilter={filter}
          onFilterChange={setFilter}
          counts={filterCounts}
          isSticky={isSticky}
        />
      </div>

      {/* Course list */}
      {filteredCourses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 p-8 text-center mt-3">
          <p className="text-sm text-muted-foreground">{getEmptyMessage()}</p>
        </div>
      ) : (
        <div className="space-y-2 mt-3">
          {displayedCourses.map((course) => (
            <TieredCourseCard
              key={course.id}
              course={course}
              isOwnProfile={isOwnProfile}
            />
          ))}
        </div>
      )}

      {/* Pagination - Load More button matching Explore page exactly */}
      {hasMore && (
        <div className="flex flex-col items-center gap-2 pt-4 px-4 pb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMore}
            disabled={isLoadingMore}
            className="w-full max-w-xs gap-1.5 transition-all duration-150 hover:shadow-sm active:scale-[0.98]"
          >
            {isLoadingMore ? (
              <>
                <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                Loading next courses…
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Next {remainingCount} courses
              </>
            )}
          </Button>
          <p className="text-[11px] text-muted-foreground">
            Showing 1–{displayedCourses.length} of {totalFiltered.toLocaleString()} courses
          </p>
        </div>
      )}

      {/* End message when all courses shown */}
      {!hasMore && filteredCourses.length > PAGE_SIZE && (
        <p className="text-center text-[11px] text-muted-foreground pt-4 pb-6">
          You've reached the end • {totalFiltered.toLocaleString()} courses total
        </p>
      )}

      {/* End-of-list closure for smaller lists */}
      {!hasMore && filteredCourses.length > 0 && filteredCourses.length <= PAGE_SIZE && (
        <div className="text-center pt-6 pb-4">
          <p className="text-sm text-foreground font-medium">
            That's your journey so far.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {filteredCourses.length} courses played. On to {filteredCourses.length + 1}.
          </p>
        </div>
      )}
    </div>
  );
};
