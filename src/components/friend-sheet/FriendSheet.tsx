/**
 * FriendSheet — unified bottom sheet for all four friend states.
 *
 * - 1a/1b: clbhouz friend, WHS-synced (full H2H or duels-only)
 * - 2:     WHS-only friend (not on clbhouz) — rendered from FriendLeaderboardEntry
 * - 3:     clbhouz friend, WHS-synced, zero duels
 * - 4:     clbhouz friend, NOT WHS-synced
 */
import React, { useMemo } from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  X,
  MessageCircle,
  UserPlus,
} from 'lucide-react';
import { useFriendHybridSnapshot } from '@/lib/whs/hooks/useFriendHybridSnapshot';
import {
  useFriendRivalries,
} from '@/lib/whs/hooks';
import { Z } from '@/config/zIndex';
import type { FriendLeaderboardEntry } from '@/lib/whs/types';

import { SheetHeader } from './parts/SheetHeader';
import { HeadToHeadCard } from './parts/HeadToHeadCard';
import { TheirFormSection } from './parts/TheirFormSection';
import { LatestPostCard } from './parts/LatestPostCard';
import { UnsyncedPitchCard } from './parts/UnsyncedPitchCard';
import { callCreateInvite } from '@/lib/whs/api';
import { shareInvite } from '@/lib/whs/share';
import {
  SheetActionFooter,
  type FooterAction,
} from './parts/SheetActionFooter';
import {
  BG_0,
  BG_1,
  BG_2,
  T100,
  T60,
  LINE,
  FONT,
} from './parts/_shared/tokens';
import {
  deriveSheetStateFromSnapshot,
  deriveSheetStateFromWhsEntry,
  type SheetState,
} from './parts/_shared/deriveSheetState';
import { formatFriendName, getFirstName } from './parts/_shared/formatName';

export interface FriendSheetProps {
  viewerUserId: string;
  /** Provided for clbhouz users (states 1a/1b/3/4). */
  targetUserId?: string | null;
  /** Provided for WHS-only friends (state 2). */
  whsOnlyEntry?: FriendLeaderboardEntry | null;
  source?: string;
  open: boolean;
  onClose: () => void;
}

export const FriendSheet: React.FC<FriendSheetProps> = ({
  viewerUserId,
  targetUserId,
  whsOnlyEntry,
  open,
  onClose,
}) => {
  const navigate = useNavigate();
  const isWhsOnlyMode = !!whsOnlyEntry && !targetUserId;

  // Snapshot only fetched when we have a clbhouz targetUserId.
  const { data: snapshot, isLoading, error } = useFriendHybridSnapshot(
    isWhsOnlyMode ? null : viewerUserId,
    isWhsOnlyMode ? null : targetUserId ?? null,
  );
  const { data: rivalries } = useFriendRivalries(viewerUserId);

  const rivalry = useMemo(
    () =>
      targetUserId
        ? rivalries?.find((r) => r.rival_user_id === targetUserId)
        : undefined,
    [rivalries, targetUserId],
  );

  const state = useMemo<SheetState | null>(() => {
    if (isWhsOnlyMode && whsOnlyEntry) {
      return deriveSheetStateFromWhsEntry(whsOnlyEntry);
    }
    if (snapshot) {
      return deriveSheetStateFromSnapshot({ snapshot, rivalry });
    }
    return null;
  }, [isWhsOnlyMode, whsOnlyEntry, snapshot, rivalry]);


  // ─── Handlers ─────────────────────────────────────────────────────
  const handleViewProfile = () => {
    onClose();
    const handle = snapshot?.profile.username ?? targetUserId;
    if (handle) navigate(`/profile/${handle}`);
  };
  const handleMessage = () => handleViewProfile();
  const handleSeeRivalry = () => {
    if (!targetUserId) return;
    onClose();
    navigate(`/handicap/rivalry/${targetUserId}`);
  };
  const handleSeeHandicap = () => {
    if (!targetUserId) return;
    onClose();
    navigate(`/handicap/${targetUserId}`);
  };
  const handleInvite = async () => {
    if (state?.kind !== 'whs_only') return;
    const passportId = state.entry.friend_passport_id;
    if (passportId == null) {
      toast.error("Can't invite this player yet");
      return;
    }
    const res = await callCreateInvite(passportId, 'friend_sheet');
    if (!res.ok || !res.share_url || !res.share_message) {
      toast.error(res.message ?? "Couldn't create invite");
      return;
    }
    await shareInvite({
      share_url: res.share_url,
      share_message: res.share_message,
      invitee_name: state.entry.friend_name,
    });
  };
  const handleNudgeSync = async () => {
    if (state?.kind !== 'clbhouz_not_synced') return;
    // CHECKPOINT: compose=nudge_sync query param is not yet wired on the
    // profile page; this navigates to the profile and lets the viewer
    // message manually. Follow-up brief needed to pre-fill compose.
    const handle = snapshot?.profile.username ?? targetUserId;
    if (!handle) return;
    onClose();
    navigate(`/profile/${handle}?compose=nudge_sync`);
  };
  const handleOpenPost = (postId: string) => {
    onClose();
    navigate(`/post/${postId}`);
  };

  // Compute firstName for the active state (used by pitch card + invite button label).
  const friendFirstName =
    state?.kind === 'whs_only'
      ? getFirstName(state.entry.friend_name)
      : state?.kind === 'clbhouz_not_synced'
        ? state.firstName
        : '';

  // ─── Footer actions per state ────────────────────────────────────
  const footer = state
    ? buildFooter(state, {
        handleMessage,
        handleViewProfile,
        handleSeeRivalry,
        handleSeeHandicap,
        handleInvite,
        handleNudgeSync,
      }, friendFirstName)
    : { actions: [] as FooterAction[], layout: 'horizontal' as const };


  // ─── Header props per state ──────────────────────────────────────
  const headerProps = (() => {
    if (!state) return null;
    if (state.kind === 'whs_only') {
      const e = state.entry;
      return {
        avatarUrl: e.friend_thumbnail_url,
        name: e.friend_name,
        handle: null,
        bio: null,
        whsContext: {
          homeClub: e.friend_home_club,
          lastSeenRelativeTime: e.last_round_played_at
            ? fmtRelative(e.last_round_played_at)
            : null,
        },
        pill: { label: 'WHS', tone: 'whs' as const },
      };
    }
    const p = snapshot?.profile;
    return {
      avatarUrl: p?.avatar_url ?? null,
      name: p?.display_name ?? p?.username ?? 'Golfer',
      handle: p?.username ?? null,
      bio: p?.bio ?? null,
      whsContext: null,
      pill: snapshot?.social.is_friend
        ? { label: 'Friends', tone: 'friends' as const }
        : null,
    };
  })();

  const titleName = formatFriendName(headerProps?.name ?? 'Golfer');

  const isClbhouzUser =
    state?.kind === 'clbhouz_synced_full' ||
    state?.kind === 'clbhouz_synced_duelsOnly' ||
    state?.kind === 'clbhouz_synced_empty';

  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            zIndex: Z.sheetBackdrop,
          }}
        />
        <DrawerPrimitive.Content
          className="hcp-light"
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: Z.sheet,
            background: BG_0,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '75dvh',
            minHeight: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: FONT,
            color: T100,
          }}
        >
          <DrawerPrimitive.Title className="sr-only">
            {titleName}
          </DrawerPrimitive.Title>
          <DrawerPrimitive.Description className="sr-only">
            Friend snapshot
          </DrawerPrimitive.Description>

          {/* Drag handle */}
          <div
            aria-hidden
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '8px 0 4px',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                background: 'var(--hcp-line-2)',
              }}
            />
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              zIndex: 3,
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: BG_2,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: T100,
            }}
          >
            <X size={16} strokeWidth={2.4} />
          </button>

          {/* Scrollable body */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              background: BG_0,
            }}
          >
            {!isWhsOnlyMode && isLoading && <SkeletonBody />}
            {!isWhsOnlyMode && error && (
              <div style={{ padding: 20, color: T60, fontSize: 14 }}>
                Couldn't load profile snapshot.
              </div>
            )}

            {headerProps && state && (
              <>
                <SheetHeader
                  {...headerProps}
                  onClick={isClbhouzUser ? handleSeeHandicap : null}
                />

                {/* ─── UNSYNCED states: single hero pitch card ─────────────── */}
                {state.kind === 'whs_only' && (
                  <UnsyncedPitchCard
                    firstName={friendFirstName}
                    eyebrow="Not on clbhouz yet"
                    headline={`Get ${friendFirstName || 'them'} on clbhouz`}
                    subCopy={`Once ${friendFirstName || 'they'} ${friendFirstName ? 'joins' : 'join'} and syncs their handicap, every stat below comes alive between you two.`}
                  />
                )}
                {state.kind === 'clbhouz_not_synced' && (
                  <UnsyncedPitchCard
                    firstName={state.firstName}
                    eyebrow="Handicap not synced"
                    headline={`${state.firstName} hasn't synced yet`}
                    subCopy={`${state.firstName} is on clbhouz but hasn't connected their official handicap. Nudge them to unlock head-to-heads and shared stats.`}
                  />
                )}

                {/* ─── SYNCED states: existing cascade ──────────── */}
                {state.kind !== 'whs_only' && state.kind !== 'clbhouz_not_synced' && (
                  <>
                    <HeadToHeadCard state={state} />

                    {state.kind === 'clbhouz_synced_full' && snapshot?.handicap && (
                      <TheirFormSection handicap={snapshot.handicap} />
                    )}
                    {state.kind === 'clbhouz_synced_duelsOnly' &&
                      snapshot?.handicap && (
                        <TheirFormSection handicap={snapshot.handicap} />
                      )}
                    {state.kind === 'clbhouz_synced_empty' && snapshot?.handicap && (
                      <TheirFormSection handicap={snapshot.handicap} />
                    )}

                    {snapshot?.recent_post && (
                      <LatestPostCard
                        post={snapshot.recent_post}
                        onTap={() => handleOpenPost(snapshot.recent_post!.id)}
                      />
                    )}
                  </>
                )}

                <div style={{ height: 8 }} />
              </>
            )}
          </div>

          {/* Sticky footer */}
          {state && footer.actions.length > 0 && (
            <div
              style={{
                flexShrink: 0,
                padding: '6px 16px 20px',
                paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
                background: BG_0,
              }}
            >
              <SheetActionFooter
                actions={footer.actions}
                layout={footer.layout}
              />
            </div>
          )}
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
};

// ─── Helpers ───────────────────────────────────────────────────────
interface Handlers {
  handleMessage: () => void;
  handleViewProfile: () => void;
  handleSeeRivalry: () => void;
  handleSeeHandicap: () => void;
  handleInvite: () => void;
  handleNudgeSync: () => void;
}

function buildFooter(
  state: SheetState,
  h: Handlers,
  firstName: string,
): { actions: FooterAction[]; layout: 'horizontal' | 'stacked' } {
  switch (state.kind) {
    case 'clbhouz_synced_full':
    case 'clbhouz_synced_duelsOnly':
      return {
        layout: 'horizontal',
        actions: [
          {
            variant: 'icon',
            label: 'Message',
            onClick: h.handleMessage,
            icon: MessageCircle,
          },
          {
            variant: 'secondary',
            label: 'View profile',
            onClick: h.handleViewProfile,
          },
          {
            variant: 'secondary',
            label: 'Handicap',
            onClick: h.handleSeeHandicap,
          },
          {
            variant: 'primary',
            label: 'See rivalry',
            onClick: h.handleSeeRivalry,
          },
        ],
      };
    case 'clbhouz_synced_empty':
      return {
        layout: 'horizontal',
        actions: [
          {
            variant: 'icon',
            label: 'Message',
            onClick: h.handleMessage,
            icon: MessageCircle,
          },
          {
            variant: 'secondary',
            label: 'View profile',
            onClick: h.handleViewProfile,
          },
          {
            variant: 'primary',
            label: 'See full handicap',
            onClick: h.handleSeeHandicap,
          },
        ],
      };
    case 'clbhouz_not_synced':
      return {
        layout: 'stacked',
        actions: [
          {
            variant: 'primary',
            label: firstName ? `Nudge ${firstName} to sync` : 'Nudge to sync',
            onClick: h.handleNudgeSync,
            icon: UserPlus,
          },
        ],
      };
    case 'whs_only':
      return {
        layout: 'stacked',
        actions: [
          {
            variant: 'primary',
            label: firstName ? `Invite ${firstName} to clbhouz` : 'Invite to clbhouz',
            onClick: h.handleInvite,
            icon: UserPlus,
          },
        ],
      };
  }
}


const SkeletonBody: React.FC = () => (
  <div style={{ padding: '0 20px 20px' }}>
    {[80, 100, 60].map((h, i) => (
      <div
        key={i}
        className="animate-pulse"
        style={{
          height: h,
          background: BG_1,
          borderRadius: 12,
          marginBottom: 10,
        }}
      />
    ))}
  </div>
);

function fmtRelative(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days < 1) return 'today';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 7)}w ago`;
  return new Date(iso).toLocaleDateString('en-GB', {
    month: 'short',
    day: '2-digit',
  });
}

export default FriendSheet;
