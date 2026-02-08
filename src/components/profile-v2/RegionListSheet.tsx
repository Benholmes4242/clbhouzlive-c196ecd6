/**
 * RegionListSheet - Simple list view for region courses
 * NOTE: Uses DEMO_COURSES placeholder data — backend integration pending.
 */

import React, { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Search, MapPin, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RegionData {
  id: string;
  name: string;
  shortName: string;
  played: number;
  total: number;
}

interface Course {
  id: string;
  name: string;
  location: string;
  isPlayed: boolean;
}

interface RegionListSheetProps {
  region: RegionData | null;
  onClose: () => void;
}

// Demo courses for each region (TODO: replace with real data hook)
const DEMO_COURSES: Record<string, Course[]> = {
  gbi: [
    { id: '1', name: 'Royal County Down', location: 'Northern Ireland', isPlayed: true },
    { id: '2', name: 'St Andrews Old Course', location: 'Scotland', isPlayed: true },
    { id: '3', name: 'Muirfield', location: 'Scotland', isPlayed: true },
    { id: '4', name: 'Royal Portrush', location: 'Northern Ireland', isPlayed: false },
    { id: '5', name: 'Carnoustie', location: 'Scotland', isPlayed: false },
    { id: '6', name: 'Royal Birkdale', location: 'England', isPlayed: false },
    { id: '7', name: 'Turnberry Ailsa', location: 'Scotland', isPlayed: false },
    { id: '8', name: 'Royal St George\'s', location: 'England', isPlayed: false },
  ],
  europe: [
    { id: '1', name: 'Valderrama', location: 'Spain', isPlayed: true },
    { id: '2', name: 'Le Golf National', location: 'France', isPlayed: false },
    { id: '3', name: 'Marco Simone', location: 'Italy', isPlayed: false },
    { id: '4', name: 'Fancourt Links', location: 'South Africa', isPlayed: false },
  ],
  usa: [
    { id: '1', name: 'Pebble Beach', location: 'California', isPlayed: true },
    { id: '2', name: 'Augusta National', location: 'Georgia', isPlayed: false },
    { id: '3', name: 'Pine Valley', location: 'New Jersey', isPlayed: false },
    { id: '4', name: 'Cypress Point', location: 'California', isPlayed: false },
    { id: '5', name: 'Shinnecock Hills', location: 'New York', isPlayed: false },
  ],
  world: [
    { id: '1', name: 'Royal Melbourne West', location: 'Australia', isPlayed: true },
    { id: '2', name: 'Cape Kidnappers', location: 'New Zealand', isPlayed: false },
    { id: '3', name: 'Hirono', location: 'Japan', isPlayed: false },
    { id: '4', name: 'Kingston Heath', location: 'Australia', isPlayed: false },
  ],
};

// Filter pill component — semantic tokens, 44px tap target
const FilterPill: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      'px-4 py-2 rounded-full text-xs font-medium transition-all min-h-[44px] active:scale-[0.98]',
      isActive
        ? 'bg-card text-foreground border border-border shadow-sm'
        : 'bg-muted text-muted-foreground border border-transparent'
    )}
  >
    {label}
  </button>
);

// Course row component — semantic tokens
const CourseRow: React.FC<{ course: Course }> = ({ course }) => (
  <div className="flex items-center gap-3 py-3 border-b border-border">
    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-muted">
      <MapPin className="w-4 h-4 text-muted-foreground" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate text-foreground">
        {course.name}
      </p>
      <p className="text-xs text-muted-foreground">
        {course.location}
      </p>
    </div>
    {course.isPlayed && (
      <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
    )}
  </div>
);

export const RegionListSheet: React.FC<RegionListSheetProps> = ({
  region,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'played' | 'unplayed'>('all');

  const courses = useMemo(() => {
    if (!region) return [];
    return DEMO_COURSES[region.id] ?? [];
  }, [region]);

  const filteredCourses = useMemo(() => {
    let result = courses;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.location.toLowerCase().includes(query)
      );
    }

    if (filter === 'played') {
      result = result.filter((c) => c.isPlayed);
    } else if (filter === 'unplayed') {
      result = result.filter((c) => !c.isPlayed);
    }

    return result;
  }, [courses, searchQuery, filter]);

  return (
    <Sheet open={!!region} onOpenChange={() => onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-t border-border h-[90svh] bg-card"
      >
        {region && (
          <div className="flex flex-col h-full">
            {/* Handle bar */}
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4 flex-shrink-0" />
            
            <SheetHeader className="pb-4">
              <SheetTitle className="text-foreground">
                {region.name}
              </SheetTitle>
              <p className="text-sm text-muted-foreground">
                {region.played} of {region.total} courses played
              </p>
            </SheetHeader>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Filter pills */}
            <div className="flex gap-2 mb-4">
              <FilterPill
                label="All"
                isActive={filter === 'all'}
                onClick={() => setFilter('all')}
              />
              <FilterPill
                label="Played"
                isActive={filter === 'played'}
                onClick={() => setFilter('played')}
              />
              <FilterPill
                label="Unplayed"
                isActive={filter === 'unplayed'}
                onClick={() => setFilter('unplayed')}
              />
            </div>

            {/* Course list */}
            <div className="flex-1 overflow-y-auto">
              {filteredCourses.length > 0 ? (
                filteredCourses.map((course) => (
                  <CourseRow key={course.id} course={course} />
                ))
              ) : (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground">
                    No courses found
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default RegionListSheet;
