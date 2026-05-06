import { Skeleton } from '@/components/ui/skeleton';
import { useParams } from 'react-router-dom';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import {
  useBusinessFollowersPaginated,
  useBusinessFollowingPaginated,
} from '@/hooks/useBusinessSocialLists';
import { UserListPage } from '@/components/social/UserListPage';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';

export default function BusinessFollowersPage() {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const { data: business, isLoading: bizLoading } = useBusinessProfile(idOrSlug);

  const {
    data,
    isLoading: followersLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
  } = useBusinessFollowersPaginated(business?.id);

  const {
    data: followingData,
    isLoading: followingLoading,
    isFetchingNextPage: followingIsFetchingNextPage,
    hasNextPage: followingHasNextPage,
    fetchNextPage: followingFetchNextPage,
    error: followingError,
    refetch: followingRefetch,
  } = useBusinessFollowingPaginated(business?.id);

  const followers = data?.pages.flatMap((p) => p.users) ?? [];
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  const following = followingData?.pages.flatMap((p) => p.users) ?? [];
  const followingTotalCount = followingData?.pages[0]?.totalCount ?? 0;

  if (bizLoading) {
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
      </div>
    );
  }

  if (!business) return null;

  const backPath = `/business/${business.slug || business.id}`;
  const displayName = business.slug || business.name || 'business';

  return (
    <>
      <UserListPage
        mode="followers"
        title="Followers"
        subtitle={`People who follow ${business.name}`}
        searchPlaceholder="Search followers by name or club"
        profileUserId={business.id}
        users={followers}
        totalCount={totalCount}
        isLoading={followersLoading}
        error={error as Error | null}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={() => fetchNextPage()}
        onRefetch={() => refetch()}
        backPath={backPath}
        isOwnProfile={false}
        profileUsername={displayName}
        // Following tab data
        followingUsers={following}
        followingTotalCount={followingTotalCount}
        followingIsLoading={followingLoading}
        followingError={followingError as Error | null}
        followingHasNextPage={followingHasNextPage}
        followingIsFetchingNextPage={followingIsFetchingNextPage}
        onFollowingLoadMore={() => followingFetchNextPage()}
        onFollowingRefetch={() => followingRefetch()}
      />
      <ScrollToTopGlass />
    </>
  );
}
