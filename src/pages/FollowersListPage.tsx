import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { usePaginatedFollowers, usePaginatedFollowing } from '@/hooks/useSocialLists';
import { useUserByUsername } from '@/hooks/useUserByUsername';
import { UserListPage } from '@/components/social/UserListPage';
import { analyticsEvents } from '@/utils/analyticsEvents';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';

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
  const totalCount = data?.pages[0]?.totalCount ?? data?.pages.reduce((acc, p) => acc + p.users.length, 0) ?? 0;

  const following = followingData?.pages.flatMap((page) => page.users) ?? [];
  const followingTotalCount = followingData?.pages[0]?.totalCount ?? followingData?.pages.reduce((acc, p) => acc + p.users.length, 0) ?? 0;

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
      <div className="min-h-screen bg-background">
        <div
          className="sticky top-0 bg-background border-b border-border px-4 pb-3 pt-2"
          style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="w-9 h-9 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
        <div className="divide-y divide-border/30">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex items-start gap-3 px-4 py-4">
              <Skeleton className="w-14 h-14 rounded-sq-md flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
                <div className="flex gap-2 mt-3">
                  <Skeleton className="h-11 flex-1 rounded-md" />
                  <Skeleton className="h-11 flex-1 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
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
