import React, { useState, useEffect } from 'react';
import { useGolfCoursesSearch } from '@/hooks/useGolfCoursesSearch';
import { useTop100Lists } from '@/hooks/useTop100Lists';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Award, X } from 'lucide-react';
import CourseCard from './CourseCard';
import { Skeleton } from '@/components/ui/skeleton';

const GlobalTop100 = () => {
  const [selectedList, setSelectedList] = useState<string>('global');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch available lists
  const { data: lists = [] } = useTop100Lists();

  // Use the search hook for Top 100 lists
  const { data: courses = [], isLoading } = useGolfCoursesSearch({
    searchQuery: debouncedSearch,
    listSlug: selectedList,
    limit: 200,
  });

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );

  // Build list options - default to 'global' as the main Top 100 list
  const listOptions = lists.length > 0 
    ? lists.map(list => ({ value: list.slug, label: list.short_label }))
    : [
        { value: 'global', label: 'Global Top 100' },
        { value: 'gb-i', label: 'GB&I Top 100' },
        { value: 'usa', label: 'USA Top 100' },
        { value: 'europe', label: 'Europe Top 100' },
      ];

  const handleResetFilters = () => {
    setSelectedList('global');
    setSearchTerm('');
  };

  const hasActiveFilters = selectedList !== 'global' || searchTerm !== '';

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative max-w-2xl">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
        <Input
          placeholder="Search Top 100 courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 h-12 bg-card border-border/50 rounded-xl shadow-sm focus:shadow-md transition-shadow"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Top 100 List Selector */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={selectedList} onValueChange={setSelectedList}>
          <SelectTrigger className="w-[200px] bg-card border-border/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Top 100 List" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {listOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Reset filters
          </Button>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : courses.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <div className="text-muted-foreground space-y-2">
            <p className="text-lg font-medium">No courses found</p>
            <p className="text-sm">Try selecting a different list or clearing your search.</p>
          </div>
          {hasActiveFilters && (
            <Button onClick={handleResetFilters} variant="outline">
              Reset filters
            </Button>
          )}
        </div>
      ) : (
        <div>
          <div className="text-sm text-muted-foreground mb-4">
            Showing {courses.length} course{courses.length !== 1 ? 's' : ''}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard 
                key={course.id} 
                course={course}
                showCountryWithFlag={true}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalTop100;
