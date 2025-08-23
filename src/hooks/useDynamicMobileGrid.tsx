import { useMemo } from 'react';
import { useIsMobile } from './use-mobile';

export interface GridItem {
  id: string;
  type: 'image' | 'video' | 'cta';
  src: string;
  title: string;
  likes: number;
  aspectRatio?: number;
  media?: Array<{
    id: string;
    media_type: string;
    media_url: string;
  }>;
  [key: string]: any;
}

export interface GridLayoutItem extends GridItem {
  gridClass: string;
  position: number;
}

// Detect aspect ratio from media URL or provided ratio
const detectAspectRatio = (item: GridItem): 'landscape' | 'portrait' | 'square' => {
  if (item.aspectRatio) {
    if (item.aspectRatio > 1.3) return 'landscape';
    if (item.aspectRatio < 0.8) return 'portrait';
    return 'square';
  }
  
  // Default fallback
  return 'square';
};

// Generate dynamic grid layout following the placement rules
const generateMobileGridLayout = (items: GridItem[]): GridLayoutItem[] => {
  const layout: GridLayoutItem[] = [];
  let squareCount = 0;
  let lastSpecialCardPosition = -8; // Track last special card position
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const aspectRatio = detectAspectRatio(item);
    const positionFromLastSpecial = i - lastSpecialCardPosition;
    
    // Determine if this should be a special card (tall/wide)
    const shouldBeSpecial = positionFromLastSpecial >= 6 && 
                           squareCount >= 6 && 
                           Math.random() < 0.3; // 30% chance for variety
    
    let gridClass = '';
    
    if (shouldBeSpecial && aspectRatio === 'landscape') {
      // Wide card (2x1)
      gridClass = 'col-span-2 row-span-1';
      lastSpecialCardPosition = i;
      squareCount = 0;
    } else if (shouldBeSpecial && aspectRatio === 'portrait') {
      // Tall card (1x2)
      gridClass = 'col-span-1 row-span-2';
      lastSpecialCardPosition = i;
      squareCount = 0;
    } else {
      // Square card (1x1) - default
      gridClass = 'col-span-1 row-span-1';
      squareCount++;
    }
    
    layout.push({
      ...item,
      gridClass,
      position: i
    });
  }
  
  return layout;
};

export const useDynamicMobileGrid = <T extends GridItem>(items: T[]) => {
  const isMobile = useIsMobile();
  
  const mobileLayout = useMemo(() => {
    if (!isMobile || !items.length) return items.map((item, i) => ({ ...item, gridClass: 'col-span-1 row-span-1', position: i }));
    
    return generateMobileGridLayout(items);
  }, [items, isMobile]);
  
  return {
    layout: mobileLayout,
    isMobile,
    gridContainerClass: isMobile 
      ? 'grid grid-cols-3 gap-1 auto-rows-fr' 
      : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
  };
};