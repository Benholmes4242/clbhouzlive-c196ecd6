/**
 * HomeCourseWeatherCard — immersive weather hero.
 *
 * Sky-gradient background (driven by ConditionState.skyTop/skyBottom),
 * full-colour inline SVG illustration per condition, palette-driven text.
 *
 * Failure paths silently hide the card and fire an analytics event.
 */
import React from 'react';
import { Navigation } from 'lucide-react';
import { useHomeCourseWeather, WeatherUnresolvedError } from '@/lib/weather/useHomeCourseWeather';
import { pickConditionState } from '@/lib/weather/conditionPalette';
import type { ConditionState } from '@/lib/weather/conditionPalette';
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

/**
 * WeatherIllustration — full-colour atmospheric SVG for each condition state.
 *
 * Sits absolute-positioned top-right of the card, BEHIND the temperature/data
 * (z-index: 0). Designed so the temperature reads cleanly in front while the
 * illustration provides atmosphere.
 *
 * Each illustration is sized at 146×100 viewBox. Cloudy uses painterly wisps
 * (radial gradients) rather than overlapping shapes — feels like overcast
 * atmosphere, not a cartoon cloud silhouette.
 */
const WeatherIllustration: React.FC<{ iconType: ConditionState['iconType'] }> = ({ iconType }) => {
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    right: -6,
    top: 6,
    pointerEvents: 'none',
    zIndex: 0,
  };

  switch (iconType) {
    case 'sun':
      return (
        <svg width={146} height={100} viewBox="0 0 146 100" style={baseStyle} aria-hidden>
          <defs>
            <radialGradient id="wxSunHalo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FDE68A" stopOpacity={0.55} />
              <stop offset="60%" stopColor="#FBBF24" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
            </radialGradient>
            <radialGradient id="wxSunDisc" cx="40%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#FFF8E1" />
              <stop offset="55%" stopColor="#FCD34D" />
              <stop offset="100%" stopColor="#F59E0B" />
            </radialGradient>
          </defs>
          {/* Soft outer halo */}
          <circle cx={96} cy={46} r={56} fill="url(#wxSunHalo)" />
          {/* Inner glow */}
          <circle cx={96} cy={46} r={38} fill="#FCD34D" opacity={0.25} />
          {/* Sun disc */}
          <circle cx={96} cy={46} r={28} fill="url(#wxSunDisc)" />
        </svg>
      );

    case 'cloud':
    case 'fog':
      // Painterly wisps — overlapping soft radial gradients.
      return (
        <svg width={146} height={100} viewBox="0 0 146 100" style={baseStyle} aria-hidden>
          <defs>
            <radialGradient id="wxWisp1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
            </radialGradient>
            <radialGradient id="wxWisp2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F8FAFC" stopOpacity={0.78} />
              <stop offset="100%" stopColor="#F8FAFC" stopOpacity={0} />
            </radialGradient>
            <radialGradient id="wxWisp3" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#E2E8F0" stopOpacity={0.7} />
              <stop offset="100%" stopColor="#E2E8F0" stopOpacity={0} />
            </radialGradient>
          </defs>
          <ellipse cx={60} cy={56} rx={42} ry={22} fill="url(#wxWisp3)" />
          <ellipse cx={92} cy={42} rx={48} ry={24} fill="url(#wxWisp1)" />
          <ellipse cx={108} cy={58} rx={36} ry={20} fill="url(#wxWisp2)" />
          <ellipse cx={78} cy={66} rx={32} ry={14} fill="url(#wxWisp1)" />
          <ellipse cx={120} cy={36} rx={22} ry={12} fill="url(#wxWisp2)" />
        </svg>
      );

    case 'rain':
    case 'drizzle':
      // Wisp-cloud above + falling raindrops below.
      return (
        <svg width={146} height={100} viewBox="0 0 146 100" style={baseStyle} aria-hidden>
          <defs>
            <radialGradient id="wxRainCloud1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#E2E8F0" stopOpacity={0.85} />
              <stop offset="100%" stopColor="#CBD5E1" stopOpacity={0} />
            </radialGradient>
            <radialGradient id="wxRainCloud2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#94A3B8" stopOpacity={0.7} />
              <stop offset="100%" stopColor="#64748B" stopOpacity={0} />
            </radialGradient>
          </defs>
          {/* Cloud wisps */}
          <ellipse cx={70} cy={36} rx={42} ry={20} fill="url(#wxRainCloud1)" />
          <ellipse cx={102} cy={32} rx={40} ry={20} fill="url(#wxRainCloud1)" />
          <ellipse cx={88} cy={46} rx={50} ry={18} fill="url(#wxRainCloud2)" />
          {/* Falling raindrops */}
          <g fill="#7DD3FC" opacity={0.85}>
            <rect x={66} y={62} width={2} height={10} rx={1} transform="rotate(12 67 67)" />
            <rect x={82} y={70} width={2} height={12} rx={1} transform="rotate(12 83 76)" />
            <rect x={96} y={60} width={2} height={10} rx={1} transform="rotate(12 97 65)" />
            <rect x={110} y={72} width={2} height={12} rx={1} transform="rotate(12 111 78)" />
            <rect x={124} y={64} width={2} height={10} rx={1} transform="rotate(12 125 69)" />
          </g>
        </svg>
      );

    case 'snow':
      // Wisp-cloud above + snowflakes below.
      return (
        <svg width={146} height={100} viewBox="0 0 146 100" style={baseStyle} aria-hidden>
          <defs>
            <radialGradient id="wxSnowCloud" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F8FAFC" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#E2E8F0" stopOpacity={0} />
            </radialGradient>
          </defs>
          <ellipse cx={70} cy={36} rx={42} ry={20} fill="url(#wxSnowCloud)" />
          <ellipse cx={102} cy={32} rx={40} ry={20} fill="url(#wxSnowCloud)" />
          <ellipse cx={88} cy={46} rx={48} ry={18} fill="url(#wxSnowCloud)" />
          {/* Snowflakes — six-point stars rendered as overlapping rects */}
          <g fill="#F8FAFC" opacity={0.95}>
            <g transform="translate(72 70)">
              <rect x={-4} y={-0.5} width={8} height={1} rx={0.5} />
              <rect x={-4} y={-0.5} width={8} height={1} rx={0.5} transform="rotate(60)" />
              <rect x={-4} y={-0.5} width={8} height={1} rx={0.5} transform="rotate(120)" />
              <circle r={1} />
            </g>
            <g transform="translate(94 78)">
              <rect x={-5} y={-0.5} width={10} height={1} rx={0.5} />
              <rect x={-5} y={-0.5} width={10} height={1} rx={0.5} transform="rotate(60)" />
              <rect x={-5} y={-0.5} width={10} height={1} rx={0.5} transform="rotate(120)" />
              <circle r={1.2} />
            </g>
            <g transform="translate(116 68)">
              <rect x={-4} y={-0.5} width={8} height={1} rx={0.5} />
              <rect x={-4} y={-0.5} width={8} height={1} rx={0.5} transform="rotate(60)" />
              <rect x={-4} y={-0.5} width={8} height={1} rx={0.5} transform="rotate(120)" />
              <circle r={1} />
            </g>
          </g>
        </svg>
      );

    case 'storm':
      // Wisp-cloud (darker) + yellow lightning bolt.
      return (
        <svg width={146} height={100} viewBox="0 0 146 100" style={baseStyle} aria-hidden>
          <defs>
            <radialGradient id="wxStormCloud1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#94A3B8" stopOpacity={0.85} />
              <stop offset="100%" stopColor="#64748B" stopOpacity={0} />
            </radialGradient>
            <radialGradient id="wxStormCloud2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#475569" stopOpacity={0.85} />
              <stop offset="100%" stopColor="#1E293B" stopOpacity={0} />
            </radialGradient>
          </defs>
          <ellipse cx={70} cy={32} rx={42} ry={20} fill="url(#wxStormCloud1)" />
          <ellipse cx={104} cy={30} rx={40} ry={20} fill="url(#wxStormCloud1)" />
          <ellipse cx={88} cy={44} rx={52} ry={18} fill="url(#wxStormCloud2)" />
          {/* Lightning bolt */}
          <path
            d="M94 50 L84 74 L92 74 L86 92 L106 66 L98 66 L104 50 Z"
            fill="#FBBF24"
            stroke="#F59E0B"
            strokeWidth={0.5}
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'wind':
      // Three soft horizontal wind-streak wisps.
      return (
        <svg width={146} height={100} viewBox="0 0 146 100" style={baseStyle} aria-hidden>
          <defs>
            <linearGradient id="wxWindStreak" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFF8E1" stopOpacity={0} />
              <stop offset="50%" stopColor="#FFF8E1" stopOpacity={0.85} />
              <stop offset="100%" stopColor="#FFF8E1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <rect x={20} y={32} width={120} height={3} rx={1.5} fill="url(#wxWindStreak)" />
          <rect x={36} y={50} width={104} height={3} rx={1.5} fill="url(#wxWindStreak)" />
          <rect x={28} y={68} width={112} height={3} rx={1.5} fill="url(#wxWindStreak)" />
        </svg>
      );

    case 'moon':
      // Crescent moon (radial gradient) + scattered stars across the whole sky.
      // The crescent shadow uses the NIGHT skyBottom (#0F172A) to "cut" the curve.
      // If you change NIGHT.skyBottom in conditionPalette.ts, update the fill below.
      return (
        <>
          {/* Stars scattered across the full card width */}
          <svg
            width="100%"
            height={118}
            viewBox="0 0 360 118"
            preserveAspectRatio="none"
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}
            aria-hidden
          >
            <g fill="#F8FAFC">
              <circle cx={24} cy={22} r={0.9} opacity={0.9} />
              <circle cx={56} cy={48} r={0.6} opacity={0.7} />
              <circle cx={88} cy={18} r={0.7} opacity={0.85} />
              <circle cx={132} cy={38} r={0.9} opacity={0.8} />
              <circle cx={172} cy={64} r={0.6} opacity={0.65} />
              <circle cx={210} cy={28} r={0.8} opacity={0.85} />
              <circle cx={252} cy={86} r={0.7} opacity={0.7} />
              <circle cx={288} cy={52} r={0.6} opacity={0.7} />
              <circle cx={332} cy={98} r={0.9} opacity={0.85} />
            </g>
          </svg>
          {/* Crescent moon */}
          <svg width={146} height={100} viewBox="0 0 146 100" style={baseStyle} aria-hidden>
            <defs>
              <radialGradient id="wxMoonDisc" cx="40%" cy="40%" r="70%">
                <stop offset="0%" stopColor="#F8FAFC" />
                <stop offset="100%" stopColor="#CBD5E1" />
              </radialGradient>
            </defs>
            <circle cx={94} cy={46} r={26} fill="url(#wxMoonDisc)" />
            {/* Crescent shadow — matches NIGHT skyBottom */}
            <circle cx={104} cy={42} r={24} fill="#0F172A" />
            {/* Craters */}
            <circle cx={86} cy={42} r={2.2} fill="#94A3B8" opacity={0.55} />
            <circle cx={82} cy={52} r={1.4} fill="#94A3B8" opacity={0.45} />
            <circle cx={92} cy={56} r={1.8} fill="#94A3B8" opacity={0.5} />
          </svg>
        </>
      );
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
  const locationLabel = buildLocationLabel(club);

  // Text colours come from the palette so they adapt to dark sky states
  // (rain, night, storm have light text; sunny/cloudy have dark text).
  const textColor = state.textOnBg;
  const textMutedColor = state.textMutedOnBg;
  const skyGradient = `linear-gradient(160deg, ${state.skyTop} 0%, ${state.skyBottom} 100%)`;

  return (
    <div
      role="group"
      aria-label={`Home course weather: ${club.name}, ${Math.round(weather.temperature)} degrees`}
      style={{
        position: 'relative',
        width: '100%',
        height: 118,
        borderRadius: 18,
        overflow: 'hidden',
        background: skyGradient,
        marginBottom: 32,
        fontFamily: FONT,
        color: textColor,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 14px rgba(15,23,42,0.10)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '13px 16px',
      }}
    >
      {/* Atmospheric illustration — full-colour, behind the data. */}
      <WeatherIllustration iconType={state.iconType} />

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
              color: textColor,
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
                color: textMutedColor,
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
            color: textColor,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 54, fontWeight: 200, letterSpacing: '-0.055em' }}>
            {Math.round(weather.temperature)}
          </span>
          <span style={{ fontSize: 20, fontWeight: 300, marginTop: 4, opacity: 0.85 }}>°</span>
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
              color: textColor,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {weather.description}
          </span>
          <span style={{ color: textMutedColor, fontSize: 11, fontWeight: 600 }}>·</span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              fontSize: 11,
              fontWeight: 600,
              color: textColor,
              fontVariantNumeric: 'tabular-nums',
              flexShrink: 0,
            }}
          >
            <Navigation
              size={9}
              strokeWidth={2.4}
              color={textMutedColor}
              style={{ transform: `rotate(${weather.windDirection}deg)` }}
            />
            {Math.round(weather.windSpeed)} mph
          </span>
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: textMutedColor,
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
