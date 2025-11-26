import React from 'react';
import { useParams } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useFollowing } from '@/hooks/useFollowersList';
import { useUserByUsername } from '@/hooks/useUserByUsername';
import { SocialListPageShell } from '@/components/profile/social/SocialListPageShell';
import { SocialUserRow } from '@/components/profile/social/SocialUserRow';
import { Loader2 } from 'lucide-react';

const FollowingListPage = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useSupabaseSession();

  // Fetch profile user by username
  const { data: profileUser, isLoading: profileLoading } = useUserByUsername(username);
  
  // Fetch following
  const { data: following = [], isLoading: followingLoading } = useFollowing(profileUser?.id);

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
        <div className="divide-y divide-border">
          {following.map((user) => (
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

export default FollowingListPage;
