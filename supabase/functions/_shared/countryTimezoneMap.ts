/**
 * Country/State → IANA Timezone Resolution
 * 
 * Maps Sportradar venue.country and venue.state to IANA timezone strings.
 * Used by tournament-live-sync for per-tournament time-of-day gating,
 * and by schedule sync functions to populate sr_tournaments.timezone.
 */

const COUNTRY_TIMEZONE_MAP: Record<string, string> = {
  // North America (full names + ISO alpha-3)
  'usa': 'America/New_York', 'united states': 'America/New_York',
  'us': 'America/New_York',
  'canada': 'America/Toronto', 'can': 'America/Toronto',
  'mexico': 'America/Mexico_City', 'mex': 'America/Mexico_City',
  'bermuda': 'Atlantic/Bermuda', 'bmu': 'Atlantic/Bermuda',
  'bahamas': 'America/Nassau', 'bhs': 'America/Nassau',
  'dominican republic': 'America/Santo_Domingo', 'dom': 'America/Santo_Domingo',
  'puerto rico': 'America/Puerto_Rico', 'pri': 'America/Puerto_Rico',

  // Europe (full names + ISO alpha-3)
  'united kingdom': 'Europe/London', 'england': 'Europe/London',
  'scotland': 'Europe/London', 'wales': 'Europe/London',
  'northern ireland': 'Europe/London',
  'gbr': 'Europe/London',
  'ireland': 'Europe/Dublin', 'irl': 'Europe/Dublin',
  'france': 'Europe/Paris', 'fra': 'Europe/Paris',
  'spain': 'Europe/Madrid', 'esp': 'Europe/Madrid',
  'italy': 'Europe/Rome', 'ita': 'Europe/Rome',
  'germany': 'Europe/Berlin', 'deu': 'Europe/Berlin',
  'portugal': 'Europe/Lisbon', 'prt': 'Europe/Lisbon',
  'netherlands': 'Europe/Amsterdam', 'nld': 'Europe/Amsterdam',
  'sweden': 'Europe/Stockholm', 'swe': 'Europe/Stockholm',
  'denmark': 'Europe/Copenhagen', 'dnk': 'Europe/Copenhagen',
  'norway': 'Europe/Oslo', 'nor': 'Europe/Oslo',
  'finland': 'Europe/Helsinki', 'fin': 'Europe/Helsinki',
  'czech republic': 'Europe/Prague', 'czechia': 'Europe/Prague', 'cze': 'Europe/Prague',
  'austria': 'Europe/Vienna', 'aut': 'Europe/Vienna',
  'switzerland': 'Europe/Zurich', 'che': 'Europe/Zurich',
  'belgium': 'Europe/Brussels', 'bel': 'Europe/Brussels',
  'turkey': 'Europe/Istanbul', 'türkiye': 'Europe/Istanbul', 'tur': 'Europe/Istanbul',

  // Middle East (full names + ISO alpha-3)
  'united arab emirates': 'Asia/Dubai', 'uae': 'Asia/Dubai', 'are': 'Asia/Dubai',
  'saudi arabia': 'Asia/Riyadh', 'sau': 'Asia/Riyadh',
  'qatar': 'Asia/Qatar', 'qat': 'Asia/Qatar',
  'bahrain': 'Asia/Bahrain', 'bhr': 'Asia/Bahrain',
  'oman': 'Asia/Muscat', 'omn': 'Asia/Muscat',

  // Asia-Pacific (full names + ISO alpha-3)
  'japan': 'Asia/Tokyo', 'jpn': 'Asia/Tokyo',
  'south korea': 'Asia/Seoul', 'korea': 'Asia/Seoul', 'kor': 'Asia/Seoul',
  'china': 'Asia/Shanghai', 'chn': 'Asia/Shanghai',
  'india': 'Asia/Kolkata', 'ind': 'Asia/Kolkata',
  'thailand': 'Asia/Bangkok', 'tha': 'Asia/Bangkok',
  'singapore': 'Asia/Singapore', 'sgp': 'Asia/Singapore',
  'malaysia': 'Asia/Kuala_Lumpur', 'mys': 'Asia/Kuala_Lumpur',
  'indonesia': 'Asia/Jakarta', 'idn': 'Asia/Jakarta',
  'philippines': 'Asia/Manila', 'phl': 'Asia/Manila',
  'vietnam': 'Asia/Ho_Chi_Minh', 'vnm': 'Asia/Ho_Chi_Minh',
  'australia': 'Australia/Sydney', 'aus': 'Australia/Sydney',
  'new zealand': 'Pacific/Auckland', 'nzl': 'Pacific/Auckland',

  // Africa (full names + ISO alpha-3)
  'south africa': 'Africa/Johannesburg', 'zaf': 'Africa/Johannesburg',
  'kenya': 'Africa/Nairobi', 'ken': 'Africa/Nairobi',
  'morocco': 'Africa/Casablanca', 'mar': 'Africa/Casablanca',
  'egypt': 'Africa/Cairo', 'egy': 'Africa/Cairo',
  'nigeria': 'Africa/Lagos', 'nga': 'Africa/Lagos',
  'mauritius': 'Indian/Mauritius', 'mus': 'Indian/Mauritius',

  // Caribbean / Central America (full names + ISO alpha-3)
  'jamaica': 'America/Jamaica', 'jam': 'America/Jamaica',
  'costa rica': 'America/Costa_Rica', 'cri': 'America/Costa_Rica',
  'panama': 'America/Panama', 'pan': 'America/Panama',

  // South America (full names + ISO alpha-3)
  'argentina': 'America/Argentina/Buenos_Aires', 'arg': 'America/Argentina/Buenos_Aires',
  'brazil': 'America/Sao_Paulo', 'bra': 'America/Sao_Paulo',
  'chile': 'America/Santiago', 'chl': 'America/Santiago',
  'colombia': 'America/Bogota', 'col': 'America/Bogota',
};

const US_STATE_TIMEZONE_MAP: Record<string, string> = {
  // Eastern
  'fl': 'America/New_York', 'ga': 'America/New_York',
  'nc': 'America/New_York', 'sc': 'America/New_York',
  'nj': 'America/New_York', 'ny': 'America/New_York',
  'ct': 'America/New_York', 'va': 'America/New_York',
  'md': 'America/New_York', 'oh': 'America/New_York',
  'mi': 'America/New_York', 'pa': 'America/New_York',
  'dc': 'America/New_York', 'ma': 'America/New_York',
  'me': 'America/New_York', 'nh': 'America/New_York',
  'vt': 'America/New_York', 'ri': 'America/New_York',
  'de': 'America/New_York', 'wv': 'America/New_York',
  'ky': 'America/New_York', 'in': 'America/New_York',

  // Central
  'tx': 'America/Chicago', 'la': 'America/Chicago',
  'tn': 'America/Chicago', 'il': 'America/Chicago',
  'mn': 'America/Chicago', 'wi': 'America/Chicago',
  'ok': 'America/Chicago', 'ms': 'America/Chicago',
  'al': 'America/Chicago', 'ar': 'America/Chicago',
  'ia': 'America/Chicago', 'mo': 'America/Chicago',
  'ks': 'America/Chicago', 'ne': 'America/Chicago',
  'nd': 'America/Chicago', 'sd': 'America/Chicago',

  // Mountain
  'az': 'America/Phoenix', 'co': 'America/Denver',
  'ut': 'America/Denver', 'nm': 'America/Denver',
  'id': 'America/Boise', 'mt': 'America/Denver',
  'wy': 'America/Denver',

  // Pacific
  'ca': 'America/Los_Angeles', 'wa': 'America/Los_Angeles',
  'or': 'America/Los_Angeles', 'nv': 'America/Los_Angeles',

  // Other
  'hi': 'Pacific/Honolulu', 'ak': 'America/Anchorage',
  'pr': 'America/Puerto_Rico',
};

const US_STATE_NAME_MAP: Record<string, string> = {
  'alabama': 'al', 'alaska': 'ak', 'arizona': 'az', 'arkansas': 'ar',
  'california': 'ca', 'colorado': 'co', 'connecticut': 'ct', 'delaware': 'de',
  'district of columbia': 'dc', 'florida': 'fl', 'georgia': 'ga', 'hawaii': 'hi',
  'idaho': 'id', 'illinois': 'il', 'indiana': 'in', 'iowa': 'ia',
  'kansas': 'ks', 'kentucky': 'ky', 'louisiana': 'la', 'maine': 'me',
  'maryland': 'md', 'massachusetts': 'ma', 'michigan': 'mi', 'minnesota': 'mn',
  'mississippi': 'ms', 'missouri': 'mo', 'montana': 'mt', 'nebraska': 'ne',
  'nevada': 'nv', 'new hampshire': 'nh', 'new jersey': 'nj', 'new mexico': 'nm',
  'new york': 'ny', 'north carolina': 'nc', 'north dakota': 'nd', 'ohio': 'oh',
  'oklahoma': 'ok', 'oregon': 'or', 'pennsylvania': 'pa', 'puerto rico': 'pr',
  'rhode island': 'ri', 'south carolina': 'sc', 'south dakota': 'sd',
  'tennessee': 'tn', 'texas': 'tx', 'utah': 'ut', 'vermont': 'vt',
  'virginia': 'va', 'washington': 'wa', 'west virginia': 'wv',
  'wisconsin': 'wi', 'wyoming': 'wy',
};

const DEFAULT_TZ = 'America/New_York';

/**
 * Resolve IANA timezone from country + optional state.
 * US tournaments use state-level resolution for accuracy.
 */
export function resolveTimezone(
  country?: string | null,
  state?: string | null
): string {
  if (!country) return DEFAULT_TZ;

  const countryLower = country.toLowerCase().trim();
  const isUS = ['usa', 'us', 'united states', 'united states of america'].includes(countryLower);

  if (isUS && state) {
    const stateLower = state.toLowerCase().trim();
    // Try abbreviation (e.g. 'ca')
    if (US_STATE_TIMEZONE_MAP[stateLower]) return US_STATE_TIMEZONE_MAP[stateLower];
    // Try full name (e.g. 'california' -> 'ca')
    const abbrev = US_STATE_NAME_MAP[stateLower];
    if (abbrev && US_STATE_TIMEZONE_MAP[abbrev]) return US_STATE_TIMEZONE_MAP[abbrev];
  }

  // Country-level lookup
  if (COUNTRY_TIMEZONE_MAP[countryLower]) return COUNTRY_TIMEZONE_MAP[countryLower];

  // Partial match fallback
  for (const [key, tz] of Object.entries(COUNTRY_TIMEZONE_MAP)) {
    if (countryLower.includes(key) || key.includes(countryLower)) return tz;
  }

  console.warn(`[Timezone] No mapping for \"${country}\" \"${state}\" — using ${DEFAULT_TZ}`);
  return DEFAULT_TZ;
}

/**
 * Check if current time is within playing hours for a given IANA timezone.
 * Window: 5 AM – 9 PM local time (generous for early tee times and playoffs).
 */
export function isWithinPlayingHoursForTimezone(timezone: string): {
  allowed: boolean; reason: string;
  localHour: number; localDay: string;
} {
  const now = new Date();
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric', hour12: false, weekday: 'short',
    });
    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const day = parts.find(p => p.type === 'weekday')?.value || '';

    if (hour < 5 || hour >= 21) {
      return {
        allowed: false,
        reason: `Outside playing hours (${hour}:00 local, ${day}, ${timezone})`,
        localHour: hour, localDay: day,
      };
    }

    return {
      allowed: true,
      reason: `Within playing hours (${hour}:00 local, ${day}, ${timezone})`,
      localHour: hour, localDay: day,
    };
  } catch {
    // Invalid timezone — allow sync (don't block on bad data)
    return { allowed: true, reason: `Fallback — invalid timezone \"${timezone}\"`, localHour: -1, localDay: 'unknown' };
  }
}

/**
 * Check if today falls within the tournament's date range (with 1-day buffer).
 * Replaces the old day-of-week check.
 */
export function isTournamentDay(
  startDate?: string | null,
  endDate?: string | null,
  timezone: string = 'America/New_York'
): { isActive: boolean; reason: string } {
  if (!startDate || !endDate) {
    return { isActive: true, reason: 'No dates — allowing' };
  }

  try {
    const now = new Date();
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric', month: '2-digit', day: '2-digit',
    });
    const todayLocal = fmt.format(now); // 'YYYY-MM-DD'

    const start = startDate.substring(0, 10);
    const end = endDate.substring(0, 10);

    // 1-day buffer each side
    const startBuf = new Date(start);
    startBuf.setDate(startBuf.getDate() - 1);
    const endBuf = new Date(end);
    endBuf.setDate(endBuf.getDate() + 1);

    const s = startBuf.toISOString().substring(0, 10);
    const e = endBuf.toISOString().substring(0, 10);

    if (todayLocal < s || todayLocal > e) {
      return {
        isActive: false,
        reason: `Not tournament day (${todayLocal}, range ${start}–${end}, ${timezone})`,
      };
    }

    return {
      isActive: true,
      reason: `Tournament day (${todayLocal}, range ${start}–${end}, ${timezone})`,
    };
  } catch {
    return { isActive: true, reason: 'Date error — allowing' };
  }
}
