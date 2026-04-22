import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import type { FeedPost } from '@/components/media-system/types/media';
import WatchActionSheet from '../WatchActionSheet';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';

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
        onReport={async (post) => {
          // Phase 4b: wired to post_reports table (matches VideoCardMenu pattern).
          if (!userId) return;
          const { error } = await supabase.from('post_reports').insert({
            post_id: post.id,
            reporter_id: userId,
          });
          if (error) {
            if (import.meta.env.DEV) console.error('[WatchActions] Report failed:', error);
            toast.error('Could not report');
          } else {
            toast.success('Report submitted', { description: 'Thanks for letting us know.' });
          }
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
