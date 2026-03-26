// PostStudio — Cinematic Root Shell
// Full-screen immersive studio. Light-first. Golf-native. Better than Instagram.

import React, { useCallback, useEffect, useRef } from 'react';
import {
  applyShieldColor,
  currentShieldColor,
} from '@/hooks/useMedianStatusBar';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PostStudioProvider, usePostStudioContext } from './usePostStudio';
import { ComposeScreen } from './screens/ComposeScreen';
import { TrimScreen } from './screens/TrimScreen';
import { PosterScreen } from './screens/PosterScreen';
import { PublishScreen } from './screens/PublishScreen';
import { SuccessScreen } from './screens/SuccessScreen';
import { MentionPanel } from './panels/MentionPanel';
import { CourseTagPanel } from './panels/CourseTagPanel';
import { AudiencePanel } from './panels/AudiencePanel';
import { SchedulePanel } from './panels/SchedulePanel';
import { DraftsPanel } from './panels/DraftsPanel';
import { SPRING, DURATION } from './constants';
import { BG_BASE, TEXT_PRIMARY, TEXT_SECONDARY } from './tokens';
import type { PostStudioProps, StudioStep, StudioMediaItem } from './types';

// ─── Screen order for directional transitions ───────────────────────────────
const STEP_ORDER: StudioStep[] = [
  'COMPOSE', 'TRIM', 'POSTER', 'PUBLISH', 'SUCCESS',
];

function getDirection(from: StudioStep | null, to: StudioStep): 'forward' | 'backward' {
  if (!from) return 'forward';
  return STEP_ORDER.indexOf(to) >= STEP_ORDER.indexOf(from) ? 'forward' : 'backward';
}

// ─── Screen Router ────────────────────────────────────────────────────────────
function StudioScreenRouter({ onClose }: { onClose: () => void }) {
  const { state, reset } = usePostStudioContext();
  const dir = getDirection(state.previousStep, state.step);

  const handleSuccessDone = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={state.step}
        initial={{ x: dir === 'forward' ? '100%' : '-100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: dir === 'forward' ? '-20%' : '20%', opacity: 0 }}
        transition={{ duration: DURATION.screenTransition, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 flex flex-col"
      >
        {renderScreen(state.step, handleSuccessDone, onClose)}
      </motion.div>
    </AnimatePresence>
  );
}

function renderScreen(step: StudioStep, onSuccessDone: () => void, onClose: () => void) {
  switch (step) {
    case 'COMPOSE':  return <ComposeScreen onClose={onClose} />;
    case 'TRIM':     return <TrimScreen />;
    case 'POSTER':   return <PosterScreen />;
    case 'PUBLISH':  return <PublishScreen />;
    case 'SUCCESS':  return <SuccessScreen onDone={onSuccessDone} />;
    default:         return null;
  }
}

// ─── Panel Router ─────────────────────────────────────────────────────────────
function PanelRouter() {
  const { state } = usePostStudioContext();
  return (
    <AnimatePresence>
      {state.activePanelId === 'mention'  && <MentionPanel />}
      {state.activePanelId === 'course'   && <CourseTagPanel />}
      {state.activePanelId === 'audience' && <AudiencePanel />}
      {state.activePanelId === 'schedule' && <SchedulePanel />}
      {state.activePanelId === 'drafts'   && <DraftsPanel />}
    </AnimatePresence>
  );
}

// ─── Discard Confirmation ─────────────────────────────────────────────────────
function DiscardConfirmation({
  onDiscard,
  onCancel,
}: {
  onDiscard: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: 'rgba(15,23,42,0.40)', backdropFilter: 'blur(12px)' }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 28, stiffness: 360 }}
        className="w-full max-w-[300px] rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.97)',
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
        }}
      >
        {/* Amber top glow */}
        <div
          className="h-1 w-full"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.8), transparent)' }}
        />
        <div className="p-6 text-center space-y-5">
          <div className="space-y-1.5">
            <h3 className="font-semibold text-base tracking-tight" style={{ color: TEXT_PRIMARY }}>Discard post?</h3>
            <p className="text-sm leading-relaxed" style={{ color: TEXT_SECONDARY }}>
              Your content will be lost and cannot be recovered.
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onDiscard}
              className="w-full py-3.5 rounded-2xl font-semibold text-sm text-white min-h-[52px]"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.30)', color: '#DC2626' }}
            >
              Discard
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onCancel}
              className="w-full py-3.5 rounded-2xl font-semibold text-sm min-h-[52px]"
              style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', color: TEXT_PRIMARY }}
            >
              Keep editing
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Studio Inner ─────────────────────────────────────────────────────────────
function StudioInner({ onClose, initialMedia }: { onClose: () => void; initialMedia?: File[] }) {
  const { state, setDiscarding, reset, addMedia, setStep } = usePostStudioContext();
  const initialMediaProcessed = useRef(false);

  // Process initialMedia on mount
  useEffect(() => {
    if (initialMediaProcessed.current || !initialMedia?.length) return;
    initialMediaProcessed.current = true;

    (async () => {
      const items: StudioMediaItem[] = [];
      for (const file of initialMedia) {
        const isVideo = file.type.startsWith('video/');
        const previewUrl = URL.createObjectURL(file);
        let duration: number | null = null;
        let thumbnailUrl: string | undefined;

        if (isVideo) {
          duration = await new Promise<number | null>((resolve) => {
            const v = document.createElement('video');
            v.preload = 'metadata';
            const u = URL.createObjectURL(file);
            v.src = u;
            v.onloadedmetadata = () => { resolve(isFinite(v.duration) ? v.duration : null); URL.revokeObjectURL(u); };
            v.onerror = () => { URL.revokeObjectURL(u); resolve(null); };
          });
          thumbnailUrl = await new Promise<string>((resolve) => {
            const v = document.createElement('video');
            v.preload = 'metadata'; v.muted = true; v.playsInline = true;
            const u = URL.createObjectURL(file);
            v.src = u;
            v.onloadeddata = () => { v.currentTime = 0.1; };
            v.onseeked = () => {
              const c = document.createElement('canvas');
              c.width = v.videoWidth; c.height = v.videoHeight;
              c.getContext('2d')?.drawImage(v, 0, 0);
              URL.revokeObjectURL(u);
              resolve(c.toDataURL('image/jpeg', 0.7));
            };
            v.onerror = () => { URL.revokeObjectURL(u); resolve(''); };
          });
        }

        items.push({
          id: crypto.randomUUID(), file, mediaType: isVideo ? 'video' : 'image',
          previewUrl, thumbnailUrl, duration, trimStart: 0, trimEnd: duration,
          posterTimestamp: 0, posterPreviewUrl: null, width: null, height: null, validationError: null,
        });
      }
      if (items.length > 0) { addMedia(items); setStep('COMPOSE'); }
    })();
  }, [initialMedia, addMedia, setStep]);

  const handleClose = useCallback(() => {
    if (state.isDirty) setDiscarding(true);
    else { reset(); onClose(); }
  }, [state.isDirty, setDiscarding, reset, onClose]);

  // Escape key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [handleClose]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Status bar — PostStudio is a portal, not a route, so App.tsx's
  // route-change useLayoutEffect never fires when it opens.
  // We manually apply light style on open and restore on close.
  useEffect(() => {
    const prevShieldColor = currentShieldColor;

    // Apply light status bar for the light studio surface
    applyShieldColor('#F8FAFC');
    document.documentElement.style.backgroundColor = '#F8FAFC';
    document.body.style.backgroundColor = '#F8FAFC';

    // Also update Median native status bar if available
    try {
      if (typeof window !== 'undefined' && window.median?.statusbar?.set) {
        window.median.statusbar.set({
          style: 'light',
          color: 'F8FAFC',
          overlay: true,
          blur: false,
        });
      }
    } catch { /* Median bridge not ready — fail silently */ }

    return () => {
      applyShieldColor(prevShieldColor);
      document.documentElement.style.backgroundColor = prevShieldColor === 'transparent' ? 'transparent' : prevShieldColor;
      document.body.style.backgroundColor = prevShieldColor === 'transparent' ? 'transparent' : prevShieldColor;
    };
  }, []);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: DURATION.backdrop }}
        className="fixed inset-0 z-[9998]"
        style={{ background: 'rgba(15,23,42,0.30)', backdropFilter: 'blur(24px)' }}
        onClick={handleClose}
      />

      {/* Studio Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', ...SPRING.sheet }}
        className="fixed inset-0 z-[9999] flex flex-col overflow-hidden"
        style={{
          top: 0,
          background: BG_BASE,
        }}
      >


        {/* Discard confirmation overlay */}
        <AnimatePresence>
          {state.isDiscarding && (
            <DiscardConfirmation
              onDiscard={() => { reset(); onClose(); }}
              onCancel={() => setDiscarding(false)}
            />
          )}
        </AnimatePresence>

        {/* Screen router */}
        <div className="relative flex-1 min-h-0">
          <StudioScreenRouter onClose={onClose} />
        </div>

        {/* Panel router */}
        <PanelRouter />
      </motion.div>
    </>
  );
}

// ─── Root Export ──────────────────────────────────────────────────────────────
export default function PostStudio({
  open,
  onClose,
  initialActorType,
  initialActorId,
  initialMedia,
  onSuccess,
}: PostStudioProps) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <PostStudioProvider
          initialActorType={initialActorType}
          initialActorId={initialActorId}
          onSuccess={onSuccess}
        >
          <StudioInner onClose={onClose} initialMedia={initialMedia} />
        </PostStudioProvider>
      )}
    </AnimatePresence>,
    document.body
  );
}
