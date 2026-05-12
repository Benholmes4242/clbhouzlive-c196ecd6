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
import {
  pickConditionState,
  warpGradient,
  buildBackgroundCss,
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

const WeatherStat: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  divider?: boolean;
}> = ({ icon, label, value, unit, divider }) => (
  <div
    style={{
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      padding: '10px 8px',
      borderLeft: divider ? '0.5px solid rgba(255,255,255,0.18)' : 'none',
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: '0.16em',
        color: 'rgba(255,255,255,0.70)',
        textTransform: 'uppercase',
      }}
    >
      {icon}
      <span>{label}</span>
    </div>
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 3,
        color: '#fff',
        fontFeatureSettings: '"kern" 1, "liga" 1',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
        {value}
      </span>
      {unit && (
        <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.65)' }}>
          {unit}
        </span>
      )}
    </div>
  </div>
);

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

  const windDescriptor =
    weather.windSpeed < 5 ? 'Calm' : weather.windSpeed < 12 ? 'Light breeze' : 'Breezy';
  const rainSuffix = weather.precipProbabilityMax4h >= 40 ? ' · rain likely' : '';

  return (
    <div
      role="group"
      aria-label={`Home course weather: ${club.name}, ${Math.round(weather.temperature)} degrees`}
      style={{
        position: 'relative',
        width: '100%',
        height: 210,
        borderRadius: 14,
        overflow: 'hidden',
        background,
        marginBottom: 8,
        fontFamily: FONT,
        color: state.textOnBg,
        boxShadow: '0 1px 2px rgba(15,23,42,0.06)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Sun glow — daylight + clear conditions only */}
      {weather.isDay === 1 && state.iconType === 'sun' && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(255,236,170,0.55) 0%, rgba(255,236,170,0) 70%)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Soft cloud whisp */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 36,
          left: -40,
          width: 240,
          height: 60,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top: course eyebrow */}
      <div style={{ padding: '14px 16px 0', position: 'relative', zIndex: 1 }}>
        <div
          style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: state.textMutedOnBg,
            marginBottom: 4,
          }}
        >
          Your course
        </div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            lineHeight: 1.2,
            color: state.textOnBg,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {club.name}
          {locationLabel && ` · ${locationLabel}`}
        </div>
      </div>

      {/* Centre: temp + condition */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          padding: '0 16px 12px',
          gap: 12,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              color: state.textOnBg,
              fontFeatureSettings: '"kern" 1, "liga" 1',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 0.9,
            }}
          >
            <span style={{ fontSize: 80, fontWeight: 100, letterSpacing: '-0.05em' }}>
              {Math.round(weather.temperature)}
            </span>
            <span
              style={{
                fontSize: 28,
                fontWeight: 200,
                marginTop: 6,
                marginLeft: 2,
              }}
            >
              °
            </span>
          </div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: state.textMutedOnBg,
              marginTop: 4,
            }}
          >
            Feels like {Math.round(weather.apparentTemperature)}°
          </div>
        </div>

        <div style={{ textAlign: 'right', maxWidth: '50%' }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: state.textOnBg,
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
            }}
          >
            {weather.description}
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: state.textMutedOnBg,
              marginTop: 2,
            }}
          >
            {windDescriptor}
            {rainSuffix}
          </div>
        </div>
      </div>

      {/* Bottom: golf-utility metrics strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          background: 'rgba(15,23,42,0.78)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderTop: '0.5px solid rgba(255,255,255,0.12)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <WeatherStat
          icon={
            <Navigation
              size={10}
              strokeWidth={2.4}
              color="rgba(255,255,255,0.70)"
              style={{ transform: `rotate(${weather.windDirection}deg)` }}
            />
          }
          label="Wind"
          value={String(Math.round(weather.windSpeed))}
          unit="mph"
        />
        <WeatherStat
          icon={<Wind size={10} strokeWidth={2.4} color="rgba(255,255,255,0.70)" />}
          label="Gust"
          value={String(Math.round(weather.windGust))}
          unit="mph"
          divider
        />
        <WeatherStat
          icon={<Sun size={10} strokeWidth={2.4} color="rgba(255,255,255,0.70)" />}
          label="Daylight"
          value={
            weather.daylightHoursRemaining != null
              ? weather.daylightHoursRemaining.toFixed(1)
              : '—'
          }
          unit={weather.daylightHoursRemaining != null ? 'hrs' : ''}
          divider
        />
        <WeatherStat
          icon={<CloudRain size={10} strokeWidth={2.4} color="rgba(255,255,255,0.70)" />}
          label="Rain 4hr"
          value={String(weather.precipProbabilityMax4h)}
          unit="%"
          divider
        />
      </div>
    </div>
  );
};

export default HomeCourseWeatherCard;
