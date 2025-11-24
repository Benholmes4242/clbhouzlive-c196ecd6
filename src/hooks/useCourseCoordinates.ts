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
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // Phase 3: Short-circuit if we already have coordinates
    if (args.latitude && args.longitude) {
      if (mountedRef.current) {
        setCoords({ lat: args.latitude, lng: args.longitude });
      }
      return;
    }

    // AbortController to prevent execution after unmount
    const abortController = new AbortController();
    let cancelled = false;

    // Fall back to geocode-club edge function only if needed
    const fetchCoords = async () => {
      if (!mountedRef.current) return;
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

        // Ignore if component unmounted
        if (cancelled || !mountedRef.current) return;

        if (!error && data?.latitude && data?.longitude) {
          setCoords({ lat: data.latitude, lng: data.longitude });
        }
      } catch (error) {
        if (!cancelled && mountedRef.current) {
          console.error('Error geocoding course:', error);
        }
      } finally {
        if (!cancelled && mountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchCoords();

    // Cleanup: abort request and mark as cancelled
    return () => {
      mountedRef.current = false;
      cancelled = true;
      abortController.abort();
    };
  }, [args.courseId, args.latitude, args.longitude, args.name, args.country, args.subCountry, args.region]);

  return { coords, loading };
}
