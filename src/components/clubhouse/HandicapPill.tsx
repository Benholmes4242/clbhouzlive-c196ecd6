import React from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWhsConnection, useHandicapTrend } from '@/lib/whs/hooks';

const GREEN = '#22C55E';
const RED = '#EF4444';
const MUTED_DARK = 'rgba(255,255,255,0.45)';
const MUTED_LIGHT = 'rgba(15,23,42,0.45)';

type Variant = 'glass-dark' | 'solid-light';

interface HandicapPillProps {
  /** Called when the pill is tapped. Should open the profile sheet (same as avatar tap). */
  onTap: () => void;
  /** Visual variant. Defaults to glass-dark. */
  variant?: Variant;
}

function getPillChromeStyle(variant: Variant): React.CSSProperties {
  const base: React.CSSProperties = {
    height: 28,
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '5px 9px 5px 10px',
    borderRadius: 999,
  };
  if (variant === 'glass-dark') {
    return {
      ...base,
      background: 'rgba(255,255,255,0.12)',
      border: '0.5px solid rgba(255,255,255,0.25)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    };
  }
  return {
    ...base,
    background: 'rgba(15,23,42,0.04)',
    border: '0.5px solid rgba(15,23,42,0.10)',
  };
}

function getNumeralStyle(variant: Variant): React.CSSProperties {
  return {
    fontFamily: "'Geist Mono', ui-monospace, monospace",
    fontSize: 13,
    fontWeight: 700,
    color: variant === 'glass-dark' ? 'white' : '#0F172A',
    letterSpacing: '-0.02em',
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1,
  };
}

export function HandicapPill({ onTap, variant = 'glass-dark' }: HandicapPillProps) {
  const { user } = useSupabaseSession();

  const { data: profile } = useQuery({
    queryKey: ['handicap-pill-profile', user?.id],
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_profiles')
        .select('eg_handicap_index, show_handicap')
        .eq('id', user.id)
        .single();
      if (error) return null;
      return data as { eg_handicap_index: number | null; show_handicap: boolean | null };
    },
  });

  const { data: connection } = useWhsConnection(user?.id);
  const { data: trend } = useHandicapTrend(connection?.id);

  const handicapIndex = profile?.eg_handicap_index;
  const showHandicap = profile?.show_handicap ?? true;

  if (handicapIndex == null) return null;
  if (!showHandicap) return null;

  if (connection?.last_sync_status === 'error' && connection?.last_synced_at) {
    const days = (Date.now() - new Date(connection.last_synced_at).getTime()) / 86_400_000;
    if (days > 7) return null;
  }

  const formatted =
    handicapIndex < 0
      ? `+${Math.abs(handicapIndex).toFixed(1)}`
      : handicapIndex.toFixed(1);

  const direction: 'down' | 'flat' | 'up' =
    trend?.delta == null
      ? 'flat'
      : trend.delta < -0.05
        ? 'down'
        : trend.delta > 0.05
          ? 'up'
          : 'flat';

  const trendDescription =
    direction === 'down' ? 'improving' : direction === 'up' ? 'worsening' : 'no recent change';

  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={`Handicap ${formatted}, ${trendDescription}. Tap to open profile.`}
      style={{
        padding: '8px 4px',
        margin: '-8px 0',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        flexShrink: 0,
      }}
    >
      <span style={getPillChromeStyle(variant)}>
        <span style={getNumeralStyle(variant)}>{formatted}</span>
        <TrendArrow direction={direction} variant={variant} />
      </span>
    </button>
  );
}

function TrendArrow({ direction, variant }: { direction: 'down' | 'flat' | 'up'; variant: Variant }) {
  const muted = variant === 'glass-dark' ? MUTED_DARK : MUTED_LIGHT;
  const color = direction === 'down' ? GREEN : direction === 'up' ? RED : muted;

  if (direction === 'flat') {
    return (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 12 H19" stroke={color} strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  const path =
    direction === 'down' ? 'M7 10 L12 15 L17 10' : 'M7 14 L12 9 L17 14';

  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={path}
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default HandicapPill;
