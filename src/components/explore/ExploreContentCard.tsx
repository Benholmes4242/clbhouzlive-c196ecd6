
import React from 'react';
import { ExploreContentItem } from './types';
import CTACard from './CTACard';
import EnhancedMediaCard from './EnhancedMediaCard';

interface ExploreContentCardProps {
  item: ExploreContentItem;
  onMediaClick: (item: ExploreContentItem) => void;
}


const ExploreContentCard: React.FC<ExploreContentCardProps> = ({ item, onMediaClick }) => {
  if (item.type === 'cta') {
    return (
      <div className="h-full">
        <CTACard item={item} />
      </div>
    );
  }

  return (
    <div className="h-full">
      <EnhancedMediaCard item={item} onMediaClick={onMediaClick} />
    </div>
  );
};

export default ExploreContentCard;
