/**
 * RegionListSheet - Simple list view for region courses
 */

import React, { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Search, MapPin, CheckCircle } from 'lucide-react';

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

// Demo courses for each region
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

// Filter pill component
const FilterPill: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
    style={{
      background: isActive ? '#ffffff' : '#f1f5f9',
      color: isActive ? '#1e293b' : '#64748b',
      border: '1px solid',
      borderColor: isActive ? '#e2e8f0' : 'transparent',
      boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
    }}
  >
    {label}
  </button>
);

// Course row component
const CourseRow: React.FC<{ course: Course }> = ({ course }) => (
  <div
    className="flex items-center gap-3 py-3 border-b border-[#e2e8f0]"
  >
    <div
      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#f1f5f9]"
    >
      <MapPin className="w-4 h-4 text-[#64748b]" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate text-[#1e293b]">
        {course.name}
      </p>
      <p className="text-xs text-[#94a3b8]">
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

  // Get courses for this region
  const courses = useMemo(() => {
    if (!region) return [];
    return DEMO_COURSES[region.id] ?? [];
  }, [region]);

  // Filter courses
  const filteredCourses = useMemo(() => {
    let result = courses;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.location.toLowerCase().includes(query)
      );
    }

    // Status filter
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
        className="rounded-t-3xl border-t h-[90svh]"
        style={{
          background: '#ffffff',
          borderColor: '#e2e8f0',
        }}
      >
        {region && (
          <div className="flex flex-col h-full">
            {/* Handle bar */}
            <div className="w-10 h-1 bg-[#e2e8f0] rounded-full mx-auto mb-4 flex-shrink-0" />
            
            <SheetHeader className="pb-4">
              <SheetTitle className="text-[#1e293b]">
                {region.name}
              </SheetTitle>
              <p className="text-sm text-[#64748b]">
                {region.played} of {region.total} courses played
              </p>
            </SheetHeader>

            {/* Search */}
            <div className="relative mb-4">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]"
              />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white border-[#e2e8f0] text-[#1e293b] placeholder:text-[#94a3b8] focus:ring-2 focus:ring-[#e2e8f0] focus:border-[#e2e8f0]"
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
                  <p className="text-[#94a3b8]">
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
