/**
 * FriendSheetProvider — single global mount for the unified friend sheet.
 * Callers open it via useOpenFriendSheet() passing either a clbhouz
 * targetUserId or a WHS-only FriendLeaderboardEntry.
 */
import React, { createContext, useCallback, useContext, useState } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import type { FriendLeaderboardEntry } from '@/lib/whs/types';
import { FriendSheet } from './FriendSheet';

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
  | 'rivalry_page'
  | 'profile_page'
  | 'other';

interface OpenArgs {
  /** For clbhouz users. */
  targetUserId?: string;
  /** For WHS-only friends (not on clbhouz). */
  whsOnlyEntry?: FriendLeaderboardEntry;
  source?: Source;
}

interface Ctx {
  open: (args: OpenArgs) => void;
  close: () => void;
}

const FriendSheetCtx = createContext<Ctx | null>(null);

export const FriendSheetProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useSupabaseSession();
  const [state, setState] = useState<OpenArgs | null>(null);

  const open = useCallback((args: OpenArgs) => setState(args), []);
  const close = useCallback(() => setState(null), []);

  return (
    <FriendSheetCtx.Provider value={{ open, close }}>
      {children}
      {state && user?.id && (
        <FriendSheet
          viewerUserId={user.id}
          targetUserId={state.targetUserId ?? null}
          whsOnlyEntry={state.whsOnlyEntry ?? null}
          source={state.source}
          open
          onClose={close}
        />
      )}
    </FriendSheetCtx.Provider>
  );
};

export function useOpenFriendSheet(): Ctx {
  const ctx = useContext(FriendSheetCtx);
  if (!ctx) {
    return {
      open: () => {
        if (typeof console !== 'undefined') {
          console.warn('[FriendSheet] open() called outside provider');
        }
      },
      close: () => {},
    };
  }
  return ctx;
}
