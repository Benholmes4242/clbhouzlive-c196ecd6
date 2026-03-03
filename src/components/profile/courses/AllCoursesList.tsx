import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserCourseActivity } from '@/hooks/useUserCourseActivity';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TieredCourseCard, CourseCardData } from './TieredCourseCard';
import { StickyFilterBar, CourseFilterType } from './StickyFilterBar';
import { Button } from '@/components/ui/button';
import { ChevronDown, ClipboardList } from 'lucide-react';
import { scrollToTop } from '@/utils/scrollToTop';

interface AllCoursesListProps {
  userId: string;
  isOwnProfile: boolean;
  displayName?: string;
}

const PAGE_SIZE = 20;

export const AllCoursesList: React.FC<AllCoursesListProps> = ({ 
  userId,
  isOwnProfile,
  displayName,
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
      
      const [coursesResult, ratingsResult] = await Promise.all([
        supabase
          .from('golf_courses')
          .select('id, name, country, sub_country, thumbnail_image')
          .in('id', courseIds),
        supabase
          .from('course_ratings')
          .select('id, course_id')
          .eq('user_id', userId)
          .eq('is_mock', false)
          .in('course_id', courseIds),
      ]);

      if (coursesResult.error) throw coursesResult.error;

      // Build a map of course_id -> rating_id
      const ratingIdMap = new Map<string, string>();
      (ratingsResult.data || []).forEach(r => ratingIdMap.set(r.course_id, r.id));

      return (coursesResult.data || []).map(course => {
        const activity = userActivity.find(a => a.course_id === course.id);
        return {
          ...course,
          is_top100: activity?.is_top100 || false,
          last_played_at: activity?.last_played_at || null,
          rating_value: activity?.rating_value || null,
          has_rating: activity?.has_rating || false,
          rating_id: ratingIdMap.get(course.id) || null,
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
        filtered = filtered
          .filter(c => c.is_top100)
          .sort((a, b) => {
            const dateA = a.last_played_at ? new Date(a.last_played_at).getTime() : 0;
            const dateB = b.last_played_at ? new Date(b.last_played_at).getTime() : 0;
            return dateB - dateA;
          });
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

  // No sticky behavior - filter bar scrolls with page

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

  // Empty state messages - dynamic based on profile context
  const getEmptyMessage = () => {
    const subject = isOwnProfile ? "You haven't" : `${firstName || 'They'} hasn't`;
    const subjectAll = isOwnProfile ? "your" : "their";
    
    switch (filter) {
      case 'rated':
        return `${subject} rated any courses yet.${isOwnProfile ? ' Rate a course to unlock insights.' : ''}`;
      case 'unrated':
        return isOwnProfile 
          ? "All your courses are rated. Keep playing to add more."
          : `All ${subjectAll} courses are rated.`;
      case 'top100':
        return `${subject} played any Top 100 courses yet.`;
      case 'highest-rated':
        return isOwnProfile 
          ? "Rate some courses to see your highest rated."
          : `${firstName || 'They'} hasn't rated any courses yet.`;
      default:
        return `${subject} logged any courses yet.${isOwnProfile ? ' Add your first course to start your journey.' : ''}`;
    }
  };

  if (isLoading) {
    return (
      <div ref={sectionRef} className="py-4">
        <h3 className="text-base font-semibold text-foreground mb-3">Course History</h3>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-18 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Compute owner name for subtitle
  const firstName = displayName?.split(' ')[0];
  const ownerSubtitle = isOwnProfile ? 'Your full course history' : `${firstName || "Their"}'s full course history`;

  return (
    <div ref={sectionRef} className="py-4">

      {/* Section header */}
      <div className="mb-3">
        <h2 className="text-[17px] font-semibold text-foreground">
          Course History
        </h2>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          {ownerSubtitle}
        </p>
      </div>

      {/* Filter bar */}
      <StickyFilterBar
        activeFilter={filter}
        onFilterChange={setFilter}
        counts={filterCounts}
        isSticky={false}
      />

      {/* Course list */}
      {filteredCourses.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-8 shadow-[0_1px_3px_rgba(0,0,0,0.05)] mt-3">
          <div className="flex flex-col items-center justify-center text-center">
            {/* Icon */}
            <div className="w-14 h-14 rounded-full bg-muted border border-border flex items-center justify-center mb-4">
              <ClipboardList className="w-6 h-6 text-muted-foreground" />
            </div>
            
            {/* Title */}
            <h3 className="text-base font-semibold text-foreground mb-1">
              {filter === 'top100' ? 'No Top 100 Courses Yet' :
               filter === 'highest-rated' ? 'No Rated Courses Yet' :
               'No Courses Logged Yet'}
            </h3>
            
            {/* Description */}
            <p className="text-sm text-muted-foreground mb-5 max-w-xs">
              {getEmptyMessage()}
            </p>
            
            {/* CTA */}
            {isOwnProfile && (
              <button
                onClick={() => navigate('/courses')}
                className="px-5 py-2 bg-foreground text-background text-sm font-medium rounded-full hover:bg-foreground/90 transition-colors min-h-[44px] active:scale-[0.98]"
              >
                {filter === 'highest-rated' ? 'Rate a Course' : 'Log a Course'}
              </button>
            )}
          </div>
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
          {isOwnProfile ? "You've reached the end" : "End of list"} • {totalFiltered.toLocaleString()} courses total
        </p>
      )}

      {/* End-of-list closure for smaller lists */}
      {!hasMore && filteredCourses.length > 0 && filteredCourses.length <= PAGE_SIZE && (
        <div className="text-center pt-4 pb-2">
          <p className="text-sm text-foreground font-medium italic">
            {isOwnProfile 
              ? "That's your journey so far. On to the next tee."
              : `That's ${firstName || 'their'}'s journey so far.`}
          </p>
        </div>
      )}
    </div>
  );
};