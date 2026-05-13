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
  const warped = warpGradient(state, weather.dayProgress);
  const background = buildBackgroundCss(warped);
  const locationLabel = buildLocationLabel(club);

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
        background,
        marginBottom: 8,
        fontFamily: FONT,
        color: state.textOnBg,
        boxShadow: '0 1px 2px rgba(15,23,42,0.06)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '11px 14px',
      }}
    >
      {/* Sun glow — daylight + clear conditions only (scaled to match smaller card) */}
      {weather.isDay === 1 && state.iconType === 'sun' && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 180,
            height: 180,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(255,236,170,0.55) 0%, rgba(255,236,170,0) 70%)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Soft cloud whisp (scaled to match smaller card) */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 24,
          left: -40,
          width: 180,
          height: 48,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none',
        }}
      />

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
              color: state.textOnBg,
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
                color: state.textMutedOnBg,
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
            color: state.textOnBg,
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
              color: state.textOnBg,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {weather.description}
          </span>
          <span style={{ color: state.textMutedOnBg, fontSize: 11, fontWeight: 600 }}>·</span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              fontSize: 11,
              fontWeight: 600,
              color: state.textOnBg,
              fontVariantNumeric: 'tabular-nums',
              flexShrink: 0,
            }}
          >
            <Navigation
              size={9}
              strokeWidth={2.4}
              color={state.textMutedOnBg}
              style={{ transform: `rotate(${weather.windDirection}deg)` }}
            />
            {Math.round(weather.windSpeed)} mph
          </span>
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: state.textMutedOnBg,
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
