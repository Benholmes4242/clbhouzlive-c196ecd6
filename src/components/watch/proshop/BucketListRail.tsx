import { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserBucketListAnchoredContent } from './hooks/useUserBucketListAnchoredContent';
import { useFeedPostsByIds } from './hooks/useFeedPostsByIds';
import { SectionHeader } from './SectionHeader';
import { HRail } from './HRail';
import WatchRailTile from '../WatchRailTile';
import { useActiveActor } from '@/context/ActiveActorContext';
import { BucketListMark } from './SectionMarks';
import type { CourseAnchoredRow } from './hooks/useCourseAnchoredContent';
import type { FeedPost } from '@/components/media-system/types/media';

const MAX_TILES = 40;

/**
 * Round-robin interleave: A1, B1, C1, A2, B2, C2, A3...
 * De-duplicates ids that appear under multiple courses.
 */
function interleaveByCourse(courses: CourseAnchoredRow[]): string[] {
  const queues = courses.map((c) => [...(c.recent_post_ids ?? [])]);
  const seen = new Set<string>();
  const out: string[] = [];
  let added = true;
  while (added && out.length < MAX_TILES) {
    added = false;
    for (const q of queues) {
      while (q.length) {
        const id = q.shift()!;
        if (seen.has(id)) continue;
        seen.add(id);
        out.push(id);
        added = true;
        break;
      }
      if (out.length >= MAX_TILES) break;
    }
  }
  return out;
}

/**
 * "From your bucket list" — one rail surfacing fresh clips/videos from
 * ALL of the user's want-to-play courses, interleaved one-per-course
 * round-robin so every course appears near the front. Hidden when the
 * user has no bucket list, or no bucket-list course has recent media.
 */
function BucketListRailInner() {
  const navigate = useNavigate();
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;

  const { data: courses = [], isLoading: coursesLoading } =
    useUserBucketListAnchoredContent(userId);

  const orderedIds = useMemo(() => interleaveByCourse(courses), [courses]);

  const { activeActor } = useActiveActor();
  const actor = activeActor ? { id: activeActor.id, type: activeActor.type } : null;
  const { data: posts = [], isLoading: postsLoading } = useFeedPostsByIds(
    orderedIds,
    userId,
    actor,
  );

  // .in('id', ids) returns rows in arbitrary order — re-apply the interleave.
  const orderedPosts = useMemo<FeedPost[]>(() => {
    const byId = new Map(posts.map((p) => [p.id, p]));
    return orderedIds
      .map((id) => byId.get(id))
      .filter((p): p is FeedPost => Boolean(p));
  }, [orderedIds, posts]);

  // postId → course name lookup so each interleaved tile captions correctly.
  const courseNameByPostId = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of courses) for (const id of c.recent_post_ids ?? []) m.set(id, c.course_name);
    return m;
  }, [courses]);

  if (coursesLoading || postsLoading) return null;
  if (courses.length === 0 || orderedPosts.length === 0) return null;

  const singleCourse = courses.length === 1 ? courses[0] : null;

  return (
    <section style={{ background: 'hsl(var(--background))' }}>
      <SectionHeader
        paddingTop={16}
        kicker="From your bucket list"
        title={singleCourse ? singleCourse.course_name : 'Courses you want to play'}
        sub={`${courses.length} ${courses.length === 1 ? 'course' : 'courses'}`}
        action={{
          label: 'See all',
          onClick: () =>
            navigate(
              singleCourse
                ? `/courses/${singleCourse.course_id}#video`
                : '/profile?tab=want-to-play',
            ),
        }}
      />
      <HRail>
        {orderedPosts.map((post, i) => (
          <div
            key={post.id}
            style={{ scrollSnapAlign: 'start', flexShrink: 0, width: 158 }}
          >
            <WatchRailTile
              post={post}
              index={i}
              allPosts={orderedPosts}
              width={158}
              aspectRatio="1/1"
              radius={16}
            />
            {!singleCourse && (
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: '#0F172A',
                  marginTop: 6,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 158,
                }}
              >
                {courseNameByPostId.get(post.id) ?? ''}
              </div>
            )}
          </div>
        ))}
      </HRail>
    </section>
  );
}

export const BucketListRail = memo(BucketListRailInner);
export default BucketListRail;
