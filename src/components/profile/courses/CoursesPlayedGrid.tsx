import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserCourseActivity } from '@/hooks/useUserCourseActivity';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Top100Pills from '@/components/courses/Top100Pills';

interface CoursesPlayedGridProps {
  userId: string;
}

type FilterType = 'all' | 'top100' | 'non-top100';
type SortType = 'recent' | 'alphabetical' | 'country';

export const CoursesPlayedGrid: React.FC<CoursesPlayedGridProps> = ({ userId }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('recent');

  const { data: userActivity = [] } = useUserCourseActivity(userId);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['user-played-courses-detail', userId],
    enabled: !!userId && userActivity.length > 0,
    queryFn: async () => {
      const courseIds = userActivity.map(a => a.course_id);
      
      const { data, error } = await supabase
        .from('golf_courses')
        .select('*')
        .in('id', courseIds);

      if (error) throw error;

      // Join with activity data
      return (data || []).map(course => ({
        ...course,
        last_played_at: userActivity.find(a => a.course_id === course.id)?.last_played_at,
        is_top100: userActivity.find(a => a.course_id === course.id)?.is_top100 || false,
      }));
    },
    staleTime: 60_000,
  });

  const filteredAndSorted = useMemo(() => {
    let filtered = [...courses];

    // Apply filter
    if (filter === 'top100') {
      filtered = filtered.filter(c => c.is_top100);
    } else if (filter === 'non-top100') {
      filtered = filtered.filter(c => !c.is_top100);
    }

    // Apply sort
    if (sort === 'recent') {
      filtered.sort((a, b) => {
        const dateA = a.last_played_at ? new Date(a.last_played_at).getTime() : 0;
        const dateB = b.last_played_at ? new Date(b.last_played_at).getTime() : 0;
        return dateB - dateA;
      });
    } else if (sort === 'alphabetical') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'country') {
      filtered.sort((a, b) => a.country.localeCompare(b.country));
    }

    return filtered;
  }, [courses, filter, sort]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading courses...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Courses Played</h2>
        
        <div className="flex items-center gap-4">
          {/* Filter chips */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                filter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card/50 border border-border/50 hover:bg-card/70'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('top100')}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                filter === 'top100'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card/50 border border-border/50 hover:bg-card/70'
              }`}
            >
              Top 100 Only
            </button>
            <button
              onClick={() => setFilter('non-top100')}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                filter === 'non-top100'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card/50 border border-border/50 hover:bg-card/70'
              }`}
            >
              Non-Top 100
            </button>
          </div>

          {/* Sort dropdown */}
          <Select value={sort} onValueChange={(v) => setSort(v as SortType)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recently Played</SelectItem>
              <SelectItem value="alphabetical">A → Z</SelectItem>
              <SelectItem value="country">Country</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredAndSorted.length === 0 ? (
        <div className="bg-card/30 border border-border/50 rounded-2xl p-12 text-center">
          <div className="text-muted-foreground">No courses found</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSorted.map((course) => (
            <div
              key={course.id}
              onClick={() => navigate(`/courses/${course.id}`)}
              className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden hover:bg-card/70 cursor-pointer transition-colors group"
            >
              {course.thumbnail_image && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={course.thumbnail_image}
                    alt={course.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="p-4">
                <div className="font-semibold mb-1">{course.name}</div>
                <div className="text-sm text-muted-foreground mb-2">
                  {course.sub_country || course.country}
                </div>
                {course.is_top100 && (
                  <div className="text-xs text-yellow-500 font-medium">
                    Top 100 Course
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
