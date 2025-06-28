
import React from 'react';
import Masonry from 'react-masonry-css';
import { ExploreContentItem } from './types';
import ExploreContentCard from './ExploreContentCard';

interface ExploreGridProps {
  content: ExploreContentItem[];
  onLike: (contentId: string) => void;
  onFollow: (contentId: string) => void;
  isLoading: boolean;
}

const ExploreGrid: React.FC<ExploreGridProps> = ({ content, onLike, onFollow, isLoading }) => {
  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 2
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (content.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📸</div>
        <h3 className="text-lg font-semibold mb-2">No content yet</h3>
        <p className="text-muted-foreground">Be the first to share something amazing!</p>
      </div>
    );
  }

  return (
    <>
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="flex w-auto -ml-2"
        columnClassName="pl-2 bg-clip-padding"
      >
        {content.map((item) => (
          <div key={item.id} className="mb-4">
            {/* Fixed square container for all thumbnails */}
            <div className="w-full aspect-square relative overflow-hidden rounded-lg">
              <ExploreContentCard 
                item={item} 
                onLike={onLike} 
                onFollow={onFollow} 
              />
            </div>
          </div>
        ))}
      </Masonry>
    </>
  );
};

export default ExploreGrid;
