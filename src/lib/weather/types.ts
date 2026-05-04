/**
 * Weather types for Morning Moment.
 * Open-Meteo current weather payload, normalized to our shape.
 */

export interface WeatherData {
  temperature: number; // °C
  windSpeed: number;   // mph
  weatherCode: number; // WMO weather code
  description: string; // human-readable
  fetchedAt: number;   // unix ms
}

export interface ClubLocation {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  country: string | null;
  region: string | null;
  sub_country: string | null;
}

export type WeatherUnresolvedReason =
  | 'no_club_coords_no_geocode'
  | 'geocode_404_no_match'
  | 'geocode_502_service_error'
  | 'geocode_network_error'
  | 'open_meteo_failure'
  | 'open_meteo_network_error'
  | 'open_meteo_malformed_response'
  | 'unknown';

export const WMO_WEATHER_CODES: Record<number, string> = {
  0: 'clear',
  1: 'mostly clear',
  2: 'partly cloudy',
  3: 'overcast',
  45: 'foggy',
  48: 'foggy',
  51: 'light drizzle',
  53: 'drizzle',
  55: 'heavy drizzle',
  56: 'freezing drizzle',
  57: 'freezing drizzle',
  61: 'light rain',
  63: 'rain',
  65: 'heavy rain',
  66: 'freezing rain',
  67: 'freezing rain',
  71: 'light snow',
  73: 'snow',
  75: 'heavy snow',
  77: 'snow grains',
  80: 'light showers',
  81: 'showers',
  82: 'heavy showers',
  85: 'snow showers',
  86: 'heavy snow showers',
  95: 'thunderstorm',
  96: 'thunderstorm',
  99: 'thunderstorm',
};
