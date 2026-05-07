/**
 * HandicapTile — primary tile in the ProfileHubSheet 2×2 grid.
 * Shows live current handicap and a monthly delta.
 *
 * NEW badge: gated by SHOW_HANDICAP_NEW_BADGE in featureFlags.ts. The badge
 * has no automatic time-based expiry — flip the flag to false to retire it.
 */
import { memo, useMemo } from 'react';
import { useWhsConnection, useHandicapTrend } from '@/lib/whs/hooks';
import { SHOW_HANDICAP_NEW_BADGE } from '@/config/featureFlags';

const AMBER = '#F7931E';
const INK = '#0f172a';
const INK_55 = '#64748B';

interface HandicapTileProps {
  userId: string;
  onClick: () => void;
}

interface MiniHeroRingProps {
  /** Current handicap index. Null shows a dimmed empty ring. */
  current: number | null;
  /** 30-day delta. Null means no inner arc rendered. */
  delta: number | null;
}

function MiniHeroRing({ current, delta }: MiniHeroRingProps) {
  const SIZE = 64;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R_OUTER = 28;
  const STROKE_OUTER = 4;
  const C_OUTER = 2 * Math.PI * R_OUTER;
  const R_INNER = 21;
  const STROKE_INNER = 2.5;
  const C_INNER = 2 * Math.PI * R_INNER;

  const outerFraction =
    current == null
      ? 0
      : Math.max(0, Math.min(1, current % 1 === 0 ? 1 : 1 - (current % 1)));
  const outerDash = outerFraction * C_OUTER;

  const showGreen = delta != null && delta < -0.05;
  const showRed = delta != null && delta > 0.05;
  const innerStrength = delta == null ? 0 : Math.min(1, Math.abs(delta) * 2);
  const innerFillLength = innerStrength * C_INNER;

  const displayValue =
    current == null
      ? '—'
      : current < 0
        ? `+${Math.abs(current).toFixed(1)}`
        : current.toFixed(1);

  return (
    <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden>
        <defs>
          <linearGradient id="handicapTileAmberGold" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F7931E" />
            <stop offset="100%" stopColor="#FBBC2E" />
          </linearGradient>
        </defs>
        <circle
          cx={CX}
          cy={CY}
          r={R_OUTER}
          fill="none"
          stroke="rgba(15,23,42,0.06)"
          strokeWidth={STROKE_OUTER}
          vectorEffect="non-scaling-stroke"
        />
        {current != null && (
          <circle
            cx={CX}
            cy={CY}
            r={R_OUTER}
            fill="none"
            stroke="url(#handicapTileAmberGold)"
            strokeWidth={STROKE_OUTER}
            strokeLinecap="round"
            strokeDasharray={`${outerDash} ${C_OUTER}`}
            transform={`rotate(-90 ${CX} ${CY})`}
            vectorEffect="non-scaling-stroke"
          />
        )}
        <circle
          cx={CX}
          cy={CY}
          r={R_INNER}
          fill="none"
          stroke="rgba(15,23,42,0.06)"
          strokeWidth={STROKE_INNER}
          vectorEffect="non-scaling-stroke"
        />
        {showGreen && (
          <circle
            cx={CX}
            cy={CY}
            r={R_INNER}
            fill="none"
            stroke="#22C55E"
            strokeWidth={STROKE_INNER}
            strokeLinecap="round"
            strokeDasharray={`${innerFillLength} ${C_INNER}`}
            transform={`rotate(-90 ${CX} ${CY})`}
            vectorEffect="non-scaling-stroke"
          />
        )}
        {showRed && (
          <g transform={`scale(-1, 1) translate(-${SIZE}, 0)`}>
            <circle
              cx={CX}
              cy={CY}
              r={R_INNER}
              fill="none"
              stroke="#DC2626"
              strokeWidth={STROKE_INNER}
              strokeLinecap="round"
              strokeDasharray={`${innerFillLength} ${C_INNER}`}
              transform={`rotate(-90 ${CX} ${CY})`}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        )}
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: INK,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {displayValue}
        </span>
      </div>
    </div>
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

  const showNewBadge = SHOW_HANDICAP_NEW_BADGE;

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex flex-col items-center justify-center text-center active:scale-[0.97] transition-transform"
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

      <MiniHeroRing
        current={trend?.current ?? null}
        delta={trend?.delta ?? null}
      />

      <div className="w-full" style={{ marginTop: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: INK, lineHeight: 1.2 }}>
          Handicap
        </div>
        <div style={{ fontSize: 11, color: INK_55, marginTop: 2 }}>{subLine}</div>
      </div>
    </button>
  );
}

export default memo(HandicapTile);
