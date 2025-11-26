import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useFollowers } from '@/hooks/useFollowersList';
import { useUserByUsername } from '@/hooks/useUserByUsername';
import { SocialListPageShell } from '@/components/profile/social/SocialListPageShell';
import { SocialUserRow } from '@/components/profile/social/SocialUserRow';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { Loader2 } from 'lucide-react';

const FollowersListPage = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useSupabaseSession();

  // Fetch profile user by username
  const { data: profileUser, isLoading: profileLoading } = useUserByUsername(username);
  
  // Fetch followers
  const { data: followers = [], isLoading: followersLoading } = useFollowers(profileUser?.id);
  
  // Track list view
  useEffect(() => {
    if (profileUser?.id) {
      analyticsEvents.social.listViewed({
        type: "followers",
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
      title="Followers"
      subtitle={`People who follow @${profileUser.username}`}
      count={followers.length}
      backPath={`/profile/${profileUser.username}`}
    >
      {followersLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!followersLoading && followers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <p className="text-muted-foreground text-center">No followers yet.</p>
        </div>
      )}

      {!followersLoading && followers.length > 0 && (
        <div className="divide-y divide-border">
          {followers.map((user) => (
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

export default FollowersListPage;
