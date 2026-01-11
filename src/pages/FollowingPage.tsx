import React from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { usePaginatedFollowing } from '@/hooks/useSocialLists';
import { UserListPage } from '@/components/social/UserListPage';
import { Loader2 } from 'lucide-react';

/**
 * /following route - Shows "People you follow" for the logged-in user
 */
const FollowingPage = () => {
  const { user, loading: sessionLoading } = useSupabaseSession();

  const {
    data,
    isLoading: followingLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
  } = usePaginatedFollowing(user?.id);

  const following = data?.pages.flatMap((page) => page.users) ?? [];
  const totalCount = data?.pages[0] ? data.pages.reduce((acc, p) => acc + p.users.length, 0) : 0;

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Please sign in to view who you follow.</p>
      </div>
    );
  }

  return (
    <UserListPage
      mode="following"
      title="Following"
      subtitle="People you follow"
      searchPlaceholder="Search following by name or club"
      emptyText="You aren't following anyone yet."
      users={following}
      totalCount={totalCount}
      isLoading={followingLoading}
      error={error as Error | null}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onLoadMore={() => fetchNextPage()}
      onRefetch={() => refetch()}
      isOwnProfile={true}
    />
  );
};

export default FollowingPage;
