/**
 * useHomeCourseWeather — Open-Meteo current-weather lookup for a user's
 * home golf club. Falls back to the geocode-club edge function when the
 * club row is missing lat/lng.
 *
 * Failure paths throw `WeatherUnresolvedError` with a typed reason so
 * the consuming card can report granular telemetry.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ClubLocation, WeatherData, WeatherUnresolvedReason } from './types';
import { WMO_WEATHER_CODES } from './types';

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

export class WeatherUnresolvedError extends Error {
  reason: WeatherUnresolvedReason;
  constructor(reason: WeatherUnresolvedReason, message?: string) {
    super(message ?? reason);
    this.name = 'WeatherUnresolvedError';
    this.reason = reason;
  }
}

async function fetchOpenMeteo(lat: number, lng: number): Promise<WeatherData> {
  const url = new URL(OPEN_METEO_BASE);
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lng));
  url.searchParams.set(
    'current',
    [
      'temperature_2m',
      'apparent_temperature',
      'wind_speed_10m',
      'wind_gusts_10m',
      'wind_direction_10m',
      'weather_code',
      'is_day',
    ].join(','),
  );
  url.searchParams.set('hourly', 'precipitation_probability');
  url.searchParams.set('daily', 'sunset,daylight_duration');
  url.searchParams.set('forecast_hours', '4');
  url.searchParams.set('forecast_days', '1');
  url.searchParams.set('temperature_unit', 'celsius');
  url.searchParams.set('wind_speed_unit', 'mph');
  url.searchParams.set('timezone', 'auto');

  let res: Response;
  try {
    res = await fetch(url.toString());
  } catch {
    throw new WeatherUnresolvedError('open_meteo_network_error');
  }

  if (!res.ok) {
    throw new WeatherUnresolvedError('open_meteo_failure', `Open-Meteo ${res.status}`);
  }

  let json: any;
  try {
    json = await res.json();
  } catch {
    throw new WeatherUnresolvedError('open_meteo_malformed_response');
  }

  const current = json?.current;
  if (
    !current ||
    typeof current.temperature_2m !== 'number' ||
    current.weather_code == null
  ) {
    throw new WeatherUnresolvedError('open_meteo_malformed_response');
  }

  const hourly = json?.hourly;
  const daily = json?.daily;

  const precipProbs: number[] = Array.isArray(hourly?.precipitation_probability)
    ? hourly.precipitation_probability.filter((v: unknown) => typeof v === 'number')
    : [];
  const precipProbabilityMax4h = precipProbs.length > 0 ? Math.max(...precipProbs) : 0;

  const sunsetIso: string | undefined = daily?.sunset?.[0];
  const sunsetTime = sunsetIso
    ? new Date(sunsetIso).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    : '—';

  const daylightSeconds: number = Number(daily?.daylight_duration?.[0] ?? 0);
  const daylightMinutes = Math.round(daylightSeconds / 60);

  const code = Number(current.weather_code);
  return {
    temperature: Number(current.temperature_2m),
    apparentTemperature: Number(current.apparent_temperature ?? current.temperature_2m),
    windSpeed: Number(current.wind_speed_10m ?? 0),
    windGust: Number(current.wind_gusts_10m ?? 0),
    windDirection: Number(current.wind_direction_10m ?? 0),
    weatherCode: code,
    description: WMO_WEATHER_CODES[code] ?? 'unknown',
    precipProbabilityMax4h,
    sunsetTime,
    daylightMinutes,
    isDay: current.is_day === 1 ? 1 : 0,
    fetchedAt: Date.now(),
  };
}

interface GeocodeFailure {
  reason: Extract<
    WeatherUnresolvedReason,
    'geocode_404_no_match' | 'geocode_502_service_error' | 'geocode_network_error'
  >;
}

async function geocodeClubViaEdgeFunction(
  clubId: string,
): Promise<{ latitude: number; longitude: number } | GeocodeFailure> {
  try {
    const { data, error } = await supabase.functions.invoke('geocode-club', {
      body: { club_id: clubId },
    });
    if (error) {
      // functions.invoke wraps HTTP status inconsistently; best-effort mapping.
      const status =
        (error as any)?.status ??
        (error as any)?.context?.status ??
        (error as any)?.context?.response?.status;
      if (typeof status === 'number') {
        if (status >= 500) return { reason: 'geocode_502_service_error' };
        if (status === 404) return { reason: 'geocode_404_no_match' };
      }
      return { reason: 'geocode_network_error' };
    }
    if (!data?.latitude || !data?.longitude) {
      return { reason: 'geocode_404_no_match' };
    }
    return { latitude: Number(data.latitude), longitude: Number(data.longitude) };
  } catch {
    return { reason: 'geocode_network_error' };
  }
}

export function useHomeCourseWeather(club: ClubLocation | null) {
  const queryClient = useQueryClient();

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
        if ('reason' in geocoded) {
          throw new WeatherUnresolvedError(geocoded.reason);
        }
        lat = geocoded.latitude;
        lng = geocoded.longitude;

        queryClient.invalidateQueries({ queryKey: ['morning-moment-club'] });
      }

      return fetchOpenMeteo(lat, lng);
    },
  });
}
