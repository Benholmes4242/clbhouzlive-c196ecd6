import { ExploreContentItem } from '@/components/explore/types';
import { GridItem, PostPlacementResult, MediaQueues, PlacementConfig } from '@/components/explore/types/PostPlacementTypes';

/**
 * Creates media queues with deduplication tracking
 * Prioritizes posts for portrait slots while ensuring no duplicates
 */
export const createMediaQueuesWithDeduplication = (
  content: ExploreContentItem[],
  isPortraitMedia: (item: ExploreContentItem) => boolean
): MediaQueues => {
  const portraitQueue: ExploreContentItem[] = [];
  const generalQueue: ExploreContentItem[] = [];
  
  // First pass: collect all portrait-suitable content for portrait queue
  content.forEach(item => {
    if (isPortraitMedia(item)) {
      portraitQueue.push(item);
    }
  });
  
  // Second pass: collect all content for general queue (includes portrait items)
  content.forEach(item => {
    generalQueue.push(item);
  });
  
  return { portraitQueue, generalQueue };
};

/**
 * Creates mobile grid layout with post deduplication
 * Ensures each post appears only once across all card types
 */
export const createMobileGridLayoutWithDeduplication = (
  content: ExploreContentItem[],
  config: PlacementConfig
): PostPlacementResult => {
  const { portraitQueue, generalQueue } = createMediaQueuesWithDeduplication(content, config.isPortraitMedia);
  const gridItems: GridItem[] = [];
  const usedPostIds = new Set<string>();
  
  let portraitIndex = 0;
  let generalIndex = 0;
  let sectionIndex = 0;
  let heroCount = 0;
  
  // Helper function to get next unused post from queue
  const getNextUnusedPost = (queue: ExploreContentItem[], startIndex: number): { post: ExploreContentItem | null, newIndex: number } => {
    for (let i = startIndex; i < queue.length; i++) {
      if (!usedPostIds.has(queue[i].id)) {
        return { post: queue[i], newIndex: i + 1 };
      }
    }
    return { post: null, newIndex: startIndex };
  };
  
  while (sectionIndex < config.maxSections) {
    const isHeroSection = (sectionIndex + 1) % 3 === 0;
    
    if (isHeroSection) {
      // Hero section - prioritize for hero card, then fill with squares
      const isHeroOnRight = heroCount % 2 === 0;
      
      // Add hero card - use general queue but mark as used
      const { post: heroPost, newIndex: newGeneralIndex } = getNextUnusedPost(generalQueue, generalIndex);
      if (heroPost) {
        gridItems.push({
          type: 'hero',
          item: heroPost,
          key: `hero-${sectionIndex}-${heroPost.id}`,
          sectionIndex,
          isOnRight: isHeroOnRight
        });
        usedPostIds.add(heroPost.id);
        generalIndex = newGeneralIndex;
        
        // Add 2 stacked squares on opposite side
        for (let i = 0; i < 2; i++) {
          const { post: squarePost, newIndex } = getNextUnusedPost(generalQueue, generalIndex);
          if (squarePost) {
            gridItems.push({
              type: 'square',
              item: squarePost,
              key: `square-hero-${sectionIndex}-${i}-${squarePost.id}`,
              sectionIndex,
              row: i + 1,
              isHeroSection: true,
              heroOnRight: isHeroOnRight
            });
            usedPostIds.add(squarePost.id);
            generalIndex = newIndex;
          }
        }
        
        heroCount++;
      } else {
        // No more posts available, break
        break;
      }
    } else {
      // Standard section - prioritize portrait, then fill squares
      const isPortraitOnRight = sectionIndex % 2 === 0;
      let hasPortrait = false;
      
      // Try to add portrait card first (highest priority)
      const { post: portraitPost, newIndex: newPortraitIndex } = getNextUnusedPost(portraitQueue, portraitIndex);
      if (portraitPost) {
        gridItems.push({
          type: 'portrait',
          item: portraitPost,
          key: `portrait-${sectionIndex}-${portraitPost.id}`,
          sectionIndex,
          isOnRight: isPortraitOnRight
        });
        usedPostIds.add(portraitPost.id);
        portraitIndex = newPortraitIndex;
        hasPortrait = true;
      }
      
      // Add 4 squares (2 rows × 2 cols)
      let squaresAdded = 0;
      for (let row = 1; row <= 2 && squaresAdded < 4; row++) {
        for (let col = 0; col < 2 && squaresAdded < 4; col++) {
          const { post: squarePost, newIndex } = getNextUnusedPost(generalQueue, generalIndex);
          if (squarePost) {
            gridItems.push({
              type: 'square',
              item: squarePost,
              key: `square-${sectionIndex}-${row}-${col}-${squarePost.id}`,
              sectionIndex,
              row,
              col,
              portraitOnRight: isPortraitOnRight
            });
            usedPostIds.add(squarePost.id);
            generalIndex = newIndex;
            squaresAdded++;
          }
        }
      }
      
      // If we couldn't add any content to this section, break
      if (!hasPortrait && squaresAdded === 0) {
        break;
      }
    }
    
    sectionIndex++;
  }
  
  return {
    gridItems,
    usedPostIds,
    totalPostsUsed: usedPostIds.size
  };
};

/**
 * Creates desktop grid layout with post deduplication
 * Ensures each post appears only once across all card types
 */
export const createDesktopGridLayoutWithDeduplication = (
  content: ExploreContentItem[],
  config: PlacementConfig
): PostPlacementResult => {
  const { portraitQueue, generalQueue } = createMediaQueuesWithDeduplication(content, config.isPortraitMedia);
  const gridItems: GridItem[] = [];
  const usedPostIds = new Set<string>();
  
  let portraitIndex = 0;
  let generalIndex = 0;
  let sectionIndex = 0;
  
  // Helper function to get next unused post from queue
  const getNextUnusedPost = (queue: ExploreContentItem[], startIndex: number): { post: ExploreContentItem | null, newIndex: number } => {
    for (let i = startIndex; i < queue.length; i++) {
      if (!usedPostIds.has(queue[i].id)) {
        return { post: queue[i], newIndex: i + 1 };
      }
    }
    return { post: null, newIndex: startIndex };
  };
  
  while (sectionIndex < config.maxSections) {
    const isPortraitOnRight = sectionIndex % 2 === 0;
    let hasContent = false;
    
    // Prioritize portrait card placement
    const { post: portraitPost, newIndex: newPortraitIndex } = getNextUnusedPost(portraitQueue, portraitIndex);
    if (portraitPost) {
      gridItems.push({
        type: 'portrait',
        item: portraitPost,
        key: `portrait-${sectionIndex}-${portraitPost.id}`,
        sectionIndex,
        isOnRight: isPortraitOnRight
      });
      usedPostIds.add(portraitPost.id);
      portraitIndex = newPortraitIndex;
      hasContent = true;
    }
    
    // Add Row 1: 3 squares
    for (let i = 0; i < 3; i++) {
      const { post: squarePost, newIndex } = getNextUnusedPost(generalQueue, generalIndex);
      if (squarePost) {
        gridItems.push({
          type: 'square',
          item: squarePost,
          key: `square-${sectionIndex}-1-${i}-${squarePost.id}`,
          sectionIndex,
          row: 1,
          position: i
        });
        usedPostIds.add(squarePost.id);
        generalIndex = newIndex;
        hasContent = true;
      }
    }
    
    // Add Row 2: 3 squares
    for (let i = 0; i < 3; i++) {
      const { post: squarePost, newIndex } = getNextUnusedPost(generalQueue, generalIndex);
      if (squarePost) {
        gridItems.push({
          type: 'square',
          item: squarePost,
          key: `square-${sectionIndex}-2-${i}-${squarePost.id}`,
          sectionIndex,
          row: 2,
          position: i
        });
        usedPostIds.add(squarePost.id);
        generalIndex = newIndex;
        hasContent = true;
      }
    }
    
    // If no content was added to this section, break
    if (!hasContent) {
      break;
    }
    
    sectionIndex++;
  }
  
  return {
    gridItems,
    usedPostIds,
    totalPostsUsed: usedPostIds.size
  };
};