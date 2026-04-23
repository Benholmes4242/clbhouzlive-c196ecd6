import { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CourseAnchoredRow } from '../proshop/hooks/useCourseAnchoredContent';
import { useFeedPostsByIds } from '../proshop/hooks/useFeedPostsByIds';
import { SectionHeader } from '../proshop/SectionHeader';
import { HRail } from '../proshop/HRail';
import WatchRailTile from '../WatchRailTile';
import type { ClipsMoodId } from './hooks/useClipsMood';

interface ClipsCourseAnchoredRailProps {
  userId: string | undefined;
  mood: ClipsMoodId;
}

/**
 * Clips-only course-anchored rail. Reuses the
 * `get_user_course_anchored_content` RPC with the new `p_format='clip'`
 * filter so we only see short-form posts from played courses.
 *
 * Maps the Clips moods to the underlying RPC's mood vocabulary:
 *   for_you / lightning / your_courses → 'for_you' (rail visible)
 *   trending / friends                 → underlying RPC returns empty
 *
 * Hides entirely when the user has no played courses with fresh clips.
 */
function ClipsCourseAnchoredRailInner({ userId, mood }: ClipsCourseAnchoredRailProps) {
  const navigate = useNavigate();

  // Map Clips mood → RPC mood (the RPC only knows the watch-tab vocabulary).
  const rpcMood =
    mood === 'trending' || mood === 'friends' ? 'trending' /* → empty */ :
    mood === 'your_courses' ? 'played_courses' :
    'for_you';

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['clips-course-anchored', userId, rpcMood],
    enabled: !!userId,
    queryFn: async (): Promise<CourseAnchoredRow[]> => {
      if (!userId) return [];
      const { data, error } = await supabase.rpc(
        'get_user_course_anchored_content' as any,
        {
          p_user_id: userId,
          p_limit_per_course: 6,
          p_mood: rpcMood,
          p_format: 'clip',
        },
      );
      if (error) {
        if (import.meta.env.DEV) {
          console.error('[ClipsCourseAnchoredRail] RPC error:', error);
          throw error;
        }
        return [];
      }
      return (data as CourseAnchoredRow[] | null) ?? [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const topCourse = courses[0];
  const postIds = useMemo(() => topCourse?.recent_post_ids ?? [], [topCourse]);

  const { data: posts = [], isLoading: postsLoading } = useFeedPostsByIds(
    postIds,
    userId,
  );

  if (coursesLoading || postsLoading) return null;
  if (!topCourse || posts.length === 0) return null;

  return (
    <section>
      <SectionHeader
        kicker="From your courses"
        title={topCourse.course_name}
        sub={`${topCourse.content_count} fresh ${
          topCourse.content_count === 1 ? 'clip' : 'clips'
        } this week`}
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

export const ClipsCourseAnchoredRail = memo(ClipsCourseAnchoredRailInner);
export default ClipsCourseAnchoredRail;
