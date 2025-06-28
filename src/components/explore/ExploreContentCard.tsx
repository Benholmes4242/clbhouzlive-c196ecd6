
import React from 'react';
import { ExploreContentItem } from './types';
import CTACard from './CTACard';
import MediaCard from './MediaCard';

interface ExploreContentCardProps {
  item: ExploreContentItem;
  onLike: (contentId: string) => void;
  onFollow: (contentId: string) => void;
}

const ExploreContentCard: React.FC<ExploreContentCardProps> = ({ item, onLike, onFollow }) => {
  if (item.type === 'cta') {
    return <CTACard item={item} />;
  }

  return <MediaCard item={item} onLike={onLike} onFollow={onFollow} />;
};

export default ExploreContentCard;
