/**
 * HomeConnectHandicapModule — Phase 4 conversion module on Home.
 *
 * Three states:
 *   1. Hidden — logged out, or loading, or connected > 7 days ago.
 *   2. Disconnected — dark-gradient conversion card (matches profile-sheet Connect state).
 *   3. Recently connected (< 7 days) — white scorecard celebrating the connection.
 *
 * Routes to /handicap on tap. No props.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection, useHandicapTrend } from '@/lib/whs/hooks';
import { ConnectHandicapCard } from '@/components/shared/ConnectHandicapCard';

// ── Design tokens (Dispatch) ─────────────────────────────────────────────
const INK = '#0F172A';
const INK_FAINT = '#94A3B8';
const AMBER = '#F7931E';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const FONT = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
const PAGE_PAD = 16;

const DAY_MS = 86_400_000;

// ── Analytics ────────────────────────────────────────────────────────────
const sessionFiredViews = new Set<string>();

function trackHome(event: 'home_connect_module_viewed' | 'home_connect_module_tapped', userId: string) {
  try {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log(`[Analytics] ${event}`, { source: 'home', user_id: userId });
    }
    // Future: post to analytics pipeline.
  } catch {
    /* swallow */
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Skeleton — shown while hooks resolve. Matches disconnected-card footprint.
// ─────────────────────────────────────────────────────────────────────────
const Skeleton: React.FC = () => (
  <div style={{ paddingLeft: PAGE_PAD, paddingRight: PAGE_PAD }}>
    <div
      style={{
        height: 156,
        borderRadius: 14,
        background: '#FFFFFF',
        border: `0.5px solid ${HAIRLINE}`,
        opacity: 0.7,
      }}
    />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────
// State A — Disconnected conversion card
// ─────────────────────────────────────────────────────────────────────────
const DisconnectedCard: React.FC<{ userId: string; onTap: () => void }> = ({ userId, onTap }) => {
  const ref = useRef<HTMLButtonElement | null>(null);

  // Fire view event once per session on viewport entry.
  useEffect(() => {
    if (sessionFiredViews.has(userId)) return;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      sessionFiredViews.add(userId);
      trackHome('home_connect_module_viewed', userId);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !sessionFiredViews.has(userId)) {
            sessionFiredViews.add(userId);
            trackHome('home_connect_module_viewed', userId);
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.5 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [userId]);

  const handleClick = () => {
    trackHome('home_connect_module_tapped', userId);
    onTap();
  };

  return (
    <div style={{ paddingLeft: PAGE_PAD, paddingRight: PAGE_PAD }}>
      <ConnectHandicapCard
        ref={ref}
        headline="Personalize your home."
        sub="Connect your handicap to see picks for your level, stats from your peers, and your trend over time."
        microcopy="Takes 30 seconds · We never post on your behalf"
        onTap={handleClick}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// State B — Recently connected celebration card (< 7 days)
// ─────────────────────────────────────────────────────────────────────────
const RecentlyConnectedCard: React.FC<{
  connectionId: string;
  daysConnected: number;
  onTap: () => void;
}> = ({ connectionId, daysConnected, onTap }) => {
  const { data: trend } = useHandicapTrend(connectionId);
  const indexLabel =
    trend?.current != null && Number.isFinite(trend.current)
      ? trend.current.toFixed(1)
      : '—';
  const roundsLabel =
    trend && typeof trend.totalRoundsInRecord === 'number'
      ? String(trend.totalRoundsInRecord)
      : '—';
  const daysLabel = daysConnected <= 0 ? 'Today' : `${daysConnected} day${daysConnected === 1 ? '' : 's'}`;

  return (
    <div style={{ paddingLeft: PAGE_PAD, paddingRight: PAGE_PAD }}>
      <button
        type="button"
        onClick={onTap}
        className="block w-full text-left transition-colors"
        style={{
          background: '#FFFFFF',
          borderRadius: 14,
          border: `0.5px solid ${HAIRLINE}`,
          padding: '16px 18px 16px 20px',
          fontFamily: FONT,
          cursor: 'pointer',
        }}
      >
        {/* Eyebrow row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              aria-hidden
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: AMBER,
                display: 'inline-block',
              }}
            />
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: AMBER,
              }}
            >
              Handicap · Connected
            </span>
          </div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              fontSize: 12,
              fontWeight: 700,
              color: AMBER,
            }}
          >
            View handicap
            <ChevronRight size={13} strokeWidth={2.4} />
          </span>
        </div>

        {/* Three-column scorecard */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            alignItems: 'baseline',
            gap: 16,
          }}
        >
          <Col value={indexLabel} valueSize={48} valueWeight={200} label="Index" />
          <Col value={roundsLabel} valueSize={28} valueWeight={300} label="Rounds" />
          <Col value={daysLabel} valueSize={22} valueWeight={400} label="Connected" />
        </div>
      </button>
    </div>
  );
};

const Col: React.FC<{
  value: string;
  valueSize: number;
  valueWeight: number;
  label: string;
}> = ({ value, valueSize, valueWeight, label }) => (
  <div>
    <div
      style={{
        fontSize: valueSize,
        fontWeight: valueWeight,
        letterSpacing: '-0.02em',
        color: INK,
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1,
      }}
    >
      {value}
    </div>
    <div
      style={{
        marginTop: 6,
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: INK_FAINT,
      }}
    >
      {label}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────
// Module — state selector
// ─────────────────────────────────────────────────────────────────────────
export const HomeConnectHandicapModule: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSupabaseSession();
  const {
    data: connection,
    isLoading: whsLoading,
    isFetched: whsFetched,
  } = useWhsConnection(user?.id);

  const goConnect = () => navigate('/handicap');

  const daysConnected = useMemo(() => {
    if (!connection?.created_at) return null;
    const t = new Date(connection.created_at).getTime();
    if (Number.isNaN(t)) return null;
    return Math.floor((Date.now() - t) / DAY_MS);
  }, [connection?.created_at]);

  // Logged out — render nothing (no slot reserved).
  if (!authLoading && !user) return null;

  // Loading: show skeleton so LazySection slot doesn't pop.
  if (authLoading || (user && whsLoading && !whsFetched)) {
    return <Skeleton />;
  }

  if (!user) return null;

  // No connection → conversion card.
  if (!connection) {
    return <DisconnectedCard userId={user.id} onTap={goConnect} />;
  }

  // Connected within last 7 days → celebration card.
  if (daysConnected != null && daysConnected < 7) {
    return (
      <RecentlyConnectedCard
        connectionId={connection.id}
        daysConnected={daysConnected}
        onTap={goConnect}
      />
    );
  }

  // Connected longer ago → module hides permanently.
  return null;
};

export default HomeConnectHandicapModule;
