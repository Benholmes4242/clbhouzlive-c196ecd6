import { useState } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useFriendsFeed, type FriendsMode } from './hooks/useFriendsFeed';
import { FriendsHeader } from './FriendsHeader';
import { FriendsFeed } from './FriendsFeed';
import { FriendsSearchOverlay } from './FriendsSearchOverlay';

interface FriendsTabContentProps {
  embedded?: boolean;
}

export default function FriendsTabContent({ embedded = false }: FriendsTabContentProps) {
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
      <FriendsHeader
        activeMode={activeMode}
        onModeChange={handleModeChange}
        onOpenSearch={() => setIsSearchOpen(true)}
        embedded={embedded}
      />
      <FriendsFeed
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
