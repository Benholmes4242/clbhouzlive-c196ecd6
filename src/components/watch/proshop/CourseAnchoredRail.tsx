import { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserCourseAnchoredContent } from './hooks/useCourseAnchoredContent';
import { useFeedPostsByIds } from './hooks/useFeedPostsByIds';
import { useWatchMood } from './hooks/useWatchMood';
import { SectionHeader } from './SectionHeader';
import { HRail } from './HRail';
import WatchRailTile from '../WatchRailTile';
import { useActiveActor } from '@/context/ActiveActorContext';

/**
 * "From your courses" rail — surfaces fresh clips/videos from a course
 * the user has actually played. Phase 1 renders the top course only.
 *
 * Hides entirely when:
 *  - user has no played courses with fresh content, OR
 *  - the course has no resolvable posts (RLS / soft-deletes), OR
 *  - the active mood doesn't make sense for played-course content
 *    (the RPC returns empty for follows/trending/tour_week)
 */
function CourseAnchoredRailInner() {
  const navigate = useNavigate();
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;
  const { mood } = useWatchMood();

  const { data: courses = [], isLoading: coursesLoading } =
    useUserCourseAnchoredContent(userId, mood);

  const topCourse = courses[0];
  const postIds = useMemo(() => topCourse?.recent_post_ids ?? [], [topCourse]);

  const { activeActor } = useActiveActor();
  const actor = activeActor ? { id: activeActor.id, type: activeActor.type } : null;
  const { data: posts = [], isLoading: postsLoading } = useFeedPostsByIds(
    postIds,
    userId,
    actor,
  );

  if (coursesLoading || postsLoading) return null;
  if (!topCourse || posts.length === 0) return null;

  return (
    <section style={{ background: 'hsl(var(--background))' }}>
      <SectionHeader
        kicker="From your courses"
        title={topCourse.course_name}
        sub={`${topCourse.content_count} recent ${
          topCourse.content_count === 1 ? 'post' : 'posts'
        } from a course you've played`}
        action={{
          label: 'See all',
          onClick: () => navigate(`/courses/${topCourse.course_id}#video`),
        }}
      />
      <HRail>
        {posts.map((post, i) => (
          <div key={post.id} style={{ scrollSnapAlign: 'start' }}>
            <WatchRailTile post={post} index={i} allPosts={posts} />
          </div>
        ))}
      </HRail>
    </section>
  );
}

export const CourseAnchoredRail = memo(CourseAnchoredRailInner);
export default CourseAnchoredRail;
