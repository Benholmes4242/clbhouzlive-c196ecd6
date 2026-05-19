/**
 * FriendHybridSheetProvider — single global mount point for the hybrid
 * friend bottom sheet. Any caller (avatar tap, HCP pill tap, etc.) opens it
 * via the useOpenFriendHybridSheet() hook.
 *
 * Avoids per-surface sheet duplication and ensures one canonical Vaul Drawer
 * instance across /handicap surfaces and beyond.
 */
import React, { createContext, useCallback, useContext, useState } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { HybridFriendSheet } from './HybridFriendSheet';

type Source =
  | 'profile_hcp_pill'
  | 'friends_leaderboard_avatar'
  | 'friends_leaderboard_row'
  | 'recently_active_rail'
  | 'friends_header'
  | 'featured_friend_round'
  | 'cinema_friend_card'
  | 'rivalries_section'
  | 'morning_moment'
  | 'other';

interface OpenArgs {
  targetUserId: string;
  source?: Source;
}

interface Ctx {
  open: (args: OpenArgs) => void;
  close: () => void;
}

const FriendHybridSheetCtx = createContext<Ctx | null>(null);

export const FriendHybridSheetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useSupabaseSession();
  const [state, setState] = useState<{ targetUserId: string; source?: Source } | null>(null);

  const open = useCallback((args: OpenArgs) => {
    setState({ targetUserId: args.targetUserId, source: args.source });
  }, []);
  const close = useCallback(() => setState(null), []);

  return (
    <FriendHybridSheetCtx.Provider value={{ open, close }}>
      {children}
      {state && user?.id && (
        <HybridFriendSheet
          viewerUserId={user.id}
          targetUserId={state.targetUserId}
          source={state.source}
          open
          onClose={close}
        />
      )}
    </FriendHybridSheetCtx.Provider>
  );
};

/**
 * Open the hybrid friend bottom sheet. If targetUserId matches the viewer,
 * the caller should bypass (navigate to /handicap directly) — this hook
 * does NOT no-op in that case so callers stay in control.
 */
export function useOpenFriendHybridSheet(): Ctx {
  const ctx = useContext(FriendHybridSheetCtx);
  if (!ctx) {
    // Safe fallback during SSR / outside provider — log but don't crash.
    return {
      open: () => {
        if (typeof console !== 'undefined') {
          console.warn('[FriendHybridSheet] open() called outside provider');
        }
      },
      close: () => {},
    };
  }
  return ctx;
}
