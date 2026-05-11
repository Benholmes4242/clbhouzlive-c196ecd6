/**
 * Weather types for Morning Moment.
 * Open-Meteo current + hourly + daily payload, normalised to our shape.
 */

export interface WeatherData {
  /** Current temperature in °C. Not rounded at the data layer. */
  temperature: number;
  /** Apparent temperature ("feels like") in °C. */
  apparentTemperature: number;
  /** Sustained wind speed in mph at 10m. */
  windSpeed: number;
  /** Wind gust speed in mph at 10m. */
  windGust: number;
  /** Wind direction in degrees, 0–360. */
  windDirection: number;
  /** WMO weather code for current conditions. */
  weatherCode: number;
  /** Display-ready description derived from WMO code. Sentence case. */
  description: string;
  /** Maximum precipitation probability (%) across the next 4 hours. */
  precipProbabilityMax4h: number;
  /** Today's peak temperature in °C, for trajectory copy. */
  peakTempToday: number;
  /** Time today's peak hits, formatted "1pm" / "11am" / "3pm". Empty if unparseable. */
  peakTempTimeLabel: string;
  /** Next-hour temperature in °C. Drives the trend arrow. */
  nextHourTemp: number;
  /** Today's sunset time as "HH:MM" string in the location's local time. */
  sunsetTime: string;
  /** Tomorrow's sunrise time as "HH:MM" in the location's local time. */
  sunriseTomorrowTime: string;
  /** Hours of daylight remaining today; null after sunset. */
  daylightHoursRemaining: number | null;
  /** Day progress: 0 at sunrise, 1 at sunset, -1 after sunset. Drives gradient warping. */
  dayProgress: number;
  /** 1 if currently daylight, 0 if night. */
  isDay: 0 | 1;
  /** Unix ms when this payload was fetched. */
  fetchedAt: number;
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
  0: 'Clear',
  1: 'Mostly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Foggy',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  56: 'Freezing drizzle',
  57: 'Freezing drizzle',
  61: 'Light rain',
  63: 'Steady rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Freezing rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Light showers',
  81: 'Showers',
  82: 'Heavy showers',
  85: 'Snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm',
  99: 'Thunderstorm',
};
