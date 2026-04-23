import { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CourseAnchoredRow } from '../proshop/hooks/useCourseAnchoredContent';
import { useFeedPostsByIds } from '../proshop/hooks/useFeedPostsByIds';
import { SectionHeader } from '../proshop/SectionHeader';
import { HRail } from '../proshop/HRail';
import { VideoLandscapeTile } from './VideoLandscapeTile';

interface VideosCourseAnchoredRailProps {
  userId: string | undefined;
}

/**
 * Long-form course-anchored rail. Reuses get_user_course_anchored_content
 * with p_format='video' so we only see >90s posts from the user's played
 * courses. Renders top course only for Phase 3.
 */
function VideosCourseAnchoredRailInner({ userId }: VideosCourseAnchoredRailProps) {
  const navigate = useNavigate();

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['videos-course-anchored', userId],
    enabled: !!userId,
    queryFn: async (): Promise<CourseAnchoredRow[]> => {
      if (!userId) return [];
      const { data, error } = await supabase.rpc(
        'get_user_course_anchored_content' as any,
        {
          p_user_id: userId,
          p_limit_per_course: 6,
          p_mood: 'for_you',
          p_format: 'video',
        },
      );
      if (error) {
        if (import.meta.env.DEV) {
          console.error('[VideosCourseAnchoredRail] RPC error:', error);
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
        sub={`${topCourse.content_count} long-form video${
          topCourse.content_count === 1 ? '' : 's'
        } from a course you've played`}
        action={{
          label: 'See all',
          onClick: () => navigate(`/courses/${topCourse.course_id}#video`),
        }}
      />
      <HRail>
        {posts.map((post, i) => (
          <VideoLandscapeTile key={post.id} post={post} index={i} allPosts={posts} />
        ))}
      </HRail>
    </section>
  );
}

export const VideosCourseAnchoredRail = memo(VideosCourseAnchoredRailInner);
export default VideosCourseAnchoredRail;
