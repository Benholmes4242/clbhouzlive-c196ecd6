/**
 * MorningMoment — Phase 3 of Handicap promotion
 *
 * A daily-return content zone that sits above the existing handicap sections
 * on the dedicated /handicap page. Greets the user by first name, surfaces a
 * time-of-day salutation, and shows their current handicap + 30-day delta
 * as the headline number.
 *
 * Strategic intent: become the user's first morning open by giving them a
 * personal, glanceable summary before they reach for England Golf.
 *
 * Design: Dispatch editorial — white surface, hairline divider, slate ink,
 * tabular-nums for the handicap number. No card chrome, no shadows.
 */

import React, { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useHandicapTrend, useWhsConnection } from '@/lib/whs/hooks';
import { analyticsEvents } from '@/utils/analyticsEvents';

const INK = '#0F172A';
const MUTED = '#64748B';
const BORDER = 'rgba(15,23,42,0.07)';
const POSITIVE = '#16A34A'; // handicap going DOWN is good
const NEGATIVE = '#DC2626';

interface Props {
  userId: string;
  connectionId?: string | undefined;
}

function getGreeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatHandicap(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return v.toFixed(1);
}

function formatDelta(d: number | null | undefined): {
  label: string;
  color: string;
} | null {
  if (d === null || d === undefined || Number.isNaN(d)) return null;
  if (d === 0) return { label: 'No change in 30 days', color: MUTED };
  // In handicap: lower is better. Negative delta = improvement.
  const isImprovement = d < 0;
  const abs = Math.abs(d).toFixed(1);
  const arrow = isImprovement ? '▼' : '▲';
  return {
    label: `${arrow} ${abs} in 30 days`,
    color: isImprovement ? POSITIVE : NEGATIVE,
  };
}

const MorningMoment: React.FC<Props> = ({ userId, connectionId: connectionIdProp }) => {
  const { data: connection } = useWhsConnection(connectionIdProp ? undefined : userId);
  const connectionId = connectionIdProp ?? connection?.id;

  const { data: profile } = useQuery<{
    first_name: string | null;
    full_name: string | null;
    username: string | null;
  } | null>({
    queryKey: ['handicap-greeting-profile', userId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('first_name, full_name, username')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
    staleTime: 5 * 60_000,
  });

  const { data: trend } = useHandicapTrend(connectionId);

  const greeting = useMemo(() => getGreeting(), []);
  const firstName = useMemo(() => {
    const fn = profile?.first_name?.trim();
    if (fn) return fn;
    const full = profile?.full_name?.trim();
    if (full) return full.split(/\s+/)[0];
    return profile?.username?.trim() || 'there';
  }, [profile]);

  const handicap = trend?.current ?? null;
  const deltaInfo = formatDelta(trend?.delta);

  useEffect(() => {
    analyticsEvents.track?.('morning_moment_viewed', {
      hasHandicap: handicap !== null,
      hasDelta: deltaInfo !== null,
    });
    // Only fire once per mount with stable values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <section
      aria-label="Morning moment"
      className="px-5 pt-6 pb-6"
      style={{
        background: '#FFFFFF',
        borderBottom: `1px solid ${BORDER}`,
      }}
    >
      {/* Eyebrow greeting */}
      <p
        className="text-[11px] font-semibold uppercase mb-2"
        style={{ color: MUTED, letterSpacing: '0.08em' }}
      >
        {greeting}
      </p>

      {/* Name */}
      <h2
        className="text-[22px] font-bold mb-5"
        style={{ color: INK, letterSpacing: '-0.02em', lineHeight: 1.15 }}
      >
        {firstName}
      </h2>

      {/* Handicap headline */}
      <div className="flex items-baseline gap-3">
        <span
          className="text-[56px] font-bold leading-none"
          style={{
            color: INK,
            letterSpacing: '-0.03em',
            fontVariantNumeric: 'tabular-nums',
            fontFeatureSettings: '"kern" 1, "liga" 1, "tnum" 1',
          }}
        >
          {formatHandicap(handicap)}
        </span>
        <span
          className="text-[12px] font-semibold uppercase"
          style={{ color: MUTED, letterSpacing: '0.08em' }}
        >
          Handicap Index
        </span>
      </div>

      {/* Delta sub-line */}
      {deltaInfo && (
        <p
          className="text-[13px] font-semibold mt-2"
          style={{
            color: deltaInfo.color,
            fontVariantNumeric: 'tabular-nums',
            fontFeatureSettings: '"kern" 1, "liga" 1, "tnum" 1',
          }}
        >
          {deltaInfo.label}
        </p>
      )}
      {!deltaInfo && handicap !== null && (
        <p
          className="text-[13px] mt-2"
          style={{ color: MUTED }}
        >
          Post a round to start tracking your trend.
        </p>
      )}
    </section>
  );
};

export default MorningMoment;
