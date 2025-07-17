
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import GolfCourseEditor from './GolfCourseEditor';
import GolfCourseCard from './golf-courses/GolfCourseCard';
import GolfCoursesFilters from './golf-courses/GolfCoursesFilters';
import EmptyCoursesState from './golf-courses/EmptyCoursesState';
import GolfCoursesLoadingSkeleton from './golf-courses/GolfCoursesLoadingSkeleton';
import BulkCourseImport from './golf-courses/BulkCourseImport';
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
  const [isMigrating, setIsMigrating] = useState(false);

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

  const handleMigrateToR2 = async () => {
    setIsMigrating(true);
    try {
      const { data, error } = await supabase.functions.invoke('migrate-media-to-cloudflare', {
        body: {
          batchSize: 10,
          resumeFrom: 0
        }
      });
      
      if (error) {
        console.error('Migration error:', error);
        toast({
          title: "Migration failed",
          description: error.message || "Failed to start migration",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Migration started",
        description: "Golf course images are being migrated to R2. Check the function logs for progress.",
      });
    } catch (error) {
      console.error('Migration error:', error);
      toast({
        title: "Migration failed",
        description: "Failed to start migration process",
        variant: "destructive",
      });
    } finally {
      setIsMigrating(false);
    }
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
          <div className="flex gap-2">
            <Button 
              onClick={handleMigrateToR2}
              disabled={isMigrating}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {isMigrating ? 'Migrating...' : 'Migrate Images to R2'}
            </Button>
            <Button 
              onClick={handleCreateCourse} 
              className="flex items-center gap-2 bg-[#b66b41] hover:bg-[#a55a3a] text-white"
            >
              <Plus className="h-4 w-4" />
              Add New Golf Club
            </Button>
          </div>
        </div>

        {/* Add the bulk import component */}
        <BulkCourseImport />

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
