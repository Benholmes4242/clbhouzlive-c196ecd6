
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import GolfCourseEditor from './GolfCourseEditor';
import GolfCourseCard from './golf-courses/GolfCourseCard';
import CascadingFilters from './golf-courses/CascadingFilters';
import EmptyCoursesState from './golf-courses/EmptyCoursesState';
import GolfCoursesLoadingSkeleton from './golf-courses/GolfCoursesLoadingSkeleton';

import { useGolfCourses } from './golf-courses/useGolfCourses';
import { filterCoursesByRegion } from './golf-courses/utils';
import { GolfCourse, RegionalFilter } from './golf-courses/types';

const GolfCoursesManagement = () => {
  const { toast } = useToast();
  const [regionalFilter, setRegionalFilter] = useState<RegionalFilter>({
    region: 'all',
    subCountry: null,
    county: null,
    top100List: 'all',
    sortBy: 'name-asc'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<GolfCourse | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { data: courses, isLoading, refetch } = useGolfCourses();


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


  const filteredCourses = filterCoursesByRegion(courses || [], regionalFilter, searchTerm);

  if (isLoading) {
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
            className="flex items-center gap-2 bg-[#b66b41] hover:bg-[#a55a3a] text-white"
          >
            <Plus className="h-4 w-4" />
            Add New Golf Club
          </Button>
        </div>


        <CascadingFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          regionalFilter={regionalFilter}
          onRegionalFilterChange={setRegionalFilter}
        />


        <div className="grid gap-4">
          {filteredCourses.length === 0 ? (
            <EmptyCoursesState searchTerm={searchTerm} />
          ) : (
            filteredCourses.map((course) => (
              <GolfCourseCard
                key={course.id}
                course={course}
                onEdit={handleEditCourse}
                activeTop100Filter={regionalFilter.top100List}
              />
            ))
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
