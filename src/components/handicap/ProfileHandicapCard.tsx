/**
 * ProfileHandicapCard: light-mode handicap summary card for the profile page.
 *
 * Index block mirrors HeroHandicapCardDark (handicap page) re-themed light.
 * Whole card taps through:
 *   own profile  -> /handicap
 *   friend       -> /handicap/:userId   (fires friend_handicap_page_viewed)
 *
 * Renders null when the user has no WHS connection or no current handicap.
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


  if (connLoading || trendLoading) return null;
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
        {/* Eyebrow */}
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
              {handicap != null
                ? handicap < 0
                  ? `+${Math.abs(handicap).toFixed(1)}`
                  : handicap.toFixed(1)
                : 'N/A'}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <TrendRow label="90 Days" delta={isManual ? null : delta90} caption="over 90 days" />
            <TrendRow
              label="12 Months"
              delta={isManual ? null : trend12.delta}
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
