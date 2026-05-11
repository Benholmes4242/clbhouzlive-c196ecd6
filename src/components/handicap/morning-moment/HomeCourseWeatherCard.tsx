/**
 * HomeCourseWeatherCard — scene-as-backdrop morning weather card.
 *
 * The condition is the visual identity: a gradient sky fills the entire
 * card surface, with optional pattern overlays (rain streaks, wind lines).
 * Data floats on top — eyebrow, hero condition + temp, and a 3-cell data
 * strip (wind, rain%, sunset).
 *
 * Failure paths silently hide the card (Phase 27 will add explicit UI).
 */
import React from 'react';
import { Wind, Droplets, Sunset } from 'lucide-react';
import { useHomeCourseWeather, WeatherUnresolvedError } from '@/lib/weather/useHomeCourseWeather';
import { pickConditionState, type WeatherPattern } from '@/lib/weather/conditionPalette';
import type { ClubLocation, WeatherUnresolvedReason } from '@/lib/weather/types';
import { analyticsEvents } from '@/utils/analyticsEvents';

interface Props {
  club: ClubLocation;
  userId: string;
}

const FONT = '"Geist", system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

const compass = (deg: number): string => {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
};

const formatClubLine = (clubName: string, fetchedAt: number): string => {
  const d = new Date(fetchedAt);
  const month = d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
  const day = d.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase();
  return `${clubName.toUpperCase()} · ${day} ${d.getDate()} ${month}`;
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

  if (isLoading) return <Skeleton />;
  if (isError || !weather) return null;

  const state = pickConditionState(weather);

  return (
    <div
      role="region"
      aria-label="Home course weather"
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: 18,
        overflow: 'hidden',
        background: `linear-gradient(180deg, ${state.skyTop} 0%, ${state.skyBottom} 100%)`,
        padding: '14px 16px 14px',
        marginBottom: 8,
        fontFamily: FONT,
        color: state.textOnBg,
        minHeight: 196,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {state.pattern !== 'none' && (
        <PatternLayer pattern={state.pattern} accent={state.accent} />
      )}

      {/* Eyebrow */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div
          style={{
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: state.textMutedOnBg,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {formatClubLine(club.name, weather.fetchedAt)}
        </div>
      </div>

      {/* Hero */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 12,
          marginTop: 18,
          flex: 1,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: '-0.01em',
              color: state.textOnBg,
              textTransform: 'capitalize',
            }}
          >
            {weather.description}
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: state.textMutedOnBg,
              marginTop: 4,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            feels like {Math.round(weather.apparentTemperature)}°
          </div>
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 200,
            lineHeight: 1,
            letterSpacing: '-0.055em',
            color: state.textOnBg,
            fontVariantNumeric: 'tabular-nums',
            flexShrink: 0,
          }}
        >
          {Math.round(weather.temperature)}°
        </div>
      </div>

      {/* Data strip */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
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
          sub={`${compass(weather.windDirection)} · g${Math.round(weather.windGust)}`}
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
          icon={<Sunset size={11} strokeWidth={2} color={state.textMutedOnBg} />}
          value={weather.sunsetTime}
          unit=""
          sub="sunset"
          textOnBg={state.textOnBg}
          textMutedOnBg={state.textMutedOnBg}
          dividerLeft={state.hairlineOnBg}
        />
      </div>
    </div>
  );
};

// ── Sub-components ──────────────────────────────────────────────────

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

const PatternLayer: React.FC<{ pattern: WeatherPattern; accent: string }> = ({
  pattern,
  accent,
}) => {
  if (pattern === 'rain') {
    return (
      <svg
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
        preserveAspectRatio="none"
        viewBox="0 0 420 200"
      >
        {Array.from({ length: 32 }).map((_, i) => {
          const x = (i * 41 + 20) % 420;
          const yStart = ((i * 27) % 70) - 20;
          return (
            <line
              key={i}
              x1={x}
              y1={yStart}
              x2={x - 14}
              y2={yStart + 28}
              stroke={accent}
              strokeWidth={1}
              strokeLinecap="round"
              opacity={0.32}
            />
          );
        })}
      </svg>
    );
  }
  if (pattern === 'wind') {
    return (
      <svg
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
        preserveAspectRatio="none"
        viewBox="0 0 420 200"
      >
        {[
          { y: 25, opacity: 0.22, len: 220, x: 60 },
          { y: 55, opacity: 0.28, len: 280, x: 100 },
          { y: 95, opacity: 0.2, len: 200, x: 40 },
          { y: 135, opacity: 0.24, len: 260, x: 80 },
          { y: 170, opacity: 0.18, len: 180, x: 140 },
        ].map((line, i) => (
          <line
            key={i}
            x1={line.x}
            y1={line.y}
            x2={line.x + line.len}
            y2={line.y}
            stroke={accent}
            strokeWidth={1.25}
            strokeLinecap="round"
            opacity={line.opacity}
          />
        ))}
      </svg>
    );
  }
  return null;
};

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
