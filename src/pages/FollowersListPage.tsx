import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { usePaginatedFollowers, usePaginatedFollowing } from '@/hooks/useSocialLists';
import { useUserByUsername } from '@/hooks/useUserByUsername';
import { UserListPage } from '@/components/social/UserListPage';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { Loader2 } from 'lucide-react';

const FollowersListPage = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useSupabaseSession();

  // Fetch profile user by username
  const { data: profileUser, isLoading: profileLoading } = useUserByUsername(username);

  // Determine if viewing own profile
  const isOwnProfile = currentUser?.id === profileUser?.id;

  // Fetch followers with pagination
  const {
    data,
    isLoading: followersLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
  } = usePaginatedFollowers(profileUser?.id);

  // Also fetch following for the tab
  const {
    data: followingData,
    isLoading: followingLoading,
    isFetchingNextPage: followingIsFetchingNextPage,
    hasNextPage: followingHasNextPage,
    fetchNextPage: followingFetchNextPage,
    error: followingError,
    refetch: followingRefetch,
  } = usePaginatedFollowing(profileUser?.id);

  const followers = data?.pages.flatMap((page) => page.users) ?? [];
  const totalCount = data?.pages.reduce((acc, p) => acc + p.users.length, 0) ?? 0;

  const following = followingData?.pages.flatMap((page) => page.users) ?? [];
  const followingTotalCount = followingData?.pages.reduce((acc, p) => acc + p.users.length, 0) ?? 0;

  // Track list view
  useEffect(() => {
    if (profileUser?.id) {
      analyticsEvents.social.listViewed({
        type: 'followers',
        profileUserId: profileUser.id,
        from: 'profile_stats',
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
    <UserListPage
      mode="followers"
      title="Followers"
      subtitle={`People who follow @${profileUser.username}`}
      searchPlaceholder="Search followers by name or club"
      emptyText="No followers yet."
      users={followers}
      totalCount={totalCount}
      isLoading={followersLoading}
      error={error}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onLoadMore={() => fetchNextPage()}
      onRefetch={() => refetch()}
      backPath={`/profile/${profileUser.username}`}
      isOwnProfile={isOwnProfile}
      profileUsername={profileUser.username}
      // Following tab data
      followingUsers={following}
      followingTotalCount={followingTotalCount}
      followingIsLoading={followingLoading}
      followingError={followingError}
      followingHasNextPage={followingHasNextPage}
      followingIsFetchingNextPage={followingIsFetchingNextPage}
      onFollowingLoadMore={() => followingFetchNextPage()}
      onFollowingRefetch={() => followingRefetch()}
    />
  );
};

export default FollowersListPage;
