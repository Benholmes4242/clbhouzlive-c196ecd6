/**
 * HomeCourseWeatherCard — scene-as-backdrop morning weather card.
 *
 * The condition is the visual identity: a gradient sky fills the entire
 * card surface, optionally overlaid with seamlessly-animated rain or wind
 * patterns. Data floats on top — eyebrow (club + location + updated),
 * hero condition + temp + trend arrow, and a 3-cell data strip
 * (wind / rain% / time-aware temporal cell).
 *
 * Failure paths silently hide the card (Phase 27 will add explicit UI).
 */
import React, { useMemo } from 'react';
import { Wind, Droplets, Sunset, Sunrise, ArrowUp, ArrowDown } from 'lucide-react';
import { useHomeCourseWeather, WeatherUnresolvedError } from '@/lib/weather/useHomeCourseWeather';
import {
  pickConditionState,
  warpGradient,
  buildBackgroundCss,
  pickTemporalMode,
  pickTemperatureTrend,
  formatUpdatedAt,
  shouldShowTrajectory,
} from '@/lib/weather/conditionPalette';
import type { ClubLocation, WeatherUnresolvedReason } from '@/lib/weather/types';
import { analyticsEvents } from '@/utils/analyticsEvents';
import RainPattern from './weather-patterns/RainPattern';
import WindPattern from './weather-patterns/WindPattern';

interface Props {
  club: ClubLocation;
  userId: string;
}

const FONT = '"Geist", system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

const compass = (deg: number): string => {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
};

const buildLocationLabel = (club: ClubLocation): string => {
  const parts: string[] = [];
  if (club.region) parts.push(club.region);
  if (club.sub_country) parts.push(club.sub_country);
  else if (club.country && parts.length === 0) parts.push(club.country);
  return parts.join(', ');
};

const HomeCourseWeatherCard: React.FC<Props> = ({ club, userId }) => {
  const { data: weather, isLoading, isError, error } = useHomeCourseWeather(club);

  // Preserve existing telemetry on unresolved.
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

  const updatedLabel = useMemo(
    () => (weather ? formatUpdatedAt(weather.fetchedAt) : ''),
    [weather?.fetchedAt],
  );

  if (isLoading) return <Skeleton />;
  if (isError || !weather) return null;

  const state = pickConditionState(weather);
  const warped = warpGradient(state, weather.dayProgress);
  const background = buildBackgroundCss(warped);
  const temporal = pickTemporalMode(weather);
  const trend = pickTemperatureTrend(weather);
  const showTraj = shouldShowTrajectory(weather);
  const locationLabel = buildLocationLabel(club);

  const subLine = showTraj
    ? `feels like ${Math.round(weather.apparentTemperature)}° · peak ${Math.round(weather.peakTempToday)}° at ${weather.peakTempTimeLabel}`
    : `feels like ${Math.round(weather.apparentTemperature)}°`;

  return (
    <div
      role="region"
      aria-label="Home course weather"
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: 18,
        overflow: 'hidden',
        background,
        padding: '14px 16px 14px',
        marginBottom: 8,
        fontFamily: FONT,
        color: state.textOnBg,
        minHeight: 196,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {state.pattern === 'rain' && <RainPattern accent={state.accent} />}
      {state.pattern === 'wind' && <WindPattern accent={state.accent} />}

      {/* Eyebrow row */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: state.textMutedOnBg,
              letterSpacing: '0.02em',
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
                marginTop: 1,
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
            fontSize: 10,
            fontWeight: 500,
            color: state.textMutedOnBg,
            whiteSpace: 'nowrap',
            flexShrink: 0,
            paddingTop: 1,
          }}
        >
          updated {updatedLabel}
        </div>
      </div>

      {/* Hero */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 12,
          marginTop: 14,
          flex: 1,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.01em',
              color: state.textOnBg,
            }}
          >
            {weather.description}
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: state.textMutedOnBg,
              marginTop: 4,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {subLine}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 2,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: 48,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: '-0.055em',
              color: state.textOnBg,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {Math.round(weather.temperature)}°
          </div>
          {trend !== 'steady' && (
            <span
              aria-label={trend === 'rising' ? 'temperature rising' : 'temperature falling'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                marginTop: 6,
                color: state.textMutedOnBg,
              }}
            >
              {trend === 'rising' ? (
                <ArrowUp size={14} strokeWidth={2.25} />
              ) : (
                <ArrowDown size={14} strokeWidth={2.25} />
              )}
            </span>
          )}
        </div>
      </div>

      {/* Data strip */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          marginTop: 14,
          paddingTop: 12,
          borderTop: `0.5px solid ${state.hairlineOnBg}`,
        }}
      >
        <DataCell
          icon={<Wind size={11} strokeWidth={2} color={state.textMutedOnBg} />}
          value={String(Math.round(weather.windSpeed))}
          unit="mph"
          sub={`${compass(weather.windDirection)} · gust ${Math.round(weather.windGust)}`}
          textOnBg={state.textOnBg}
          textMutedOnBg={state.textMutedOnBg}
        />
        <DataCell
          icon={<Droplets size={11} strokeWidth={2} color={state.textMutedOnBg} />}
          value={String(weather.precipProbabilityMax4h)}
          unit="%"
          sub="rain in 4h"
          textOnBg={state.textOnBg}
          textMutedOnBg={state.textMutedOnBg}
          dividerLeft={state.hairlineOnBg}
        />
        <DataCell
          icon={
            temporal.iconType === 'sunrise' ? (
              <Sunrise size={11} strokeWidth={2} color={state.textMutedOnBg} />
            ) : (
              <Sunset size={11} strokeWidth={2} color={state.textMutedOnBg} />
            )
          }
          value={temporal.value}
          unit=""
          sub={temporal.sub}
          textOnBg={state.textOnBg}
          textMutedOnBg={state.textMutedOnBg}
          dividerLeft={state.hairlineOnBg}
        />
      </div>
    </div>
  );
};

const DataCell: React.FC<{
  icon: React.ReactNode;
  value: string;
  unit: string;
  sub: string;
  textOnBg: string;
  textMutedOnBg: string;
  dividerLeft?: string;
}> = ({ icon, value, unit, sub, textOnBg, textMutedOnBg, dividerLeft }) => (
  <div
    style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      paddingLeft: dividerLeft ? 12 : 0,
      marginLeft: dividerLeft ? 12 : 0,
      borderLeft: dividerLeft ? `0.5px solid ${dividerLeft}` : undefined,
      minWidth: 0,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{icon}</div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
      <span
        style={{
          fontSize: 16,
          fontWeight: 500,
          color: textOnBg,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.01em',
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      {unit && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: textMutedOnBg,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {unit}
        </span>
      )}
    </div>
    <div
      style={{
        fontSize: 9,
        fontWeight: 500,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: textMutedOnBg,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {sub}
    </div>
  </div>
);

const Skeleton: React.FC = () => (
  <div
    style={{
      width: '100%',
      minHeight: 196,
      borderRadius: 18,
      marginBottom: 8,
      background:
        'linear-gradient(180deg, rgba(15,23,42,0.06) 0%, rgba(15,23,42,0.10) 100%)',
      animation: 'pulse 1.6s ease-in-out infinite',
    }}
  />
);

export default HomeCourseWeatherCard;
