import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useUserFriends } from '@/hooks/useUserFriends';

interface SharedCoursesSectionProps {
  userId: string;
  isOwnProfile: boolean;
}

interface SharedCourse {
  course_id: string;
  course_name: string;
  course_thumbnail: string | null;
  country: string;
  friend_count: number;
  friends: Array<{
    id: string;
    display_name: string;
    profile_photo_url: string | null;
  }>;
}

/**
 * Shows courses the user has played that friends have also played.
 */
export const SharedCoursesSection: React.FC<SharedCoursesSectionProps> = ({ 
  userId,
  isOwnProfile 
}) => {
  const navigate = useNavigate();
  const { data: friends = [] } = useUserFriends(userId);

  // Query shared courses
  const { data: sharedCourses = [], isLoading } = useQuery({
    queryKey: ['shared-courses', userId, friends.map(f => f.id)],
    enabled: !!userId && friends.length > 0,
    queryFn: async () => {
      // Get user's played courses
      const { data: userCourses, error: userError } = await supabase
        .from('user_course_activity' as any)
        .select('course_id')
        .eq('user_id', userId);

      if (userError) throw userError;
      if (!userCourses || userCourses.length === 0) return [];

      const userCourseIds = userCourses.map((c: any) => c.course_id);

      // Get friends' played courses that overlap
      const friendIds = friends.map(f => f.id);
      const { data: friendActivities, error: friendError } = await supabase
        .from('user_course_activity' as any)
        .select('course_id, user_id')
        .in('user_id', friendIds)
        .in('course_id', userCourseIds);

      if (friendError) throw friendError;
      if (!friendActivities || friendActivities.length === 0) return [];

      // Group by course and count friends
      const courseMap = new Map<string, Set<string>>();
      friendActivities.forEach((activity: any) => {
        if (!courseMap.has(activity.course_id)) {
          courseMap.set(activity.course_id, new Set());
        }
        courseMap.get(activity.course_id)!.add(activity.user_id);
      });

      // Get course details for top shared courses
      const sharedCourseIds = Array.from(courseMap.entries())
        .sort((a, b) => b[1].size - a[1].size)
        .slice(0, 10)
        .map(([id]) => id);

      if (sharedCourseIds.length === 0) return [];

      const { data: courses, error: courseError } = await supabase
        .from('golf_courses')
        .select('id, name, thumbnail_image, country')
        .in('id', sharedCourseIds);

      if (courseError) throw courseError;

      // Build result
      return (courses || []).map(course => {
        const friendIdsForCourse = Array.from(courseMap.get(course.id) || []);
        const courseFriends = friends
          .filter(f => friendIdsForCourse.includes(f.id))
          .slice(0, 3);

        return {
          course_id: course.id,
          course_name: course.name,
          course_thumbnail: course.thumbnail_image,
          country: course.country,
          friend_count: friendIdsForCourse.length,
          friends: courseFriends,
        } as SharedCourse;
      }).sort((a, b) => b.friend_count - a.friend_count);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Empty state - no friends or no overlaps
  if (!isLoading && (friends.length === 0 || sharedCourses.length === 0)) {
    return (
      <div>
        <div className="mb-3">
          <h3 className="text-base font-semibold text-slate-900">
            Courses you share with friends
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            See where your rounds overlap.
          </p>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-sq-md p-6 text-center">
          <p className="text-sm text-slate-500">
            {friends.length === 0
              ? 'Follow more golfers to see courses you\'ve both played.'
              : 'No shared courses found yet. Keep playing!'}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <h3 className="text-base font-semibold text-slate-900 mb-3">
          Courses you share with friends
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-40 h-28 bg-slate-50 rounded-sq-sm animate-pulse flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3">
        <h3 className="text-base font-semibold text-slate-900">
          Courses you share with friends
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          See where your rounds overlap.
        </p>
      </div>

      {/* Horizontal scroll of cards */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {sharedCourses.map((course) => (
          <div
            key={course.course_id}
            onClick={() => navigate(`/courses/${course.course_id}`)}
            className="flex-shrink-0 w-44 bg-white border border-slate-100 rounded-sq-sm overflow-hidden cursor-pointer hover:border-slate-200 transition-colors"
          >
            {/* Thumbnail */}
            {course.course_thumbnail ? (
              <img
                src={course.course_thumbnail}
                alt={course.course_name}
                className="w-full h-20 object-cover"
              />
            ) : (
              <div className="w-full h-20 bg-slate-100" />
            )}

            {/* Content */}
            <div className="p-2.5">
              <div className="text-sm font-medium text-slate-900 truncate">
                {course.course_name}
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[10px] text-slate-500">
                  You + {course.friend_count} friend{course.friend_count !== 1 ? 's' : ''}
                </span>
                
                {/* Avatar stack */}
                <div className="flex -space-x-1.5">
                  {course.friends.slice(0, 3).map((friend) => (
                    <SquircleAvatar
                      key={friend.id}
                      src={friend.profile_photo_url}
                      alt={friend.display_name || ''}
                      userId={friend.id}
                      size={20}
                      thinRing
                      ringColor="#ffffff"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};