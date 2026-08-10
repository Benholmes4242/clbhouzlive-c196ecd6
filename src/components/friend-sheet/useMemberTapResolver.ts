/**
 * useMemberTapResolver — tapping another member inside the handicap area
 * resolves DIRECTLY to one of three destinations. There is no intermediate
 * sheet on this path any more, because another member's handicap page is
 * private to them.
 *
 *   clbhouz_synced_full | _duelsOnly | _empty -> COMPARE SHEET
 *   clbhouz_not_synced                        -> NUDGE TO SYNC
 *   whs_only                                  -> INVITE
 *
 * THIS HIDES A SURFACE, IT IS NOT A DATA-PRIVACY CHANGE. The compare sheet
 * still reads the other member's WHS figures through
 * whs_connection_publicly_visible(); nothing here narrows what may be read.
 *
 * THE STATE IS NOT RE-DERIVED HERE. It comes from the same
 * deriveSheetState* pair the friend sheet uses, so the resolution can never
 * drift from what that sheet would have shown. The rivalry argument is
 * deliberately omitted: full and duels-only both land on compare, so
 * fetching rivalries would cost a round trip that cannot change the answer.
 *
 * UNRESOLVABLE MEANS NOTHING HAPPENS. A failed lookup, a missing user id or
 * a snapshot the RPC declines to return leaves the tap inert. We never fall
 * back to the handicap page, and never open compare against an id we could
 * not confirm.
 */
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { callCreateInvite } from '@/lib/whs/api';
import { shareInvite } from '@/lib/whs/share';
import type { FriendLeaderboardEntry } from '@/lib/whs/types';
import {
  friendHybridSnapshotKey,
  type FriendHybridSnapshot,
} from '@/lib/whs/hooks/useFriendHybridSnapshot';
import {
  deriveSheetStateFromSnapshot,
  deriveSheetStateFromWhsEntry,
} from './parts/_shared/deriveSheetState';

export interface MemberTapArgs {
  /** For clbhouz members. */
  targetUserId?: string | null;
  /** For WHS-only friends (not on clbhouz). */
  whsOnlyEntry?: FriendLeaderboardEntry | null;
}

/** The compare destination. One string, one place. */
export function compareRouteFor(userId: string): string {
  return `/handicap?subtab=circle&compare=${encodeURIComponent(userId)}`;
}

export function useMemberTapResolver() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSupabaseSession();
  const viewerId = user?.id ?? null;

  const invite = useCallback(async (entry: FriendLeaderboardEntry) => {
    const state = deriveSheetStateFromWhsEntry(entry);
    if (state.kind !== 'whs_only') return;
    const passportId = state.entry.friend_passport_id;
    if (passportId == null) {
      toast.error("Can't invite this player yet");
      return;
    }
    const res = await callCreateInvite(passportId, 'copy_link');
    if (!res.ok || !res.share_url || !res.share_message) {
      toast.error(res.message ?? "Couldn't create invite");
      return;
    }
    await shareInvite({
      share_url: res.share_url,
      share_message: res.share_message,
      invitee_name: state.entry.friend_name,
    });
  }, []);

  const resolve = useCallback(
    async (args: MemberTapArgs) => {
      const targetUserId = args.targetUserId ?? null;
      const whsOnlyEntry = args.whsOnlyEntry ?? null;

      // No clbhouz identity to resolve: this is an England Golf friend who is
      // not on clbhouz, so the only destination that exists is the invite.
      if (!targetUserId) {
        if (whsOnlyEntry) await invite(whsOnlyEntry);
        return;
      }

      // SELF IS NEVER ROUTED THROUGH HERE. A member's own handicap page is
      // untouched by this change; callers guard, and this is the backstop.
      if (viewerId && targetUserId === viewerId) {
        navigate('/handicap');
        return;
      }
      if (!viewerId) return;

      let snapshot: FriendHybridSnapshot | null = null;
      try {
        snapshot = await queryClient.fetchQuery({
          queryKey: friendHybridSnapshotKey(viewerId, targetUserId),
          staleTime: 30_000,
          gcTime: 5 * 60_000,
          queryFn: async () => {
            const { data, error } = await supabase.rpc('get_friend_hybrid_snapshot', {
              p_viewer_id: viewerId,
              p_target_user_id: targetUserId,
            } as never);
            if (error) throw error;
            return (data as unknown as FriendHybridSnapshot) ?? null;
          },
        });
      } catch {
        // Inert on failure — see the header note.
        return;
      }
      if (!snapshot) return;

      const state = deriveSheetStateFromSnapshot({ snapshot, rivalry: undefined });

      if (state.kind === 'clbhouz_not_synced') {
        // ALREADY A MEMBER, just no official handicap connected. An
        // invite-to-clbhouz sheet here would be telling an existing member
        // to join, so this opens a direct thread with an editable draft
        // instead. The draft is never sent automatically.
        //
        // THE SENDER IS FORCED PERSONAL. The member may be acting as a
        // business elsewhere in the app; a nudge about someone's handicap can
        // only come from the person.
        await startConversation(
          { actorType: 'personal', actorId: targetUserId },
          t('handicap.circle.nudge.draft', {
            name: getFirstName(snapshot.profile.display_name ?? snapshot.profile.username ?? ''),
          }),
          { asActor: { actorType: 'personal', actorId: viewerId } },
        );
        return;
      }


      navigate(compareRouteFor(targetUserId));
    },
    [invite, navigate, queryClient, viewerId],
  );

  return { resolve };
}
