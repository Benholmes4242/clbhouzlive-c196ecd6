import React from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { usePaginatedFriends } from '@/hooks/useSocialLists';
import { UserListPage } from '@/components/social/UserListPage';
import { Loader2 } from 'lucide-react';

/**
 * /friends route - Shows "Your friends" for the logged-in user
 */
const FriendsPage = () => {
  const { user, loading: sessionLoading } = useSupabaseSession();

  const {
    data,
    isLoading: friendsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = usePaginatedFriends(user?.id);

  const friends = data?.pages.flatMap((page) => page.users) ?? [];
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
        <p className="text-muted-foreground">Please sign in to view your friends.</p>
      </div>
    );
  }

  return (
    <UserListPage
      mode="friends"
      title="Friends"
      subtitle="Your friends"
      searchPlaceholder="Search friends by name or club"
      emptyText="You haven't added any friends yet."
      users={friends}
      totalCount={totalCount}
      isLoading={friendsLoading}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onLoadMore={() => fetchNextPage()}
    />
  );
};

export default FriendsPage;
