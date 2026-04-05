import { useRef } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWatchFeed } from './hooks/useWatchFeed';
import WatchTile from './WatchTile';
import WatchAutoplay from './WatchAutoplay';
import { Skeleton } from '@/components/ui/skeleton';

interface TrendingThisWeekProps {
  enabled?: boolean;
}

export default function TrendingThisWeek({ enabled = true }: TrendingThisWeekProps) {
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;
  const stripRef = useRef<HTMLDivElement>(null);

  const { posts, isLoading } = useWatchFeed({
    userId,
    filter: 'top',
    enabled: !!userId && enabled,
  });

  const topPosts = posts.slice(0, 5);

  if (isLoading) {
    return (
      <div style={{ padding: '14px 0 10px', borderTop: '1px solid hsl(var(--border) / 0.08)' }}>
        <div className="px-4 pb-2">
          <span className="text-[15px] font-semibold text-foreground">
            Trending this week
          </span>
        </div>
        <div className="flex gap-3 overflow-x-auto px-4" style={{ scrollbarWidth: 'none' }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="shrink-0 w-[150px] aspect-[4/5] rounded-[8px]" />
          ))}
        </div>
      </div>
    );
  }

  if (topPosts.length === 0) return null;

  return (
    <div style={{ padding: '14px 0 10px', borderTop: '1px solid hsl(var(--border) / 0.08)' }}>
      {/* Section header */}
      <div className="flex items-center justify-between px-4 pb-2">
        <span className="text-[15px] font-semibold text-foreground">
          Trending this week
        </span>
        <span className="text-[11px] text-muted-foreground">
          {topPosts.length} clips
        </span>
      </div>

      <WatchAutoplay posts={topPosts} gridRef={stripRef as React.RefObject<HTMLDivElement>} />

      {/* Horizontal scroll strip of portrait tiles */}
      <div
        ref={stripRef}
        className="flex gap-3 overflow-x-auto px-4 pb-2"
        style={{ scrollbarWidth: 'none' }}
      >
        {topPosts.map((post, i) => (
          <div key={post.id} className="shrink-0 w-[150px] rounded-[8px] overflow-hidden">
            <WatchTile post={post} index={i} allPosts={topPosts} />
          </div>
        ))}
      </div>
    </div>
  );
}
