/**
 * HomeCourseWeatherCard — Morning Brief card (analytical, mini-ring).
 *
 * The card communicates: home club, course readiness (encoded as the arc
 * length of an amber mini-ring), wind speed (centred inside the ring),
 * temperature + condition, and the club name.
 */
import React from 'react';
import {
  ChevronRight,
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
  CloudFog,
  Wind,
  type LucideIcon,
} from 'lucide-react';
import { useHomeCourseWeather, WeatherUnresolvedError } from '@/lib/weather/useHomeCourseWeather';
import type { WeatherUnresolvedReason } from '@/lib/weather/types';
import { analyticsEvents } from '@/utils/analyticsEvents';

const INK = '#0F172A';
const INK_40 = 'rgba(15,23,42,0.40)';
const INK_55 = 'rgba(15,23,42,0.55)';
const INK_08 = 'rgba(15,23,42,0.08)';
const INK_06 = 'rgba(15,23,42,0.06)';
const AMBER = '#F7931E';
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

function pickWeatherIcon(description: string | undefined): LucideIcon {
  const d = (description ?? '').toLowerCase();
  if (d.includes('thunder') || d.includes('storm')) return CloudLightning;
  if (d.includes('snow') || d.includes('sleet')) return CloudSnow;
  if (d.includes('rain') || d.includes('shower') || d.includes('drizzle')) return CloudRain;
  if (d.includes('fog') || d.includes('mist') || d.includes('haze')) return CloudFog;
  if (d.includes('partly') || d.includes('few clouds') || d.includes('mostly clear')) return CloudSun;
  if (d.includes('clear') || d.includes('sunny')) return Sun;
  if (d.includes('cloud') || d.includes('overcast')) return Cloud;
  return Cloud;
}

const ICON_BOX = 56;

const HomeCourseWeatherCard: React.FC<Props> = ({ club, userId }) => {
  const { data: weather, isLoading, isError, error } = useHomeCourseWeather(club);

  const hasFiredUnresolved = React.useRef(false);
  React.useEffect(() => {
    if (isLoading) return;
    if (hasFiredUnresolved.current) return;
    if (isError || (!weather && !isLoading)) {
      hasFiredUnresolved.current = true;
      let reason: WeatherUnresolvedReason;
      if (error instanceof WeatherUnresolvedError) reason = error.reason;
      else if (club.latitude === null || club.longitude === null) reason = 'no_club_coords_no_geocode';
      else reason = 'unknown';
      analyticsEvents.track('morning_moment_weather_unresolved', {
        user_id: userId,
        club_id: club.id,
        reason,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isError, weather, error, club.id]);

  if (!isLoading && (isError || !weather)) return null;

  const wind = weather ? Math.round(weather.windSpeed) : null;
  const temp = weather ? Math.round(weather.temperature) : null;
  const WeatherIcon = pickWeatherIcon(weather?.description);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        width: '100%',
        background: '#fff',
        border: `0.5px solid ${INK_08}`,
        borderRadius: 14,
        padding: 14,
        marginBottom: 8,
        fontFamily: FONT_GEIST,
      }}
    >
      {/* Weather glyph */}
      <div
        style={{
          width: ICON_BOX,
          height: ICON_BOX,
          borderRadius: 14,
          background: INK_06,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {isLoading ? (
          <div style={{ width: 24, height: 24, background: INK_08, borderRadius: 6 }} />
        ) : (
          <WeatherIcon size={28} strokeWidth={2} color={INK} />
        )}
      </div>

      {/* Centre column */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            color: INK_40,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            marginBottom: 3,
          }}
        >
          HOME CLUB
        </div>

        {isLoading ? (
          <>
            <div style={{ width: 130, height: 20, background: INK_06, borderRadius: 4, marginBottom: 4 }} />
            <div style={{ width: 100, height: 11, background: INK_06, borderRadius: 4 }} />
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: INK,
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                }}
              >
                {temp}°
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: INK_55,
                  fontWeight: 500,
                }}
              >
                {weather!.description}
              </span>
              {wind != null && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    fontSize: 12,
                    color: INK_55,
                    fontWeight: 500,
                  }}
                >
                  <span style={{ color: INK_40 }}>·</span>
                  <Wind size={11} strokeWidth={2.4} color={INK_40} />
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{wind}mph</span>
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: INK_55,
                marginTop: 3,
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

      <ChevronRight size={14} color={INK_40} strokeWidth={2} style={{ flexShrink: 0 }} />
    </div>
  );
};

export default HomeCourseWeatherCard;
