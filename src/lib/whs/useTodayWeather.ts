import { useQuery } from '@tanstack/react-query';

export interface TodayWeather {
  tempNow: number;
  tempMax: number | null;
  code: number | null;
  windWord: string | null;
}

/**
 * Lightweight Open-Meteo lookup for the Today greeting line.
 * Returns null if coords aren't available — caller hides the meta row.
 */
export function useTodayWeather(lat: number | null, lng: number | null) {
  return useQuery<TodayWeather | null>({
    queryKey: ['today-greeting-weather', lat, lng],
    enabled: lat != null && lng != null,
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      if (lat == null || lng == null) return null;
      const url = new URL('https://api.open-meteo.com/v1/forecast');
      url.searchParams.set('latitude', String(lat));
      url.searchParams.set('longitude', String(lng));
      url.searchParams.set('current', 'temperature_2m,weather_code,wind_speed_10m');
      url.searchParams.set('daily', 'temperature_2m_max');
      url.searchParams.set('timezone', 'auto');
      url.searchParams.set('forecast_days', '1');

      const res = await fetch(url.toString());
      if (!res.ok) return null;
      const json: any = await res.json();
      const tempNow = json?.current?.temperature_2m;
      const tempMax = json?.daily?.temperature_2m_max?.[0] ?? null;
      const code = json?.current?.weather_code ?? null;
      const windKmh = json?.current?.wind_speed_10m ?? null;
      if (typeof tempNow !== 'number') return null;

      return { tempNow, tempMax, code, windWord: windWord(windKmh) };
    },
  });
}

function windWord(kmh: number | null): string | null {
  if (kmh == null) return null;
  if (kmh < 5) return 'calm air';
  if (kmh < 15) return 'light breeze';
  if (kmh < 30) return 'fresh breeze';
  if (kmh < 50) return 'strong wind';
  return 'gale';
}
