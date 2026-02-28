import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GeocodeResult {
  courseId: string;
  courseName: string;
  success: boolean;
  error?: string;
}

const BATCH_SIZE = 5; // Process 5 courses at a time to respect API limits
const BATCH_DELAY_MS = 2000; // 2 second delay between batches

export function Top100GeocodingBackfill() {
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{
    total: number;
    processed: number;
    successful: number;
    failed: number;
  } | null>(null);
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [coursesWithoutCoords, setCoursesWithoutCoords] = useState<number | null>(null);

  const checkMissingCoordinates = async () => {
    try {
      // Query all Top 100 courses missing coordinates
      const { data: memberships, error } = await supabase
        .from('course_top100_memberships')
        .select(`
          course_id,
          golf_courses!inner(
            id,
            name,
            latitude,
            longitude,
            country,
            sub_country,
            region
          )
        `);

      if (error) throw error;

      // Filter to unique courses without coordinates
      const uniqueCoursesMap = new Map();
      memberships?.forEach((m: any) => {
        const course = m.golf_courses;
        if (course && (!course.latitude || !course.longitude)) {
          if (!uniqueCoursesMap.has(course.id)) {
            uniqueCoursesMap.set(course.id, course);
          }
        }
      });

      const count = uniqueCoursesMap.size;
      setCoursesWithoutCoords(count);

      toast.success(`Found ${count} Top 100 courses missing coordinates`);

      return Array.from(uniqueCoursesMap.values());
    } catch (error: any) {
      console.error('Error checking coordinates:', error);
      toast.error(error.message || "Failed to check coordinates");
      return [];
    }
  };

  const geocodeCourse = async (course: any): Promise<GeocodeResult> => {
    try {
      const { data, error } = await supabase.functions.invoke('geocode-club', {
        body: {
          courseId: course.id,
          clubName: course.name,
          country: course.country,
          subCountry: course.sub_country,
          region: course.region,
        },
      });

      if (error) throw error;

      console.log(`✅ Geocoded: ${course.name}`, data);

      return {
        courseId: course.id,
        courseName: course.name,
        success: true,
      };
    } catch (error: any) {
      console.error(`❌ Failed to geocode: ${course.name}`, error);

      return {
        courseId: course.id,
        courseName: course.name,
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  };

  const startBackfill = async () => {
    setIsProcessing(true);
    setProgress({ total: 0, processed: 0, successful: 0, failed: 0 });
    setResults([]);

    try {
      // Get all courses without coordinates
      const courses = await checkMissingCoordinates();
      
      if (courses.length === 0) {
        toast.success("All courses already have coordinates");
        setIsProcessing(false);
        return;
      }

      setProgress({ total: courses.length, processed: 0, successful: 0, failed: 0 });

      // Process in batches
      for (let i = 0; i < courses.length; i += BATCH_SIZE) {
        const batch = courses.slice(i, i + BATCH_SIZE);
        
        console.log(`🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(courses.length / BATCH_SIZE)}`);
        
        // Process batch in parallel
        const batchResults = await Promise.all(
          batch.map(course => geocodeCourse(course))
        );

        // Update progress
        setResults(prev => [...prev, ...batchResults]);
        setProgress(prev => ({
          total: prev?.total || 0,
          processed: (prev?.processed || 0) + batchResults.length,
          successful: (prev?.successful || 0) + batchResults.filter(r => r.success).length,
          failed: (prev?.failed || 0) + batchResults.filter(r => !r.success).length,
        }));

        // Delay between batches (except for the last batch)
        if (i + BATCH_SIZE < courses.length) {
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
        }
      }

      toast.success(`Successfully geocoded ${progress?.successful || 0} out of ${courses.length} courses`);

    } catch (error: any) {
      console.error('Backfill error:', error);
      toast.error(error.message || "Backfill failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Top 100 Geocoding Backfill
        </CardTitle>
        <CardDescription>
          Automatically populate missing coordinates for all Top 100 courses using the Google Maps Geocoding API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This tool finds all Top 100 courses without coordinates and calls the same geocode-club edge function
            that Course Details uses. Processes {BATCH_SIZE} courses at a time with rate limiting.
          </AlertDescription>
        </Alert>

        {coursesWithoutCoords !== null && (
          <Alert>
            <MapPin className="h-4 w-4" />
            <AlertDescription>
              <strong>{coursesWithoutCoords} Top 100 courses</strong> are currently missing coordinates
            </AlertDescription>
          </Alert>
        )}

        {progress && (
          <div className="space-y-2">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Progress: {progress.processed} / {progress.total} courses processed
                <br />
                ✅ Successful: {progress.successful} | ❌ Failed: {progress.failed}
              </AlertDescription>
            </Alert>

            {/* Progress bar */}
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-primary-accent h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.processed / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="max-h-64 overflow-y-auto space-y-1 text-sm">
            {results.map((result, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                )}
                <span className="truncate">
                  {result.courseName}
                  {result.error && <span className="text-red-600 ml-2">({result.error})</span>}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={checkMissingCoordinates}
            disabled={isProcessing}
            variant="secondary"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Scan for Missing Coordinates
          </Button>

          <Button
            onClick={startBackfill}
            disabled={isProcessing || coursesWithoutCoords === 0}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 mr-2" />
                Start Geocoding Backfill
              </>
            )}
          </Button>
        </div>

        <Alert>
          <AlertDescription className="text-xs">
            <strong>How it works:</strong>
            <ol className="list-decimal list-inside mt-1 space-y-1">
              <li>Finds all Top 100 courses with null latitude/longitude</li>
              <li>Calls geocode-club edge function for each course</li>
              <li>geocode-club uses Google Maps API with course name + region + country</li>
              <li>Writes coordinates back to golf_courses table</li>
              <li>Top 100 Map immediately sees the updated coordinates</li>
            </ol>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
