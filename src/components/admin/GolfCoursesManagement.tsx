
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Plus, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState<{
    total: number;
    processed: number;
    successful: number;
    failed: number;
    status: string;
    errors: string[];
  } | null>(null);

  const { data: courses, isLoading, refetch } = useGolfCourses();
  const [migrationStats, setMigrationStats] = useState<{
    total: number;
    migrated: number;
    remaining: number;
    noImage: number;
  } | null>(null);

  // Fetch migration stats
  const fetchMigrationStats = async () => {
    try {
      const { data, error } = await supabase
        .from('golf_courses')
        .select('thumbnail_image')
        .not('thumbnail_image', 'is', null);

      if (error) {
        console.error('Error fetching migration stats:', error);
        return;
      }

      const total = data.length;
      const migrated = data.filter(course => 
        course.thumbnail_image?.includes('golf-courses.clbhouz.co.uk')
      ).length;
      const remaining = data.filter(course => 
        course.thumbnail_image?.includes('supabase')
      ).length;

      // Also count courses with no image
      const { count: totalCount } = await supabase
        .from('golf_courses')
        .select('*', { count: 'exact', head: true });

      const noImage = (totalCount || 0) - total;

      setMigrationStats({
        total: totalCount || 0,
        migrated,
        remaining,
        noImage
      });
    } catch (error) {
      console.error('Error fetching migration stats:', error);
    }
  };

  // Fetch stats on component mount and when courses change
  React.useEffect(() => {
    fetchMigrationStats();
  }, [courses]);

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
    setMigrationProgress(null);
    
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
        setMigrationProgress(null);
        return;
      }

      // Set the final progress from the response
      if (data) {
        setMigrationProgress(data);
        
        if (data.status === 'completed') {
          toast({
            title: "Migration completed",
            description: `Successfully migrated ${data.successful} files. ${data.failed > 0 ? `${data.failed} failed.` : ''}`,
            variant: data.failed > 0 ? "destructive" : "default",
          });
        } else if (data.status === 'no_files_to_migrate') {
          toast({
            title: "No files to migrate",
            description: "All files are already migrated to R2.",
          });
        } else if (data.status === 'error') {
          toast({
            title: "Migration failed",
            description: "All migration attempts failed. Check the logs for details.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Migration error:', error);
      toast({
        title: "Migration failed",
        description: "Failed to start migration process",
        variant: "destructive",
      });
      setMigrationProgress(null);
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


        <GolfCoursesFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedRegion={selectedRegion}
          onRegionChange={setSelectedRegion}
        />

        {/* Migration Progress Indicator */}
        {migrationStats && (
          <div className="bg-card border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Migration Progress</h3>
              <button
                onClick={fetchMigrationStats}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Refresh
              </button>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Images migrated to R2</span>
                <span className="font-mono">
                  {migrationStats.migrated} / {migrationStats.total - migrationStats.noImage}
                </span>
              </div>
              
              <Progress 
                value={migrationStats.total > migrationStats.noImage 
                  ? (migrationStats.migrated / (migrationStats.total - migrationStats.noImage)) * 100 
                  : 0
                } 
                className="h-2"
              />
              
              <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
                <div className="text-center">
                  <div className="font-semibold text-green-600">{migrationStats.migrated}</div>
                  <div>Migrated</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-orange-600">{migrationStats.remaining}</div>
                  <div>Remaining</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-500">{migrationStats.noImage}</div>
                  <div>No Image</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Migration Progress */}
        {(isMigrating || migrationProgress) && (
          <div className="bg-card border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isMigrating ? (
                  <>
                    <Upload className="h-5 w-5 animate-pulse text-blue-500" />
                    <h3 className="font-semibold">Migrating Media to R2...</h3>
                  </>
                ) : migrationProgress?.status === 'completed' ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <h3 className="font-semibold">Migration Completed</h3>
                  </>
                ) : migrationProgress?.status === 'error' ? (
                  <>
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <h3 className="font-semibold">Migration Failed</h3>
                  </>
                ) : migrationProgress?.status === 'no_files_to_migrate' ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <h3 className="font-semibold">All Files Already Migrated</h3>
                  </>
                ) : null}
              </div>
              {migrationProgress && !isMigrating && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMigrationProgress(null)}
                >
                  ×
                </Button>
              )}
            </div>

            {/* Show indeterminate progress bar while migrating */}
            {isMigrating && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Processing files and uploading to R2... This may take a few minutes.
                </div>
                <Progress value={undefined} className="h-2" />
              </div>
            )}

            {/* Show detailed progress after migration completes */}
            {migrationProgress && !isMigrating && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Progress</span>
                    <span>{migrationProgress.processed}/{migrationProgress.total}</span>
                  </div>
                  <Progress 
                    value={migrationProgress.total > 0 ? (migrationProgress.processed / migrationProgress.total) * 100 : 0} 
                    className="h-2"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-green-600">{migrationProgress.successful}</div>
                    <div className="text-muted-foreground">Successful</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-red-600">{migrationProgress.failed}</div>
                    <div className="text-muted-foreground">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{migrationProgress.total}</div>
                    <div className="text-muted-foreground">Total</div>
                  </div>
                </div>

                {migrationProgress.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-red-600">Errors:</h4>
                    <div className="bg-red-50 border border-red-200 rounded p-3 max-h-32 overflow-y-auto">
                      {migrationProgress.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-700 mb-1">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

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
