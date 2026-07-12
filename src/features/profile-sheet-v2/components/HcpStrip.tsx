/**
 * ProfileSheetV2 · HcpStrip
 *
 * Slim tappable handicap strip. Two states:
 *   - Connected: HCP eyebrow + index + trend arrow + rounds-30d + chevron
 *   - Disconnected: HCP eyebrow + "Connect England Golf" + chevron
 * Hidden for business actors. Both states tap to /handicap.
 *
 * rounds-30d is computed locally by scanning useAllScores by play_date,
 * mirroring src/hooks/useProfileSheetStats.ts (which dies with the old
 * sheet).
 */

import React, { useMemo } from 'react';
import { useWhsConnection, useHandicapTrend, useAllScores } from '@/lib/whs/hooks';

const AMBER_DEEP = '#c97a10';
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
  if (actorType === 'business') return null;

  const { data: connection } = useWhsConnection(actorId);
  const { data: trend } = useHandicapTrend(connection?.id);
  const { data: scores } = useAllScores(connection?.id);

  const rounds30d = useMemo(() => {
    if (!scores) return null;
    const cutoff = Date.now() - 30 * 86_400_000;
    return scores.filter(
      (s: any) => s.play_date && new Date(s.play_date).getTime() >= cutoff,
    ).length;
  }, [scores]);

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
        color: AMBER_DEEP,
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
      <div onClick={() => onNavigate('/handicap')} role="button" tabIndex={0} style={stripBase}>
        {eyebrow}
        <span style={{ fontWeight: 600, fontSize: 13, color: INK }}>
          Connect England Golf
        </span>
        {chevron}
      </div>
    );
  }

  const current = trend?.current;
  const prev = (trend as any)?.previousHandicap ?? null;
  let trendNode: React.ReactNode = null;
  if (typeof current === 'number' && typeof prev === 'number') {
    const delta = Math.round((current - prev) * 10) / 10;
    if (delta < 0) {
      trendNode = (
        <span style={{ fontWeight: 700, fontSize: 11.5, color: GREEN, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <span style={{ fontSize: 9 }}>{'\u25BC'}</span>
          {Math.abs(delta).toFixed(1)}
        </span>
      );
    } else if (delta > 0) {
      trendNode = (
        <span style={{ fontWeight: 700, fontSize: 11.5, color: RED, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <span style={{ fontSize: 9 }}>{'\u25B2'}</span>
          {delta.toFixed(1)}
        </span>
      );
    }
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
      {rounds30d != null && (
        <span style={{ fontWeight: 500, fontSize: 11, color: MUTED }}>
          {DOT} {rounds30d} rounds {DOT} 30d
        </span>
      )}
      {chevron}
    </div>
  );
}
