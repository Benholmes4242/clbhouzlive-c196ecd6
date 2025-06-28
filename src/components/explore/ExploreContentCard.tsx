
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
    return (
      <div className="h-full">
        <CTACard item={item} />
      </div>
    );
  }

  return (
    <div className="h-full">
      <MediaCard item={item} onLike={onLike} onFollow={onFollow} />
    </div>
  );
};

export default ExploreContentCard;
