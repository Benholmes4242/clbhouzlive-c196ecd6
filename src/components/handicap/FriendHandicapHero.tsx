/**
 * FriendHandicapHero — Inline Hero Ring entry point on a friend's profile.
 *
 * Renders nothing when:
 *  - the connection or trend is loading
 *  - the friend has no WHS connection
 *  - the friend has no current handicap value
 *
 * The whole section is tappable and navigates to /handicap/:userId.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWhsConnection, useHandicapTrend } from '@/lib/whs/hooks';
import HeroHandicapCard from '@/components/profile/handicap/whs/sections/HeroHandicapCard';
import { analyticsEvents } from '@/utils/analyticsEvents';

const INK_55 = '#64748B';
const AMBER = '#F7931E';
const FONT_GEIST =
  'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

interface Props {
  userId: string;
  viewerUserId: string;
}

const FriendHandicapHero: React.FC<Props> = ({ userId, viewerUserId }) => {
  const navigate = useNavigate();
  const { data: connection, isLoading: connLoading } = useWhsConnection(userId);
  const { data: trend, isLoading: trendLoading } = useHandicapTrend(connection?.id);

  if (connLoading || trendLoading) return null;
  if (!connection) return null;
  if (trend?.current === null || trend?.current === undefined) return null;

  const handleTap = () => {
    analyticsEvents.track?.('friend_handicap_page_viewed', {
      viewer_id: viewerUserId,
      friend_id: userId,
      source: 'profile_hero_ring',
    });
    navigate(`/handicap/${userId}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTap();
    }
  };

  return (
    <section
      role="button"
      tabIndex={0}
      onClick={handleTap}
      onKeyDown={handleKeyDown}
      aria-label="View full handicap"
      style={{
        padding: '20px 16px 24px',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 4px',
          marginBottom: 4,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: AMBER,
          }}
        />
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: INK_55,
            letterSpacing: '0.22em',
            fontFamily: FONT_GEIST,
          }}
        >
          HANDICAP INDEX
        </span>
      </div>

      {/* HeroHandicapCard does not yet accept readOnly. The range chip is
          harmless on a friend page; revisit if a true readOnly variant is
          built. TODO(handicap): plumb readOnly into HeroHandicapCard. */}
      <HeroHandicapCard connection={connection} />
    </section>
  );
};

export default FriendHandicapHero;
