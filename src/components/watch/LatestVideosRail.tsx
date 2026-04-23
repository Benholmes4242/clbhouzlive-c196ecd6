import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useVideosFeed } from '@/components/videos-tab/hooks/useVideosFeed';
import { VideosFeedSkeleton } from '@/components/videos-tab/VideosFeedSkeleton';
import WatchSectionHeader from './WatchSectionHeader';
import LatestVideoTile from './LatestVideoTile';
import { HRail } from './proshop/HRail';

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
          sub="Tournament recaps, coaching, vlogs"
          onSeeAll={() => navigate('/watch/videos')}
          seeAllLabel="More videos"
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
        sub="Tournament recaps, coaching, vlogs"
        onSeeAll={() => navigate('/watch/videos')}
        seeAllLabel="More videos"
      />

      {/* Single hero anchor — Phase 5e: wrapped to apply the canonical
          12px radius. Heroes were the last full-bleed holdout; matching the
          radius unifies them with every other tile/hero on the surface. */}
      <Suspense fallback={null}>
        <div
          style={{
            margin: '0 16px',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <VideoCard
            post={hero}
            userId={userId}
            cardIndex={0}
            allPosts={posts}
          />
        </div>
      </Suspense>

      {/* Horizontal rail of next 9 */}
      {rail.length > 0 && (
        <HRail paddingTop={20} paddingBottom={4}>
          {rail.map((post, i) => (
            <div key={post.id} style={{ scrollSnapAlign: 'start' }}>
              <LatestVideoTile
                post={post}
                index={i + 1}
                allPosts={posts}
              />
            </div>
          ))}
        </HRail>
      )}
    </div>
  );
}
