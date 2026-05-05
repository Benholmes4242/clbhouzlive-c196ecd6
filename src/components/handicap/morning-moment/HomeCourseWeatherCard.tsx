/**
 * HomeCourseWeatherCard — current weather at the user's home club.
 * Hides silently if weather can't be resolved.
 */
import React from 'react';
import { Cloud } from 'lucide-react';
import { useHomeCourseWeather, WeatherUnresolvedError } from '@/lib/weather/useHomeCourseWeather';
import type { WeatherUnresolvedReason } from '@/lib/weather/types';
import { analyticsEvents } from '@/utils/analyticsEvents';

const INK = '#0F172A';
const INK_55 = '#64748B';
const INK_10 = 'rgba(15,23,42,0.10)';
const BLUE = '#3B82F6';
const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

interface Club {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  country: string | null;
  region: string | null;
  sub_country: string | null;
}

interface Props {
  club: Club;
  userId: string;
}

const HomeCourseWeatherCard: React.FC<Props> = ({ club, userId }) => {
  const { data: weather, isLoading, isError, error } = useHomeCourseWeather(club);

  // Telemetry: weather couldn't resolve. Fire at most once per mount, only
  // after the query has settled into an unresolvable state.
  const hasFiredUnresolved = React.useRef(false);

  React.useEffect(() => {
    if (isLoading) return;
    if (hasFiredUnresolved.current) return;

    if (isError || (!weather && !isLoading)) {
      hasFiredUnresolved.current = true;

      let reason: WeatherUnresolvedReason;
      if (error instanceof WeatherUnresolvedError) {
        reason = error.reason;
      } else if (club.latitude === null || club.longitude === null) {
        reason = 'no_club_coords_no_geocode';
      } else {
        reason = 'unknown';
      }

      analyticsEvents.track('morning_moment_weather_unresolved', {
        user_id: userId,
        club_id: club.id,
        reason,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isError, weather, error, club.id]);

  if (!isLoading && (isError || !weather)) {
    return null;
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        background: '#fff',
        border: `0.5px solid ${INK_10}`,
        borderRadius: 12,
        padding: '12px 14px',
        marginBottom: 8,
        fontFamily: FONT_GEIST,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 11,
          background: `${BLUE}14`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Cloud size={22} color={BLUE} strokeWidth={2} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 9,
            fontWeight: 800,
            color: INK_55,
            letterSpacing: '0.16em',
            marginBottom: 2,
          }}
        >
          HOME CLUB
        </div>

        {isLoading ? (
          <>
            <div
              style={{
                width: 120,
                height: 18,
                background: INK_10,
                borderRadius: 4,
                marginBottom: 4,
              }}
            />
            <div style={{ width: 90, height: 11, background: INK_10, borderRadius: 4 }} />
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  color: INK,
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1.1,
                }}
              >
                {Math.round(weather!.temperature)}°
              </span>
              <span style={{ fontSize: 12, color: INK_55, fontVariantNumeric: 'tabular-nums' }}>
                {Math.round(weather!.windSpeed)}mph · {weather!.description}
              </span>
            </div>
            <div
              style={{
                fontSize: 11,
                color: INK_55,
                marginTop: 2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {club.name}
            </div>
          </>
        )}
      </div>

    </div>
  );
};

export default HomeCourseWeatherCard;
