/**
 * ProfileContentGrid - Main orchestrator for content grids
 * Determines which grid layout to render based on filter type
 * Shared between Personal and Business profiles
 */

import { LongFormGrid } from './LongFormGrid';
import { ShortsGrid } from './ShortsGrid';
import { ImagesGrid } from './ImagesGrid';
import { GridEmptyState } from './GridEmptyState';
import { useFilteredContent } from './hooks/useFilteredContent';
import { ContentFilter, GridPost, GridEmptyStateConfig } from './types';

interface ProfileContentGridProps {
  posts: GridPost[];
  filter: ContentFilter;
  onPostTap: (post: GridPost, index: number) => void;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  canCreate?: boolean;
  onCreatePost?: () => void;
  emptyStateConfig?: GridEmptyStateConfig;
  profileType: 'personal' | 'business';
  profileName?: string;
  isTaggedTab?: boolean;
  isReady?: (id: string) => boolean;    // NEW: Video ready state checker
  onReady?: (id: string) => void;        // NEW: Video ready callback
}

export function ProfileContentGrid({
  posts,
  filter,
  onPostTap,
  isLoading,
  hasMore,
  onLoadMore,
  canCreate,
  onCreatePost,
  emptyStateConfig,
  profileType,
  profileName,
  isTaggedTab,
  isReady = () => true,
  onReady,
}: ProfileContentGridProps) {
  const filteredPosts = useFilteredContent(posts, filter);
  
  // Show empty state if no posts after filtering
  if (!isLoading && filteredPosts.length === 0) {
    return (
      <GridEmptyState
        filter={filter}
        canCreate={canCreate}
        onCreatePost={onCreatePost}
        config={emptyStateConfig}
        profileType={profileType}
        profileName={profileName}
        isTaggedTab={isTaggedTab}
      />
    );
  }
  
  // For 'all' filter, we don't use this grid - return null and let parent handle
  // This allows business profile to keep using BusinessPostCard for 'all'
  if (filter === 'all') {
    return null;
  }
  
  switch (filter) {
    case 'longform':
      return (
        <LongFormGrid
          posts={filteredPosts}
          onPostTap={onPostTap}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
          isLoading={isLoading}
          isReady={isReady}
          onReady={onReady}
        />
      );
    
    case 'shorts':
      return (
        <ShortsGrid
          posts={filteredPosts}
          onPostTap={onPostTap}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
          isLoading={isLoading}
          isReady={isReady}
          onReady={onReady}
        />
      );
    
    case 'images':
      return (
        <ImagesGrid
          posts={filteredPosts}
          onPostTap={onPostTap}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
          isLoading={isLoading}
        />
      );
    
    default:
      return null;
  }
}

// Re-export types for convenience
export type { ContentFilter, GridPost, GridEmptyStateConfig } from './types';
