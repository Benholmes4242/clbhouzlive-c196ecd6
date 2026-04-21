import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
import WatchActionSheet from '../WatchActionSheet';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface WatchActionsContextValue {
  /** Open the long-press action sheet for a given post. */
  openActions: (post: FeedPost) => void;
}

const WatchActionsContext = createContext<WatchActionsContextValue | null>(null);

/**
 * Provider that hosts a single shared WatchActionSheet so any tile in the
 * Watch tab can trigger it via `useWatchActions().openActions(post)`.
 */
export function WatchActionsProvider({ children }: { children: ReactNode }) {
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;
  const [open, setOpen] = useState(false);
  const [activePost, setActivePost] = useState<FeedPost | null>(null);

  const openActions = useCallback((post: FeedPost) => {
    setActivePost(post);
    setOpen(true);
  }, []);

  return (
    <WatchActionsContext.Provider value={{ openActions }}>
      {children}
      <WatchActionSheet
        open={open}
        onOpenChange={setOpen}
        post={activePost}
        userId={userId}
        onShare={(post) => {
          // Best-effort share; falls back gracefully if Web Share API isn't available.
          const url = `${window.location.origin}/post/${post.id}`;
          if (navigator.share) {
            navigator.share({ url, text: post.caption || 'Check this out' }).catch(() => {});
          } else {
            navigator.clipboard?.writeText(url).catch(() => {});
          }
        }}
        onReport={() => {
          // Placeholder — wire to existing moderation flow if/when available.
        }}
      />
    </WatchActionsContext.Provider>
  );
}

export function useWatchActions(): WatchActionsContextValue {
  const ctx = useContext(WatchActionsContext);
  // Allow tiles to render outside the provider (no-op in that case)
  return ctx ?? { openActions: () => {} };
}
