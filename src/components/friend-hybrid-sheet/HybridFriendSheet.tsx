/**
 * HybridFriendSheet — Vaul bottom sheet built against get_friend_hybrid_snapshot.
 *
 * Dark-mode scoped via `.hcp-dark` wrapper. Relationship-first layout: surfaces
 * the head-to-head ("duels") relationship between viewer and target above
 * everything else, with their handicap form and latest post as supporting
 * sections.
 */
import React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { useNavigate } from 'react-router-dom';
import { X, Lock, ChevronRight } from 'lucide-react';
import { useFriendHybridSnapshot } from '@/lib/whs/hooks/useFriendHybridSnapshot';
import { useFriendRivalries } from '@/lib/whs/hooks';
import { firstName } from '@/lib/whs/share';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { Z } from '@/config/zIndex';
import {
  BG_0,
  BG_1,
  BG_2,
  T100,
  T60,
  T40,
  LINE,
  FONT,
} from './sheet/_shared/tokens';
import { Eyebrow } from './sheet/_shared/Eyebrow';
import { deriveH2HState } from './sheet/_shared/deriveH2H';
import { SheetHeader } from './sheet/SheetHeader';
import { HeadToHeadCard } from './sheet/HeadToHeadCard';
import { TheirFormSection } from './sheet/TheirFormSection';
import { LatestPostCard } from './sheet/LatestPostCard';
import { SheetActionFooter } from './sheet/SheetActionFooter';

interface Props {
  viewerUserId: string;
  targetUserId: string;
  source?: string;
  open: boolean;
  onClose: () => void;
}

export const HybridFriendSheet: React.FC<Props> = ({
  viewerUserId,
  targetUserId,
  source,
  open,
  onClose,
}) => {
  const navigate = useNavigate();
  const { data, isLoading, error } = useFriendHybridSnapshot(
    viewerUserId,
    targetUserId,
  );
  const { data: rivalries } = useFriendRivalries(viewerUserId);

  React.useEffect(() => {
    if (open) {
      analyticsEvents.track?.('friend_hybrid_sheet_opened', {
        viewer_id: viewerUserId,
        target_id: targetUserId,
        source,
      });
    }
  }, [open, viewerUserId, targetUserId, source]);

  const profile = data?.profile;
  const social = data?.social;
  const hcp = data?.handicap;
  const recentPost = data?.recent_post;

  const name = profile?.display_name ?? 'Golfer';
  const first = firstName(name) || 'this golfer';

  const friendshipPill = (() => {
    if (!social) return null;
    if (social.is_friend) return 'Friends';
    if (social.is_following && social.mutual_count > 0) return 'Mutual';
    if (social.is_following) return 'Following';
    return null;
  })();

  const rivalry = React.useMemo(
    () => rivalries?.find((r) => r.rival_user_id === targetUserId),
    [rivalries, targetUserId],
  );

  const h2hState = React.useMemo(
    () =>
      deriveH2HState({
        sharedRounds: hcp?.shared_rounds ?? 0,
        rivalry,
      }),
    [hcp?.shared_rounds, rivalry],
  );

  const handleViewProfile = () => {
    onClose();
    navigate(`/profile/${profile?.username ?? targetUserId}`);
  };
  const handleViewHandicap = () => {
    onClose();
    navigate(`/handicap/${targetUserId}`);
  };
  const handleSeeRivalry = () => {
    onClose();
    navigate(`/handicap/rivalry/${targetUserId}`);
  };
  const handleMessage = () => {
    // v1 fallback — surface the profile until in-app messaging exists.
    handleViewProfile();
  };
  const handleOpenPost = (postId: string) => {
    onClose();
    navigate(`/post/${postId}`);
  };

  const primaryLabel =
    hcp?.is_synced
      ? h2hState.kind === 'empty'
        ? 'See full handicap'
        : 'See rivalry'
      : 'Nudge to sync';
  const primaryOnClick =
    hcp?.is_synced
      ? h2hState.kind === 'empty'
        ? handleViewHandicap
        : handleSeeRivalry
      : handleViewProfile;

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
          className="hcp-dark"
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: Z.sheet,
            background: BG_0,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '78vh',
            minHeight: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: FONT,
            color: T100,
          }}
        >
          <DrawerPrimitive.Title className="sr-only">{name}</DrawerPrimitive.Title>
          <DrawerPrimitive.Description className="sr-only">
            Friend hybrid profile snapshot
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
                background: 'rgba(255,255,255,0.22)',
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
            <SheetHeader
              avatarUrl={profile?.avatar_url ?? null}
              name={name}
              handle={profile?.username ?? null}
              bio={profile?.bio ?? null}
              friendshipPill={friendshipPill}
            />

            {isLoading && <SkeletonBody />}
            {error && (
              <div style={{ padding: '20px', color: T60, fontSize: 14 }}>
                Couldn't load profile snapshot.
              </div>
            )}

            {!isLoading && !error && data && (
              <>
                {hcp?.is_synced ? (
                  <>
                    <HeadToHeadCard state={h2hState} rivalFirstName={first} />
                    <TheirFormSection handicap={hcp} />
                    {recentPost && (
                      <LatestPostCard
                        post={recentPost}
                        onTap={() => handleOpenPost(recentPost.id)}
                      />
                    )}
                  </>
                ) : (
                  <NonSyncedHandicap
                    first={first}
                    syncedFriends={data.synced_friends_count ?? 0}
                  />
                )}
                <div style={{ height: 8 }} />
              </>
            )}
          </div>

          {/* Sticky footer */}
          {!isLoading && !error && data && (
            <div
              style={{
                flexShrink: 0,
                borderTop: `1px solid ${LINE}`,
                padding: '12px 16px',
                paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
                background: BG_0,
              }}
            >
              <SheetActionFooter
                primaryLabel={primaryLabel}
                primaryOnClick={primaryOnClick}
                onViewProfile={handleViewProfile}
                onMessage={handleMessage}
              />
            </div>
          )}
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
};

// ─── Non-synced fallback (preserved as-is) ────────────────────────────────

const NonSyncedHandicap: React.FC<{ first: string; syncedFriends: number }> = ({
  first,
  syncedFriends,
}) => (
  <div style={{ padding: '4px 20px 18px' }}>
    <Eyebrow label="HANDICAP" />
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: '12px 0 4px',
      }}
    >
      <Lock size={48} color={T40 as unknown as string} strokeWidth={1.6} />
      <div style={{ fontSize: 16, fontWeight: 700, color: T100 }}>
        Not synced yet
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 14,
          color: T60,
          textAlign: 'center',
          lineHeight: 1.4,
          maxWidth: 320,
        }}
      >
        If {first} syncs their England Golf handicap, you'll see their live
        index, recent rounds, achievements, and head-to-head record.
      </p>
      {syncedFriends > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            fontSize: 12,
            color: T60,
            fontStyle: 'italic',
            marginTop: 4,
          }}
        >
          {syncedFriends} of your friends are already synced
          <ChevronRight size={14} />
        </div>
      )}
    </div>
  </div>
);

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

export default HybridFriendSheet;
