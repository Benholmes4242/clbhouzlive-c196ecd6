import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseCourseCoordinatesArgs {
  courseId: string;
  clubId?: string | null;
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

    // Short-circuit if we already have coordinates
    if (args.latitude && args.longitude) {
      if (mountedRef.current) {
        setCoords({ lat: args.latitude, lng: args.longitude });
      }
      return;
    }

    // geocode-club requires a club_id; skip fallback if we don't have one
    if (!args.clubId) {
      return;
    }

    const abortController = new AbortController();
    let cancelled = false;

    const fetchCoords = async () => {
      if (!mountedRef.current) return;
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('geocode-club', {
          body: { club_id: args.clubId },
        });

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

    return () => {
      mountedRef.current = false;
      cancelled = true;
      abortController.abort();
    };
  }, [args.courseId, args.clubId, args.latitude, args.longitude]);

  return { coords, loading };
}
