import { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserCourseAnchoredContent } from './hooks/useCourseAnchoredContent';
import { useFeedPostsByIds } from './hooks/useFeedPostsByIds';
import { useWatchMood } from './hooks/useWatchMood';
import { SectionHeader } from '@/components/ui/SectionHeader';
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

  const stillLoading = coursesLoading || postsLoading;

  // Reserved-height skeleton while resolving so this rail can't push
  // subsequent content down after settling. Collapses only when confirmed
  // that no played course has resolvable posts for this mood.
  if (stillLoading) {
    return (
      <section style={{ background: 'hsl(var(--background))' }}>
        <SectionHeader
          role="rail"
          kicker="From your courses"
          title="Loading…"
          paddingX={16}
        />
        <div
          style={{
            display: 'flex',
            gap: 12,
            padding: '0 16px 4px',
            overflow: 'hidden',
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                flexShrink: 0,
                width: 200,
                aspectRatio: '3/4',
                borderRadius: 12,
                background: 'rgba(0,0,0,0.06)',
                backgroundImage:
                  'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.08) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: `clb-shimmer ${1.5 + i * 0.15}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>
      </section>
    );
  }

  if (!topCourse || posts.length === 0) return null;

  return (
    <section style={{ background: 'hsl(var(--background))' }}>
      <SectionHeader
        role="rail"
        kicker="From your courses"
        title={topCourse.course_name}
        paddingX={16}
        action={{
          label: 'See all',
          onClick: () => navigate(`/courses/${topCourse.course_id}#video`),
        }}
      />
      <HRail>
        {posts.map((post, i) => (
          <div key={post.id} style={{ scrollSnapAlign: 'start' }}>
          </div>
        ))}
      </HRail>
    </section>
  );
}

export const CourseAnchoredRail = memo(CourseAnchoredRailInner);
export default CourseAnchoredRail;
