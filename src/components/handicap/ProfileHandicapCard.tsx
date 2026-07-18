/**
 * ProfileHandicapCard: light-mode handicap summary card for the profile page.
 *
 * Index block mirrors HeroHandicapCardDark (handicap page) re-themed light.
 *
 * WHS-synced users see the full interactive card (index + trends + trophies),
 * which taps through to /handicap (or /handicap/:userId for friends).
 *
 * Manual-handicap users see a simple, non-interactive variant: eyebrow +
 * current index only. They have no WHS round data, so trends and trophies
 * are intentionally omitted.
 *
 * Renders null when the user has no WHS connection and no manual handicap,
 * or when no current handicap can be resolved.
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useWhsConnection,
  useHandicapTrend,
  useHandicapHistory,
} from '@/lib/whs/hooks';
import { useHandicapTrend12mo } from '@/hooks/useHandicapTrend12mo';
import { useUserProfile } from '@/hooks/useUserProfile';
import { resolveDisplayHandicap } from '@/lib/handicap/resolveHandicap';
import TrophyRoomEntryRow from '@/components/profile/handicap/whs/sections/TrophyRoomEntryRow';

import { analyticsEvents } from '@/utils/analyticsEvents';

const FONT = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

interface Props {
  userId: string;
  viewerUserId: string;
  isOwnProfile: boolean;
  displayName?: string | null;
}

interface TrendRowProps {
  label: string;
  delta: number | null;
  caption: string;
  borderTop?: boolean;
}

function TrendRow({ label, delta, caption, borderTop }: TrendRowProps) {
  const improved = delta != null && delta < -0.05;
  const drifted = delta != null && delta > 0.05;
  const color = improved ? '#16A34A' : drifted ? '#DC2626' : 'var(--hcp-t-40)';
  const arrow = improved ? '\u2193 ' : drifted ? '\u2191 ' : '';
  const fmt =
    delta == null
      ? 'N/A'
      : `${delta > 0 ? '+' : delta < 0 ? '-' : ''}${Math.abs(delta).toFixed(1)}`;
  return (
    <div
      style={{
        padding: '10px 0 10px 16px',
        borderTop: borderTop ? '1px solid var(--hcp-line-2)' : 'none',
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--hcp-t-40)',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.01em',
          lineHeight: 1,
        }}
      >
        {arrow}
        {fmt}
      </div>
      <div
        style={{
          fontSize: 10,
          color: 'var(--hcp-t-40)',
          fontWeight: 600,
          marginTop: 4,
        }}
      >
        {caption}
      </div>
    </div>
  );
}

function formatHandicap(handicap: number | null): string {
  if (handicap == null) return 'N/A';
  if (handicap < 0) return `+${Math.abs(handicap).toFixed(1)}`;
  return handicap.toFixed(1);
}

const ProfileHandicapCard: React.FC<Props> = ({
  userId,
  viewerUserId,
  isOwnProfile,
  displayName,
}) => {
  const navigate = useNavigate();
  const { data: connection, isLoading: connLoading } = useWhsConnection(userId);
  const { data: trend, isLoading: trendLoading } = useHandicapTrend(connection?.id);
  const { data: history90 } = useHandicapHistory(connection?.id, 90);
  const trend12 = useHandicapTrend12mo(connection?.id);
  const { data: profileRow } = useUserProfile(userId);

  const resolved = resolveDisplayHandicap({
    egHandicapIndex: trend?.current ?? (profileRow as any)?.eg_handicap_index ?? null,
    manualHandicapIndex: (profileRow as any)?.manual_handicap_index ?? null,
    hasWhsConnection: !!connection,
  });
  const handicap = resolved.value;
  const isManual = resolved.source === 'manual';

  const delta90 = useMemo<number | null>(() => {
    if (!history90 || history90.length < 2) return null;
    return (
      history90[history90.length - 1].handicap_index - history90[0].handicap_index
    );
  }, [history90]);

  // Manual users have no connection/trend data; don't let WHS loading gates
  // suppress their simple card. WHS users still wait for both.
  if (connLoading) return null;
  if (!isManual && trendLoading) return null;
  if (handicap == null) return null;

  const resolvedName = (displayName ?? '').trim().split(/\s+/)[0] || 'this golfer';

  const handleTap = () => {
    if (!isOwnProfile) {
      analyticsEvents.track?.('friend_handicap_page_viewed', {
        viewer_id: viewerUserId,
        friend_id: userId,
        source: 'profile_hero_ring',
      });
      navigate(`/handicap/${userId}`);
    } else {
      navigate('/handicap');
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTap();
    }
  };

  const eyebrow = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.22em',
          color: 'var(--hcp-t-60)',
        }}
      >
        HANDICAP INDEX
      </span>
    </div>
  );

  const currentIndexLabel = (
    <div
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--hcp-t-40)',
        marginBottom: 8,
      }}
    >
      Current Index
    </div>
  );

  const currentIndexValue = (
    <div
      style={{
        fontSize: 56,
        fontWeight: 200,
        color: 'var(--hcp-t-100)',
        lineHeight: 0.9,
        letterSpacing: '-0.03em',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {formatHandicap(handicap)}
    </div>
  );

  // Simple, non-interactive variant for manual-handicap users.
  if (isManual) {
    return (
      <div className="hcp-light" style={{ padding: '8px 16px 16px' }}>
        <div
          style={{
            background: 'var(--hcp-bg-1)',
            border: '1px solid var(--hcp-line)',
            borderRadius: 18,
            overflow: 'hidden',
            padding: '16px 16px 14px',
            fontFamily: FONT,
          }}
        >
          {eyebrow}
          {currentIndexLabel}
          {currentIndexValue}
        </div>
      </div>
    );
  }

  // Full interactive variant for WHS-synced users.
  return (
    <div className="hcp-light" style={{ padding: '8px 16px 16px' }}>
      <div
        role="button"
        tabIndex={0}
        onClick={handleTap}
        onKeyDown={handleKey}
        aria-label={
          isOwnProfile
            ? 'See your full handicap: trends, records, rounds'
            : `See ${resolvedName}'s full handicap: trends, records, rounds`
        }
        style={{
          background: 'var(--hcp-bg-1)',
          border: '1px solid var(--hcp-line)',
          borderRadius: 18,
          overflow: 'hidden',
          padding: '16px 16px 14px',
          fontFamily: FONT,
          cursor: 'pointer',
        }}
      >
        {eyebrow}

        {/* Index grid: CURRENT INDEX | 90d / 12mo */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <div
            style={{
              borderRight: '1px solid var(--hcp-line-2)',
              paddingRight: 16,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            {currentIndexLabel}
            {currentIndexValue}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <TrendRow label="90 Days" delta={delta90} caption="over 90 days" />
            <TrendRow
              label="12 Months"
              delta={trend12.delta}
              caption="over 12 months"
              borderTop
            />
          </div>
        </div>
      </div>

      {/* Trophies entry row (light variant of handicap page shelf preview) */}
      <div style={{ marginTop: 10 }}>
        <TrophyRoomEntryRow
          userId={userId}
          viewMode={isOwnProfile ? 'owner' : 'friend'}
          ownerFirstName={resolvedName}
          variant="light"
        />
      </div>
    </div>
  );
};


export default ProfileHandicapCard;
