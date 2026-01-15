import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { usePaginatedFollowing } from '@/hooks/useSocialLists';
import { useUserByUsername } from '@/hooks/useUserByUsername';
import { UserListPage } from '@/components/social/UserListPage';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { Loader2 } from 'lucide-react';

const FollowingListPage = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useSupabaseSession();

  // Fetch profile user by username
  const { data: profileUser, isLoading: profileLoading } = useUserByUsername(username);

  // Determine if viewing own profile
  const isOwnProfile = currentUser?.id === profileUser?.id;

  // Fetch following with pagination
  const {
    data,
    isLoading: followingLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
  } = usePaginatedFollowing(profileUser?.id);

  const following = data?.pages.flatMap((page) => page.users) ?? [];
  const totalCount = data?.pages.reduce((acc, p) => acc + p.users.length, 0) ?? 0;

  // Track list view
  useEffect(() => {
    if (profileUser?.id) {
      analyticsEvents.social.listViewed({
        type: 'following',
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
      mode="following"
      title="Following"
      subtitle={`People @${profileUser.username} follows`}
      searchPlaceholder="Search following by name or club"
      emptyText="Not following anyone yet."
      users={following}
      totalCount={totalCount}
      isLoading={followingLoading}
      error={error}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onLoadMore={() => fetchNextPage()}
      onRefetch={() => refetch()}
      backPath={`/profile/${profileUser.username}`}
      isOwnProfile={isOwnProfile}
    />
  );
};

export default FollowingListPage;
