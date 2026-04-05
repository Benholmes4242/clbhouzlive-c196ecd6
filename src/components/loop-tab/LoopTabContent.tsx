import { useState } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useFriendsFeed, type FriendsMode } from '@/components/friends-tab/hooks/useFriendsFeed';
import { LoopHeader } from './LoopHeader';
import { OnCourseNowStrip } from './OnCourseNowStrip';
import { LoopFeed } from './LoopFeed';
import { FriendsSearchOverlay } from '@/components/friends-tab/FriendsSearchOverlay';

interface LoopTabContentProps {
  embedded?: boolean;
}

export default function LoopTabContent({ embedded = false }: LoopTabContentProps) {
  const { user } = useSupabaseSession();
  const [activeMode, setActiveMode] = useState<FriendsMode>('latest');
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

  const handleModeChange = (mode: FriendsMode) => {
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
    </div>
  );
}
