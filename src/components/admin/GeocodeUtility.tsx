import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Play, Pause, RotateCcw } from 'lucide-react';

interface GeocodeStats {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
}

const GeocodeUtility = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [stats, setStats] = useState<GeocodeStats>({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    skipped: 0
  });
  const [currentClub, setCurrentClub] = useState<string>('');

  const fetchClubsWithoutCoordinates = async () => {
    const { data, error } = await supabase
      .from('golf_courses')
      .select('id, name, region, country, sub_country')
      .is('latitude', null)
      .limit(100);

    if (error) {
      console.error('Error fetching clubs:', error);
      return [];
    }

    return data || [];
  };

  const geocodeClub = async (club: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('geocode-club', {
        body: {
          clubId: club.id,
          clubName: club.name,
          region: club.region,
          country: club.country,
          subCountry: club.sub_country
        }
      });

      if (error) {
        console.error(`Failed to geocode ${club.name}:`, error);
        return false;
      }

      return data?.latitude && data?.longitude;
    } catch (error) {
      console.error(`Error geocoding ${club.name}:`, error);
      return false;
    }
  };

  const startGeocoding = async () => {
    setIsRunning(true);
    setIsPaused(false);
    
    const clubs = await fetchClubsWithoutCoordinates();
    
    if (clubs.length === 0) {
      toast.success('No clubs found', {
        description: 'All clubs already have coordinates or no clubs exist',
      });
      setIsRunning(false);
      return;
    }

    setStats({
      total: clubs.length,
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0
    });

    for (let i = 0; i < clubs.length; i++) {
      if (isPaused) {
        while (isPaused && isRunning) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      if (!isRunning) break;

      const club = clubs[i];
      setCurrentClub(club.name);

      const success = await geocodeClub(club);
      
      setStats(prev => ({
        ...prev,
        processed: i + 1,
        successful: prev.successful + (success ? 1 : 0),
        failed: prev.failed + (success ? 0 : 1)
      }));

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setIsRunning(false);
    setCurrentClub('');
    
    toast.success('Geocoding complete', {
      description: `Processed ${stats.processed} clubs. ${stats.successful} successful, ${stats.failed} failed.`,
    });
  };

  const pauseGeocoding = () => {
    setIsPaused(!isPaused);
  };

  const stopGeocoding = () => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentClub('');
  };

  const resetStats = () => {
    setStats({
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0
    });
    setCurrentClub('');
  };

  const progress = stats.total > 0 ? (stats.processed / stats.total) * 100 : 0;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Club Geocoding Utility
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          {!isRunning ? (
            <Button onClick={startGeocoding} className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Start Geocoding
            </Button>
          ) : (
            <>
              <Button 
                onClick={pauseGeocoding} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <Pause className="h-4 w-4" />
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              <Button 
                onClick={stopGeocoding} 
                variant="destructive"
                className="flex items-center gap-2"
              >
                Stop
              </Button>
            </>
          )}
          
          <Button 
            onClick={resetStats} 
            variant="outline"
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>

        {stats.total > 0 && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Progress</span>
                <span>{stats.processed} / {stats.total}</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>

            {currentClub && (
              <div className="text-sm">
                <span className="text-muted-foreground">Currently processing: </span>
                <span className="font-medium">{currentClub}</span>
                {isPaused && <span className="text-yellow-600 ml-2">(Paused)</span>}
              </div>
            )}

            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.processed}</div>
                <div className="text-xs text-muted-foreground">Processed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.successful}</div>
                <div className="text-xs text-muted-foreground">Successful</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                <div className="text-xs text-muted-foreground">Failed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">{stats.skipped}</div>
                <div className="text-xs text-muted-foreground">Skipped</div>
              </div>
            </div>
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          <p>This utility will process clubs that don't have coordinates and attempt to geocode them using Google Maps API.</p>
          <p className="mt-1">⚠️ Rate limited to 1 request per second to avoid API limits.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeocodeUtility;
