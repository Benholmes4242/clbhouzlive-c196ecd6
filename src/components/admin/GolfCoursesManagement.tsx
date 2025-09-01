
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import GolfCourseEditor from './GolfCourseEditor';
import GolfCoursesTable from './golf-courses/GolfCoursesTable';
import CascadingFilters from './golf-courses/CascadingFilters';
import EmptyCoursesState from './golf-courses/EmptyCoursesState';
import GolfCoursesLoadingSkeleton from './golf-courses/GolfCoursesLoadingSkeleton';

import { useGolfCourses } from './golf-courses/useGolfCourses';
import { GolfCourse, RegionalFilter } from './golf-courses/types';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useDebounce } from '@/hooks/useDebounce';
import { Loader2 } from 'lucide-react';

const GolfCoursesManagement = () => {
  const { toast } = useToast();
  const [regionalFilter, setRegionalFilter] = useState<RegionalFilter>({
    scope: 'all',
    subCountry: null,
    county: null,
    top100List: null,
    sortBy: 'name-asc'
  });
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearchTerm = useDebounce(searchInput, 300);
  const [selectedCourse, setSelectedCourse] = useState<GolfCourse | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { 
    data, 
    isLoading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    isFetching,
    refetch 
  } = useGolfCourses({ regionalFilter, searchTerm: debouncedSearchTerm });

  // Flatten all pages into a single array
  const courses = data?.pages?.flatMap(page => page.courses) || [];
  const totalCount = data?.pages?.[0]?.totalCount || 0;

  // Intersection observer for infinite scroll
  const { ref: sentinelRef, isInView } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '200px'
  });

  // Trigger next page fetch when sentinel is in view
  useEffect(() => {
    if (isInView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isInView, hasNextPage, isFetchingNextPage, fetchNextPage]);


  const handleEditCourse = (course: GolfCourse) => {
    // Ensure the course has all required properties
    const courseWithDefaults: GolfCourse = {
      ...course,
      latitude: course.latitude || null,
      longitude: course.longitude || null,
    };
    setSelectedCourse(courseWithDefaults);
    setIsCreating(false);
    setIsEditorOpen(true);
  };

  const handleCreateCourse = () => {
    setSelectedCourse(null);
    setIsCreating(true);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setSelectedCourse(null);
    setIsCreating(false);
    refetch();
  };


  // Courses are now pre-filtered by the server-side query
  const isFirstLoad = isLoading && !data;

  if (isFirstLoad) {
    return <GolfCoursesLoadingSkeleton />;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Golf Courses Management</h2>
            <p className="text-muted-foreground">Manage golf courses and their information</p>
          </div>
          <Button 
            onClick={handleCreateCourse} 
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add New Golf Club
          </Button>
        </div>


        <CascadingFilters
          searchTerm={searchInput}
          onSearchChange={setSearchInput}
          regionalFilter={regionalFilter}
          onRegionalFilterChange={setRegionalFilter}
        />

        {/* Loading indicator for refetches */}
        {isFetching && data && (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
            <span className="text-sm text-muted-foreground">Updating results...</span>
          </div>
        )}


        <div className="space-y-4">
          {/* Course count display */}
          {totalCount > 0 && (
            <div className="text-sm text-muted-foreground">
              Showing {courses.length} of {totalCount.toLocaleString()} courses
            </div>
          )}

          {courses.length === 0 && !isLoading && !isFetching ? (
            <EmptyCoursesState searchTerm={debouncedSearchTerm} />
          ) : (
            <GolfCoursesTable
              courses={courses}
              onEdit={handleEditCourse}
              activeTop100Filter={regionalFilter.top100List}
            />
          )}

          {/* Infinite scroll sentinel */}
          {hasNextPage && (
            <div ref={sentinelRef} className="flex justify-center py-4">
              {isFetchingNextPage ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  Load More Courses
                </Button>
              )}
            </div>
          )}

          {/* End of results indicator */}
          {!hasNextPage && courses.length > 0 && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              End of results • {totalCount.toLocaleString()} courses total
            </div>
          )}
        </div>
      </div>

      {isEditorOpen && (
        <GolfCourseEditor
          course={selectedCourse}
          isCreating={isCreating}
          onClose={handleCloseEditor}
        />
      )}
    </>
  );
};

export default GolfCoursesManagement;
