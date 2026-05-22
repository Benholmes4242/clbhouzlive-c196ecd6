import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { FriendRivalryHydrated } from '@/lib/whs/types';
import type { RivalryDimension } from '@/lib/whs/utils/useRivalryDimension';
import type { RivalryTier } from '@/lib/whs/utils/rivalryTiering';
import { rivalKey } from '@/lib/whs/utils/rivalryTiering';
import RivalryHeroCard from './RivalryHeroCard';
import RivalryCompactCard from './RivalryCompactCard';

interface Props {
  rivalry: FriendRivalryHydrated;
  tier: RivalryTier;
  rank: number;
  total: number;
  variant: 'hero' | 'compact';
  /** Optional 180px portrait variant when the hero card is in a mixed-tier rail. */
  portraitVariant?: 'hero' | 'mixed';
  dimension?: RivalryDimension;
  friendViewOwnerId?: string;
  /** Legacy/unused props preserved for compatibility with section callers. */
  userName?: string | null;
  userThumbnailUrl?: string | null;
  userHandicap?: number | null;
  selfLabel?: string | null;
}

export const RivalryCard: React.FC<Props> = (props) => {
  const navigate = useNavigate();
  const handleNavigate = () => {
    const key = rivalKey(props.rivalry);
    if (!key) return;
    if (props.friendViewOwnerId) {
      navigate(`/handicap/${props.friendViewOwnerId}/rivalry/${key}`);
    } else {
      navigate(`/handicap/rivalry/${key}`);
    }
  };

  switch (props.variant) {
    case 'hero':
      return (
        <RivalryHeroCard
          rivalry={props.rivalry}
          tier={props.tier}
          rank={props.rank}
          total={props.total}
          portraitVariant={props.portraitVariant}
          dimension={props.dimension}
          onTap={handleNavigate}
        />
      );
    case 'compact':
      return (
        <RivalryCompactCard
          rivalry={props.rivalry}
          tier={props.tier}
          onTap={handleNavigate}
        />
      );
  }
};

export default RivalryCard;
