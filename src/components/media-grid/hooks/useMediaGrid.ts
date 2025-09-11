import { useState, useCallback, useMemo } from 'react';
import { MediaItem, MediaGridConfig, GridLayoutItem } from '../types';
import { cn } from '@/lib/utils';

export const useMediaGrid = (items: MediaItem[], config: MediaGridConfig) => {
  const [itemLoadingStates, setItemLoadingStates] = useState<{[key: string]: boolean}>({});

  // Generate grid CSS classes based on config
  const gridClasses = useMemo(() => {
    const { columns, spacing } = config;
    
    const spacingClasses = {
      tight: 'gap-px',
      normal: 'gap-4', 
      loose: 'gap-6'
    };

    return cn(
      'grid',
      `grid-cols-${columns.mobile}`,
      `md:grid-cols-${columns.tablet}`,
      `lg:grid-cols-${columns.desktop}`,
      spacingClasses[spacing]
    );
  }, [config]);

  // Simple layout strategy for modal media (uniform grid)
  const createSimpleLayout = useCallback((mediaItems: MediaItem[]): GridLayoutItem[] => {
    return mediaItems.map(item => ({
      key: item.id,
      item,
      className: config.aspectRatio === 'square' ? 'aspect-square' : 'aspect-[4/5]'
    }));
  }, [config.aspectRatio]);

  // Create layout based on config
  const layoutItems = useMemo(() => {
    if (config.layout === 'modal') {
      return createSimpleLayout(items);
    }
    // Future: Add support for discover/profile layouts
    return createSimpleLayout(items);
  }, [items, config.layout, createSimpleLayout]);

  // Loading state handlers
  const handleImageLoad = useCallback((itemId: string) => {
    setItemLoadingStates(prev => ({ ...prev, [itemId]: false }));
  }, []);

  const handleImageError = useCallback((itemId: string) => {
    setItemLoadingStates(prev => ({ ...prev, [itemId]: false }));
  }, []);

  return {
    layoutItems,
    gridClasses,
    itemLoadingStates,
    handleImageLoad,
    handleImageError
  };
};