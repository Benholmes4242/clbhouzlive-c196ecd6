import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, MapPin, AlertCircle, CheckCircle2, ArrowRight, Building2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BackfillResult {
  clubId: string;
  clubName: string;
  success: boolean;
  method: 'copied' | 'geocoded';
  error?: string;
}

interface ClubStats {
  totalClubs: number;
  clubsWithCoords: number;
  clubsWithoutCoords: number;
  clubsWithCourseCoords: number; // Can copy from courses
  clubsNeedingGeocode: number;   // No course coords available
}

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 500;

export function GolfClubsGeocodingBackfill() {
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<ClubStats | null>(null);
  const [progress, setProgress] = useState<{
    total: number;
    processed: number;
    successful: number;
    failed: number;
  } | null>(null);
  const [results, setResults] = useState<BackfillResult[]>([]);

  const scanClubs = async () => {
    setIsProcessing(true);
    try {
      // Get all golf_clubs
      const { data: allClubs, error: clubsError } = await supabase
        .from('golf_clubs')
        .select('id, name, latitude, longitude');

      if (clubsError) throw clubsError;

      const totalClubs = allClubs?.length || 0;
      const clubsWithCoords = allClubs?.filter(c => c.latitude !== null && c.longitude !== null).length || 0;
      const clubsWithoutCoords = totalClubs - clubsWithCoords;

      // For clubs without coords, check which have linked courses with coords
      const clubsNeedingCoords = allClubs?.filter(c => c.latitude === null || c.longitude === null) || [];
      
      let clubsWithCourseCoords = 0;
      if (clubsNeedingCoords.length > 0) {
        const clubIds = clubsNeedingCoords.map(c => c.id);
        
        // Query courses that have coords for these clubs
        const { data: coursesWithCoords } = await supabase
          .from('golf_courses')
          .select('club_id')
          .in('club_id', clubIds)
          .not('latitude', 'is', null)
          .not('longitude', 'is', null);

        const uniqueClubsWithCourseCoords = new Set(coursesWithCoords?.map(c => c.club_id));
        clubsWithCourseCoords = uniqueClubsWithCourseCoords.size;
      }

      const clubsNeedingGeocode = clubsWithoutCoords - clubsWithCourseCoords;

      setStats({
        totalClubs,
        clubsWithCoords,
        clubsWithoutCoords,
        clubsWithCourseCoords,
        clubsNeedingGeocode,
      });

      toast.success("Scan complete");
    } catch (error: any) {
      console.error('Error scanning clubs:', error);
      toast.error("Couldn't scan clubs");
    } finally {
      setIsProcessing(false);
    }
  };

  const copyFromCourses = async () => {
    setIsProcessing(true);
    setProgress({ total: 0, processed: 0, successful: 0, failed: 0 });
    setResults([]);

    try {
      // Get clubs without coords
      const { data: clubsWithoutCoords } = await supabase
        .from('golf_clubs')
        .select('id, name')
        .or('latitude.is.null,longitude.is.null');

      if (!clubsWithoutCoords || clubsWithoutCoords.length === 0) {
        toast.success("No Work Needed", { description: "All clubs already have coordinates!" });
        setIsProcessing(false);
        return;
      }

      // For each club, find a course with coords
      const clubIds = clubsWithoutCoords.map(c => c.id);
      const { data: coursesWithCoords } = await supabase
        .from('golf_courses')
        .select('club_id, latitude, longitude')
        .in('club_id', clubIds)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      // Build a map of club_id -> first course coords
      const coordsMap = new Map<string, { lat: number; lng: number }>();
      coursesWithCoords?.forEach(course => {
        if (!coordsMap.has(course.club_id) && course.latitude && course.longitude) {
          coordsMap.set(course.club_id, { lat: course.latitude, lng: course.longitude });
        }
      });

      const clubsToCopy = clubsWithoutCoords.filter(c => coordsMap.has(c.id));
      
      if (clubsToCopy.length === 0) {
        toast.success("No Work Needed", { description: "No clubs have linked courses with coordinates to copy." });
        setIsProcessing(false);
        return;
      }

      setProgress({ total: clubsToCopy.length, processed: 0, successful: 0, failed: 0 });

      // Process in batches
      for (let i = 0; i < clubsToCopy.length; i += BATCH_SIZE) {
        const batch = clubsToCopy.slice(i, i + BATCH_SIZE);
        
        const batchResults: BackfillResult[] = await Promise.all(
          batch.map(async (club) => {
            const coords = coordsMap.get(club.id)!;
            const { error } = await supabase
              .from('golf_clubs')
              .update({ latitude: coords.lat, longitude: coords.lng })
              .eq('id', club.id);

            return {
              clubId: club.id,
              clubName: club.name,
              success: !error,
              method: 'copied' as const,
              error: error?.message,
            };
          })
        );

        setResults(prev => [...prev, ...batchResults]);
        setProgress(prev => ({
          total: prev?.total || 0,
          processed: (prev?.processed || 0) + batchResults.length,
          successful: (prev?.successful || 0) + batchResults.filter(r => r.success).length,
          failed: (prev?.failed || 0) + batchResults.filter(r => !r.success).length,
        }));

        if (i + BATCH_SIZE < clubsToCopy.length) {
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
        }
      }

      toast.success("Coordinates copied");
    } catch (error: any) {
      console.error('Copy error:', error);
      toast.error("Couldn't copy coordinates");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Golf Clubs Coordinate Backfill
        </CardTitle>
        <CardDescription>
          Populate coordinates for golf_clubs from their linked golf_courses. This ensures business profiles show maps immediately when linked to a club.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            When a business profile is linked to a golf club, the map uses this fallback chain:
            <br />
            <code className="text-xs">business_accounts.lat/lng → golf_clubs.lat/lng → golf_courses.lat/lng</code>
            <br />
            This tool copies coords from golf_courses to golf_clubs so maps render instantly.
          </AlertDescription>
        </Alert>

        {stats && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-muted/30 p-3 rounded-sq-sm">
              <div className="text-2xl font-bold">{stats.totalClubs.toLocaleString()}</div>
              <div className="text-muted-foreground">Total Golf Clubs</div>
            </div>
            <div className="bg-green-50 p-3 rounded-sq-sm">
              <div className="text-2xl font-bold text-green-600">{stats.clubsWithCoords.toLocaleString()}</div>
              <div className="text-muted-foreground">Have Coordinates</div>
            </div>
            <div className="bg-orange-50 p-3 rounded-sq-sm">
              <div className="text-2xl font-bold text-orange-600">{stats.clubsWithCourseCoords.toLocaleString()}</div>
              <div className="text-muted-foreground">Can Copy from Courses</div>
            </div>
            <div className="bg-red-50 p-3 rounded-sq-sm">
              <div className="text-2xl font-bold text-red-600">{stats.clubsNeedingGeocode.toLocaleString()}</div>
              <div className="text-muted-foreground">Need Geocoding</div>
            </div>
          </div>
        )}

        {progress && (
          <div className="space-y-2">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Progress: {progress.processed} / {progress.total} clubs processed
                <br />
                ✅ Successful: {progress.successful} | ❌ Failed: {progress.failed}
              </AlertDescription>
            </Alert>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.processed / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="max-h-48 overflow-y-auto space-y-1 text-sm border rounded-sq-sm p-2">
            {results.slice(-20).map((result, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                )}
                <span className="truncate">
                  {result.clubName}
                  {result.error && <span className="text-red-600 ml-2">({result.error})</span>}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={scanClubs}
            disabled={isProcessing}
            variant="secondary"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Scan Golf Clubs
          </Button>

          <Button
            onClick={copyFromCourses}
            disabled={isProcessing || !stats || stats.clubsWithCourseCoords === 0}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4 mr-2" />
                Copy Coords from Courses
              </>
            )}
          </Button>
        </div>

        <Alert>
          <AlertDescription className="text-xs">
            <strong>How it works:</strong>
            <ol className="list-decimal list-inside mt-1 space-y-1">
              <li>Finds all golf_clubs with null latitude/longitude</li>
              <li>Checks if any linked golf_courses have coordinates</li>
              <li>Copies the first available course coords to the parent club</li>
              <li>Business profile maps now render immediately when linked</li>
            </ol>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
