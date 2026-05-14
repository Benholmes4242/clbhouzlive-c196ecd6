/**
 * HomeCourseWeatherCard — immersive weather hero.
 *
 * Full-bleed dynamic sky gradient, ultra-light 80px temperature, and a
 * dark frosted golf-utility strip (Wind / Gust / Daylight / Rain 4hr).
 *
 * Failure paths silently hide the card and fire an analytics event.
 */
import React from 'react';
import { Navigation } from 'lucide-react';
import { useHomeCourseWeather, WeatherUnresolvedError } from '@/lib/weather/useHomeCourseWeather';
import { pickConditionState, pickConditionIconStyle } from '@/lib/weather/conditionPalette';
import type { ClubLocation, WeatherUnresolvedReason } from '@/lib/weather/types';
import { analyticsEvents } from '@/utils/analyticsEvents';

interface Props {
  club: ClubLocation;
  userId: string;
}

const FONT = '"Geist", system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

const buildLocationLabel = (club: ClubLocation): string => {
  const parts: string[] = [];
  if (club.region) parts.push(club.region);
  if (club.sub_country) parts.push(club.sub_country);
  else if (club.country && parts.length === 0) parts.push(club.country);
  return parts.join(', ');
};


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

  if (isLoading) return null;
  if (isError || !weather) return null;

  const state = pickConditionState(weather);
  const iconStyle = pickConditionIconStyle(state.iconType);
  const HeroIcon = iconStyle.Icon;
  const locationLabel = buildLocationLabel(club);

  const INK = '#0F172A';
  const INK_MUTE = 'rgba(15,23,42,0.55)';

  return (
    <div
      role="group"
      aria-label={`Home course weather: ${club.name}, ${Math.round(weather.temperature)} degrees`}
      style={{
        position: 'relative',
        width: '100%',
        height: 104,
        borderRadius: 16,
        overflow: 'hidden',
        background: '#F8FAFC',
        border: '0.5px solid rgba(15,23,42,0.10)',
        marginBottom: 24,
        fontFamily: FONT,
        color: INK,
        boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '11px 14px',
      }}
    >
      {/* Hero icon — right-centre, behind the temperature. Condition-tinted. */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          right: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          opacity: 0.32,
          color: iconStyle.tint,
          pointerEvents: 'none',
          lineHeight: 0,
        }}
      >
        <HeroIcon size={96} strokeWidth={1.5} />
      </div>

      {/* Top row: course meta (left) + temperature (right) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: '-0.015em',
              lineHeight: 1.2,
              color: INK,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {club.name}
          </div>
          {locationLabel && (
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: INK_MUTE,
                marginTop: 2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {locationLabel}
            </div>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            lineHeight: 0.9,
            fontVariantNumeric: 'tabular-nums',
            fontFeatureSettings: '"kern" 1, "liga" 1',
            color: INK,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 44, fontWeight: 200, letterSpacing: '-0.05em' }}>
            {Math.round(weather.temperature)}
          </span>
          <span style={{ fontSize: 18, fontWeight: 300, marginTop: 3 }}>°</span>
        </div>
      </div>

      {/* Bottom row: condition + wind (left) + feels like (right) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 12,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            minWidth: 0,
            flex: 1,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '-0.005em',
              color: INK,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {weather.description}
          </span>
          <span style={{ color: INK_MUTE, fontSize: 11, fontWeight: 600 }}>·</span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              fontSize: 11,
              fontWeight: 600,
              color: INK,
              fontVariantNumeric: 'tabular-nums',
              flexShrink: 0,
            }}
          >
            <Navigation
              size={9}
              strokeWidth={2.4}
              color={INK_MUTE}
              style={{ transform: `rotate(${weather.windDirection}deg)` }}
            />
            {Math.round(weather.windSpeed)} mph
          </span>
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: INK_MUTE,
            flexShrink: 0,
          }}
        >
          Feels like {Math.round(weather.apparentTemperature)}°
        </div>
      </div>
    </div>
  );
};

export default HomeCourseWeatherCard;
