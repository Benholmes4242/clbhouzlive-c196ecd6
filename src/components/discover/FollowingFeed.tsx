import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useUnifiedFollowingFeed } from '@/hooks/explore/useUnifiedFollowingFeed';
import FollowingFeedCard from './FollowingFeedCard';
import FollowingEmptyState from './FollowingEmptyState';

interface FollowingFeedProps {
  onMediaClick: (item: any) => void;
}

/**
 * FollowingFeed - Phase 4 Implementation
 * 
 * Following is:
 * - Chronological
 * - Predictable
 * - Calm
 * - Trust-based
 * 
 * This is where Clbhouz feels personal.
 * 
 * Core rules:
 * - One feed, one scroll, chronological-first
 * - No discovery injection
 * - No suggested content
 * - No algorithms competing for attention
 * 
 * If it feels boring in a good way — it's right.
 */
export default function FollowingFeed({ onMediaClick }: FollowingFeedProps) {
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

  // Empty state: User follows no one
  if (!loading && followingCount === 0) {
    return <FollowingEmptyState variant="no-following" />;
  }

  // Empty state: Following people but no posts yet
  if (!loading && items.length === 0 && followingCount > 0) {
    return <FollowingEmptyState variant="no-posts" />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Unified chronological feed */}
      <div className="flex flex-col">
        {items.map((item) => (
          <FollowingFeedCard
            key={item.id}
            item={item}
            onClick={() => onMediaClick(item)}
          />
        ))}
      </div>

      {/* Loading state */}
      {loading && items.length === 0 && (
        <div className="py-12 px-5">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-3 w-20 bg-muted rounded mt-1" />
                  </div>
                </div>
                <div className="aspect-[4/3] bg-muted rounded-lg" />
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
