import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft } from 'lucide-react';
import { useFriendsWhoPlayedCourse } from '@/hooks/useFriendsWhoPlayedCourse';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { formatDistanceToNow } from 'date-fns';
import SquircleImage from '@/components/ui/SquircleImage';
import { Button } from '@/components/ui/button';

const CourseFriendsPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useSupabaseSession();
  const navigate = useNavigate();

  const { data: friends = [], isLoading } = useFriendsWhoPlayedCourse(user?.id, courseId);
  
  // Fetch course name
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

  const courseName = course?.name || 'this course';

  // Sort by most recent last_played_at descending
  const sortedFriends = useMemo(() => {
    return [...friends].sort((a, b) => {
      if (!a.last_played_at) return 1;
      if (!b.last_played_at) return -1;
      return new Date(b.last_played_at).getTime() - new Date(a.last_played_at).getTime();
    });
  }, [friends]);

  const totalFriends = sortedFriends.length;
  const lastPlayed = sortedFriends[0]?.last_played_at;

  const summaryLabel =
    totalFriends === 1
      ? '1 friend has logged a round or left a review here'
      : `${totalFriends} friends have logged a round or left a review here`;

  const lastPlayedLabel = lastPlayed
    ? `Last round ${formatDistanceToNow(new Date(lastPlayed), { addSuffix: true })}`
    : null;

  const handleOpenProfile = (username: string) => {
    navigate(`/profile/${username}`);
  };

  const handleViewReview = (friendUserId: string) => {
    // Navigate to Reviews tab, optionally with friend filter
    navigate(`/courses/${courseId}?tab=reviews&friend=${friendUserId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 pt-4 pb-3 border-b border-border/60">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-3 inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to course
        </button>

        <h1 className="text-lg font-semibold text-foreground">
          Friends who've played {courseName}
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          {summaryLabel}
        </p>

        {lastPlayedLabel && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {lastPlayedLabel}
          </p>
        )}
      </header>

      {/* Loading state */}
      {isLoading && (
        <div className="divide-y divide-border/40">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="px-4 py-3 flex items-center justify-between animate-pulse"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="h-10 w-10 rounded-[16px] bg-muted" />
                <div className="space-y-1">
                  <div className="h-3 w-28 bg-muted rounded-full" />
                  <div className="h-3 w-40 bg-muted rounded-full" />
                </div>
              </div>
              <div className="h-7 w-20 rounded-full bg-muted" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && sortedFriends.length === 0 && (
        <div className="px-4 py-6 text-sm text-muted-foreground">
          None of your friends have logged a round here yet.
        </div>
      )}

      {/* Friends list */}
      {!isLoading && sortedFriends.length > 0 && (
        <div className="divide-y divide-border/40">
          {sortedFriends.map((friend) => {
            const displayName = friend.profile.display_name || friend.profile.username;
            const initial = displayName[0]?.toUpperCase() || '?';
            const lastPlayed = friend.last_played_at
              ? formatDistanceToNow(new Date(friend.last_played_at), { addSuffix: true })
              : null;
            const rightLabel = friend.has_review ? 'View review' : 'View round';

            return (
              <div
                key={friend.user_id}
                className="px-4 py-3 flex items-center justify-between border-b border-border/40 last:border-b-0"
              >
                {/* Left side: avatar + name + last played */}
                <button
                  type="button"
                  onClick={() => handleOpenProfile(friend.profile.username)}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  {friend.profile.profile_photo_url ? (
                    <SquircleImage
                      src={friend.profile.profile_photo_url}
                      alt={displayName}
                      size={40}
                    />
                  ) : (
                    <div
                      className="w-10 h-10 flex items-center justify-center bg-muted text-foreground font-semibold"
                      style={{ borderRadius: '22%' }}
                    >
                      {initial}
                    </div>
                  )}

                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {displayName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {lastPlayed && `Last played ${lastPlayed}`}
                      {friend.has_review && ' · Left a review'}
                    </span>
                  </div>
                </button>

                {/* Right side: pill button */}
                <Button
                  onClick={() => handleViewReview(friend.user_id)}
                  className="ml-3 h-7 px-3 text-xs font-medium rounded-full"
                  variant="default"
                >
                  {rightLabel}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CourseFriendsPage;
