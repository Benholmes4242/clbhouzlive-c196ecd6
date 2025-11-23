import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseCourseCoordinatesArgs {
  courseId: string;
  latitude?: number | null;
  longitude?: number | null;
  name: string;
  country?: string | null;
  subCountry?: string | null;
  region?: string | null;
}

export function useCourseCoordinates(args: UseCourseCoordinatesArgs) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    args.latitude && args.longitude 
      ? { lat: args.latitude, lng: args.longitude } 
      : null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If we already have coordinates, use them
    if (args.latitude && args.longitude) {
      setCoords({ lat: args.latitude, lng: args.longitude });
      return;
    }

    // Fall back to geocode-club edge function
    const abortController = new AbortController();
    let cancelled = false;

    const fetchCoords = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('geocode-club', {
          body: {
            courseId: args.courseId,
            clubName: args.name,
            country: args.country,
            subCountry: args.subCountry,
            region: args.region,
          },
        });

        if (cancelled) return;

        if (!error && data?.latitude && data?.longitude) {
          setCoords({ lat: data.latitude, lng: data.longitude });
        }
      } catch (error) {
        if (cancelled) return;
        console.error('Error geocoding course:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchCoords();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [args.courseId, args.latitude, args.longitude]);

  return { coords, loading };
}
