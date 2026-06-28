/**
 * HandicapChip — dark-header entry point for the user's handicap.
 *
 * Four states (per handicap-chip-final_3.jsx, Option C):
 *   improving    — index number + green TrendingDown (90D delta ≤ -0.3)
 *   drifting     — index number + crimson TrendingUp  (90D delta ≥ +0.3)
 *   steady       — index number alone (|delta| < 0.3 or insufficient history)
 *   disconnected — amber "Connect HCP" label
 *
 * Logged-out users render nothing. While the WHS connection resolves we
 * render a fixed-width skeleton pill to prevent layout shift.
 */
import { useLocation, useNavigate } from 'react-router-dom';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection, useHandicapTrend } from '@/lib/whs/hooks';
import { useHandicapTrend90d, type HandicapTrend90dDirection } from '@/hooks/useHandicapTrend90d';
import { analyticsEvents } from '@/utils/analyticsEvents';

const WHITE = '#FFFFFF';
// Match the PostingAsPill (avatar dropdown) borders so the two header
// controls share the same hairline weight/color.
const WHITE_HAIRLINE = 'rgba(255,255,255,0.10)';
const DARK_INK = '#0F172A';
const DARK_HAIRLINE = 'var(--cm-border)';

const SEASON_GREEN = '#10B981';
const CRIMSON = '#EF4444';

// Shared lift with top-bar / rail floating glyphs.
const FLOAT_SHADOW = 'drop-shadow(0 1px 4px rgba(0,0,0,0.55))';

const BASE_STYLE = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px clamp(7px, 1.8vw, 11px)',
  borderRadius: 10,
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: 'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  height: 26,
  flexShrink: 0,
} as const;

const PILL_STYLE = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0 12px',
  borderRadius: 999,
  background: '#FFFFFF',
  cursor: 'pointer',
  fontFamily: 'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  height: 38,
  flexShrink: 0,
} as const;

function resolveSource(pathname: string): string {
  if (pathname === '/') return 'home_header';
  if (pathname === '/tourhub' || pathname === '/tour') return 'tourhub_header';
  if (pathname.startsWith('/tourhub/')) return 'tourhub_header';
  return 'global_header';
}

export function HandicapChip({ light = false, pill = false }: { light?: boolean; pill?: boolean } = {}) {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: connection, isLoading: whsLoading } = useWhsConnection(user?.id);
  const { data: trendData } = useHandicapTrend(connection?.id);
  const trend = useHandicapTrend90d(connection?.id);

  // Theme-aware tokens
  const INK = light ? DARK_INK : WHITE;
  const HAIRLINE = light ? DARK_HAIRLINE : WHITE_HAIRLINE;
  const shadow = light ? 'none' : FLOAT_SHADOW;

  const baseStyle = pill
    ? {
        ...PILL_STYLE,
        background: light ? '#FFFFFF' : 'rgba(255,255,255,0.08)',
        border: light ? '0.5px solid rgba(15,23,42,0.10)' : '1px solid rgba(255,255,255,0.12)',
        boxShadow: light ? '0 1px 2px rgba(15,23,42,0.04)' : 'none',
        filter: light ? 'none' : shadow,
      }
    : { ...BASE_STYLE, border: `1px solid ${HAIRLINE}`, filter: shadow };

  if (!user) return null;

  // Skeleton — reserves space to prevent layout shift on initial load.
  if (whsLoading) {
    return (
      <div
        aria-hidden
        style={{
          ...baseStyle,
          width: 60,
          cursor: 'default',
        }}
      />
    );
  }

  const handleTap = (state: HandicapTrend90dDirection | 'disconnected') => {
    analyticsEvents.track('header_handicap_chip_tapped', {
      source: resolveSource(location.pathname),
      state,
    });
    navigate('/handicap');
  };

  // Disconnected / no-index state — dashed "empty slot" pill.
  const disconnectedPill = (
    <button
      type="button"
      onClick={() => handleTap('disconnected')}
      aria-label="Connect handicap"
      style={
        pill
          ? {
              ...PILL_STYLE,
              background: 'transparent',
              border: light
                ? '0.5px dashed rgba(15,23,42,0.22)'
                : '1px dashed rgba(255,255,255,0.26)',
              boxShadow: light ? '0 1px 2px rgba(15,23,42,0.04)' : 'none',
              filter: light ? 'none' : shadow,
              whiteSpace: 'nowrap',
            }
          : {
              ...BASE_STYLE,
              border: `1px dashed ${light ? 'rgba(15,23,42,0.22)' : 'rgba(255,255,255,0.26)'}`,
              filter: shadow,
              whiteSpace: 'nowrap',
            }
      }
      className="active:scale-[0.97] transition-transform"
    >
      <span
        style={{
          fontSize: pill ? 13 : 11,
          fontWeight: 700,
          color: INK,
          letterSpacing: '0.02em',
        }}
      >
        Connect HCP
      </span>
    </button>
  );

  // Disconnected — no WHS connection.
  if (!connection) {
    return disconnectedPill;
  }

  const indexValue = trendData?.current ?? null;
  if (indexValue === null) {
    // Connection exists but no current index — fall back to Connect HCP.
    return disconnectedPill;
  }

  const { direction } = trend;
  const showArrow = direction === 'improving' || direction === 'drifting';
  const arrowColor = direction === 'improving' ? SEASON_GREEN : CRIMSON;
  const ArrowIcon = direction === 'improving' ? TrendingDown : TrendingUp;

  const formattedIndex = Number(indexValue).toFixed(1);

  return (
    <button
      type="button"
      onClick={() => handleTap(direction)}
      aria-label={`Handicap ${formattedIndex}${
        direction === 'improving' ? ', improving' : direction === 'drifting' ? ', drifting' : ''
      }`}
      style={{ ...baseStyle, gap: showArrow ? 6 : 0 }}
      className="active:scale-[0.97] transition-transform"
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: INK,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.01em',
        }}
      >
        {formattedIndex}
      </span>
      {showArrow && <ArrowIcon size={11} color={arrowColor} strokeWidth={2.4} />}
    </button>
  );
}

export default HandicapChip;
