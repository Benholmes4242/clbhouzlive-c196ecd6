/**
 * HandicapTile — full-width primary tile in the ProfileHubSheet.
 * Shows live current handicap with a horizontal milestone progress bar.
 *
 * NEW badge: gated by SHOW_HANDICAP_NEW_BADGE in featureFlags.ts.
 */
import { memo, useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { useWhsConnection, useHandicapTrend } from '@/lib/whs/hooks';
import { SHOW_HANDICAP_NEW_BADGE } from '@/config/featureFlags';

const AMBER = '#F7931E';
const INK = '#0f172a';

interface HandicapTileProps {
  userId: string;
  onClick: () => void;
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

  // Local milestone calculation — duplicates HeroHandicapCard's calcMilestoneProgress
  // to avoid cross-file imports.
  const milestone = useMemo(() => {
    if (trend?.current === null || trend?.current === undefined) {
      return { displayed: null as number | null, progress: 0 };
    }
    const h = trend.current;
    const displayed = h < 0 ? Math.floor(h) : Math.ceil(h);
    const windowTop = displayed + 0.4;
    const windowBottom = displayed - 0.5;
    const progress = (windowTop - h) / (windowTop - windowBottom);
    return { displayed, progress: Math.max(0, Math.min(1, progress)) };
  }, [trend]);

  const milestoneFromLabel = useMemo(() => {
    if (milestone.displayed == null) return '—';
    const d = milestone.displayed;
    return d < 0 ? `+${Math.abs(d)} HCP` : `${d} HCP`;
  }, [milestone]);

  const milestoneToLabel = useMemo(() => {
    if (milestone.displayed == null) return '—';
    const next = milestone.displayed - 1;
    return next < 0 ? `+${Math.abs(next)} HCP` : `${next} HCP`;
  }, [milestone]);

  const milestoneProgress = milestone.progress;

  const milestoneProgressLabel = useMemo(() => {
    if (milestone.displayed == null) return 'Awaiting data';
    const pct = Math.round(milestone.progress * 100);
    if (pct >= 95) return `Almost at ${milestoneToLabel}`;
    if (pct <= 5) return `Just hit ${milestoneFromLabel}`;
    return `${pct}% to next milestone`;
  }, [milestone, milestoneFromLabel, milestoneToLabel]);

  const deltaColor = useMemo(() => {
    if (!trend || trend.delta === null || trend.delta === undefined) return 'rgba(15,23,42,0.55)';
    if (Math.abs(trend.delta) < 0.05) return 'rgba(15,23,42,0.55)';
    return trend.delta < 0 ? '#15803D' : '#DC2626';
  }, [trend]);

  const showNewBadge = SHOW_HANDICAP_NEW_BADGE;

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative active:scale-[0.97] transition-transform"
      style={{
        width: '100%',
        minHeight: 110,
        padding: '12px 14px 14px',
        borderRadius: 14,
        background: 'linear-gradient(135deg, rgba(247,147,30,0.08), transparent 70%), #ffffff',
        border: '1px solid rgba(247,147,30,0.30)',
        boxShadow: '0 2px 12px rgba(247,147,30,0.10)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'left',
      }}
      aria-label={`Handicap ${displayValue}. ${subLine}.`}
    >
      {showNewBadge && (
        <span
          style={{
            position: 'absolute',
            top: -6, right: -6,
            padding: '3px 8px',
            borderRadius: 999,
            background: AMBER, color: '#fff',
            fontSize: 9, fontWeight: 800, letterSpacing: '0.10em',
            boxShadow: '0 2px 6px rgba(247,147,30,0.40)',
            lineHeight: 1,
          }}
        >
          NEW
        </span>
      )}

      {/* Top — eyebrow + chevron */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: AMBER }} />
          <span style={{
            fontSize: 9, fontWeight: 800, color: 'rgba(15,23,42,0.55)',
            letterSpacing: '0.16em', textTransform: 'uppercase',
          }}>
            Handicap
          </span>
        </div>
        <ChevronRight size={16} color="rgba(15,23,42,0.40)" strokeWidth={2.2} />
      </div>

      {/* Middle — number + monthly delta on one line */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
        <span style={{
          fontSize: 28, fontWeight: 700, color: INK,
          letterSpacing: '-0.04em', lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {displayValue}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 700,
          color: deltaColor,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {subLine}
        </span>
      </div>

      {/* Bottom — milestone progress bar */}
      <div style={{ marginTop: 'auto', width: '100%', paddingTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{
            fontSize: 9, fontWeight: 700,
            color: 'rgba(15,23,42,0.40)',
            letterSpacing: '0.12em',
          }}>
            {milestoneFromLabel}
          </span>
          <span style={{
            fontSize: 9, fontWeight: 800,
            color: '#C97211',
            letterSpacing: '0.12em',
          }}>
            {milestoneToLabel} →
          </span>
        </div>
        <div style={{
          height: 6, background: 'rgba(15,23,42,0.06)',
          borderRadius: 3, position: 'relative', overflow: 'hidden',
        }}>
          <div
            style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: `${Math.round(milestoneProgress * 100)}%`,
              background: `linear-gradient(90deg, ${AMBER} 0%, #FBBC2E 100%)`,
              borderRadius: 3,
              transition: 'width 320ms cubic-bezier(0.22, 0.61, 0.36, 1)',
            }}
          />
        </div>
        <div style={{
          marginTop: 4, fontSize: 10,
          color: 'rgba(15,23,42,0.55)', fontWeight: 500,
        }}>
          {milestoneProgressLabel}
        </div>
      </div>
    </button>
  );
}

export default memo(HandicapTile);
