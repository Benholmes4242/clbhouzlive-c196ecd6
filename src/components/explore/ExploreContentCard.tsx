
import React from 'react';
import { ExploreContentItem } from './types';
import CTACard from './CTACard';
import MediaCard from './MediaCard';

interface ExploreContentCardProps {
  item: ExploreContentItem;
  onLike: (contentId: string) => void;
  onFollow: (contentId: string) => void;
  onMediaClick?: (item: ExploreContentItem) => void;
  isFeatured?: boolean;
  isPortrait?: boolean;
  autoplayManager?: {
    registerVideo: (videoId: string, element: HTMLElement, index: number) => void;
    unregisterVideo: (videoId: string) => void;
    shouldVideoAutoplay: (index: number) => boolean;
    isVideoAutoplaying: (videoId: string) => boolean;
  };
  videoIndex?: number;
  isAboveTheFold?: boolean;
}


const ExploreContentCard: React.FC<ExploreContentCardProps> = ({ item, onLike, onFollow, onMediaClick, isFeatured, isPortrait, autoplayManager, videoIndex, isAboveTheFold = false }) => {
  if (item.type === 'cta') {
    return (
      <div className="h-full">
        <CTACard item={item} />
      </div>
    );
  }

  return (
    <div className="h-full">
      <MediaCard 
        item={item} 
        onLike={onLike} 
        onFollow={onFollow} 
        onMediaClick={onMediaClick} 
        isFeatured={isFeatured}
        isPortrait={isPortrait}
        autoplayManager={autoplayManager}
        videoIndex={videoIndex}
        stage="grid"
        isAboveTheFold={isAboveTheFold}
      />
    </div>
  );
};

export default ExploreContentCard;
