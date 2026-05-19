import React from 'react';
import { useRecentUnlocks } from '@/hooks/gam/useRecentUnlocks';
import { Skeleton, RetryStub } from '../../gam/_shared/GamAtoms';
import { relativeTime } from '@/lib/gam/visuals';
import type { RecentUnlock } from '@/lib/gam/types';
import { openGamAchievements } from './events';
import { renderBadgeIcon } from './badgeIcons';
import { RARITY_DARK } from './tokens';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

function renderIcon(name: string, size = 26): React.ReactNode {
  return renderBadgeIcon(name, size, 'var(--hcp-t-100)');
}

interface RecentUnlocksStripProps {
  userId: string;
  readOnly?: boolean;
}

const Eyebrow: React.FC = () => (
  <div
    style={{
      fontFamily: FONT,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--hcp-t-60)',
      padding: '0 16px',
      marginBottom: 10,
      marginTop: 32,
    }}
  >
    <span style={{ color: '#F7931E', marginRight: 6 }}>•</span>
    RECENT UNLOCKS
  </div>
);

const ScrollContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      display: 'flex',
      gap: 10,
      overflowX: 'auto',
      overflowY: 'hidden',
      scrollSnapType: 'x mandatory',
      WebkitOverflowScrolling: 'touch',
      paddingLeft: 16,
      paddingRight: 16,
      paddingBottom: 4,
      msOverflowStyle: 'none',
      scrollbarWidth: 'none',
    }}
    className="gam-no-scrollbar"
  >
    {children}
  </div>
);

const UnlockCard: React.FC<{
  unlock: RecentUnlock;
  onTap: () => void;
}> = ({ unlock, onTap }) => {
  const [pressed, setPressed] = React.useState(false);
  const rarity = RARITY_DARK[unlock.rarity as keyof typeof RARITY_DARK] ?? RARITY_DARK.common;

  return (
    <div
      onClick={onTap}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onTouchCancel={() => setPressed(false)}
      style={{
        flex: '0 0 calc((100vw - 32px - 20px) / 2.2)',
        position: 'relative',
        scrollSnapAlign: 'start',
        padding: 14,
        borderRadius: 12,
        background: rarity.cardBg,
        border: `1px solid ${rarity.cardBorder}`,
        boxShadow: rarity.glow ?? undefined,
        cursor: 'pointer',
        transform: pressed ? 'scale(0.995)' : 'scale(1)',
        transition: 'transform 120ms ease, box-shadow 200ms ease',
        overflow: 'hidden',
        fontFamily: FONT,
      }}
    >
      {rarity.topStripe && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: rarity.topStripe,
          }}
        />
      )}

      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: rarity.iconBg,
          border: `1px solid ${rarity.iconRing}`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 10,
        }}
      >
        {renderIcon(unlock.icon, 22)}
      </div>

      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--hcp-t-100)',
          lineHeight: 1.2,
          marginBottom: 4,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {unlock.title}
      </div>

      <div
        style={{
          fontSize: 12,
          fontWeight: 400,
          color: 'var(--hcp-t-60)',
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: 33,
        }}
      >
        {unlock.description}
      </div>

      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--hcp-t-40)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginTop: 8,
          display: 'flex',
          gap: 6,
          alignItems: 'center',
        }}
      >
        <span>{relativeTime(unlock.occurred_at)}</span>
        <span>·</span>
        <span style={{ color: rarity.labelFg }}>{unlock.rarity}</span>
      </div>
    </div>
  );
};

const RecentUnlocksStrip: React.FC<RecentUnlocksStripProps> = ({
  userId,
  readOnly: _readOnly = false,
}) => {
  const { data, isLoading, isError, refetch } = useRecentUnlocks(userId);

  if (isError) {
    return (
      <div style={{ padding: '0 16px', marginTop: 32 }}>
        <RetryStub
          message="Couldn't load recent unlocks"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <>
        <Eyebrow />
        <ScrollContainer>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{ flex: '0 0 calc((100vw - 32px - 20px) / 2.2)', scrollSnapAlign: 'start' }}
            >
              <Skeleton height={120} width="100%" radius={12} />
            </div>
          ))}
        </ScrollContainer>
      </>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <>
      <Eyebrow />
      <ScrollContainer>
        {data.map((unlock, idx) => (
          <UnlockCard
            key={`${unlock.kind}-${idx}-${unlock.occurred_at}`}
            unlock={unlock}
            onTap={() => openGamAchievements()}
          />
        ))}
      </ScrollContainer>
    </>
  );
};

export default RecentUnlocksStrip;
