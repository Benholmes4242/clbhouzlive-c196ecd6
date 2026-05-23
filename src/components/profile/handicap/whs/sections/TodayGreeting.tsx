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
import { Trophy, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAllScores } from '@/lib/whs/hooks';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTodayWeather } from '@/lib/whs/useTodayWeather';
import { openGamAchievements } from '@/components/profile/handicap/whs/gam/events';
import { useUserAchievements } from '@/hooks/gam/useUserAchievements';

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

  const { data: achievements } = useUserAchievements(userId);

  const { weeklyCount, lifetimeCount } = React.useMemo(() => {
    if (!achievements) return { weeklyCount: 0, lifetimeCount: 0 };
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let weekly = 0;
    let lifetime = 0;
    for (const b of achievements) {
      if (!b.is_earned) continue;
      lifetime++;
      if (b.earned_at && new Date(b.earned_at).getTime() > cutoff) {
        weekly++;
      }
    }
    return { weeklyCount: weekly, lifetimeCount: lifetime };
  }, [achievements]);

  const showMeta = !!homeCourseName;

  return (
    <div
      style={{
        padding: '18px 20px 16px',
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
                <span style={{ color: '#F7931E', fontSize: 13, lineHeight: 1 }}>
                  {weatherGlyph(weather.code)}
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
              {weather.tempMax != null && (
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

      {lifetimeCount > 0 && (
        <button
          type="button"
          onClick={() => openGamAchievements()}
          aria-label={
            weeklyCount > 0
              ? `Open trophies — ${weeklyCount} new ${weeklyCount === 1 ? 'unlock' : 'unlocks'} this week`
              : `Open trophies — ${lifetimeCount} earned`
          }
          style={{
            marginTop: 14,
            padding: '12px 14px',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
            width: '100%',
            fontFamily: FONT,
            textAlign: 'left',
            background:
              weeklyCount > 0
                ? 'linear-gradient(135deg, rgba(247,147,30,0.12) 0%, rgba(251,188,46,0.05) 100%)'
                : 'linear-gradient(135deg, rgba(247,147,30,0.06) 0%, rgba(251,188,46,0.02) 100%)',
            border:
              weeklyCount > 0
                ? '1px solid rgba(247,147,30,0.30)'
                : '1px solid rgba(247,147,30,0.20)',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 11,
              background:
                weeklyCount > 0 ? 'rgba(247,147,30,0.18)' : 'rgba(247,147,30,0.12)',
              border:
                weeklyCount > 0
                  ? '1px solid rgba(247,147,30,0.40)'
                  : '1px solid rgba(247,147,30,0.28)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: '#FBBC2E',
            }}
          >
            <Trophy size={22} strokeWidth={2} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {weeklyCount > 0 ? (
              <>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#FBBC2E',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.2,
                  }}
                >
                  {weeklyCount} new {weeklyCount === 1 ? 'trophy' : 'trophies'} this week
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: 'var(--hcp-t-100)',
                    marginTop: 2,
                  }}
                >
                  Tap to see what you unlocked
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--hcp-t-100)',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.2,
                  }}
                >
                  <span style={{ color: '#FBBC2E', fontVariantNumeric: 'tabular-nums' }}>
                    {lifetimeCount}
                  </span>{' '}
                  {lifetimeCount === 1 ? 'trophy' : 'trophies'} in your case
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: 'var(--hcp-t-60)',
                    marginTop: 2,
                  }}
                >
                  See them all
                </div>
              </>
            )}
          </div>

          <ChevronRight
            size={16}
            strokeWidth={2.4}
            color={weeklyCount > 0 ? '#FBBC2E' : 'rgba(251,188,46,0.6)'}
            style={{ flexShrink: 0 }}
          />
        </button>
      )}
    </div>
  );
};

export default TodayGreeting;
