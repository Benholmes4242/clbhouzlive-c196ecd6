import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { usePaginatedFriends } from '@/hooks/useSocialLists';
import { useUserByUsername } from '@/hooks/useUserByUsername';
import { SocialListPageShell } from '@/components/profile/social/SocialListPageShell';
import { SocialUserRow } from '@/components/profile/social/SocialUserRow';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { Loader2 } from 'lucide-react';

const FriendsListPage = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useSupabaseSession();

  // Fetch profile user by username
  const { data: profileUser, isLoading: profileLoading } = useUserByUsername(username);
  
  // Fetch friends with pagination
  const {
    data,
    isLoading: friendsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = usePaginatedFriends(profileUser?.id);

  const friends = data?.pages.flatMap(page => page.users) ?? [];

  const isOwnProfile = currentUser?.id === profileUser?.id;
  
  // Track list view
  useEffect(() => {
    if (profileUser?.id) {
      analyticsEvents.social.listViewed({
        type: "friends",
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
      title="Friends"
      subtitle={`Friends of @${profileUser.username}`}
      count={friends.length}
      backPath={`/profile/${profileUser.username}`}
    >
      {friendsLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!friendsLoading && friends.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <p className="text-muted-foreground text-center">
            {isOwnProfile ? "You haven't added any friends yet." : "No friends to show yet."}
          </p>
        </div>
      )}

      {!friendsLoading && friends.length > 0 && (
        <>
          <div className="divide-y divide-border">
            {friends.map((user) => (
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

export default FriendsListPage;
