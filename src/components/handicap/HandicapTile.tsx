/**
 * HandicapTile — primary tile in the ProfileHubSheet 2×2 grid.
 * Shows live current handicap, monthly delta, and a NEW badge.
 *
 * NEW badge: shown for 60 days after HANDICAP_PROMO_LAUNCHED_AT.
 * Per Phase-5 brief: v1 uses static badge with automatic 60-day expiry
 * (not dismiss-on-tap). Update HANDICAP_PROMO_LAUNCHED_AT at rollout.
 */
import { memo, useMemo } from 'react';
import { useWhsConnection, useHandicapTrend } from '@/lib/whs/hooks';

const AMBER = '#F7931E';
const INK = '#0f172a';
const INK_55 = '#64748B';

// Rollout date for the Handicap promotion. NEW badge auto-hides 60 days after.
const HANDICAP_PROMO_LAUNCHED_AT = new Date('2026-05-04T00:00:00Z').getTime();
const NEW_BADGE_DURATION_MS = 60 * 24 * 60 * 60 * 1000;

interface HandicapTileProps {
  userId: string;
  onClick: () => void;
}

function MiniRing() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke={`${AMBER}30`} strokeWidth="2.5" fill="none" />
      <path
        d="M 12 2 A 10 10 0 0 1 21.5 8.5"
        stroke={AMBER}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="3" fill={AMBER} />
    </svg>
  );
}

function HandicapTile({ userId, onClick }: HandicapTileProps) {
  const { data: connection } = useWhsConnection(userId);
  const { data: trend } = useHandicapTrend(connection?.id);

  const displayValue = useMemo(() => {
    if (trend?.current === null || trend?.current === undefined) return '—';
    const v = trend.current;
    return v < 0 ? `+${Math.abs(v).toFixed(1)}` : v.toFixed(1);
  }, [trend]);

  const subLine = useMemo(() => {
    if (!connection) return 'Connect to view';
    if (!trend || trend.delta === null || trend.delta === undefined) return 'Tap to view';
    const d = trend.delta;
    if (Math.abs(d) < 0.05) return 'Steady this month';
    const arrow = d < 0 ? '↓' : '↑';
    return `${arrow} ${Math.abs(d).toFixed(1)} this month`;
  }, [connection, trend]);

  const showNewBadge = useMemo(
    () => Date.now() - HANDICAP_PROMO_LAUNCHED_AT < NEW_BADGE_DURATION_MS,
    [],
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex flex-col justify-between text-left active:scale-[0.97] transition-transform"
      style={{
        minHeight: 110,
        padding: '14px 14px 16px',
        borderRadius: 14,
        background: 'linear-gradient(135deg, rgba(247,147,30,0.08), transparent 70%), #ffffff',
        border: '1px solid rgba(247,147,30,0.30)',
        boxShadow: '0 2px 12px rgba(247,147,30,0.10)',
        cursor: 'pointer',
      }}
      aria-label={`Handicap ${displayValue}`}
    >
      {/* NEW badge — auto-hides 60 days after launch */}
      {showNewBadge && (
        <span
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            padding: '3px 8px',
            borderRadius: 999,
            background: AMBER,
            color: '#fff',
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.10em',
            boxShadow: '0 2px 6px rgba(247,147,30,0.40)',
            lineHeight: 1,
          }}
        >
          NEW
        </span>
      )}

      {/* Top row: icon + value */}
      <div className="flex items-center justify-between w-full">
        <div
          className="flex items-center justify-center"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: '#ffffff',
            boxShadow: '0 1px 4px rgba(247,147,30,0.20)',
          }}
        >
          <MiniRing />
        </div>
        <span
          style={{
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: INK,
            fontVariantNumeric: 'tabular-nums lining-nums',
            fontFeatureSettings: '"kern" 1, "liga" 1',
            lineHeight: 1,
          }}
        >
          {displayValue}
        </span>
      </div>

      {/* Bottom: label + sub */}
      <div className="w-full">
        <div style={{ fontSize: 15, fontWeight: 700, color: INK, lineHeight: 1.2 }}>
          Handicap
        </div>
        <div style={{ fontSize: 11, color: INK_55, marginTop: 2 }}>{subLine}</div>
      </div>
    </button>
  );
}

export default memo(HandicapTile);
