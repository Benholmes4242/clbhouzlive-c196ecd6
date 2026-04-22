import { memo } from 'react';
import { useVideosFollowingRail } from './hooks/useVideosFollowingRail';
import { SectionHeader } from '../proshop/SectionHeader';
import { HRail } from '../proshop/HRail';
import { VideoLandscapeTile } from './VideoLandscapeTile';

interface VideosFollowingRailProps {
  userId: string | undefined;
}

/**
 * Long-form videos from creators the user follows. Hides for users who
 * follow no one or whose follows have no recent long-form content.
 */
function VideosFollowingRailInner({ userId }: VideosFollowingRailProps) {
  const { data: posts = [], isLoading } = useVideosFollowingRail(userId, 8);

  if (isLoading) return null;
  if (posts.length === 0) return null;

  return (
    <section>
      <SectionHeader
        title="From creators you follow"
        sub="New from people you've subscribed to"
      />
      <HRail>
        {posts.map((post, i) => (
          <VideoLandscapeTile key={post.id} post={post} index={i} allPosts={posts} />
        ))}
      </HRail>
    </section>
  );
}

export const VideosFollowingRail = memo(VideosFollowingRailInner);
export default VideosFollowingRail;
