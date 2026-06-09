/**
 * TodayGreeting — "Morning, Benjamin" + home course/weather meta line.
 * Top of the Today tab on /handicap.
 *
 * Home course = most-played course across the user's WHS history (by count).
 * Coordinates are looked up from `golf_courses` by name; weather comes from
 * Open-Meteo. Missing weather hides the meta row entirely; missing name hides
 * the meta row entirely — the greeting still renders.
 */
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAllScores } from '@/lib/whs/hooks';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTodayWeather } from '@/lib/whs/useTodayWeather';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  connectionId: string;
  userId: string;
}

function getTimeOfDay(now: Date = new Date()): 'Morning' | 'Afternoon' | 'Evening' {
  const h = now.getHours();
  if (h < 12) return 'Morning';
  if (h < 18) return 'Afternoon';
  return 'Evening';
}

export function formatToday(): string {
  return new Date()
    .toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    .toUpperCase();
}

function weatherGlyph(code: number | null | undefined): string {
  if (code == null) return '';
  if (code === 0) return '☀';
  if (code <= 2) return '⛅';
  if (code === 3) return '☁';
  if (code >= 45 && code <= 48) return '🌫';
  if (code >= 51 && code <= 67) return '🌧';
  if (code >= 71 && code <= 77) return '❄';
  if (code >= 80 && code <= 82) return '🌧';
  if (code >= 95) return '⛈';
  return '☀';
}

/**
 * Custom inline-SVG weather glyph. Replaces emoji for the clear (0) and
 * partly-cloudy (1–2) cases; falls back to the emoji string for every
 * other code so we don't lose coverage.
 */
const WeatherGlyph: React.FC<{ code: number | null | undefined }> = ({ code }) => {
  if (code == null) return null;
  if (code === 0 || code <= 2) {
    // Sun — filled circle r≈4 + 8 short rays in a 16x16 viewBox.
    return (
      <svg
        width={13}
        height={13}
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
        aria-hidden
      >
        <circle cx="8" cy="8" r="3.2" fill="currentColor" stroke="none" />
        <line x1="8" y1="1.2" x2="8" y2="3" />
        <line x1="8" y1="13" x2="8" y2="14.8" />
        <line x1="1.2" y1="8" x2="3" y2="8" />
        <line x1="13" y1="8" x2="14.8" y2="8" />
        <line x1="3.2" y1="3.2" x2="4.5" y2="4.5" />
        <line x1="11.5" y1="11.5" x2="12.8" y2="12.8" />
        <line x1="12.8" y1="3.2" x2="11.5" y2="4.5" />
        <line x1="4.5" y1="11.5" x2="3.2" y2="12.8" />
      </svg>
    );
  }
  return <>{weatherGlyph(code)}</>;
};

function normaliseCourseName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\b(golf|country|club|links|course|the)\b/g, ' ')
    .replace(/\b(east|west|north|south|old|new|championship|main|number\s*\d+|no\s*\d+)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

function cleanCourseDisplay(raw: string): string {
  let s = raw.replace(/\([^)]*\)/g, ' ').replace(/-/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  const STOP = new Set([
    'golf', 'club', 'country', 'links', 'course',
    'east', 'west', 'north', 'south', 'old', 'new',
    'championship', 'main',
  ]);
  const tokens = s.split(' ').filter(Boolean);
  while (tokens.length > 1 && STOP.has(tokens[tokens.length - 1].toLowerCase())) {
    tokens.pop();
  }
  return tokens
    .map(t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase())
    .join(' ');
}

const TodayGreeting: React.FC<Props> = ({ connectionId, userId }) => {
  const tod = useMemo(() => getTimeOfDay(), []);
  const { data: profile } = useUserProfile(userId);
  const { data: allScores } = useAllScores(connectionId);

  const firstName = useMemo(() => {
    const name = profile?.display_name?.trim();
    if (!name) return null;
    if (name.includes(',')) {
      const afterComma = name.split(',')[1]?.trim();
      if (afterComma) return afterComma.split(' ')[0];
    }
    return name.split(' ')[0];
  }, [profile?.display_name]);

  /** Most-played course by name across history. */
  const homeCourseName = useMemo<string | null>(() => {
    if (!allScores || allScores.length === 0) return null;
    const counts = new Map<string, number>();
    for (const r of allScores as any[]) {
      const n = r?.course?.name;
      if (!n) continue;
      counts.set(n, (counts.get(n) ?? 0) + 1);
    }
    let best: string | null = null;
    let max = 0;
    counts.forEach((v, k) => {
      if (v > max) { best = k; max = v; }
    });
    return best;
  }, [allScores]);

  /** Resolve coords from golf_courses by normalised-name match. */
  const { data: courseLookup } = useQuery<{ lat: number; lng: number; canonicalName: string } | null>({
    queryKey: ['today-greeting-course-lookup', homeCourseName],
    enabled: !!homeCourseName,
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      if (!homeCourseName) return null;
      const firstWord = homeCourseName
        .toLowerCase()
        .replace(/[^a-z\s]/g, ' ')
        .split(/\s+/)
        .find(w => w.length > 2 && !['the', 'golf', 'club'].includes(w));
      if (!firstWord) return null;
      const { data, error } = await (supabase as any)
        .from('golf_courses')
        .select('name, latitude, longitude')
        .ilike('name', `%${firstWord}%`)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .limit(20);
      if (error || !data || data.length === 0) return null;
      const target = normaliseCourseName(homeCourseName);
      const match = (data as Array<{ name: string; latitude: number; longitude: number }>)
        .find(c => normaliseCourseName(c.name) === target);
      if (!match) return null;
      const lat = Number(match.latitude);
      const lng = Number(match.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return { lat, lng, canonicalName: match.name };
    },
  });

  const coords = courseLookup ? { lat: courseLookup.lat, lng: courseLookup.lng } : null;

  const { data: weather } = useTodayWeather(coords?.lat ?? null, coords?.lng ?? null);


  const showMeta = !!homeCourseName;

  return (
    <div
      style={{
        padding: '0 20px 16px',
        fontFamily: FONT,
        color: 'var(--hcp-t-100)',
      }}
    >
      <div
        style={{
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1.12,
          color: 'var(--hcp-t-100)',
        }}
      >
        {tod}
        {firstName ? <>, <span>{firstName}</span></> : null}
      </div>


      {showMeta && homeCourseName && (
        <div
          style={{
            marginTop: 10,
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
            rowGap: 6,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--hcp-t-60)',
          }}
        >
          <span style={{ color: 'var(--hcp-t-100)' }}>
            {cleanCourseDisplay(courseLookup?.canonicalName ?? homeCourseName)}
          </span>
          {weather && (
            <>
              <span style={{ opacity: 0.4 }}>·</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span style={{ color: '#F7931E', display: 'inline-flex', lineHeight: 0 }}>
                  <WeatherGlyph code={weather.code} />
                </span>
                <span>Now</span>
                <span
                  style={{
                    color: 'var(--hcp-t-100)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {Math.round(weather.tempNow)}°
                </span>
              </span>
              {weather.tempMax != null && Math.round(weather.tempMax) - Math.round(weather.tempNow) >= 2 && (
                <>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <span>Peak</span>
                    <span
                      style={{
                        color: 'var(--hcp-t-100)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {Math.round(weather.tempMax)}°
                    </span>
                  </span>
                </>
              )}
              {weather.windWord && (
                <>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span>{weather.windWord}</span>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TodayGreeting;
