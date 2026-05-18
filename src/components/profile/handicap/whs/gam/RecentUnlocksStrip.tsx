import React from 'react';
import {
  Trophy, Crown, Flag, Target, MapPin, Hash, Award,
  Flame, Sparkles, Shield, Medal, Star, Activity, Feather,
  TrendingDown, Map, CircleDot, Crosshair, Scissors,
  ArrowUp, Swords, Minus, Gauge,
  type LucideIcon,
} from 'lucide-react';
import { useRecentUnlocks } from '@/hooks/gam/useRecentUnlocks';
import { Skeleton, RetryStub } from '../../gam/_shared/GamAtoms';
import { relativeTime } from '@/lib/gam/visuals';
import type { RecentUnlock } from '@/lib/gam/types';
import { openTrophiesSheet } from '../trophiesSheetEvents';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

const ICON_MAP: Record<string, LucideIcon> = {
  trophy: Trophy,
  crown: Crown,
  flag: Flag,
  target: Target,
  'map-pin': MapPin,
  hash: Hash,
  award: Award,
  flame: Flame,
  sparkles: Sparkles,
  shield: Shield,
  medal: Medal,
  star: Star,
  activity: Activity,
  feather: Feather,
  'trending-down': TrendingDown,
  map: Map,
  'circle-dot': CircleDot,
  crosshair: Crosshair,
  scissors: Scissors,
  'arrow-up': ArrowUp,
  swords: Swords,
  minus: Minus,
  gauge: Gauge,
};

function renderIcon(name: string, size = 26): React.ReactNode {
  if (!name) return null;
  const Icon = ICON_MAP[name.toLowerCase()];
  if (Icon) return <Icon size={size} color="var(--hcp-t-100)" />;
  return <span style={{ fontSize: size, lineHeight: 1 }}>{name}</span>;
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
      marginTop: 24,
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

  const showGradientStripe = unlock.rarity === 'epic' || unlock.rarity === 'legendary';
  const isRare = unlock.rarity === 'rare';

  return (
    <div
      onClick={onTap}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onTouchCancel={() => setPressed(false)}
      style={{
        flex: '0 0 160px',
        position: 'relative',
        scrollSnapAlign: 'start',
        padding: 14,
        borderRadius: 12,
        background: 'var(--hcp-bg-1)',
        border: isRare
          ? '1px solid rgba(247,147,30,0.32)'
          : '1px solid var(--hcp-line)',
        cursor: 'pointer',
        transform: pressed ? 'scale(0.995)' : 'scale(1)',
        transition: 'transform 120ms ease',
        overflow: 'hidden',
        fontFamily: FONT,
      }}
    >
      {showGradientStripe && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: 'linear-gradient(90deg, #F7931E 0%, #FBBC2E 100%)',
          }}
        />
      )}

      <div style={{ marginBottom: 8 }}>{renderIcon(unlock.icon)}</div>

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
        }}
      >
        {relativeTime(unlock.occurred_at)} · {unlock.rarity}
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
      <div style={{ padding: '0 16px', marginTop: 24 }}>
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
              style={{ flex: '0 0 160px', scrollSnapAlign: 'start' }}
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
            onTap={() => openTrophiesSheet()}
          />
        ))}
      </ScrollContainer>
    </>
  );
};

export default RecentUnlocksStrip;
