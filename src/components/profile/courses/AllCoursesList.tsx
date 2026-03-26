import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserCourseActivity } from '@/hooks/useUserCourseActivity';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TieredCourseCard, CourseCardData } from './TieredCourseCard';
import { StickyFilterBar, CoursePrimaryTab, CourseSortOption } from './StickyFilterBar';
import { type QuickRegion } from '@/components/leaderboard/courses/CourseRegionPills';
import { Button } from '@/components/ui/button';
import { ChevronDown, ClipboardList } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<CoursePrimaryTab>('all');
  const [activeSort, setActiveSort] = useState<CourseSortOption>('recently-played');
  const [activeCountry, setActiveCountry] = useState<QuickRegion>('global');
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
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

  // Tab counts
  const tabCounts = useMemo(() => ({
    all: courses.length,
    top100: courses.filter(c => c.is_top100).length,
  }), [courses]);

  // Apply filters and sorting
  const filteredCourses = useMemo(() => {
    let result = [...courses];

    // Step 1: Primary tab filter
    if (activeTab === 'top100') {
      result = result.filter(c => c.is_top100);
    }

    // Step 2: Country filter
    if (activeCountry !== 'all') {
      result = result.filter(c => {
        switch (activeCountry) {
          case 'gb-i':
            return c.country === 'Britain & Ireland';
          case 'usa':
            return c.country === 'USA';
          case 'europe':
            return c.country === 'Continental Europe';
          case 'global':
            // On All tab, global = top100 courses from all countries
            // On Top 100 tab, global = all top100 (already filtered), so show all
            return activeTab === 'all' ? c.is_top100 : true;
          default:
            return true;
        }
      });
    }

    // Step 3: Sort
    switch (activeSort) {
      case 'recently-played':
        result.sort((a, b) => {
          const dateA = a.last_played_at ? new Date(a.last_played_at).getTime() : 0;
          const dateB = b.last_played_at ? new Date(b.last_played_at).getTime() : 0;
          return dateB - dateA;
        });
        break;
      case 'rating-high-low':
        result.sort((a, b) => (b.rating_value || 0) - (a.rating_value || 0));
        break;
      case 'rating-low-high':
        result.sort((a, b) => (a.rating_value || 0) - (b.rating_value || 0));
        break;
    }

    return result;
  }, [courses, activeTab, activeCountry, activeSort]);

  const displayedCourses = filteredCourses.slice(0, displayCount);
  const hasMore = displayCount < filteredCourses.length;
  const remainingCount = Math.min(PAGE_SIZE, filteredCourses.length - displayCount);
  const totalFiltered = filteredCourses.length;

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayCount(prev => Math.min(prev + PAGE_SIZE, filteredCourses.length));
      setIsLoadingMore(false);
    }, 300);
  }, [hasMore, isLoadingMore, filteredCourses.length]);

  const firstName = displayName?.split(' ')[0];

  const getEmptyMessage = () => {
    const subject = isOwnProfile ? "You haven't" : `${firstName || 'They'} hasn't`;
    if (activeTab === 'top100') {
      return `${subject} played any Top 100 courses yet.`;
    }
    if (activeCountry !== 'all') {
      return 'No courses found for the selected country.';
    }
    return `${subject} logged any courses yet.`;
  };

  if (isLoading) {
    return (
      <div ref={sectionRef} className="py-4">
        <div className="h-5 w-32 bg-muted rounded mb-1 animate-pulse" />
        <div className="h-3 w-48 bg-muted rounded mb-4 animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const ownerSubtitle = isOwnProfile ? 'Your full course history' : `${firstName || "Their"}\u2019s full course history`;

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
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'top100' && activeCountry === 'all') {
            setActiveCountry('gb-i');
          }
          setDisplayCount(PAGE_SIZE);
        }}
        activeSort={activeSort}
        onSortChange={(sort) => {
          setActiveSort(sort);
          setDisplayCount(PAGE_SIZE);
        }}
        activeCountry={activeCountry}
        onCountryChange={(country) => {
          setActiveCountry(country);
          setDisplayCount(PAGE_SIZE);
        }}
        allCount={tabCounts.all}
        top100Count={tabCounts.top100}
      />

      {/* Course list */}
      {filteredCourses.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-8 shadow-[0_1px_3px_rgba(0,0,0,0.05)] mt-3">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-full bg-muted border border-border flex items-center justify-center mb-4">
              <ClipboardList className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">
              {activeTab === 'top100' ? 'No Top 100 Courses Yet' : 'No Courses Found'}
            </h3>
            <p className="text-sm text-muted-foreground mb-5 max-w-xs">
              {getEmptyMessage()}
            </p>
            {isOwnProfile && (
              <button
                onClick={() => navigate('/courses')}
                className="px-5 py-2.5 bg-card text-foreground border border-border/60 text-sm font-semibold rounded-full hover:bg-muted transition-colors min-h-[44px] active:scale-[0.97]"
              >
                Log a Course
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

      {/* Load More */}
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

      {!hasMore && filteredCourses.length > PAGE_SIZE && (
        <p className="text-center text-[11px] text-muted-foreground pt-4 pb-6">
          {isOwnProfile ? "You\u2019ve reached the end" : "End of list"} • {totalFiltered.toLocaleString()} courses total
        </p>
      )}

      {!hasMore && filteredCourses.length > 0 && filteredCourses.length <= PAGE_SIZE && (
        <div className="text-center pt-4 pb-2">
          <p className="text-sm text-foreground font-medium italic">
            {isOwnProfile 
              ? "That\u2019s your journey so far. On to the next tee."
              : `That\u2019s ${firstName || 'their'}\u2019s journey so far.`}
          </p>
        </div>
      )}
    </div>
  );
};
