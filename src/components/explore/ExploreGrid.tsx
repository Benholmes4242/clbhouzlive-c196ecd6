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

const ExploreGrid: React.FC<ExploreGridProps> = ({ content, onLike, onFollow, isLoading }) => {
  const [itemHeights, setItemHeights] = useState<Record<string, string>>({});

  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 2
  };

  // Completely randomized height assignment with strong anti-pattern logic
  useEffect(() => {
    const newHeights: Record<string, string> = {};
    const columnCount = window.innerWidth > 1100 ? 4 : window.innerWidth > 700 ? 3 : 2;
    
    // Track the last several heights per column to prevent patterns
    const columnHistory: Record<number, string[]> = {};
    for (let i = 0; i < columnCount; i++) {
      columnHistory[i] = [];
    }

    content.forEach((item, index) => {
      const columnIndex = index % columnCount;
      let attempts = 0;
      let selectedHeight: string;
      
      do {
        // Get a truly random height
        selectedHeight = heightClasses[Math.floor(Math.random() * heightClasses.length)];
        attempts++;
        
        // If we've tried too many times, just use any height that's not the immediate previous
        if (attempts > 20) {
          const lastHeight = columnHistory[columnIndex][columnHistory[columnIndex].length - 1];
          const availableHeights = heightClasses.filter(h => h !== lastHeight);
          selectedHeight = availableHeights[Math.floor(Math.random() * availableHeights.length)] || heightClasses[0];
          break;
        }
        
      } while (shouldRejectHeight(selectedHeight, columnIndex, columnHistory, columnCount, index));
      
      newHeights[item.id] = selectedHeight;
      
      // Update column history
      columnHistory[columnIndex].push(selectedHeight);
      
      // Keep only last 4 heights per column to prevent long-term patterns
      if (columnHistory[columnIndex].length > 4) {
        columnHistory[columnIndex] = columnHistory[columnIndex].slice(-4);
      }
    });
    
    setItemHeights(newHeights);
  }, [content]);

  // Function to determine if a height should be rejected to prevent patterns
  const shouldRejectHeight = (
    height: string, 
    columnIndex: number, 
    columnHistory: Record<number, string[]>, 
    columnCount: number,
    globalIndex: number
  ): boolean => {
    const currentColumnHistory = columnHistory[columnIndex];
    
    // Reject if it's the same as the last 2 items in this column
    if (currentColumnHistory.length >= 2 && 
        currentColumnHistory.slice(-2).every(h => h === height)) {
      return true;
    }
    
    // Reject if it's the same as the immediate previous item in this column
    if (currentColumnHistory.length >= 1 && 
        currentColumnHistory[currentColumnHistory.length - 1] === height) {
      return true;
    }
    
    // For items that would form a visual row, check adjacent columns
    const rowPosition = Math.floor(globalIndex / columnCount);
    const startOfRow = rowPosition * columnCount;
    
    // If we're not at the start of a row, check what's already been assigned in this row
    if (globalIndex > startOfRow) {
      for (let i = startOfRow; i < globalIndex; i++) {
        const adjacentColumnIndex = i % columnCount;
        const adjacentHeight = columnHistory[adjacentColumnIndex][columnHistory[adjacentColumnIndex].length - 1];
        if (adjacentHeight === height) {
          return true; // Reject to prevent horizontal patterns
        }
      }
    }
    
    return false;
  };

  // Handle window resize to recalculate heights with new randomization
  useEffect(() => {
    const handleResize = () => {
      const newColumnCount = window.innerWidth > 1100 ? 4 : window.innerWidth > 700 ? 3 : 2;
      
      // Force complete re-randomization on resize
      const newHeights: Record<string, string> = {};
      const columnHistory: Record<number, string[]> = {};
      
      for (let i = 0; i < newColumnCount; i++) {
        columnHistory[i] = [];
      }
      
      content.forEach((item, index) => {
        const columnIndex = index % newColumnCount;
        let attempts = 0;
        let selectedHeight: string;
        
        do {
          selectedHeight = heightClasses[Math.floor(Math.random() * heightClasses.length)];
          attempts++;
          
          if (attempts > 20) {
            const lastHeight = columnHistory[columnIndex][columnHistory[columnIndex].length - 1];
            const availableHeights = heightClasses.filter(h => h !== lastHeight);
            selectedHeight = availableHeights[Math.floor(Math.random() * availableHeights.length)] || heightClasses[0];
            break;
          }
          
        } while (shouldRejectHeight(selectedHeight, columnIndex, columnHistory, newColumnCount, index));
        
        newHeights[item.id] = selectedHeight;
        columnHistory[columnIndex].push(selectedHeight);
        
        if (columnHistory[columnIndex].length > 4) {
          columnHistory[columnIndex] = columnHistory[columnIndex].slice(-4);
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
        {content.map((item, index) => {
          // Use truly random height if not yet calculated, but ensure it's different from patterns
          const dynamicHeight = itemHeights[item.id] || (() => {
            // Emergency fallback with some randomness
            const randomIndex = (index * 7 + Date.now()) % heightClasses.length;
            return heightClasses[randomIndex];
          })();
          
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
