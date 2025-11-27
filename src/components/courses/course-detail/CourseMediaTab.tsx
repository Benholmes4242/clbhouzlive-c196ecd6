import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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
import { FilterPillsRow, FilterOption } from '@/components/ui/FilterPillsRow';
import type { MediaFilterMode } from './MediaFilterRow';
import { useCourseMediaSummary } from '@/hooks/useCourseMediaSummary';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface CourseMediaTabProps {
  courseId: string;
  courseName?: string;
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

const CourseMediaTab = ({ courseId, courseName, portalTarget }: CourseMediaTabProps) => {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null);
  const [modalPortalTarget, setModalPortalTarget] = useState<HTMLElement | null>(null);
  const [filterMode, setFilterMode] = useState<MediaFilterMode>('most_recent');

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

  const summary = useCourseMediaSummary(mediaSummaryItems, user?.id || null);

  // Extract contributor info
  const contributorIds = Array.from(new Set(exploreItems.map(item => item.user?.id).filter(Boolean))) as string[];
  const contributorsCount = contributorIds.length;
  const contributors = contributorIds.slice(0, 3).map(id => {
    const item = exploreItems.find(i => i.user?.id === id);
    return item?.user ? {
      id: item.user.id,
      name: item.user.name || 'Unknown',
      avatarUrl: item.user.avatar || null
    } : null;
  }).filter(Boolean) as Array<{ id: string; name: string; avatarUrl: string | null }>;

  // Filter pill options
  const filterOptions: FilterOption[] = [
    { id: 'most_recent', label: 'Most recent' },
    { id: 'photos', label: 'Photos' },
    { id: 'videos', label: 'Videos' },
    { id: 'mine', label: 'From you' },
  ];

  // Filter media items based on active filter mode
  const filteredItems = useMemo(() => {
    let filtered = exploreItems;

    switch (filterMode) {
      case 'videos':
        filtered = exploreItems.filter(item => item.type === 'video');
        break;
      case 'photos':
        filtered = exploreItems.filter(item => item.type === 'image');
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
  }, [exploreItems, filterMode, user?.id]);

  // Adapt for new MediaGrid using filtered items
  const mediaItems = useMemo(
    () => adaptExploreContentToMediaItems(filteredItems),
    [filteredItems]
  );

  const handleMediaClick = (item: NewMediaItem) => {
    if (FLAGS.USE_VERTICAL_FEED_FOR_PROFILE_MEDIA) {
      const index = filteredItems.findIndex(media => media.id === item.id);
      if (index !== -1) {
        setPosts(filteredItems);
        openFeed(filteredItems[index]);
      }
    } else {
      const index = filteredItems.findIndex(media => media.id === item.id);
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

  // Empty state and filtered state are handled inline in the main render


  const renderFullscreenModal = () => {
    if (selectedMediaIndex === null || !filteredItems[selectedMediaIndex]) return null;

    // Transform filteredItems to StandardMediaItem[] with proper poster URLs
    const standardizedMediaItems: StandardMediaItem[] = filteredItems.map(item => {
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

    const currentItem = filteredItems[selectedMediaIndex];
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
        photoCount={summary.photoCount}
        videoCount={summary.videoCount}
        contributorsCount={contributorsCount}
        contributors={contributors}
        courseName={courseName}
        onAddMedia={() => navigate(`/courses/${courseId}/rate`)}
      />

      {/* Sort/Filter Bar */}
      <FilterPillsRow
        options={filterOptions}
        activeId={filterMode}
        onChange={(id) => setFilterMode(id as MediaFilterMode)}
      />

      {/* Empty state - matches Reviews tab styling */}
      {filteredItems.length === 0 && !isLoading && (
        <div className="px-4 py-8 bg-slate-100">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center">
            <p className="text-sm font-semibold text-slate-900">No photos or videos yet</p>
            <p className="mt-1 text-xs text-slate-500">
              Help other golfers discover this course — share your experience.
            </p>
            <button
              type="button"
              className="mt-4 w-full h-11 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm font-medium hover:bg-slate-50 transition-colors"
              onClick={() => navigate(`/courses/${courseId}/rate`)}
            >
              Rate this course
            </button>
          </div>
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