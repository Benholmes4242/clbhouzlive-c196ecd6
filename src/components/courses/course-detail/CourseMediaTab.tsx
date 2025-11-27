import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import FullscreenMediaModal from '@/components/ui/fullscreen-media-modal';
import DiscoverVerticalFeed from '@/components/discover/DiscoverVerticalFeed';
import { useVerticalMediaFeed } from '@/hooks/useVerticalMediaFeed';
import { adaptClubMediaArrayToExploreItems, ExploreContentItem } from '@/lib/adapters/clubMediaToExplore';
import { Image as ImageIcon } from 'lucide-react';
// MediaGrid imports
import { MediaGrid, GRID_PRESETS, adaptExploreContentToMediaItems } from '@/components/media-grid';
import type { ExtendedMediaItem as NewMediaItem } from '@/components/media-grid';
import { getStreamIdFromUrl, getStreamPoster } from '@/utils/stream';
import { MediaItem as StandardMediaItem } from '@/types/media';
import { FLAGS } from '@/config/flags';
// New components for media tab polish
import { CourseMediaSummaryCard } from './CourseMediaSummaryCard';
import { MediaFilterRow, MediaFilterMode } from './MediaFilterRow';
import { FriendsAvatarRow } from './FriendsAvatarRow';
import { useCourseMediaSummary } from '@/hooks/useCourseMediaSummary';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserFriends } from '@/hooks/useUserFriends';
import { Button } from '@/components/ui/button';

interface CourseMediaTabProps {
  courseId: string;
  portalTarget?: HTMLElement | null;
}

import { MediaItem } from '@/types/media';

interface LocalMediaItem {
  id: string;
  source: 'post' | 'review';
  sourceId: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  createdAt: string;
  author: {
    id: string;
    displayName: string;
    username?: string;
    avatarUrl?: string;
  };
}

const CourseMediaTab = ({ courseId, portalTarget }: CourseMediaTabProps) => {
  const { user } = useSupabaseSession();
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null);
  const [modalPortalTarget, setModalPortalTarget] = useState<HTMLElement | null>(null);
  const [filterMode, setFilterMode] = useState<MediaFilterMode>('most_recent');
  const [focusedFriendId, setFocusedFriendId] = useState<string | null>(null);

  // Get user's friends
  const { data: friendsData } = useUserFriends(user?.id);
  const friendIds = useMemo(() => friendsData?.map(f => f.id) || [], [friendsData]);

  // Vertical feed for consistent UX
  const { 
    isOpen: isFeedOpen, 
    posts: feedPosts,
    initialItem, 
    openFeed, 
    closeFeed,
    setPosts
  } = useVerticalMediaFeed();

  // Get portal target for fullscreen modal
  useEffect(() => {
    const target = document.getElementById('modal-portal');
    setModalPortalTarget(target);
  }, []);

  const { data: mediaResp, isLoading } = useQuery({
    queryKey: ['course-media', courseId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-club-media', {
        body: { clubId: courseId, limit: 30 }
      });

      if (error) throw error;
      return data?.edges ?? [];
    },
    enabled: !!courseId,
    staleTime: 10 * 60 * 1000, // Phase 3: 10 minutes for better caching
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  // Use memo so remounts don't flash empty
  const exploreItems = useMemo(
    () => adaptClubMediaArrayToExploreItems(mediaResp ?? []),
    [mediaResp]
  );

  // Calculate summary stats
  const mediaSummaryItems = useMemo(() => {
    return exploreItems.map(item => ({
      id: item.id,
      type: item.type as 'image' | 'video',
      createdAt: new Date().toISOString(), // Placeholder - ideally from API
      author: {
        id: item.user?.id || '',
      },
    }));
  }, [exploreItems]);

  const mediaSummary = useCourseMediaSummary(mediaSummaryItems, user?.id || null);

  // Calculate friends with media for avatar row
  const friendsWithMedia = useMemo(() => {
    const friendMediaMap = new Map<string, { id: string; name: string; avatarUrl?: string | null; count: number }>();

    exploreItems.forEach(item => {
      if (item.user && friendIds.includes(item.user.id)) {
        const existing = friendMediaMap.get(item.user.id);
        if (existing) {
          existing.count++;
        } else {
          friendMediaMap.set(item.user.id, {
            id: item.user.id,
            name: item.user.name,
            avatarUrl: item.user.avatar,
            count: 1,
          });
        }
      }
    });

    return Array.from(friendMediaMap.values()).map(f => ({
      id: f.id,
      name: f.name,
      avatarUrl: f.avatarUrl,
      mediaCount: f.count,
    }));
  }, [exploreItems, friendIds]);

  // Calculate dynamic subtitle based on filter mode
  const subtitle = useMemo(() => {
    if (filterMode === 'friends') {
      const count = friendsWithMedia.length;

      if (count === 0) {
        return 'No media from your friends here yet.';
      } else if (focusedFriendId) {
        const friendName = friendsWithMedia.find(f => f.id === focusedFriendId)?.name || 'Friend';
        const firstName = friendName.split(' ')[0];
        return `Showing media from ${firstName}.`;
      } else {
        return `Showing media from your friends (${count}).`;
      }
    }
    return undefined; // Use default subtitle from summary card
  }, [filterMode, friendsWithMedia, focusedFriendId]);

  // Filter media items based on active filter mode and focused friend
  const filteredExploreItems = useMemo(() => {
    let filtered = exploreItems;

    switch (filterMode) {
      case 'videos':
        filtered = exploreItems.filter(item => item.type === 'video');
        break;
      case 'photos':
        filtered = exploreItems.filter(item => item.type === 'image');
        break;
      case 'friends':
        // Filter by friends
        filtered = exploreItems.filter(item => item.user && friendIds.includes(item.user.id));
        
        // Then narrow by focused friend if set
        if (focusedFriendId) {
          filtered = filtered.filter(item => item.user?.id === focusedFriendId);
        }
        break;
      case 'mine':
        filtered = exploreItems.filter(item => item.user?.id === user?.id);
        break;
      case 'most_recent':
      default:
        filtered = exploreItems;
        break;
    }

    return filtered;
  }, [exploreItems, filterMode, friendIds, focusedFriendId, user?.id]);

  // Adapt for new MediaGrid using filtered items
  const mediaItems = useMemo(
    () => adaptExploreContentToMediaItems(filteredExploreItems),
    [filteredExploreItems]
  );

  // Handle filter mode change - clear focused friend when switching away from friends
  const handleFilterChange = (mode: MediaFilterMode) => {
    setFilterMode(mode);
    if (mode !== 'friends') {
      setFocusedFriendId(null);
    }
  };

  // Handle friend avatar click - toggle focused friend
  const handleFriendClick = (friendId: string) => {
    if (focusedFriendId === friendId) {
      // Second tap: clear focused friend
      setFocusedFriendId(null);
    } else {
      // First tap: focus this friend
      setFocusedFriendId(friendId);
    }
  };

  const handleMediaClick = (item: NewMediaItem) => {
    if (FLAGS.USE_VERTICAL_FEED_FOR_PROFILE_MEDIA) {
      const index = filteredExploreItems.findIndex(media => media.id === item.id);
      if (index !== -1) {
        setPosts(filteredExploreItems);
        openFeed(filteredExploreItems[index]);
      }
    } else {
      const index = filteredExploreItems.findIndex(media => media.id === item.id);
      setSelectedMediaIndex(index);
    }
  };

  const handleLike = (contentId: string) => {
    // Handle like functionality for vertical feed
  };

  const handleLoadMore = () => {
    // Handle load more for vertical feed if needed
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  // Empty state - no media at all
  if (exploreItems.length === 0) {
    return (
      <div className="space-y-6">
        <CourseMediaSummaryCard
          photoCount={0}
          videoCount={0}
          userMediaCount={0}
          lastMediaCreatedAt={null}
          subtitle={subtitle}
        />

        <div className="rounded-xl bg-white shadow-sm px-6 py-14 text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <ImageIcon className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            No photos or videos yet
          </h3>
          <p className="text-sm text-slate-600 max-w-sm mb-6">
            Help other golfers discover this course — add your first moment.
          </p>
          <button
            className="px-6 py-3 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 active:scale-95 transition"
            onClick={() => {
              // TODO: Open create moment flow
              console.log('Open capture moment flow');
            }}
          >
            Capture a moment
          </button>
        </div>
      </div>
    );
  }

  // Filtered state - no results for current filter
  if (filteredExploreItems.length === 0 && exploreItems.length > 0) {
    return (
      <div className="space-y-6">
        <CourseMediaSummaryCard
          photoCount={mediaSummary.photoCount}
          videoCount={mediaSummary.videoCount}
          userMediaCount={mediaSummary.userMediaCount}
          lastMediaCreatedAt={mediaSummary.lastMediaCreatedAt}
          onUserMediaClick={() => setFilterMode('mine')}
          subtitle={subtitle}
        />

        <MediaFilterRow
          filterMode={filterMode}
          onFilterChange={handleFilterChange}
          hasFriends={friendsWithMedia.length > 0}
          hasUserMedia={mediaSummary.userMediaCount > 0}
        />
        
        <div className="rounded-xl bg-white shadow-sm px-6 py-14 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            No results for this filter
          </h3>
          <p className="text-sm text-slate-600">
            Try changing the filter to see more media.
          </p>
        </div>
      </div>
    );
  }

  // User-only media message
  const showOnlyYourMediaMessage = 
    filterMode === 'most_recent' && 
    mediaSummary.userMediaCount > 0 && 
    mediaSummary.userMediaCount === exploreItems.length;


  const renderFullscreenModal = () => {
    if (selectedMediaIndex === null || !filteredExploreItems[selectedMediaIndex]) return null;

    // Transform filteredExploreItems to StandardMediaItem[] with proper poster URLs
    const standardizedMediaItems: StandardMediaItem[] = filteredExploreItems.map(item => {
      if (item.type === 'video') {
        const streamId = getStreamIdFromUrl(item.src);
        return {
          id: item.id,
          type: 'video' as const,
          url: item.src,
          streamId,
          posterUrl: getStreamPoster(item.src, '1s') ?? undefined,
          alt: item.title || 'Video'
        };
      }
      return {
        id: item.id,
        type: 'image' as const,
        url: item.src,
        alt: item.title || 'Photo'
      };
    });

    const currentItem = filteredExploreItems[selectedMediaIndex];
    const mediaUrls = standardizedMediaItems.map(item => item.url);
    const mediaTypes = standardizedMediaItems.map(item => item.type);

    const modalContent = (
      <FullscreenMediaModal
        isOpen={true}
        onClose={() => setSelectedMediaIndex(null)}
        mediaUrl={mediaUrls}
        mediaType={mediaTypes}
        initialIndex={selectedMediaIndex}
        user={currentItem.user ? {
          id: currentItem.user.id,
          profile_photo_url: currentItem.user.avatar
        } : undefined}
        displayName={currentItem.user?.name}
      />
    );

    // Use modal portal target for proper z-index stacking
    return modalPortalTarget ? createPortal(modalContent, modalPortalTarget) : modalContent;
  };

  return (
    <div className="space-y-0">
      {/* Summary Card */}
      <CourseMediaSummaryCard
        photoCount={mediaSummary.photoCount}
        videoCount={mediaSummary.videoCount}
        userMediaCount={mediaSummary.userMediaCount}
        lastMediaCreatedAt={mediaSummary.lastMediaCreatedAt}
        onUserMediaClick={() => setFilterMode('mine')}
        subtitle={subtitle}
      />

      {/* Filter Row */}
      <MediaFilterRow
        filterMode={filterMode}
        onFilterChange={handleFilterChange}
        hasFriends={friendsWithMedia.length > 0}
        hasUserMedia={mediaSummary.userMediaCount > 0}
      />

      {/* Friends Avatar Row - shown when "From friends" is active and friends have media */}
      {filterMode === 'friends' && friendsWithMedia.length > 0 && (
        <FriendsAvatarRow
          friends={friendsWithMedia}
          focusedFriendId={focusedFriendId}
          onFriendClick={handleFriendClick}
        />
      )}

      {/* Only your media message */}
      {showOnlyYourMediaMessage && (
        <div className="px-4 py-3 bg-blue-50 border-t border-b border-blue-100">
          <p className="text-xs text-blue-700">
            Only your media here so far — invite friends to share theirs.
          </p>
        </div>
      )}

      {/* Square Squircle Media Grid - 2 columns mobile, 4 desktop */}
      <div className="py-6 grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-slate-50">
        {mediaItems.map((item) => {
          const isVideo = item.type === 'video';
          const imageSrc = isVideo ? (item.posterUrl || item.url) : item.url;
          
          // Format duration for display
          const formatDuration = (seconds?: number) => {
            if (!seconds || Number.isNaN(seconds)) return '0:00';
            const m = Math.floor(seconds / 60);
            const s = Math.floor(seconds % 60);
            return `${m}:${s.toString().padStart(2, '0')}`;
          };

          return (
            <button
              key={item.id}
              onClick={() => handleMediaClick(item)}
              className="relative aspect-square rounded-[var(--squircle-radius)] overflow-hidden bg-slate-200 border border-slate-300/40 shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-150"
            >
              {/* Thumbnail image */}
              <img
                src={imageSrc}
                alt={item.alt || 'Media'}
                className="w-full h-full object-cover"
              />

              {/* Video overlays: gradient + duration */}
              {isVideo && (
                <>
                  {/* Bottom gradient for readability */}
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

                  {/* Duration pill */}
                  <div className="absolute bottom-2 right-2">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/70 backdrop-blur-sm">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M3 2v12l10-6L3 2z" />
                      </svg>
                      <span className="text-[10px] font-medium text-white">
                        {formatDuration(item.duration)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Conditional Modal/Feed based on feature flag */}
      {FLAGS.USE_VERTICAL_FEED_FOR_PROFILE_MEDIA ? (
        initialItem && (
          <DiscoverVerticalFeed
            isOpen={isFeedOpen}
            onClose={closeFeed}
            posts={feedPosts}
            onLike={handleLike}
            onLoadMore={handleLoadMore}
            hasMore={false}
            isLoadingMore={false}
            initialItem={initialItem}
          />
        )
      ) : (
        renderFullscreenModal()
      )}
    </div>
  );
};

export default CourseMediaTab;