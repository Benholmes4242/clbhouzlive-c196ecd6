import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useVideosFeed } from '@/components/videos-tab/hooks/useVideosFeed';
import { VideosFeedSkeleton } from '@/components/videos-tab/VideosFeedSkeleton';
import WatchSectionHeader from './WatchSectionHeader';
import VideoFeedCard from './videos/VideoFeedCard';

/**
 * "Latest videos" section — full-width YouTube-style vertical stack of the
 * 3 most recent videos. Replaced the prior hero + 200px horizontal rail
 * after user feedback that the rail tiles felt too small.
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

  const stack = posts.slice(0, 3);

  return (
    <div>
      <WatchSectionHeader
        eyebrow="Videos"
        title="Latest videos"
        sub="Tournament recaps, coaching, vlogs"
        onSeeAll={() => navigate('/watch/videos')}
        seeAllLabel="More videos"
      />

      {/* Full-width vertical stack — replaces old hero + 200px rail */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {stack.map((post, i) => (
          <VideoFeedCard
            key={post.id}
            post={post}
            index={i}
            allPosts={posts}
            userId={userId}
          />
        ))}
      </div>
    </div>
  );
}
