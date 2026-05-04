/**
 * useHomeCourseWeather — Open-Meteo current-weather lookup for a user's
 * home golf club. Falls back to the geocode-club edge function when the
 * club row is missing lat/lng.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ClubLocation, WeatherData } from './types';
import { WMO_WEATHER_CODES } from './types';

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

async function fetchOpenMeteo(lat: number, lng: number): Promise<WeatherData> {
  const url = new URL(OPEN_METEO_BASE);
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lng));
  url.searchParams.set('current', 'temperature_2m,wind_speed_10m,weather_code');
  url.searchParams.set('temperature_unit', 'celsius');
  url.searchParams.set('wind_speed_unit', 'mph');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const json = await res.json();

  const code = Number(json.current?.weather_code ?? 0);
  return {
    temperature: Number(json.current?.temperature_2m ?? 0),
    windSpeed: Number(json.current?.wind_speed_10m ?? 0),
    weatherCode: code,
    description: WMO_WEATHER_CODES[code] ?? 'unknown',
    fetchedAt: Date.now(),
  };
}

async function geocodeClubViaEdgeFunction(
  clubId: string,
): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const { data, error } = await supabase.functions.invoke('geocode-club', {
      body: { club_id: clubId },
    });
    if (error || !data?.latitude || !data?.longitude) return null;
    return { latitude: Number(data.latitude), longitude: Number(data.longitude) };
  } catch {
    return null;
  }
}

export function useHomeCourseWeather(club: ClubLocation | null) {
  return useQuery<WeatherData | null>({
    queryKey: ['home-course-weather', club?.id],
    enabled: !!club?.id,
    staleTime: 30 * 60_000,
    refetchInterval: 30 * 60_000,
    retry: 1,
    queryFn: async () => {
      if (!club) return null;

      let lat = club.latitude;
      let lng = club.longitude;

      if (lat === null || lng === null) {
        const geocoded = await geocodeClubViaEdgeFunction(club.id);
        if (!geocoded) return null;
        lat = geocoded.latitude;
        lng = geocoded.longitude;
      }

      return fetchOpenMeteo(lat, lng);
    },
  });
}
