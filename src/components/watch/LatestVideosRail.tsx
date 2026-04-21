import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useVideosFeed } from '@/components/videos-tab/hooks/useVideosFeed';
import { VideosFeedSkeleton } from '@/components/videos-tab/VideosFeedSkeleton';
import WatchSectionHeader from './WatchSectionHeader';
import LatestVideoTile from './LatestVideoTile';

// Hero re-uses the rich VideoCard treatment for the freshest single post.
const VideoCard = lazy(() =>
  import('@/components/videos-tab/VideoCard').then((m) => ({ default: m.VideoCard }))
);

/**
 * "Latest videos" section — one full-bleed autoplay hero anchor +
 * a horizontal rail of the next 9 latest videos as compact tiles.
 *
 * Replaces the previous "two near-full-screen autoplay cards" layout
 * which made the Watch tab feel like a second vertical feed instead
 * of a discovery surface.
 */
export default function LatestVideosRail() {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const userId = user?.id;

  const { posts, isLoading } = useVideosFeed({
    userId,
    filter: 'latest',
  });

  if (isLoading || posts.length === 0) {
    return (
      <div>
        <WatchSectionHeader
          eyebrow="Videos"
          title="Latest videos"
          onSeeAll={() => navigate('/watch/videos')}
          paddingTop={4}
        />
        <Suspense fallback={null}>
          <VideosFeedSkeleton />
        </Suspense>
      </div>
    );
  }

  const hero = posts[0];
  const rail = posts.slice(1, 10);

  return (
    <div>
      <WatchSectionHeader
        eyebrow="Videos"
        title="Latest videos"
        onSeeAll={() => navigate('/watch/videos')}
        paddingTop={4}
      />

      {/* Single hero anchor */}
      <Suspense fallback={null}>
        <VideoCard
          post={hero}
          userId={userId}
          cardIndex={0}
          allPosts={posts}
        />
      </Suspense>

      {/* Horizontal rail of next 9 */}
      {rail.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 12,
            overflowX: 'auto',
            padding: '20px 16px 4px',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'x mandatory',
          }}
        >
          {rail.map((post, i) => (
            <div key={post.id} style={{ scrollSnapAlign: 'start' }}>
              <LatestVideoTile
                post={post}
                index={i + 1}
                allPosts={posts}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
