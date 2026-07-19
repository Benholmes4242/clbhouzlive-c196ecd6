/**
 * ProfileSheetV2 · HcpStrip
 *
 * Slim tappable handicap strip. Two states:
 *   - Connected: HCP eyebrow + index + trend arrow + rounds-90d + chevron
 *   - Disconnected: HCP eyebrow + "Connect official WHS handicap" + chevron
 * Hidden for business actors. Both states tap to /handicap.
 *
 * rounds-90d is computed locally by scanning useAllScores by play_date,
 * mirroring src/hooks/useProfileSheetStats.ts (which dies with the old
 * sheet).
 */

import React, { useMemo } from 'react';
import { useWhsConnection, useHandicapTrend, useHandicapHistory, useAllScores } from '@/lib/whs/hooks';

const AMBER = '#F7931E';
const INK = '#0F172A';
const MUTED = '#94A3B8';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const GREEN = '#16a34a';
const RED = '#dc2626';
const DOT = '\u00B7';
const CHEVRON = '\u203A';

interface Props {
  actorType: 'personal' | 'business';
  actorId: string;
  onNavigate: (route: string) => void;
}

export default function HcpStrip({ actorType, actorId, onNavigate }: Props) {
  const isBusiness = actorType === 'business';

  const { data: connection } = useWhsConnection(isBusiness ? undefined : actorId);
  const { data: trend } = useHandicapTrend(connection?.id);
  const { data: history90 } = useHandicapHistory(connection?.id, 90);
  const { data: scores } = useAllScores(connection?.id);

  // 90-day delta: replicate HeroHandicapCardDark exactly —
  //   history90[last].handicap_index - history90[0].handicap_index
  // (see src/components/profile/handicap/whs/sections/HeroHandicapCardDark.tsx)
  const delta90 = useMemo<number | null>(() => {
    if (!history90 || history90.length < 2) return null;
    return history90[history90.length - 1].handicap_index - history90[0].handicap_index;
  }, [history90]);

  const rounds90d = useMemo(() => {
    if (!scores) return null;
    const cutoff = Date.now() - 90 * 86_400_000;
    return scores.filter(
      (s: any) => s.play_date && new Date(s.play_date).getTime() >= cutoff,
    ).length;
  }, [scores]);

  if (isBusiness) return null;

  const stripBase: React.CSSProperties = {
    margin: '12px 20px 0',
    padding: '11px 15px',
    background: '#fff',
    border: `1px solid ${HAIRLINE}`,
    borderRadius: 14,
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    cursor: 'pointer',
  };

  const eyebrow = (
    <span
      style={{
        fontWeight: 700,
        fontSize: 10,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: AMBER,
      }}
    >
      HCP
    </span>
  );

  const chevron = (
    <span style={{ color: MUTED, fontSize: 15, marginLeft: 'auto' }}>{CHEVRON}</span>
  );

  // Disconnected state
  if (!connection) {
    return (
      <div
        onClick={() => onNavigate('/handicap')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onNavigate('/handicap');
          }
        }}
        role="button"
        tabIndex={0}
        style={stripBase}
      >
        {eyebrow}
        <span style={{ fontWeight: 600, fontSize: 13, color: INK }}>
          Connect official WHS handicap
        </span>
        {chevron}
      </div>
    );
  }

  // current-index from useHandicapTrend (default 30d window) — mirrors the
  // page: the hero shows the trend row deltas from history90, but the current
  // index is the authoritative value from the trend hook.
  const current = trend?.current;
  let trendNode: React.ReactNode = null;
  // Thresholds match HeroHandicapCardDark TrendRow: improved < -0.05 (green),
  // drifted > 0.05 (red), else neutral/omitted.
  const improved = delta90 != null && delta90 < -0.05;
  const drifted = delta90 != null && delta90 > 0.05;
  if (improved || drifted) {
    const sign = delta90! < 0 ? '-' : '+';
    const formatted = `${sign}${Math.abs(delta90!).toFixed(1)}`;
    trendNode = (
      <span style={{ fontWeight: 700, fontSize: 11.5, color: improved ? GREEN : RED, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
        <span style={{ fontSize: 9 }}>{improved ? '\u25BC' : '\u25B2'}</span>
        {formatted}
      </span>
    );
  }

  const indexText = typeof current === 'number'
    ? (current < 0 ? `+${Math.abs(current).toFixed(1)}` : current.toFixed(1))
    : '\u2014';

  return (
    <div onClick={() => onNavigate('/handicap')} role="button" tabIndex={0} style={stripBase}>
      {eyebrow}
      <span
        style={{
          fontWeight: 800,
          fontSize: 22,
          color: INK,
          letterSpacing: '-0.02em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {indexText}
      </span>
      {trendNode}
      {rounds90d != null && (
        <span style={{ fontWeight: 500, fontSize: 11, color: MUTED }}>
          {DOT} {rounds90d} rounds {DOT} 90d
        </span>
      )}
      {chevron}
    </div>
  );
}
