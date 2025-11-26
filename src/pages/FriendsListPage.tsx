import React from 'react';
import { useParams } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useFriends } from '@/hooks/useFollowersList';
import { useUserByUsername } from '@/hooks/useUserByUsername';
import { SocialListPageShell } from '@/components/profile/social/SocialListPageShell';
import { SocialUserRow } from '@/components/profile/social/SocialUserRow';
import { Loader2 } from 'lucide-react';

const FriendsListPage = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useSupabaseSession();

  // Fetch profile user by username
  const { data: profileUser, isLoading: profileLoading } = useUserByUsername(username);
  
  // Fetch friends
  const { data: friends = [], isLoading: friendsLoading } = useFriends(profileUser?.id);

  const isOwnProfile = currentUser?.id === profileUser?.id;

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
        <div className="divide-y divide-border">
          {friends.map((user) => (
            <SocialUserRow
              key={user.id}
              user={user}
              currentUserId={currentUser?.id || null}
            />
          ))}
        </div>
      )}
    </SocialListPageShell>
  );
};

export default FriendsListPage;
