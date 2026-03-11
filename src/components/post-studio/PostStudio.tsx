// PostStudio — Root entry point
// Full-screen sheet with spring animation, renders active screen + panels

import React, { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PostStudioProvider, usePostStudioContext } from './usePostStudio';
import { MediaPickerScreen } from './screens/MediaPickerScreen';
import { ComposerScreen } from './screens/ComposerScreen';
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
import type { PostStudioProps, StudioStep, StudioMediaItem } from './types';

// ============================================================================
// SCREEN ROUTER
// ============================================================================

function StudioScreenRouter({ onClose }: { onClose: () => void }) {
  const { state, reset } = usePostStudioContext();

  const direction = getSlideDirection(state.previousStep, state.step);

  const handleSuccessDone = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={state.step}
        initial={{ x: direction === 'forward' ? '100%' : '-100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: direction === 'forward' ? '-100%' : '100%', opacity: 0 }}
        transition={{ duration: DURATION.screenTransition, ease: 'easeInOut' }}
        className="absolute inset-0 flex flex-col"
      >
        {renderScreen(state.step, handleSuccessDone)}
      </motion.div>
    </AnimatePresence>
  );
}

function renderScreen(step: StudioStep, onSuccessDone: () => void) {
  switch (step) {
    case 'MEDIA_PICKER':
      return <MediaPickerScreen />;
    case 'COMPOSER':
      return <ComposerScreen />;
    case 'TRIM':
      return <TrimScreen />;
    case 'POSTER':
      return <PosterScreen />;
    case 'PUBLISH':
      return <PublishScreen />;
    case 'SUCCESS':
      return <SuccessScreen onDone={onSuccessDone} />;
    default:
      return null;
  }
}

function getSlideDirection(from: StudioStep | null, to: StudioStep): 'forward' | 'backward' {
  const order: StudioStep[] = ['MEDIA_PICKER', 'COMPOSER', 'TRIM', 'POSTER', 'PUBLISH', 'SUCCESS'];
  if (!from) return 'forward';
  return order.indexOf(to) >= order.indexOf(from) ? 'forward' : 'backward';
}

// ============================================================================
// PANEL ROUTER
// ============================================================================

function PanelRouter() {
  const { state } = usePostStudioContext();

  return (
    <AnimatePresence>
      {state.activePanelId === 'mention' && <MentionPanel />}
      {state.activePanelId === 'course' && <CourseTagPanel />}
      {state.activePanelId === 'audience' && <AudiencePanel />}
      {state.activePanelId === 'schedule' && <SchedulePanel />}
      {state.activePanelId === 'drafts' && <DraftsPanel />}
    </AnimatePresence>
  );
}

// ============================================================================
// INNER SHELL (inside provider)
// ============================================================================

function StudioInner({ onClose, initialMedia }: { onClose: () => void; initialMedia?: File[] }) {
  const { state, setDiscarding, reset, addMedia, setStep } = usePostStudioContext();
  const initialMediaProcessed = useRef(false);

  // Process initialMedia files (from snap modal) on mount
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
          id: crypto.randomUUID(),
          file,
          mediaType: isVideo ? 'video' : 'image',
          previewUrl,
          thumbnailUrl,
          duration,
          trimStart: 0,
          trimEnd: duration,
          posterTimestamp: 0,
          posterPreviewUrl: null,
          width: null,
          height: null,
          validationError: null,
        });
      }

      if (items.length > 0) {
        addMedia(items);
        setStep('COMPOSER');
      }
    })();
  }, [initialMedia, addMedia, setStep]);

  const handleClose = useCallback(() => {
    if (state.isDirty) {
      setDiscarding(true);
    } else {
      reset();
      onClose();
    }
  }, [state.isDirty, setDiscarding, reset, onClose]);

  // Escape key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [handleClose]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        transition={{ duration: DURATION.backdrop }}
        className="fixed inset-0 bg-black z-[9998]"
        onClick={handleClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', ...SPRING.sheet }}
        className="fixed inset-0 z-[9999] bg-background rounded-t-[24px] flex flex-col overflow-hidden"
        style={{ top: 0 }}
      >
        {/* Discard confirmation */}
        <AnimatePresence>
          {state.isDiscarding && (
            <DiscardConfirmation
              onDiscard={() => {
                reset();
                onClose();
              }}
              onCancel={() => setDiscarding(false)}
            />
          )}
        </AnimatePresence>

        {/* Screen router */}
        <div className="relative flex-1 overflow-hidden">
          <StudioScreenRouter onClose={onClose} />
        </div>

        {/* Panel router */}
        <PanelRouter />
      </motion.div>
    </>
  );
}

// ============================================================================
// DISCARD CONFIRMATION
// ============================================================================

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
      className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card rounded-2xl p-6 w-full max-w-[300px] text-center space-y-4"
      >
        <h3 className="text-foreground font-semibold text-base">Discard post?</h3>
        <p className="text-muted-foreground text-sm">
          You'll lose any unsaved changes.
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onDiscard}
            className="w-full py-3 rounded-xl bg-destructive text-destructive-foreground font-medium text-sm min-h-[44px]"
          >
            Discard
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 rounded-xl bg-muted text-foreground font-medium text-sm min-h-[44px]"
          >
            Keep editing
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// ROOT EXPORT
// ============================================================================

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
        >
          <StudioInner onClose={onClose} />
        </PostStudioProvider>
      )}
    </AnimatePresence>,
    document.body
  );
}
