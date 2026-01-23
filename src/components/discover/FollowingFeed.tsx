/**
 * FollowingFeed - Uses same card layout as Videos page
 * 
 * UNIFIED WITH CLUBHOUSE: Video tiles now handle their own visibility-based
 * autoplay internally - no external MediaRuntime coordination needed.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUnifiedFollowingFeed } from '@/hooks/explore/useUnifiedFollowingFeed';
import { LongFormVideoTileAutoplay } from '@/components/videos/LongFormVideoTileAutoplay';
import FollowingEmptyState from './FollowingEmptyState';
import type { LongFormVideo } from '@/components/videos/LongFormVideoTile';

interface FollowingFeedProps {
  onMediaClick: (item: any) => void;
}

/**
 * FollowingFeed - Uses same card layout as Videos page
 * Video tiles handle their own visibility-based autoplay internally
 */
export default function FollowingFeed({ onMediaClick }: FollowingFeedProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const {
    items,
    loading,
    hasMore,
    followingCount,
    loadMore,
  } = useUnifiedFollowingFeed(20);

  const sentinelRef = useRef<HTMLDivElement>(null);


  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.3 }
    );

    const sentinel = sentinelRef.current;
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [hasMore, loading, loadMore]);

  // Convert ExploreContentItem to LongFormVideo format
  const convertToVideoFormat = useCallback((item: any): LongFormVideo => ({
    id: item.id,
    title: item.title || '',
    mediaUrl: item.type === 'video' ? item.src : undefined,
    thumbnailUrl: item.type === 'image' ? item.src : undefined,
    duration: item.duration || '',
    durationSeconds: item.durationSeconds || 0,
    creatorName: item.user?.name || 'User',
    creatorUserId: item.user?.id || '',
    creatorAvatarUrl: item.user?.avatar,
    views: item.likes || 0,
    likes: item.likes || 0,
  }), []);

  const handleVideoClick = useCallback((id: string) => {
    const item = items.find(i => i.id === id);
    if (item) {
      if (item.type === 'video') {
        navigate(`/video/${id}`, {
          state: { backgroundLocation: location, fromVideo: true }
        });
      } else {
        onMediaClick(item);
      }
    }
  }, [items, navigate, location, onMediaClick]);

  const handleCreatorClick = useCallback((creatorUserId: string) => {
    navigate(`/golfer/${creatorUserId}`);
  }, [navigate]);

  // Empty state: User follows no one
  if (!loading && followingCount === 0) {
    return <FollowingEmptyState variant="no-following" />;
  }

  // Empty state: Following people but no posts yet
  if (!loading && items.length === 0 && followingCount > 0) {
    return <FollowingEmptyState variant="no-posts" />;
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: '#f8fafc' }}>
      {/* Simple list layout - same as Videos page */}
      <div className="space-y-3 pt-4">
        {items.map((item) => (
          <LongFormVideoTileAutoplay
            key={item.id}
            video={convertToVideoFormat(item)}
            onVideoClick={handleVideoClick}
            onCreatorClick={handleCreatorClick}
          />
        ))}
      </div>

      {/* Loading state */}
      {loading && items.length === 0 && (
        <div className="py-12 px-5">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-card border border-border/30 overflow-hidden">
                <div className="aspect-[16/9] bg-muted" />
                <div className="px-4 py-3">
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/3 bg-muted rounded mt-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4">
        {loading && hasMore && items.length > 0 && (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* End of feed indicator */}
      {!hasMore && items.length > 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">You're all caught up</p>
        </div>
      )}
    </div>
  );
}
