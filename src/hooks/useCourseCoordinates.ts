import { useState, useEffect, useRef } from 'react';
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

    // AbortController to cancel edge function on unmount
    const abortController = new AbortController();
    let mounted = true;

    // Fall back to geocode-club edge function
    const fetchCoords = async () => {
      if (!mounted) return;
      
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

        // Guard against state updates after unmount
        if (!mounted) return;

        if (!error && data?.latitude && data?.longitude) {
          setCoords({ lat: data.latitude, lng: data.longitude });
        }
      } catch (error) {
        // Guard against state updates after unmount
        if (!mounted) return;
        console.error('Error geocoding course:', error);
      } finally {
        // Guard against state updates after unmount
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchCoords();

    return () => {
      mounted = false;
      abortController.abort();
    };
  }, [args.courseId, args.latitude, args.longitude]);

  return { coords, loading };
}
