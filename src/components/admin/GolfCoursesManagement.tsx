import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import GolfCoursesTable from './golf-courses/GolfCoursesTable';
import CascadingFilters from './golf-courses/CascadingFilters';
import EmptyCoursesState from './golf-courses/EmptyCoursesState';
import GolfCoursesLoadingSkeleton from './golf-courses/GolfCoursesLoadingSkeleton';
import { GolfCoursesHeader } from './golf-courses/GolfCoursesHeader';
import { CourseDetailDrawer } from './golf-courses/CourseDetailDrawer';
import { BulkActionsBar } from './golf-courses/BulkActionsBar';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';

import { useGolfCourses } from './golf-courses/useGolfCourses';
import { GolfCourse, RegionalFilter } from './golf-courses/types';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useDebounce } from '@/hooks/useDebounce';
import { useGolfCoursesSelection } from '@/hooks/useGolfCoursesSelection';
import { Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const GolfCoursesManagement = () => {
  
  const navigate = useNavigate();
  const [regionalFilter, setRegionalFilter] = useState<RegionalFilter>({
    scope: 'all',
    subCountry: null,
    county: null,
    top100List: null,
    sortBy: 'name-asc'
  });
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearchTerm = useDebounce(searchInput, 300);

  // Detail drawer state
  const [selectedCourse, setSelectedCourse] = useState<GolfCourse | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  // Selection hook
  const {
    selectedIds,
    selectedCourses,
    isSelectMode,
    isAllSelected,
    isSomeSelected,
    toggleSelection,
    selectAll,
    clearSelection,
    toggleSelectMode,
  } = useGolfCoursesSelection(courses);

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
    navigate(`/admin/golf-courses/${course.id}/edit`);
  };

  const handleViewDetails = (course: GolfCourse) => {
    setSelectedCourse(course);
    setDrawerOpen(true);
  };

  const handleCreateCourse = () => {
    navigate('/admin/golf-courses/new');
  };

  // Courses are now pre-filtered by the server-side query
  const isFirstLoad = isLoading && !data;

  if (isFirstLoad) {
    return <GolfCoursesLoadingSkeleton />;
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header with Stats */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Golf Courses</h2>
            <p className="text-muted-foreground">Manage golf courses and their information</p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={isSelectMode ? "secondary" : "outline"}
                  size="sm"
                  onClick={toggleSelectMode}
                >
                  <CheckSquare className="h-4 w-4 mr-1.5" />
                  {isSelectMode ? 'Exit Select' : 'Select'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">S</kbd> to toggle</p>
              </TooltipContent>
            </Tooltip>
            <Button 
              onClick={handleCreateCourse} 
              variant="default"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Course
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <GolfCoursesHeader />

        {/* Bulk Actions Bar */}
        {selectedCourses.length > 0 && (
          <BulkActionsBar
            selectedCourses={selectedCourses}
            onClearSelection={clearSelection}
            onSuccess={() => refetch()}
          />
        )}

        {/* Filters */}
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
              onViewDetails={handleViewDetails}
              activeTop100Filter={regionalFilter.top100List}
              isSelectMode={isSelectMode}
              selectedIds={selectedIds}
              onToggleSelection={toggleSelection}
              onSelectAll={selectAll}
              isAllSelected={isAllSelected}
              isSomeSelected={isSomeSelected}
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

      {/* Scroll to top button */}
      <ScrollToTopGlass />

      {/* Course Detail Drawer */}
      <CourseDetailDrawer
        course={selectedCourse}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onEdit={handleEditCourse}
      />
    </>
  );
};

export default GolfCoursesManagement;
