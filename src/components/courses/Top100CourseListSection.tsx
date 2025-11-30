import React, { useState, useMemo } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useTop100CoursesList } from '@/hooks/useTop100CoursesList';
import Top100CourseCard from '@/components/profile/Top100CourseCard';
import { cn } from '@/lib/utils';

interface Top100CourseListSectionProps {
  searchQuery: string;
}

const Top100CourseListSection: React.FC<Top100CourseListSectionProps> = ({ searchQuery }) => {
  const { user } = useSupabaseSession();
  const [activeFilter, setActiveFilter] = useState<'all' | 'played' | 'not-played'>('all');

  // Fetch all Top 100 courses (global view)
  const {
    courses,
    playedCourses,
    getUserRating,
    isLoading,
    toggleCourse
  } = useTop100CoursesList('global', user?.id || '', !!user);

  // Filter courses based on search and filter state
  const filteredCourses = useMemo(() => {
    let filtered = courses;

    // Apply search filter
    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase();
      filtered = filtered.filter(course =>
        course.name.toLowerCase().includes(term) ||
        course.country.toLowerCase().includes(term) ||
        course.region?.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (activeFilter === 'played') {
      filtered = filtered.filter(course => playedCourses.has(course.id));
    } else if (activeFilter === 'not-played') {
      filtered = filtered.filter(course => !playedCourses.has(course.id));
    }

    return filtered;
  }, [courses, searchQuery, activeFilter, playedCourses]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-slate-500 text-sm">Loading courses...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All courses' },
          { id: 'played', label: 'Played' },
          { id: 'not-played', label: 'Not played' },
        ].map((f) => (
          <button
            key={f.id}
            className={cn(
              'px-3 py-1.5 rounded-full text-[12px] border transition-colors whitespace-nowrap',
              activeFilter === f.id
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200'
            )}
            onClick={() => setActiveFilter(f.id as any)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Course list */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-12 px-4">
          <p className="text-sm text-slate-500">
            {searchQuery.trim() ? 'No courses match your search.' : 'No courses found.'}
          </p>
        </div>
      ) : (
        <div className="space-y-0">
          {filteredCourses.map((course) => {
            const isPlayed = playedCourses.has(course.id);
            const userRating = getUserRating(course.id);

            return (
              <Top100CourseCard
                key={course.id}
                course={course}
                isPlayed={isPlayed}
                region="global"
                isOwnProfile={!!user}
                onToggle={user ? () => toggleCourse(course.id) : undefined}
                userRating={userRating}
                viewType="list"
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Top100CourseListSection;
