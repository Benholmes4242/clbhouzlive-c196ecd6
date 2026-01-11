import React from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { usePaginatedFollowers } from '@/hooks/useSocialLists';
import { UserListPage } from '@/components/social/UserListPage';
import { Loader2 } from 'lucide-react';

/**
 * /followers route - Shows "My Followers" for the logged-in user
 */
const FollowersPage = () => {
  const { user, loading: sessionLoading } = useSupabaseSession();

  const {
    data,
    isLoading: followersLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
  } = usePaginatedFollowers(user?.id);

  const followers = data?.pages.flatMap((page) => page.users) ?? [];
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
        <p className="text-muted-foreground">Please sign in to view your followers.</p>
      </div>
    );
  }

  return (
    <UserListPage
      mode="followers"
      title="Followers"
      subtitle="People who follow you"
      searchPlaceholder="Search followers by name or club"
      emptyText="No followers yet."
      users={followers}
      totalCount={totalCount}
      isLoading={followersLoading}
      error={error as Error | null}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onLoadMore={() => fetchNextPage()}
      onRefetch={() => refetch()}
      isOwnProfile={true}
    />
  );
};

export default FollowersPage;
