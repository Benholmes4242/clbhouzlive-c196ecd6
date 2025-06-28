
import React from 'react';
import { ExploreContentItem } from './types';
import MediaCard from './MediaCard';

interface ExploreContentCardProps {
  item: ExploreContentItem;
  onLike: (contentId: string) => void;
  onFollow: (contentId: string) => void;
  onClick: (item: ExploreContentItem) => void;
}

const ExploreContentCard: React.FC<ExploreContentCardProps> = ({ item, onLike, onFollow, onClick }) => {
  return <MediaCard item={item} onLike={onLike} onFollow={onFollow} onClick={onClick} />;
};

export default ExploreContentCard;
