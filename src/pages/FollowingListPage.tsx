import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { usePaginatedFollowing } from '@/hooks/useSocialLists';
import { useUserByUsername } from '@/hooks/useUserByUsername';
import { SocialListPageShell } from '@/components/profile/social/SocialListPageShell';
import { SocialUserRow } from '@/components/profile/social/SocialUserRow';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { Loader2 } from 'lucide-react';

const FollowingListPage = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useSupabaseSession();

  // Fetch profile user by username
  const { data: profileUser, isLoading: profileLoading } = useUserByUsername(username);
  
  // Fetch following with pagination
  const {
    data,
    isLoading: followingLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = usePaginatedFollowing(profileUser?.id);

  const following = data?.pages.flatMap(page => page.users) ?? [];
  
  // Track list view
  useEffect(() => {
    if (profileUser?.id) {
      analyticsEvents.social.listViewed({
        type: "following",
        profileUserId: profileUser.id,
        from: "profile_stats",
      });
    }
  }, [profileUser?.id]);

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  return (
    <SocialListPageShell
      title="Following"
      subtitle={`People @${profileUser.username} follows`}
      count={following.length}
      backPath={`/profile/${profileUser.username}`}
    >
      {followingLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!followingLoading && following.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <p className="text-muted-foreground text-center">Not following anyone yet.</p>
        </div>
      )}

      {!followingLoading && following.length > 0 && (
        <>
          <div className="divide-y divide-border">
            {following.map((user) => (
              <SocialUserRow
                key={user.id}
                user={user}
                currentUserId={currentUser?.id || null}
              />
            ))}
          </div>

          {hasNextPage && (
            <div className="flex justify-center py-6">
              <Button
                variant="secondary"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? 'Loading more…' : 'Load more'}
              </Button>
            </div>
          )}
        </>
      )}
    </SocialListPageShell>
  );
};

export default FollowingListPage;
