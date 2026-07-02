import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserBucketListAnchoredContent } from './hooks/useUserBucketListAnchoredContent';
import { useFeedPostsByIds } from './hooks/useFeedPostsByIds';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { HRail } from './HRail';
import WatchRailTile from '../WatchRailTile';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useWatchReveal } from '../WatchRevealContext';
import type { CourseAnchoredRow } from './hooks/useCourseAnchoredContent';
import type { FeedPost } from '@/components/media-system/types/media';
import { useFirstVisibleDecoded } from '../shared/useFirstVisibleDecoded';

const VISIBLE_COUNT = 3;

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

  const {
    data: courses = [],
    isLoading: coursesLoading,
    dataUpdatedAt: coursesUpdatedAt,
  } = useUserBucketListAnchoredContent(userId);

  const orderedIds = useMemo(() => interleaveByCourse(courses), [courses]);

  const { activeActor } = useActiveActor();
  const actor = activeActor ? { id: activeActor.id, type: activeActor.type } : null;
  const {
    data: posts = [],
    isLoading: postsLoading,
    dataUpdatedAt: postsUpdatedAt,
  } = useFeedPostsByIds(orderedIds, userId, actor);

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

  const stillLoading = coursesLoading || postsLoading;
  const { settled: firstVisibleDecoded, onDecoded } = useFirstVisibleDecoded(orderedPosts.length, VISIBLE_COUNT);

  // Canonical resolve: courses query resolved AND either (a) no ids to fetch
  // so the posts query is skipped, or (b) the posts query has also resolved.
  const coursesResolved = coursesUpdatedAt > 0;
  const postsResolved = orderedIds.length === 0 || postsUpdatedAt > 0;
  const hasResolved = coursesResolved && postsResolved;
  const isEmpty = hasResolved && orderedPosts.length === 0;
  const revealed = useWatchReveal(
    'bucket-list',
    hasResolved && (isEmpty || firstVisibleDecoded),
  );

  // Reserve final height while loading so late-resolving posts don't push
  // the rest of the feed down. Held until coordinated reveal.
  if (!revealed || stillLoading) {
    return (
      <section style={{ background: 'hsl(var(--background))' }}>
        <SectionHeader role="rail" paddingTop={18} paddingX={16} title="Bucket list" />
        <div
          style={{
            display: 'flex',
            gap: 12,
            padding: '0 16px 4px',
            overflow: 'hidden',
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ flexShrink: 0, width: 158 }}>
              <div
                style={{
                  width: 158,
                  height: 158,
                  borderRadius: 6,
                  background: 'rgba(0,0,0,0.06)',
                  backgroundImage:
                    'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.08) 50%, transparent 100%)',
                  backgroundSize: '200% 100%',
                  animation: `clb-shimmer ${1.5 + i * 0.15}s ease-in-out infinite`,
                }}
              />
              <div
                style={{
                  marginTop: 6,
                  width: 120,
                  height: 12,
                  borderRadius: 4,
                  background: 'rgba(0,0,0,0.06)',
                }}
              />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (courses.length === 0 || orderedPosts.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
      style={{ background: 'hsl(var(--background))' }}
    >
      <SectionHeader role="rail" paddingTop={18} paddingX={16} title="Bucket list" />
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
              radius={6}
              thumbHeightPx={316}
              onDecoded={i < VISIBLE_COUNT ? onDecoded : undefined}
              debugId={`bucket-list#${i}`}
            />

            {courseNameByPostId.get(post.id) && (
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
                {courseNameByPostId.get(post.id)}
              </div>
            )}
          </div>
        ))}
      </HRail>
    </motion.section>
  );
}

export const BucketListRail = memo(BucketListRailInner);
export default BucketListRail;
