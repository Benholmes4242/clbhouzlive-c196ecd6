/**
 * ProfileSheetV2 — Switchboard redesign of the profile hub bottom sheet.
 *
 * Prop contract intentionally matches src/components/profile/ProfileHubSheet.tsx
 * verbatim so the eventual cutover in PostingAsMenu is a one-line import
 * swap. This file must not import from that old sheet or HandicapMasthead.
 *
 * BRIEF_ACCOUNT_SHEET_REBUILD E — THIS SHEET USES THE SHARED PRIMITIVE.
 * It was a bespoke portal (own backdrop, own grab handle, own framer drag, own
 * 85dvh cap, own scroll lock) and therefore sat OUTSIDE the sheet back stack
 * that BottomSheet owns, so hardware back and the back gesture did not dismiss
 * it. It is now BottomSheet + SheetHeader: fixed head titled "Account", body
 * scrolls, back-stack registration is automatic.
 *
 * TWO KNOWN DELTAS, both accepted deliberately:
 *  1. NO CLOSE ANIMATION. The 220ms slide-down is gone; BottomSheet unmounts on
 *     close like all its other consumers. Being the one sheet outside the back
 *     stack was the worse trade.
 *  2. SCROLL LOCK IS WEAKER HERE THAN IT WAS. This file called
 *     lockBodyScroll(), which is reference-counted and does position-fixed
 *     locking with scroll capture and restore. BottomSheet only sets
 *     body.style.overflow = 'hidden'. That is a fact about all of BottomSheet's
 *     consumers, not about this sheet, and moving the primitive onto the helper
 *     is filed as its own change — it is not bundled here.
 *  3. Drag-to-dismiss is touch-only on the shared primitive (no mouse drag on
 *     desktop). Left as-is: it matches every other sheet.
 *
 * The overlay perf timings (overlayOpen / overlayMark) are preserved by wrapping
 * the shared sheet rather than by keeping the bespoke frame.
 */

import React, { useEffect, useRef, useState } from 'react';
import { overlayOpen, overlayMark } from '@/perf/overlayTiming';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SheetHeader } from '@/components/ui/SheetHeader';
import ActorCards from './components/ActorCards';
import HcpStrip from './components/HcpStrip';
import QuickActionsRow from './components/QuickActionsRow';
import SheetNavGroup from './components/SheetNavGroup';
import SignOutRow from './components/SignOutRow';
import YourCourseAnalyticsSheet from './components/YourCourseAnalyticsSheet';
import { useInviteSheet } from '@/hooks/useInviteSheet';
import { useWhsConnection } from '@/lib/whs/hooks';
import { useUserAnalyticsCourses } from '@/hooks/gam/useUserAnalyticsCourses';
import { A } from '@/features/courses/components/holes/analytical/tokens';


interface Profile {
  id: string;
  type: 'personal' | 'business';
  name: string;
  avatarUrl?: string;
  subtitle?: string;
  username?: string | null;
}

interface CurrentActor {
  type: 'personal' | 'business';
  id: string;
  name: string;
  avatarUrl?: string;
  subtitle?: string;
}

export interface ProfileSheetV2Props {
  open: boolean;
  onClose: () => void;
  currentActor: CurrentActor;
  profiles: Profile[];
  onSwitchProfile: (profileId: string) => Promise<void> | void;
  onNavigate: (route: string) => void;
  isAdmin: boolean;
  isLoading?: boolean;
}

const SHEET_BG = A.CANVAS;
const SKELETON_TILE = A.TRACK;

function SheetSkeleton() {
  const block = (h: number, style: React.CSSProperties = {}) => (
    <div
      className="clb-shimmer-light"
      style={{
        height: h,
        background: SKELETON_TILE,
        borderRadius: 14,
        ...style,
      }}
    />
  );
  return (
    <div style={{ padding: '4px 0 24px' }}>
      {/* actor card rail */}
      <div style={{ display: 'flex', gap: 10, padding: '10px 20px 0', overflow: 'hidden' }}>
        {block(68, { flex: '0 0 220px' })}
        {block(68, { flex: '0 0 220px', opacity: 0.6 })}
      </div>
      {/* hcp strip */}
      {block(46, { margin: '12px 20px 0' })}
      {/* quick action tiles */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 20px 0' }}>
        {block(58, { flex: 1 })}
        {block(58, { flex: 1 })}
        {block(58, { flex: 1 })}
      </div>
      {/* nav group */}
      {block(168, { margin: '12px 20px 0' })}
    </div>
  );
}

export default function ProfileSheetV2({
  open,
  onClose,
  currentActor,
  profiles,
  onSwitchProfile,
  onNavigate,
  isAdmin,
  isLoading,
}: ProfileSheetV2Props) {
  const { openInviteSheet } = useInviteSheet();

  const handleInviteFriends = () => {
    onClose();
    setTimeout(() => openInviteSheet('profile_sheet'), 250);
  };

  // Course analytics entry state — only relevant for personal actor.
  const [analyticsSheetOpen, setAnalyticsSheetOpen] = useState(false);
  const analyticsUserId = currentActor.type === 'personal' ? currentActor.id : undefined;
  const { data: whsConn } = useWhsConnection(analyticsUserId);
  const whsSynced = !!whsConn && !(whsConn as { deleted_at?: string | null }).deleted_at;
  const { data: userCourses } = useUserAnalyticsCourses({ enabled: open && whsSynced });
  const analyticsState: 'ready' | 'building' | 'disconnected' = !whsSynced
    ? 'disconnected'
    : (userCourses?.length ?? 0) > 0
      ? 'ready'
      : 'building';
  const handleOpenCourseAnalytics = () => setAnalyticsSheetOpen(true);
  const handleAnalyticsNavigate = (route: string) => {
    onClose();
    setTimeout(() => onNavigate(route), 40);
  };
  const ovlId = useRef<number>(-1);

  // profile_hub_sheet_opened — instrumentation was lost in the v2 rewrite and
  // re-added 7 Sep 2026. Fires once per open, matching the v1 sheet's contract.
  useEffect(() => {
    if (!open) return;
    analyticsEvents.track('profile_hub_sheet_opened', {
      actor_type: currentActor.type,
      is_admin: isAdmin,
    });
  }, [open, currentActor.type, isAdmin]);

  /* Overlay perf timing — preserved through the migration (E). The bespoke
     frame owned the open/close tweens, so it could mark 'animation-start' and
     'animation-done' itself. BottomSheet owns the transition now, so the two
     marks that remain measurable from here are the open and the close; the
     animation pair is emitted around the primitive's own slide-in frame. */
  useEffect(() => {
    if (open) {
      ovlId.current = overlayOpen('profile-sheet-v2');
      const raf = requestAnimationFrame(() => {
        if (ovlId.current >= 0) overlayMark(ovlId.current, 'animation-start');
      });
      return () => cancelAnimationFrame(raf);
    }
    if (ovlId.current >= 0) {
      overlayMark(ovlId.current, 'close-start');
      overlayMark(ovlId.current, 'closed');
      ovlId.current = -1;
    }
  }, [open]);

  /* Body scroll lock, escape, backdrop, drag-to-dismiss, the 85dvh cap and the
     back-stack entry all belong to BottomSheet now. Nothing is reimplemented
     here; see the file header for the two accepted deltas. */

  return (
    <>
      <BottomSheet
        open={open}
        onClose={onClose}
        zIndexBase={9998}
        topRadius={24}
        ariaLabelledBy="ps2-title"
        style={{
          boxShadow: '0 -12px 40px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* FIXED HEAD (E). The sheet had no title at all, so a scrolled open
            landed mid-card with nothing naming the surface. */}
        <SheetHeader
          title="Account"
          onClose={onClose}
          dark
          borderBottom
        />
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {isLoading ? (
            <SheetSkeleton />
          ) : (
            <div style={{ paddingTop: 16, paddingBottom: 32 }}>
              <ActorCards
                currentActor={currentActor}
                profiles={profiles}
                onSwitchProfile={onSwitchProfile}
                onNavigate={onNavigate}
              />
              <HcpStrip
                actorType={currentActor.type}
                actorId={currentActor.id}
                onNavigate={onNavigate}
              />
              <QuickActionsRow
                actorType={currentActor.type}
                actorId={currentActor.id}
                onNavigate={onNavigate}
              />
              <SheetNavGroup
                currentActor={{ id: currentActor.id, type: currentActor.type }}
                isAdmin={isAdmin}
                onNavigate={onNavigate}
                onInviteFriends={handleInviteFriends}
                onOpenCourseAnalytics={
                  currentActor.type === 'personal' ? handleOpenCourseAnalytics : undefined
                }
                analyticsState={analyticsState}
                /* D2: the dashed "+ Business" tile left the actor rail; this is
                   what decides whether the business row offers creation. */
                hasBusinessActor={profiles.some((p) => p.type === 'business')}
              />
              <SignOutRow onNavigate={onNavigate} />
            </div>
          )}
        </div>
      </BottomSheet>
      <YourCourseAnalyticsSheet
        open={analyticsSheetOpen}
        onClose={() => setAnalyticsSheetOpen(false)}
        onNavigate={handleAnalyticsNavigate}
        synced={whsSynced}
      />
    </>
  );
}

    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="ps2-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 9998,
            }}
          />
        )}
      </AnimatePresence>

      {mounted && (
        <motion.div
          ref={panelRef}
          drag="y"
          dragListener={false}
          dragControls={dragControls}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.4 }}
          onDragStart={() => { openTweenRef.current?.stop(); }}
          onDragEnd={handleDragEnd}
          style={{
            y: sheetY,
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            background: SHEET_BG,
            borderRadius: '24px 24px 0 0',
            boxShadow: '0 -12px 40px rgba(0,0,0,0.3)',
            maxHeight: '85dvh',
            overflow: 'hidden',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            onPointerDown={(e) => dragControls.start(e)}
            style={{
              display: 'flex',
              justifyContent: 'center',
              paddingTop: 8,
              paddingBottom: 4,
              flexShrink: 0,
              touchAction: 'none',
              cursor: 'grab',
            }}
          >
            <div
              style={{
                width: 40,
                height: 4.5,
                borderRadius: 999,
                background: A.BORDER,
              }}
            />
          </div>

          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch',
            }}
          >
          {isLoading ? (
            <SheetSkeleton />
          ) : (
            <div style={{ paddingTop: 16, paddingBottom: 32 }}>
              <ActorCards
                currentActor={currentActor}
                profiles={profiles}
                onSwitchProfile={onSwitchProfile}
                onNavigate={onNavigate}
              />
              <HcpStrip
                actorType={currentActor.type}
                actorId={currentActor.id}
                onNavigate={onNavigate}
              />
              <QuickActionsRow
                actorType={currentActor.type}
                actorId={currentActor.id}
                onNavigate={onNavigate}
              />
              <SheetNavGroup
                currentActor={{ id: currentActor.id, type: currentActor.type }}
                isAdmin={isAdmin}
                onNavigate={onNavigate}
                onInviteFriends={handleInviteFriends}
                onOpenCourseAnalytics={
                  currentActor.type === 'personal' ? handleOpenCourseAnalytics : undefined
                }
                analyticsState={analyticsState}
                /* D2: the dashed "+ Business" tile left the actor rail; this is
                   what decides whether the business row offers creation. */
                hasBusinessActor={profiles.some((p) => p.type === 'business')}

              />
              <SignOutRow onNavigate={onNavigate} />
            </div>
          )}
          </div>
        </motion.div>
      )}
      <YourCourseAnalyticsSheet
        open={analyticsSheetOpen}
        onClose={() => setAnalyticsSheetOpen(false)}
        onNavigate={handleAnalyticsNavigate}
        synced={whsSynced}
      />
    </>
  );

  return createPortal(content, document.body);
}
