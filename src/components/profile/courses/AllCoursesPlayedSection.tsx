import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserCourseActivity } from '@/hooks/useUserCourseActivity';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Filter, Calendar } from 'lucide-react';
import { RatingPill } from '@/components/ui/RatingPill';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface AllCoursesPlayedSectionProps {
  userId: string;
  isOwnProfile: boolean;
  firstName?: string;
}

type FilterType = 'all' | 'rated' | 'unrated' | 'regulars' | 'travel';

interface CourseWithDetails {
  id: string;
  name: string;
  country: string;
  sub_country: string | null;
  thumbnail_image: string | null;
  is_top100: boolean;
  last_played_at: string | null;
  play_count: number;
  rating_value: number | null;
  has_rating: boolean;
}

const PAGE_SIZE = 15;

export const AllCoursesPlayedSection: React.FC<AllCoursesPlayedSectionProps> = ({ 
  userId,
  isOwnProfile,
  firstName,
}) => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(0);

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

      // Join with activity data
      return (data || []).map(course => {
        const activity = userActivity.find(a => a.course_id === course.id);
        return {
          ...course,
          is_top100: activity?.is_top100 || false,
          last_played_at: activity?.last_played_at || null,
          play_count: 1, // We'd need play count from a different source
          rating_value: activity?.rating_value || null,
          has_rating: activity?.has_rating || false,
        } as CourseWithDetails;
      });
    },
    staleTime: 60_000,
  });

  const filteredCourses = useMemo(() => {
    let filtered = [...courses];

    switch (filter) {
      case 'rated':
        filtered = filtered.filter(c => c.has_rating);
        break;
      case 'unrated':
        filtered = filtered.filter(c => !c.has_rating);
        break;
      case 'regulars':
        // For now, just show all - would need home club data
        break;
      case 'travel':
        // For now, just show all - would need user location data
        break;
    }

    // Sort by most recent
    filtered.sort((a, b) => {
      const dateA = a.last_played_at ? new Date(a.last_played_at).getTime() : 0;
      const dateB = b.last_played_at ? new Date(b.last_played_at).getTime() : 0;
      return dateB - dateA;
    });

    return filtered;
  }, [courses, filter]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(0);
  }, [filter]);

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / PAGE_SIZE));
  const pagedCourses = filteredCourses.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const hasNextPage = page < totalPages - 1;
  const startIndex = filteredCourses.length === 0 ? 0 : page * PAGE_SIZE + 1;
  const endIndex = Math.min((page + 1) * PAGE_SIZE, filteredCourses.length);

  const scrollToSectionTop = () => {
    // Use #root container for scrolling (same as rest of app)
    const scrollContainer = document.getElementById('root');
    if (sectionRef.current && scrollContainer) {
      const top = sectionRef.current.offsetTop - 80;
      scrollContainer.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (!hasNextPage) return;
    setPage(page + 1);
    scrollToSectionTop();
  };

  const handlePrevPage = () => {
    if (page === 0) return;
    setPage(page - 1);
    scrollToSectionTop();
  };

  const filterOptions: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'rated', label: 'Rated only' },
    { key: 'unrated', label: 'Unrated' },
    { key: 'regulars', label: 'Home & regulars' },
    { key: 'travel', label: 'Travel rounds' },
  ];

  // Empty states - dynamic based on profile context
  const getEmptyMessage = () => {
    const subject = isOwnProfile ? "You haven't" : `${firstName || 'They'} hasn't`;
    
    switch (filter) {
      case 'rated':
        return `${subject} rated any courses yet.${isOwnProfile ? ' Rate a course to unlock insights.' : ''}`;
      case 'unrated':
        return isOwnProfile 
          ? "All your courses are rated for now. Keep playing to add more."
          : `All ${firstName || 'their'}'s courses are rated.`;
      default:
        return `${subject} logged any courses yet.${isOwnProfile ? ' Add your first course to start your journey.' : ''}`;
    }
  };

  if (isLoading) {
    return (
      <div ref={sectionRef}>
        <h3 className="text-base font-semibold text-slate-900 mb-3">All Courses Played</h3>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-slate-50 rounded-sq-sm animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={sectionRef}>
      {/* Section header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            All Courses Played
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isOwnProfile 
              ? "Every course you've logged a round on."
              : `Every course ${firstName || 'they'} has logged a round on.`}
          </p>
        </div>
        <button className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" />
          Filters
        </button>
      </div>


      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1">
        {filterOptions.map((option) => (
          <button
            key={option.key}
            onClick={() => setFilter(option.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-sq-pill whitespace-nowrap transition-colors ${
              filter === option.key
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Course list - keyed by page for smooth re-render */}
      {filteredCourses.length === 0 ? (
        <div className="bg-slate-50 border border-slate-100 rounded-sq-md p-8 text-center">
          <p className="text-sm text-slate-500">{getEmptyMessage()}</p>
        </div>
      ) : (
        <div key={page} className="space-y-2 animate-fade-in">
          {pagedCourses.map((course) => (
            <div
              key={course.id}
              onClick={() => navigate(`/courses/${course.id}`)}
              className="bg-white border border-slate-100 rounded-sq-sm overflow-hidden cursor-pointer hover:border-slate-200 transition-colors flex"
            >
              {/* Thumbnail */}
              {course.thumbnail_image ? (
                <img
                  src={course.thumbnail_image}
                  alt={course.name}
                  className="w-20 h-20 object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-20 h-20 bg-slate-100 flex-shrink-0" />
              )}

              {/* Content */}
              <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
                <div className="font-medium text-sm text-slate-900 truncate">
                  {course.name}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {course.sub_country || course.country}
                </div>
                {course.is_top100 && (
                  <span className="text-[10px] text-amber-600 font-medium mt-0.5">
                    Top 100 Course
                  </span>
                )}
                {course.last_played_at && (
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span className="text-[10px] text-slate-400">
                      Last played {format(new Date(course.last_played_at), 'd MMM yyyy')}
                    </span>
                  </div>
                )}
              </div>

              {/* Rating or CTA */}
              <div className="flex items-center px-3">
                {course.has_rating && course.rating_value ? (
                  <RatingPill score={course.rating_value} className="text-[10px] px-2 py-1" />
                ) : isOwnProfile ? (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs text-slate-500 h-auto py-1 px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/courses/${course.id}/rate`);
                    }}
                  >
                    Rate course
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination controls */}
      {filteredCourses.length > PAGE_SIZE && (
        <div className="flex items-center justify-between gap-3 pt-3">
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            disabled={page === 0}
            onClick={handlePrevPage}
          >
            Previous 15 courses
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            disabled={!hasNextPage}
            onClick={handleNextPage}
          >
            Next 15 courses
          </Button>
        </div>
      )}

      {/* Summary line with 24px bottom gap */}
      <p className="mt-3 mb-6 text-xs text-slate-500 text-center">
        Showing {filteredCourses.length === 0 ? 0 : startIndex}–{endIndex} of {filteredCourses.length} courses
      </p>
    </div>
  );
};