import { useState } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useFriendsFeed } from '@/components/friends-tab/hooks/useFriendsFeed';
import type { LoopMode } from './types';
import { LoopHeader } from './LoopHeader';
import { OnCourseNowStrip } from './OnCourseNowStrip';
import { LoopFeed } from './LoopFeed';
import { FriendsSearchOverlay } from '@/components/friends-tab/FriendsSearchOverlay';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';

interface LoopTabContentProps {
  embedded?: boolean;
}

export default function LoopTabContent({ embedded = false }: LoopTabContentProps) {
  const { user } = useSupabaseSession();
  const [activeMode, setActiveMode] = useState<LoopMode>('latest');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const {
    posts,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    resetSeen,
  } = useFriendsFeed({ userId: user?.id, mode: activeMode });

  const handleModeChange = (mode: LoopMode) => {
    setActiveMode(mode);
    resetSeen();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-background min-h-screen">
      <LoopHeader
        activeMode={activeMode}
        onModeChange={handleModeChange}
        onOpenSearch={() => setIsSearchOpen(true)}
        embedded={embedded}
      />
      <OnCourseNowStrip userId={user?.id} />
      <LoopFeed
        posts={posts}
        isLoading={isLoading}
        isError={isError}
        hasNextPage={hasNextPage}
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
