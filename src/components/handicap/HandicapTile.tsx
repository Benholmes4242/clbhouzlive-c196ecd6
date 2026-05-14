/**
 * HandicapTile — full-width primary tile in the ProfileHubSheet.
 * Six-state state machine: improving / drifting / steady / milestone / nodata / connect.
 *
 * NEW badge: gated by SHOW_HANDICAP_NEW_BADGE in featureFlags.ts.
 */
import { memo, useMemo } from 'react';
import { ChevronRight, Trophy } from 'lucide-react';
import { useWhsConnection, useHandicapTrend } from '@/lib/whs/hooks';
import { SHOW_HANDICAP_NEW_BADGE } from '@/config/featureFlags';

const AMBER = '#F7931E';
const INK = '#0f172a';

interface HandicapTileProps {
  userId: string;
  onClick: () => void;
}

type HandicapTileState =
  | 'improving'
  | 'drifting'
  | 'steady'
  | 'milestone'
  | 'nodata'
  | 'connect';

function classifyHandicapTileState(
  hasConnection: boolean,
  trend:
    | {
        current: number | null;
        delta: number | null;
        previousHandicap: number | null;
        totalRoundsInRecord: number;
        hasHistory: boolean;
      }
    | undefined,
): HandicapTileState {
  if (!hasConnection) return 'connect';
  if (!trend || trend.current === null) return 'nodata';
  // True "awaiting data" — user hasn't built enough scoring record yet.
  if (trend.totalRoundsInRecord < 8) return 'nodata';

  // Milestone crossing — only checkable when we have a 30D baseline.
  if (trend.hasHistory && trend.previousHandicap !== null) {
    const currentDisplayed = trend.current < 0 ? Math.floor(trend.current) : Math.ceil(trend.current);
    const previousDisplayed =
      trend.previousHandicap < 0 ? Math.floor(trend.previousHandicap) : Math.ceil(trend.previousHandicap);
    if (currentDisplayed !== previousDisplayed) return 'milestone';
  }

  // Without a 30D baseline (or with a tiny delta), fall through to steady.
  if (!trend.hasHistory || trend.delta === null) return 'steady';
  if (Math.abs(trend.delta) < 0.05) return 'steady';
  return trend.delta < 0 ? 'improving' : 'drifting';
}

function HandicapTile({ userId, onClick }: HandicapTileProps) {
  const { data: connection } = useWhsConnection(userId);
  const { data: trend } = useHandicapTrend(connection?.id);

  const state = useMemo(
    () => classifyHandicapTileState(!!connection, trend as any),
    [connection, trend],
  );

  const displayValue = useMemo(() => {
    if (trend?.current === null || trend?.current === undefined) return '—';
    const v = trend.current;
    return v < 0 ? `+${Math.abs(v).toFixed(1)}` : v.toFixed(1);
  }, [trend]);

  const milestone = useMemo(() => {
    if (trend?.current === null || trend?.current === undefined) {
      return { displayed: null as number | null, progress: 0 };
    }
    const h = trend.current;
    const displayed = h < 0 ? Math.floor(h) : Math.ceil(h);
    const windowTop = displayed + 0.4;
    const windowBottom = displayed - 0.6;
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
    return `${pct}% of the way to ${milestoneToLabel}`;
  }, [milestone, milestoneFromLabel, milestoneToLabel]);

  const stateTokens = useMemo(() => {
    switch (state) {
      case 'improving':
        return {
          background: 'linear-gradient(135deg, rgba(34,197,94,0.07), transparent 70%), #FFFFFF',
          borderColor: 'rgba(34,197,94,0.22)',
          boxShadow: '0 2px 12px rgba(34,197,94,0.08)',
          dotColor: '#22C55E',
          tagColor: '#15803D',
          tagText: 'Improving',
          deltaColor: '#15803D',
          deltaArrow: '↓',
          fillGradient: 'linear-gradient(90deg, #22C55E 0%, #4ADE80 100%)',
        };
      case 'drifting':
        return {
          background: 'linear-gradient(135deg, rgba(220,38,38,0.06), transparent 70%), #FFFFFF',
          borderColor: 'rgba(220,38,38,0.20)',
          boxShadow: '0 2px 12px rgba(220,38,38,0.06)',
          dotColor: '#DC2626',
          tagColor: '#991B1B',
          tagText: 'Drifting',
          deltaColor: '#991B1B',
          deltaArrow: '↑',
          fillGradient: 'linear-gradient(90deg, #DC2626 0%, #F87171 100%)',
        };
      case 'steady':
        return {
          background: 'linear-gradient(135deg, rgba(100,116,139,0.05), transparent 70%), #FFFFFF',
          borderColor: 'rgba(100,116,139,0.18)',
          boxShadow: '0 2px 12px rgba(15,23,42,0.04)',
          dotColor: '#94A3B8',
          tagColor: '#64748B',
          tagText: 'Steady',
          deltaColor: '#64748B',
          deltaArrow: '—',
          fillGradient: 'linear-gradient(90deg, #94A3B8 0%, #CBD5E1 100%)',
        };
      case 'milestone':
        return {
          background: 'linear-gradient(135deg, rgba(247,147,30,0.10), transparent 70%), #FFFFFF',
          borderColor: 'rgba(247,147,30,0.32)',
          boxShadow: '0 4px 16px rgba(247,147,30,0.14)',
          dotColor: '#F7931E',
          tagColor: '#C97211',
          tagText: 'Milestone',
          deltaColor: '#C97211',
          deltaArrow: trend && trend.delta !== null && trend.delta < 0 ? '↓' : '↑',
          fillGradient: 'linear-gradient(90deg, #F7931E 0%, #FBBC2E 100%)',
        };
      case 'nodata':
        return {
          background: 'linear-gradient(135deg, rgba(15,23,42,0.04), transparent 70%), #FFFFFF',
          borderColor: 'rgba(15,23,42,0.10)',
          boxShadow: 'none',
          dotColor: '#CBD5E1',
          tagColor: '#64748B',
          tagText: 'Awaiting data',
          deltaColor: '#94A3B8',
          deltaArrow: '',
          fillGradient: 'linear-gradient(90deg, #94A3B8 0%, #CBD5E1 100%)',
        };
      default:
        return null;
    }
  }, [state, trend]);

  const showNewBadge = SHOW_HANDICAP_NEW_BADGE;

  // Empty-state branch — render dashed amber CTA tile when not connected.
  if (state === 'connect') {
    return (
      <button
        type="button"
        onClick={onClick}
        className="relative active:scale-[0.97] transition-transform"
        style={{
          width: '100%',
          background: 'linear-gradient(135deg, rgba(247,147,30,0.04), #fff)',
          border: '1.5px dashed rgba(247,147,30,0.36)',
          borderRadius: 16,
          padding: '18px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          cursor: 'pointer',
          textAlign: 'left',
        }}
        aria-label="Connect your handicap"
      >
        <div
          style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #FBA738, #F7931E)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 3px 8px rgba(247,147,30,0.24)',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6 L3 18 M3 12 Q9 7 15 12 T 21 12" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 9, fontWeight: 800, color: '#C97211',
            letterSpacing: '0.16em', textTransform: 'uppercase',
            marginBottom: 3,
          }}>
            HANDICAP
          </div>
          <div style={{
            fontSize: 14.5, fontWeight: 700, color: INK,
            letterSpacing: '-0.01em', marginBottom: 2,
          }}>
            Connect your handicap
          </div>
          <div style={{
            fontSize: 11, color: '#64748B',
            lineHeight: 1.35,
          }}>
            Sync rounds, track your index, play against friends.
          </div>
        </div>
        <ChevronRight size={18} color="rgba(15,23,42,0.40)" strokeWidth={2} />
      </button>
    );
  }

  // Defensive: stateTokens only null for 'connect', already handled above.
  if (!stateTokens) return null;

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
        background: stateTokens.background,
        border: `1px solid ${stateTokens.borderColor}`,
        boxShadow: stateTokens.boxShadow,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'left',
      }}
      aria-label={`Handicap ${displayValue}. ${stateTokens.tagText}.`}
    >
      {showNewBadge && (
        <span
          style={{
            position: 'absolute',
            top: -6, right: -6,
            padding: '3px 8px',
            borderRadius: 999,
            background: AMBER, color: '#fff',
            fontSize: 9, fontWeight: 800, letterSpacing: '0.14em',
            boxShadow: '0 2px 6px rgba(247,147,30,0.40)',
            lineHeight: 1,
          }}
        >
          NEW
        </span>
      )}

      {/* Top — state tag · Handicap eyebrow + chevron */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: stateTokens.dotColor, flexShrink: 0 }} />
          <span style={{
            fontSize: 9, fontWeight: 800, color: stateTokens.tagColor,
            letterSpacing: '0.16em', textTransform: 'uppercase',
          }}>
            {stateTokens.tagText}
          </span>
          <span style={{ fontSize: 9, fontWeight: 800, color: '#94A3B8' }}>·</span>
          <span style={{
            fontSize: 9, fontWeight: 800, color: '#64748B',
            letterSpacing: '0.16em', textTransform: 'uppercase',
          }}>
            Handicap
          </span>
        </div>
        <ChevronRight size={16} color="rgba(15,23,42,0.40)" strokeWidth={2.2} />
      </div>

      {/* Middle — number + 30D delta on one line */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
        <span style={{
          fontSize: 28, fontWeight: 700, color: INK,
          letterSpacing: '-0.04em', lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {displayValue}
        </span>
        {state !== 'nodata' && trend && trend.delta !== null && (
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: stateTokens.deltaColor,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {stateTokens.deltaArrow} {Math.abs(trend.delta).toFixed(1)} / 30D
          </span>
        )}
        {state === 'nodata' && trend && trend.totalRoundsInRecord < 8 && (
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: stateTokens.deltaColor,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {trend.totalRoundsInRecord} of 8 rounds
          </span>
        )}
      </div>

      {/* Bottom — milestone progress bar */}
      <div style={{ marginTop: 'auto', width: '100%', paddingTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{
            fontSize: 9, fontWeight: 700,
            color: '#94A3B8',
            letterSpacing: '0.14em',
            textTransform: 'uppercase' as const,
          }}>
            {milestoneFromLabel}
          </span>
          <span style={{
            fontSize: 9, fontWeight: 800,
            color: '#C97211',
            letterSpacing: '0.14em',
            textTransform: 'uppercase' as const,
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
              background: stateTokens.fillGradient,
              borderRadius: 3,
              transition: 'width 320ms cubic-bezier(0.22, 0.61, 0.36, 1)',
            }}
          />
        </div>
        {state === 'milestone' ? (
          <div style={{
            marginTop: 6, fontSize: 11, fontWeight: 700, color: '#C97211',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <Trophy size={12} strokeWidth={2.4} />
            <span>You crossed into {milestoneFromLabel}</span>
          </div>
        ) : state === 'nodata' ? (
          <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(15,23,42,0.65)' }}>
            {trend && trend.totalRoundsInRecord < 8
              ? `Trend appears after ${8 - trend.totalRoundsInRecord} more rounds`
              : 'Trend updates with your next round'}
          </div>
        ) : (
          <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(15,23,42,0.65)' }}>
            {milestoneProgressLabel.replace(/^(\d+%)/, '§§§$1§§§')
              .split('§§§')
              .map((part, i) =>
                /^\d+%$/.test(part)
                  ? <span key={i} style={{ fontWeight: 500, color: 'rgba(15,23,42,0.85)' }}>{part}</span>
                  : part
              )}
          </div>
        )}
      </div>
    </button>
  );
}

export default memo(HandicapTile);
