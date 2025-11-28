import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useFriendsWhoPlayedCourse } from '@/hooks/useFriendsWhoPlayedCourse';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { CourseFriendRow } from '@/components/courses/course-detail/CourseFriendRow';

const CourseFriendsPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useSupabaseSession();

  const { data: course } = useQuery({
    queryKey: ['course-detail', courseId],
    queryFn: async () => {
      if (!courseId) return null;
      const { data, error } = await supabase
        .from('golf_courses')
        .select('id, name')
        .eq('id', courseId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: friends = [], isLoading } = useFriendsWhoPlayedCourse(user?.id, courseId);

  const sortedFriends = useMemo(
    () =>
      [...friends].sort(
        (a, b) => {
          if (!a.last_played_at) return 1;
          if (!b.last_played_at) return -1;
          return new Date(b.last_played_at).getTime() - new Date(a.last_played_at).getTime();
        }
      ),
    [friends]
  );

  const totalFriends = sortedFriends.length;
  const courseName = course?.name || 'this course';
  const lastPlayed = sortedFriends[0]?.last_played_at;

  const summaryLabel =
    totalFriends === 1
      ? '1 friend has logged a round or left a review here'
      : `${totalFriends} friends have logged a round or left a review here`;

  const lastPlayedLabel = lastPlayed
    ? `Last round ${formatDistanceToNow(new Date(lastPlayed), {
        addSuffix: true,
      })}`
    : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="px-4 pt-4 pb-3 border-b border-border/60">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-3 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to course
        </button>

        <h1 className="text-lg font-semibold text-foreground">
          Friends who've played {courseName}
        </h1>

        {!isLoading && totalFriends > 0 && (
          <>
            <p className="mt-1 text-sm text-muted-foreground">
              {summaryLabel}
            </p>

            {lastPlayedLabel && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {lastPlayedLabel}
              </p>
            )}
          </>
        )}
      </header>

      <main>
        {isLoading && (
          <div className="divide-y divide-border/40">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="px-4 py-3 flex items-center justify-between animate-pulse"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="h-10 w-10 rounded-[22%] bg-muted shrink-0" />
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="h-3 w-28 bg-muted rounded-full" />
                    <div className="h-3 w-40 bg-muted rounded-full" />
                  </div>
                </div>
                <div className="h-7 w-20 rounded-full bg-muted shrink-0" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && sortedFriends.length === 0 && (
          <div className="px-4 py-6 text-sm text-muted-foreground">
            None of your friends have logged a round here yet.
          </div>
        )}

        {!isLoading && sortedFriends.length > 0 && (
          <div className="divide-y divide-border/40">
            {sortedFriends.map((friend) => (
              <CourseFriendRow
                key={friend.user_id}
                friend={friend}
                onOpenProfile={(userId) => navigate(`/users/${userId}`)}
                onViewReview={() =>
                  navigate(`/courses/${courseId}?tab=reviews&friend=${friend.user_id}`)
                }
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CourseFriendsPage;
