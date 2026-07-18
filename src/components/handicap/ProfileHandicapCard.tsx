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
  const { data: achievements } = useUserAchievements(userId);

  const handicap = trend?.current ?? null;

  const delta90 = useMemo<number | null>(() => {
    if (!history90 || history90.length < 2) return null;
    return (
      history90[history90.length - 1].handicap_index - history90[0].handicap_index
    );
  }, [history90]);

  const trophyCount = (achievements ?? []).filter((b: any) => b.is_earned).length;

  if (connLoading || trendLoading) return null;
  if (!connection) return null;
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
            <TrendRow label="90 Days" delta={delta90} caption="over 90 days" />
            <TrendRow
              label="12 Months"
              delta={trend12.delta}
              caption="over 12 months"
              borderTop
            />
          </div>
        </div>

        {/* Trophies info strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            margin: '14px -16px -14px',
            padding: '12px 16px',
            borderTop: '1px solid var(--hcp-line)',
            background: 'var(--hcp-amber-tint, rgba(247,147,30,0.10))',
          }}
        >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 1px 2px rgba(15,23,42,0.06)',
              }}
            >
              <Trophy
                size={18}
                color={trophyCount > 0 ? '#c97a10' : 'var(--hcp-t-60)'}
                strokeWidth={2.2}
              />
            </div>
            {trophyCount > 0 ? (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13.5,
                    color: 'var(--hcp-t-100)',
                    lineHeight: 1.35,
                  }}
                >
                  <span style={{ fontWeight: 800, color: '#c97a10' }}>
                    {trophyCount}
                  </span>
                  <span style={{ fontWeight: 700 }}>
                    {' '}
                    {trophyCount === 1 ? 'trophy' : 'trophies'} in{' '}
                    {isOwnProfile ? 'your' : `${resolvedName}'s`} case
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: 'var(--hcp-t-60)',
                    marginTop: 1,
                  }}
                >
                  Tap anywhere to see{' '}
                  {isOwnProfile ? 'your' : 'their'} full record
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13.5,
                    color: 'var(--hcp-t-100)',
                    lineHeight: 1.35,
                    fontWeight: 700,
                  }}
                >
                  {isOwnProfile
                    ? 'Start your trophy hunt'
                    : `${resolvedName} is on the trophy hunt`}
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: 'var(--hcp-t-60)',
                    marginTop: 1,
                  }}
                >
                  {isOwnProfile
                    ? 'Play rounds and post reviews to earn your first'
                    : 'No trophies earned yet'}
                </div>
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default ProfileHandicapCard;
