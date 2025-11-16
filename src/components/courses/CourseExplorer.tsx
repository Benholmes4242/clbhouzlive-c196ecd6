
import React, { useState, useEffect } from 'react';
import { useGolfCoursesSearch } from '@/hooks/useGolfCoursesSearch';
import { useTop100Lists } from '@/hooks/useTop100Lists';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, MapPin } from 'lucide-react';
import CourseCard from './CourseCard';
import { Skeleton } from '@/components/ui/skeleton';

const CourseExplorer = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedList, setSelectedList] = useState<string>('all');
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

  // Use the new search hook
  const { data: courses = [], isLoading } = useGolfCoursesSearch({
    searchQuery: debouncedSearch,
    regionSlug: selectedRegion === 'all' ? undefined : selectedRegion,
    listSlug: selectedList === 'all' ? undefined : selectedList,
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

  const regionOptions = [
    { value: 'all', label: 'All Regions' },
    { value: 'gb-i', label: 'Britain & Ireland' },
    { value: 'usa', label: 'United States' },
    { value: 'europe', label: 'Continental Europe' },
  ];

  const listOptions = [
    { value: 'all', label: 'All Courses' },
    ...lists.map(list => ({ value: list.slug, label: list.short_label }))
  ];

  return (
    <div className="space-y-6">
      {/* Search - Apple-like dark input */}
      <div className="relative max-w-2xl">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
        <Input
          placeholder="Search golf courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 h-12 bg-card border-border/50 rounded-xl shadow-sm focus:shadow-md transition-shadow"
        />
      </div>

      {/* Filters - Styled dropdowns */}
      <div className="flex flex-wrap gap-3">
        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
          <SelectTrigger className="w-[200px] bg-card border-border/50 rounded-lg">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Region" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {regionOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedList} onValueChange={setSelectedList}>
          <SelectTrigger className="w-[200px] bg-card border-border/50 rounded-lg">
            <SelectValue placeholder="Top 100 List" />
          </SelectTrigger>
          <SelectContent>
            {listOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : courses.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No courses found</h3>
          <p className="text-muted-foreground">
            Try adjusting filters or searching another location
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => (
            <CourseCard 
              key={course.id} 
              course={course}
              viewContext="global"
              customHeight="h-72"
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseExplorer;
