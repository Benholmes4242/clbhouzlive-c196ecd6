/**
 * HomeCourseWeatherCard — Morning Brief card (analytical, mini-ring).
 *
 * The card communicates: home club, course readiness (encoded as the arc
 * length of an amber mini-ring), wind speed (centred inside the ring),
 * temperature + condition, and the club name.
 */
import React from 'react';
import { ChevronRight } from 'lucide-react';
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

/**
 * Course readiness — encoded as the arc length of the mini-ring.
 *  - calm + warm:    90% (playable)
 *  - moderate:       60% (manageable)
 *  - tough:          30%
 *  - no data:         0%
 */
function readinessFraction(temp: number | null, wind: number | null): number {
  if (temp == null || wind == null) return 0;
  if (wind <= 8 && temp >= 8) return 0.9;
  if (wind <= 15 && temp >= 4) return 0.6;
  return 0.3;
}

const RING_SIZE = 56;
const RING_R = 24;
const RING_STROKE = 4;
const RING_C = 2 * Math.PI * RING_R;

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
  const fraction = readinessFraction(temp, wind);
  const dash = fraction * RING_C;

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
      {/* Mini-ring with wind speed inside */}
      <div style={{ position: 'relative', width: RING_SIZE, height: RING_SIZE, flexShrink: 0 }}>
        <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_R}
            fill="none"
            stroke={INK_06}
            strokeWidth={RING_STROKE}
            vectorEffect="non-scaling-stroke"
          />
          {dash > 0 && (
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_R}
              fill="none"
              stroke={AMBER}
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${RING_C}`}
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
              vectorEffect="non-scaling-stroke"
              style={{ transition: 'stroke-dasharray 320ms cubic-bezier(0.22,0.61,0.36,1)' }}
            />
          )}
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          {isLoading ? (
            <div style={{ width: 18, height: 10, background: INK_06, borderRadius: 3 }} />
          ) : (
            <>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: INK,
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {wind}
              </span>
              <span
                style={{
                  fontSize: 7.5,
                  fontWeight: 700,
                  color: INK_40,
                  letterSpacing: '0.08em',
                  marginTop: 2,
                }}
              >
                MPH
              </span>
            </>
          )}
        </div>
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
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
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
                {weather!.description} · {(wind ?? 0) <= 8 ? 'low wind' : (wind ?? 0) <= 15 ? 'moderate wind' : 'strong wind'}
              </span>
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
