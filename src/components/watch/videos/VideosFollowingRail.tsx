import { memo } from 'react';
import { useVideosFollowingRail } from './hooks/useVideosFollowingRail';
import SectionHeader from '@/components/ui/SectionHeader';
import { HRail } from '../proshop/HRail';
import { VideoRailTile } from './VideoRailTile';

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
      <SectionHeader role="rail" title="From creators you follow" paddingTop={20} paddingX={16} />
      <HRail paddingBottom={10}>
        {posts.map((post, i) => (
          <VideoRailTile key={post.id} post={post} index={i} allPosts={posts} width={280} />
        ))}
      </HRail>
    </section>
  );
}

export const VideosFollowingRail = memo(VideosFollowingRailInner);
export default VideosFollowingRail;
