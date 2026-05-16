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

  /** Resolve coords from golf_courses by name (exact match). */
  const { data: coords } = useQuery<{ lat: number; lng: number } | null>({
    queryKey: ['today-greeting-course-coords', homeCourseName],
    enabled: !!homeCourseName,
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      if (!homeCourseName) return null;
      const { data, error } = await (supabase as any)
        .from('golf_courses')
        .select('latitude, longitude')
        .ilike('name', homeCourseName)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .limit(1)
        .maybeSingle();
      if (error || !data) return null;
      const lat = Number(data.latitude);
      const lng = Number(data.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return { lat, lng };
    },
  });

  const { data: weather } = useTodayWeather(coords?.lat ?? null, coords?.lng ?? null);

  const showMeta = !!homeCourseName;

  return (
    <div
      style={{
        padding: '14px 20px 8px',
        fontFamily: FONT,
        color: 'var(--hcp-t-100)',
      }}
    >
      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: '-0.01em',
          lineHeight: 1.15,
          color: 'var(--hcp-t-100)',
        }}
      >
        {tod}
        {firstName ? <>, <span>{firstName}</span></> : null}
      </div>

      {showMeta && homeCourseName && (
        <div
          style={{
            marginTop: 6,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--hcp-t-60)',
          }}
        >
          <span style={{ color: 'var(--hcp-t-60)' }}>{homeCourseName}</span>
          {weather && (
            <>
              <span>·</span>
              <span style={{ color: '#F7931E', fontSize: 13, lineHeight: 1 }}>
                {weatherGlyph(weather.code)}
              </span>
              <span style={{ color: 'var(--hcp-t-100)', fontVariantNumeric: 'tabular-nums' }}>
                {Math.round(weather.tempNow)}°
              </span>
              {weather.tempMax != null && (
                <>
                  <span>·</span>
                  <span>
                    peak{' '}
                    <span style={{ color: 'var(--hcp-t-100)', fontVariantNumeric: 'tabular-nums' }}>
                      {Math.round(weather.tempMax)}°
                    </span>
                  </span>
                </>
              )}
              {weather.windWord && (
                <>
                  <span>·</span>
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
