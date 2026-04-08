// PostStudio — Cinematic Root Shell
// Full-screen immersive studio. Light-first. Golf-native. Better than Instagram.

import React, { useCallback, useEffect, useRef } from 'react';
import {
  applyShieldColor,
  currentShieldColor,
} from '@/hooks/useMedianStatusBar';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Trash2 } from 'lucide-react';
import { PostStudioProvider, usePostStudioContext } from './usePostStudio';
import { ComposeScreen } from './screens/ComposeScreen';
import { TrimScreen } from './screens/TrimScreen';
import { PosterScreen } from './screens/PosterScreen';

import { SuccessScreen } from './screens/SuccessScreen';
import { MentionPanel } from './panels/MentionPanel';
import { CourseTagPanel } from './panels/CourseTagPanel';
// AudiencePanel removed — merged into Account & Visibility sheet
import { SchedulePanel } from './panels/SchedulePanel';
import { DraftsPanel } from './panels/DraftsPanel';
import { useSaveDraft } from './hooks/useSaveDraft';
import { SPRING, DURATION } from './constants';
import { BG_BASE, TEXT_PRIMARY, TEXT_SECONDARY } from './tokens';
import type { PostStudioProps, StudioStep, StudioMediaItem } from './types';

// ─── Screen order for directional transitions ───────────────────────────────
const STEP_ORDER: StudioStep[] = [
  'COMPOSE', 'TRIM', 'POSTER', 'SUCCESS',
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
      
      {state.activePanelId === 'schedule' && <SchedulePanel />}
      {state.activePanelId === 'drafts'   && <DraftsPanel />}
    </AnimatePresence>
  );
}

// ─── Studio Exit Sheet — iOS-style action sheet with Save Draft option ────────
interface StudioExitSheetProps {
  onSaveDraft: () => void;
  onDiscard: () => void;
  onKeepEditing: () => void;
  isSaving?: boolean;
}

function StudioExitSheet({ onSaveDraft, onDiscard, onKeepEditing, isSaving }: StudioExitSheetProps) {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
        onClick={onKeepEditing}
      />

      {/* Main card */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 360 }}
        className="absolute bottom-0 inset-x-0 z-50 px-3"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)' }}
      >
        {/* Action card */}
        <div
          className="rounded-2xl overflow-hidden mb-2"
          style={{
            background: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
          }}
        >
          <div className="text-center pt-5 pb-3 px-4">
            <h3 className="font-semibold text-[15px]" style={{ color: TEXT_PRIMARY }}>Discard post?</h3>
            <p className="text-[13px] mt-1" style={{ color: TEXT_SECONDARY }}>Unsaved changes will be lost</p>
          </div>

          <div className="px-3 pb-3 space-y-2">
            {/* Save Draft — primary */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onSaveDraft}
              disabled={isSaving}
              className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-50"
              style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.30)', color: '#D97706' }}
            >
              {isSaving ? (
                <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(217,119,6,0.3)', borderTopColor: 'transparent' }} />
              ) : (
                <BookOpen className="w-4 h-4" strokeWidth={1.75} />
              )}
              {isSaving ? 'Saving…' : 'Save Draft'}
            </motion.button>

            {/* Discard — destructive */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onDiscard}
              disabled={isSaving}
              className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-30"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', color: '#DC2626' }}
            >
              <Trash2 className="w-4 h-4" strokeWidth={1.75} />
              Discard
            </motion.button>
          </div>
        </div>

        {/* Cancel card */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onKeepEditing}
          className="w-full py-3.5 rounded-2xl font-semibold text-[15px] min-h-[48px]"
          style={{
            background: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(20px)',
            color: TEXT_PRIMARY,
          }}
        >
          Keep Editing
        </motion.button>
      </motion.div>
    </>
  );
}

// ─── Studio Inner ─────────────────────────────────────────────────────────────
function StudioInner({ onClose, initialMedia }: { onClose: () => void; initialMedia?: File[] }) {
  const { state, setDiscarding, reset, addMedia, setStep } = usePostStudioContext();
  const { saveDraft, isSaving: isSavingDraft } = useSaveDraft(state);

  const handleSaveDraft = useCallback(async () => {
    const ok = await saveDraft();
    if (ok) { reset(); onClose(); }
  }, [saveDraft, reset, onClose]);
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

    // Apply dark status bar for the dark studio surface
    applyShieldColor('#0D0D0D');
    document.documentElement.style.backgroundColor = '#0D0D0D';
    document.body.style.backgroundColor = '#0D0D0D';

    // Dark studio — white status bar icons
    try {
      if (typeof window !== 'undefined' && window.median?.statusbar?.set) {
        window.median.statusbar.set({
          style: 'dark',
          color: '0D0D0D',
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
          background: '#0D0D0D',
        }}
      >


        {/* Exit action sheet */}
        <AnimatePresence>
          {state.isDiscarding && (
            <StudioExitSheet
              onSaveDraft={handleSaveDraft}
              onDiscard={() => { reset(); onClose(); }}
              onKeepEditing={() => setDiscarding(false)}
              isSaving={isSavingDraft}
            />
          )}
        </AnimatePresence>

        {/* Screen router */}
        <div className="relative flex-1 min-h-0">
          <StudioScreenRouter onClose={handleClose} />
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
