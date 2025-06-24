
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import GolfCourseEditor from './GolfCourseEditor';
import GolfCourseCard from './golf-courses/GolfCourseCard';
import GolfCoursesFilters from './golf-courses/GolfCoursesFilters';
import EmptyCoursesState from './golf-courses/EmptyCoursesState';
import GolfCoursesLoadingSkeleton from './golf-courses/GolfCoursesLoadingSkeleton';
import { useGolfCourses } from './golf-courses/useGolfCourses';
import { filterCoursesByRegion } from './golf-courses/utils';
import { GolfCourse, RegionKey } from './golf-courses/types';

const GolfCoursesManagement = () => {
  const { toast } = useToast();
  const [selectedRegion, setSelectedRegion] = useState<RegionKey>('all');
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

  const filteredCourses = filterCoursesByRegion(courses || [], selectedRegion, searchTerm);

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
          <Button onClick={handleCreateCourse} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New Golf Club
          </Button>
        </div>

        <GolfCoursesFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedRegion={selectedRegion}
          onRegionChange={setSelectedRegion}
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
