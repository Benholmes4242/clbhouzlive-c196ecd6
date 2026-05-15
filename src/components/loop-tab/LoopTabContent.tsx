import { useMemo, useState } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useFriendsFeed } from '@/components/friends-tab/hooks/useFriendsFeed';
import { useNetworkActivity } from '@/hooks/useNetworkActivity';
import { useLoopMode } from './hooks/useLoopMode';
import { loopModeToRpcMode } from './types';
import { OnCourseNowStrip } from './OnCourseNowStrip';
import { LoopFeed } from './LoopFeed';
import { FriendsSearchOverlay } from '@/components/friends-tab/FriendsSearchOverlay';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';

interface LoopTabContentProps {
  embedded?: boolean;
}

export default function LoopTabContent({ embedded = false }: LoopTabContentProps) {
  const { user } = useSupabaseSession();
  const { mode } = useLoopMode();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const {
    posts,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useFriendsFeed({ userId: user?.id, mode: loopModeToRpcMode(mode) });

  // For live_now we filter the latest feed to authors who are active right now.
  const { data: network } = useNetworkActivity(user?.id);
  const activeAuthorIds = useMemo(() => {
    if (mode !== 'live_now') return null;
    return new Set((network?.friends ?? []).filter(f => f.is_active_recently).map(f => f.id));
  }, [mode, network]);

  const visiblePosts = useMemo(() => {
    if (!activeAuthorIds) return posts;
    return posts.filter(p => {
      const authorId = (p as unknown as { authorId?: string; userId?: string; user_id?: string })
        .authorId
        ?? (p as unknown as { userId?: string }).userId
        ?? (p as unknown as { user_id?: string }).user_id;
      return authorId ? activeAuthorIds.has(authorId) : false;
    });
  }, [posts, activeAuthorIds]);

  return (
    <div className="bg-background min-h-screen">
      <OnCourseNowStrip userId={user?.id} />
      <LoopFeed
        posts={visiblePosts}
        isLoading={isLoading}
        isError={isError}
        hasNextPage={mode === 'live_now' ? false : hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
        refetch={refetch}
        userId={user?.id}
      />
      <FriendsSearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        userId={user?.id}
      />
      <ScrollToTopGlass />
    </div>
  );
}
