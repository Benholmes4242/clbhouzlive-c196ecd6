
import React, { useState, useEffect } from 'react';
import Masonry from 'react-masonry-css';
import { ExploreContentItem } from './types';
import ExploreContentCard from './ExploreContentCard';

interface ExploreGridProps {
  content: ExploreContentItem[];
  onLike: (contentId: string) => void;
  onFollow: (contentId: string) => void;
  isLoading: boolean;
}

// Height classes for randomization
const heightClasses = [
  'h-64',  // Small
  'h-80',  // Medium
  'h-96',  // Large  
  'h-72',  // Medium-small
  'h-88',  // Medium-large
];

// Function to get a random height that's different from the previous one
const getRandomHeight = (excludeHeight?: string): string => {
  const availableHeights = excludeHeight 
    ? heightClasses.filter(h => h !== excludeHeight)
    : heightClasses;
  
  return availableHeights[Math.floor(Math.random() * availableHeights.length)];
};

const ExploreGrid: React.FC<ExploreGridProps> = ({ content, onLike, onFollow, isLoading }) => {
  const [itemHeights, setItemHeights] = useState<Record<string, string>>({});
  const [columnLastHeights, setColumnLastHeights] = useState<Record<number, string>>({});

  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 2
  };

  // Generate heights for content items with anti-uniformity logic
  useEffect(() => {
    const newHeights: Record<string, string> = {};
    const newColumnLastHeights: Record<number, string> = {};
    
    content.forEach((item, index) => {
      const columnCount = window.innerWidth > 1100 ? 4 : window.innerWidth > 700 ? 3 : 2;
      const columnIndex = index % columnCount;
      
      // Get the last height used in this column
      const lastHeightInColumn = newColumnLastHeights[columnIndex];
      
      // Get a random height that's different from the last one in this column
      const randomHeight = getRandomHeight(lastHeightInColumn);
      
      newHeights[item.id] = randomHeight;
      newColumnLastHeights[columnIndex] = randomHeight;
    });
    
    setItemHeights(newHeights);
    setColumnLastHeights(newColumnLastHeights);
  }, [content]);

  // Handle window resize to recalculate heights if needed
  useEffect(() => {
    const handleResize = () => {
      // Trigger height recalculation on significant breakpoint changes
      const newHeights: Record<string, string> = {};
      const newColumnLastHeights: Record<number, string> = {};
      
      content.forEach((item, index) => {
        const columnCount = window.innerWidth > 1100 ? 4 : window.innerWidth > 700 ? 3 : 2;
        const columnIndex = index % columnCount;
        
        const lastHeightInColumn = newColumnLastHeights[columnIndex];
        const randomHeight = getRandomHeight(lastHeightInColumn);
        
        newHeights[item.id] = randomHeight;
        newColumnLastHeights[columnIndex] = randomHeight;
      });
      
      setItemHeights(newHeights);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [content]);

  return (
    <>
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="flex w-auto -ml-2"
        columnClassName="pl-2 bg-clip-padding"
      >
        {content.map((item, index) => {
          const dynamicHeight = itemHeights[item.id] || 'h-80';
          
          return (
            <div key={item.id} className="mb-4">
              <div className={`${dynamicHeight} relative overflow-hidden rounded-lg`}>
                <ExploreContentCard 
                  item={item} 
                  onLike={onLike} 
                  onFollow={onFollow} 
                />
              </div>
            </div>
          );
        })}
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
