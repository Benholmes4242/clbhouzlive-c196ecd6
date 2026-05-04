/**
 * HandicapTile — the primary tile in the ProfileHubSheet 2×2 grid.
 * Shows the user's live handicap value with a NEW badge.
 */
import { memo, useMemo } from 'react';
import { useWhsConnection } from '@/lib/whs/hooks';
import { useHandicapTrend } from '@/lib/whs/hooks';

const AMBER = '#F7931E';
const INK = '#0F172A';
const INK_55 = '#64748B';

interface HandicapTileProps {
  userId: string | undefined;
  onClick: () => void;
}

const MiniRing = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="10" stroke={`${AMBER}4D`} strokeWidth="2.5" fill="none" />
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

function HandicapTile({ userId, onClick }: HandicapTileProps) {
  const { data: connection } = useWhsConnection(userId);
  const { data: trend } = useHandicapTrend(connection?.id);

  const value = useMemo(() => {
    if (!trend?.current && trend?.current !== 0) return '—';
    const v = trend.current;
    return v >= 0 ? v.toFixed(1) : `+${Math.abs(v).toFixed(1)}`;
  }, [trend]);

  const subline = useMemo(() => {
    if (!connection) return 'Connect to view';
    const delta = trend?.delta;
    if (delta == null) return 'Tap to view';
    if (Math.abs(delta) < 0.05) return 'Steady this month';
    const arrow = delta < 0 ? '↓' : '↑';
    return `${arrow} ${Math.abs(delta).toFixed(1)} this month`;
  }, [trend, connection]);

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex flex-col justify-between text-left active:scale-[0.97] transition-transform"
      style={{
        minHeight: 110,
        padding: '14px 14px 16px',
        borderRadius: 14,
        background: 'linear-gradient(135deg, rgba(247,147,30,0.08), rgba(255,255,255,1) 70%)',
        border: '1px solid rgba(247,147,30,0.30)',
        boxShadow: '0 2px 12px rgba(247,147,30,0.10)',
      }}
      aria-label={`Handicap ${value}`}
    >
      {/* NEW badge */}
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
        }}
      >
        NEW
      </span>

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
            fontFamily: 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: INK,
            fontVariantNumeric: 'tabular-nums lining-nums',
          }}
        >
          {value}
        </span>
      </div>

      {/* Bottom row */}
      <div className="w-full">
        <div style={{ fontSize: 15, fontWeight: 700, color: INK, letterSpacing: '-0.1px' }}>
          Handicap
        </div>
        <div style={{ fontSize: 11, color: INK_55, marginTop: 2 }}>{subline}</div>
      </div>
    </button>
  );
}

export default memo(HandicapTile);
