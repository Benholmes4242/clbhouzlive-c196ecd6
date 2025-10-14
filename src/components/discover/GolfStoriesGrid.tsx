import React from 'react';
import FeaturedVideoCard from './FeaturedVideoCard';
import SquareVideoCard from './SquareVideoCard';
import VerticalVideoCard from './VerticalVideoCard';
import { ExploreContentItem } from '@/components/explore/types';

interface GolfStoriesGridProps {
  content: ExploreContentItem[];
  onMediaClick?: (item: ExploreContentItem) => void;
}

const GolfStoriesGrid: React.FC<GolfStoriesGridProps> = ({ content, onMediaClick }) => {
  if (content.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-4xl mb-4">🎥</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No videos found</h3>
        <p className="text-muted-foreground max-w-md">
          No videos match these filters. Try a different duration or topic.
        </p>
      </div>
    );
  }

  // Pattern repeater for dynamic layouts
  const getRowPattern = (index: number) => {
    const patterns = ['featured', 'trending', 'split'];
    return patterns[index % patterns.length];
  };

  const renderRow = (items: ExploreContentItem[], rowIndex: number) => {
    const pattern = getRowPattern(rowIndex);

    switch (pattern) {
      case 'featured':
        // Row 1: Full-width featured card (2:1)
        return items.length > 0 ? (
          <div key={`row-${rowIndex}`} className="w-full">
            <FeaturedVideoCard item={items[0]} onMediaClick={onMediaClick} />
          </div>
        ) : null;

      case 'trending':
        // Row 2: Three square cards (1:1)
        return items.length > 0 ? (
          <div key={`row-${rowIndex}`} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            {items.slice(0, 3).map((item) => (
              <SquareVideoCard key={item.id} item={item} onMediaClick={onMediaClick} />
            ))}
          </div>
        ) : null;

      case 'split':
        // Row 3: Split layout - vertical (2:3) + horizontal (2:1)
        return items.length >= 2 ? (
          <div key={`row-${rowIndex}`} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <VerticalVideoCard item={items[0]} onMediaClick={onMediaClick} />
            <div className="flex flex-col justify-center">
              <FeaturedVideoCard item={items[1]} onMediaClick={onMediaClick} />
            </div>
          </div>
        ) : items.length === 1 ? (
          <div key={`row-${rowIndex}`} className="w-full mb-4">
            <VerticalVideoCard item={items[0]} onMediaClick={onMediaClick} />
          </div>
        ) : null;

      default:
        return null;
    }
  };

  // Group content into rows based on pattern requirements
  const rows: ExploreContentItem[][] = [];
  let currentIndex = 0;

  let rowIndex = 0;
  while (currentIndex < content.length) {
    const pattern = getRowPattern(rowIndex);
    let itemsNeeded = 1;

    if (pattern === 'featured') itemsNeeded = 1;
    else if (pattern === 'trending') itemsNeeded = 3;
    else if (pattern === 'split') itemsNeeded = 2;

    const rowItems = content.slice(currentIndex, currentIndex + itemsNeeded);
    if (rowItems.length > 0) {
      rows.push(rowItems);
      currentIndex += rowItems.length;
    }
    rowIndex++;
  }

  return (
    <div className="w-full">
      {rows.map((rowItems, idx) => renderRow(rowItems, idx))}
    </div>
  );
};

export default GolfStoriesGrid;
