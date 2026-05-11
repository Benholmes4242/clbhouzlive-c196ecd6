/**
 * useHomeCourseWeather — Open-Meteo lookup for a user's home golf club.
 * Falls back to the geocode-club edge function when the club row is
 * missing lat/lng. Failure paths throw `WeatherUnresolvedError` with a
 * typed reason for granular telemetry.
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

function formatHM(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatHourLabel(iso?: string): string {
  if (!iso) return '';
  return new Date(iso)
    .toLocaleTimeString([], { hour: 'numeric', hour12: true })
    .toLowerCase()
    .replace(/\s/g, '');
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
  url.searchParams.set(
    'hourly',
    ['temperature_2m', 'precipitation_probability'].join(','),
  );
  url.searchParams.set(
    'daily',
    ['temperature_2m_max', 'sunrise', 'sunset', 'daylight_duration'].join(','),
  );
  url.searchParams.set('forecast_hours', '24');
  url.searchParams.set('forecast_days', '2');
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

  const hourlyTemps: number[] = Array.isArray(hourly?.temperature_2m)
    ? hourly.temperature_2m.filter((v: unknown): v is number => typeof v === 'number')
    : [];
  const hourlyPrecip: number[] = Array.isArray(hourly?.precipitation_probability)
    ? hourly.precipitation_probability.filter(
        (v: unknown): v is number => typeof v === 'number',
      )
    : [];
  const hourlyTimes: string[] = Array.isArray(hourly?.time) ? hourly.time : [];

  const precipProbabilityMax4h =
    hourlyPrecip.length > 0 ? Math.max(...hourlyPrecip.slice(0, 4)) : 0;

  // hourly[0] is the current hour, [1] is the next hour
  const nextHourTemp =
    typeof hourlyTemps[1] === 'number' ? hourlyTemps[1] : Number(current.temperature_2m);

  const peakTempToday: number =
    typeof daily?.temperature_2m_max?.[0] === 'number'
      ? daily.temperature_2m_max[0]
      : Number(current.temperature_2m);

  // Find peak time within today's hourly slice (~24 entries)
  const todaySlice = hourlyTemps.slice(0, 24);
  let peakIdx = -1;
  if (todaySlice.length > 0) {
    const maxVal = Math.max(...todaySlice);
    peakIdx = todaySlice.indexOf(maxVal);
  }
  const peakTimeIso = peakIdx >= 0 ? hourlyTimes[peakIdx] : undefined;
  const peakTempTimeLabel = formatHourLabel(peakTimeIso);

  const sunriseTodayIso: string | undefined = daily?.sunrise?.[0];
  const sunsetIso: string | undefined = daily?.sunset?.[0];
  const sunriseTomorrowIso: string | undefined = daily?.sunrise?.[1];

  const sunsetTime = formatHM(sunsetIso);
  const sunriseTomorrowTime = formatHM(sunriseTomorrowIso);

  const isDay: 0 | 1 = current.is_day === 1 ? 1 : 0;

  let daylightHoursRemaining: number | null = null;
  if (isDay === 1 && sunsetIso) {
    const ms = new Date(sunsetIso).getTime() - Date.now();
    daylightHoursRemaining = Math.max(0, ms / 3_600_000);
  }

  let dayProgress = -1;
  if (isDay === 1 && sunriseTodayIso && sunsetIso) {
    const sr = new Date(sunriseTodayIso).getTime();
    const ss = new Date(sunsetIso).getTime();
    const total = ss - sr;
    if (total > 0) {
      dayProgress = Math.max(0, Math.min(1, (Date.now() - sr) / total));
    }
  }

  const code = Number(current.weather_code);
  return {
    temperature: Number(current.temperature_2m),
    apparentTemperature: Number(current.apparent_temperature ?? current.temperature_2m),
    windSpeed: Number(current.wind_speed_10m ?? 0),
    windGust: Number(current.wind_gusts_10m ?? 0),
    windDirection: Number(current.wind_direction_10m ?? 0),
    weatherCode: code,
    description: WMO_WEATHER_CODES[code] ?? 'Unknown',
    precipProbabilityMax4h,
    peakTempToday,
    peakTempTimeLabel,
    nextHourTemp,
    sunsetTime,
    sunriseTomorrowTime,
    daylightHoursRemaining,
    dayProgress,
    isDay,
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
