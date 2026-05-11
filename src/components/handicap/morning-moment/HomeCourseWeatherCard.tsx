/**
 * HomeCourseWeatherCard — glance peek weather widget.
 *
 * Compact tappable card: icon tile, club name + location, current temp.
 * Gradient sky backdrop conveys condition emotionally. Tap reserved for
 * a future weather detail page (currently a no-op placeholder).
 *
 * Failure paths silently hide the card (Phase 27 will add explicit UI).
 */
import React from 'react';
import {
  Sun, Cloud, CloudDrizzle, CloudRain, CloudSnow,
  CloudLightning, CloudFog, Wind, Moon,
} from 'lucide-react';
import { useHomeCourseWeather, WeatherUnresolvedError } from '@/lib/weather/useHomeCourseWeather';
import {
  pickConditionState,
  warpGradient,
  buildBackgroundCss,
  type ConditionState,
} from '@/lib/weather/conditionPalette';
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

const iconFor = (kind: ConditionState['iconType'], color: string) => {
  const props = { size: 26, strokeWidth: 2.4, color };
  switch (kind) {
    case 'sun':     return <Sun {...props} />;
    case 'cloud':   return <Cloud {...props} />;
    case 'drizzle': return <CloudDrizzle {...props} />;
    case 'rain':    return <CloudRain {...props} />;
    case 'snow':    return <CloudSnow {...props} />;
    case 'storm':   return <CloudLightning {...props} />;
    case 'fog':     return <CloudFog {...props} />;
    case 'wind':    return <Wind {...props} />;
    case 'moon':    return <Moon {...props} />;
  }
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

  const isDarkBackdrop =
    state.iconType === 'rain' || state.iconType === 'storm' || state.iconType === 'moon';
  const tileTint = isDarkBackdrop
    ? 'rgba(248,250,252,0.14)'
    : 'rgba(255,255,255,0.55)';

  return (
    <button
      type="button"
      onClick={() => {
        // Placeholder — weather detail page is a forthcoming phase.
      }}
      aria-label={`Home course weather: ${club.name}, ${Math.round(weather.temperature)} degrees`}
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: 14,
        overflow: 'hidden',
        background,
        padding: '12px 14px',
        marginBottom: 8,
        fontFamily: FONT,
        color: state.textOnBg,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        boxShadow: '0 1px 2px rgba(15,23,42,0.06)',
      }}
    >
      {/* Icon tile */}
      <div
        style={{
          flexShrink: 0,
          width: 48,
          height: 48,
          borderRadius: 12,
          background: tileTint,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {iconFor(state.iconType, state.accent)}
      </div>

      {/* Club name + location */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 800,
            lineHeight: 1.15,
            color: state.textOnBg,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {club.name}
        </div>
        {locationLabel && (
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              lineHeight: 1.2,
              color: state.textMutedOnBg,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {locationLabel}
          </div>
        )}
      </div>

      {/* Temperature */}
      <div
        style={{
          flexShrink: 0,
          fontSize: 38,
          fontWeight: 800,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          color: state.textOnBg,
          fontFeatureSettings: '"kern" 1, "liga" 1',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {Math.round(weather.temperature)}°
      </div>
    </button>
  );
};

export default HomeCourseWeatherCard;
