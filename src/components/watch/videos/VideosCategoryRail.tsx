import { memo } from 'react';
import { useVideosCategoryRail } from './hooks/useVideosCategoryRail';
import { moodToCategory, moodCategoryLabel, moodCategorySub, type VideosMoodId } from './hooks/useVideosMood';
import { SectionHeader } from '../proshop/SectionHeader';
import { HRail } from '../proshop/HRail';
import { VideoLandscapeTile } from './VideoLandscapeTile';

interface VideosCategoryRailProps {
  userId: string | undefined;
  mood: VideosMoodId;
}

/**
 * Mood-driven category rail. Renders only when active mood maps to a real
 * MOMENT_CATEGORIES id (course_vlogs / coaching / tournaments). Hides for
 * for_you and friends. Hides also when no posts are returned for the
 * category — better to show fewer rails than empty rails.
 */
function VideosCategoryRailInner({ userId, mood }: VideosCategoryRailProps) {
  const category = moodToCategory(mood);
  const label = moodCategoryLabel(mood);
  const sub = moodCategorySub(mood);

  const { data: posts = [], isLoading } = useVideosCategoryRail(userId, category, 8);

  if (!category || !label) return null;
  if (isLoading) return null;
  if (posts.length === 0) return null;

  return (
    <section>
      <SectionHeader
        kicker="IN THE MOOD FOR"
        title={label}
        sub={sub ?? undefined}
      />
      <HRail>
        {posts.map((post, i) => (
          <VideoLandscapeTile key={post.id} post={post} index={i} allPosts={posts} />
        ))}
      </HRail>
    </section>
  );
}

export const VideosCategoryRail = memo(VideosCategoryRailInner);
export default VideosCategoryRail;
