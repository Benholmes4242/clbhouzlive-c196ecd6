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
  'h-72',  // Medium-small
  'h-80',  // Medium
  'h-88',  // Medium-large
  'h-96',  // Large  
];

// Enhanced function to get a truly random height with better distribution
const getRandomHeight = (excludeHeights: string[] = []): string => {
  const availableHeights = excludeHeights.length > 0 
    ? heightClasses.filter(h => !excludeHeights.includes(h))
    : heightClasses;
  
  // If we've excluded too many, reset and just exclude the first one
  const finalHeights = availableHeights.length === 0 ? heightClasses.slice(1) : availableHeights;
  
  return finalHeights[Math.floor(Math.random() * finalHeights.length)];
};

const ExploreGrid: React.FC<ExploreGridProps> = ({ content, onLike, onFollow, isLoading }) => {
  const [itemHeights, setItemHeights] = useState<Record<string, string>>({});

  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 2
  };

  // Enhanced height generation with better anti-uniformity logic
  useEffect(() => {
    const newHeights: Record<string, string> = {};
    const columnCount = window.innerWidth > 1100 ? 4 : window.innerWidth > 700 ? 3 : 2;
    
    // Track last few heights per column for better variety
    const columnRecentHeights: Record<number, string[]> = {};
    
    // Initialize column tracking
    for (let i = 0; i < columnCount; i++) {
      columnRecentHeights[i] = [];
    }
    
    content.forEach((item, index) => {
      const columnIndex = index % columnCount;
      
      // Get recent heights for this column (last 2-3 items)
      const recentHeightsInColumn = columnRecentHeights[columnIndex].slice(-2);
      
      // Also check adjacent columns for better distribution
      const adjacentColumnHeights: string[] = [];
      for (let col = 0; col < columnCount; col++) {
        if (col !== columnIndex && columnRecentHeights[col].length > 0) {
          adjacentColumnHeights.push(columnRecentHeights[col][columnRecentHeights[col].length - 1]);
        }
      }
      
      // Combine exclusions from same column and adjacent columns
      const excludeHeights = [...recentHeightsInColumn, ...adjacentColumnHeights.slice(0, 1)];
      
      // Get a random height avoiding recent ones
      const randomHeight = getRandomHeight(excludeHeights);
      
      newHeights[item.id] = randomHeight;
      
      // Update column tracking
      columnRecentHeights[columnIndex].push(randomHeight);
      
      // Keep only last 3 heights per column to prevent memory buildup
      if (columnRecentHeights[columnIndex].length > 3) {
        columnRecentHeights[columnIndex] = columnRecentHeights[columnIndex].slice(-3);
      }
    });
    
    setItemHeights(newHeights);
  }, [content]);

  // Handle window resize to recalculate heights
  useEffect(() => {
    const handleResize = () => {
      // Only recalculate if there's a significant change
      const newColumnCount = window.innerWidth > 1100 ? 4 : window.innerWidth > 700 ? 3 : 2;
      
      // Trigger height recalculation with new column distribution
      const newHeights: Record<string, string> = {};
      const columnRecentHeights: Record<number, string[]> = {};
      
      for (let i = 0; i < newColumnCount; i++) {
        columnRecentHeights[i] = [];
      }
      
      content.forEach((item, index) => {
        const columnIndex = index % newColumnCount;
        const recentHeightsInColumn = columnRecentHeights[columnIndex].slice(-2);
        const randomHeight = getRandomHeight(recentHeightsInColumn);
        
        newHeights[item.id] = randomHeight;
        columnRecentHeights[columnIndex].push(randomHeight);
        
        if (columnRecentHeights[columnIndex].length > 3) {
          columnRecentHeights[columnIndex] = columnRecentHeights[columnIndex].slice(-3);
        }
      });
      
      setItemHeights(newHeights);
    };

    const debouncedResize = debounce(handleResize, 300);
    window.addEventListener('resize', debouncedResize);
    return () => window.removeEventListener('resize', debouncedResize);
  }, [content]);

  return (
    <>
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="flex w-auto -ml-2"
        columnClassName="pl-2 bg-clip-padding"
      >
        {content.map((item) => {
          // Use a more varied default if height isn't set yet
          const dynamicHeight = itemHeights[item.id] || heightClasses[Math.floor(Math.random() * heightClasses.length)];
          
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

// Simple debounce utility
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export default ExploreGrid;
