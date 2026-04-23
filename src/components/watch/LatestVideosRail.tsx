import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useVideosFeed } from '@/components/videos-tab/hooks/useVideosFeed';
import { VideosFeedSkeleton } from '@/components/videos-tab/VideosFeedSkeleton';
import WatchSectionHeader from './WatchSectionHeader';
import VideoFeedCard from './videos/VideoFeedCard';
import { VideoRailTile } from './videos/VideoRailTile';
import { HRail } from './proshop/HRail';

/**
 * "Latest videos" section — one hero anchor (unified VideoFeedCard
 * treatment: thumbnail + meta row with counts and dropdown menu) +
 * a horizontal rail of the next 9 latest videos as compact tiles.
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
        <VideosFeedSkeleton />
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

      {/* Hero anchor — unified light-treatment VideoFeedCard. No card
          chrome; the component supplies its own 16px horizontal padding
          and 12px thumbnail radius. */}
      <VideoFeedCard
        post={hero}
        index={0}
        allPosts={posts}
        userId={userId}
      />

      {/* Horizontal rail of next 9 */}
      {rail.length > 0 && (
        <HRail paddingTop={20} paddingBottom={4}>
          {rail.map((post, i) => (
            <div key={post.id} style={{ scrollSnapAlign: 'start' }}>
              <VideoRailTile
                post={post}
                index={i + 1}
                allPosts={posts}
                width={200}
              />
            </div>
          ))}
        </HRail>
      )}
    </div>
  );
}
