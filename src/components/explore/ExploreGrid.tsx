
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

  return (
    <>
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="flex w-auto -ml-2"
        columnClassName="pl-2 bg-clip-padding"
      >
        {content.map((item) => (
          <div key={item.id} className="mb-4">
            <ExploreContentCard 
              item={item} 
              onLike={onLike} 
              onFollow={onFollow} 
            />
          </div>
        ))}
      </Masonry>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2a2626] border-t-transparent"></div>
        </div>
      )}
    </>
  );
};

export default ExploreGrid;
