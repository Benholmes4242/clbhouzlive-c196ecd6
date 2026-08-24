/**
 * ProfileSheetV2 — Switchboard redesign of the profile hub bottom sheet.
 *
 * Stage 1 (PS1): frame + actor cards + HCP strip. Body carries PS2
 * placeholder comments where the action row / nav group / sign-out land.
 *
 * Prop contract intentionally matches src/components/profile/ProfileHubSheet.tsx
 * verbatim so the eventual cutover in PostingAsMenu is a one-line import
 * swap. This file must not import from that old sheet or HandicapMasthead.
 */

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useMotionValue, animate, useDragControls } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/bodyScrollLock';
import { overlayOpen, overlayMark } from '@/perf/overlayTiming';
import ActorCards from './components/ActorCards';
import HcpStrip from './components/HcpStrip';
import QuickActionsRow from './components/QuickActionsRow';
import SheetNavGroup from './components/SheetNavGroup';
import SignOutRow from './components/SignOutRow';
import YourCourseAnalyticsSheet from './components/YourCourseAnalyticsSheet';
import { useInviteSheet } from '@/hooks/useInviteSheet';
import { useWhsConnection } from '@/lib/whs/hooks';
import { useUserAnalyticsCourses } from '@/hooks/gam/useUserAnalyticsCourses';

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

const SHEET_BG = '#F8FAFC';
const SKELETON_TILE = 'rgba(0,0,0,0.06)';

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
  const sheetY = useMotionValue(0);
  // Drag is grab-handle only so the body below can scroll internally.
  const dragControls = useDragControls();
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
  const panelRef = useRef<HTMLDivElement | null>(null);
  const openTweenRef = useRef<ReturnType<typeof animate> | null>(null);
  const ovlId = useRef<number>(-1);
  const [mounted, setMounted] = useState(false);

  // Body scroll lock while open.
  useEffect(() => {
    if (!open) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [open]);

  // Overlay perf timing.
  useEffect(() => {
    if (open) {
      ovlId.current = overlayOpen('profile-sheet-v2');
    } else if (ovlId.current >= 0) {
      overlayMark(ovlId.current, 'close-start');
    }
  }, [open]);

  // Open: mount, seed offscreen, slide to 0.
  useEffect(() => {
    if (!open) return;
    const fallbackH = typeof window !== 'undefined' ? window.innerHeight : 1000;
    sheetY.set(fallbackH);
    setMounted(true);
    const raf = requestAnimationFrame(() => {
      const h = panelRef.current?.offsetHeight ?? fallbackH;
      sheetY.set(h);
      if (ovlId.current >= 0) overlayMark(ovlId.current, 'animation-start');
      openTweenRef.current?.stop();
      openTweenRef.current = animate(sheetY, 0, {
        type: 'tween',
        duration: 0.25,
        ease: [0.32, 0.72, 0, 1],
      });
      openTweenRef.current.finished
        .then(() => { if (ovlId.current >= 0) overlayMark(ovlId.current, 'animation-done'); })
        .catch(() => {});
    });
    return () => cancelAnimationFrame(raf);
  }, [open, sheetY]);

  // Close: slide down then unmount.
  useEffect(() => {
    if (open || !mounted) return;
    openTweenRef.current?.stop();
    const h = panelRef.current?.offsetHeight ?? window.innerHeight;
    const t = animate(sheetY, h, {
      type: 'tween',
      duration: 0.22,
      ease: [0.32, 0.72, 0, 1],
    });
    t.finished
      .then(() => {
        setMounted(false);
        if (ovlId.current >= 0) overlayMark(ovlId.current, 'closed');
      })
      .catch(() => {});
    return () => { t.stop(); };
  }, [open, mounted, sheetY]);

  // Escape closes.
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    } else {
      animate(sheetY, 0, { type: 'spring', damping: 25, stiffness: 300 });
    }
  };

  if (typeof document === 'undefined') return null;

  const content = (
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
                background: 'rgba(15,23,42,0.15)',
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
