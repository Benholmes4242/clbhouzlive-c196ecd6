// PostStudio — Root entry point
// Full-screen sheet with spring animation, renders active screen

import React, { useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PostStudioProvider, usePostStudioContext } from './usePostStudio';
import { StudioHeader } from './components/StudioHeader';
import { MediaPickerScreen } from './screens/MediaPickerScreen';
import { ComposerScreen } from './screens/ComposerScreen';
import { SPRING, DURATION } from './constants';
import type { PostStudioProps, StudioStep } from './types';

// ============================================================================
// SCREEN ROUTER
// ============================================================================

function StudioScreenRouter() {
  const { state } = usePostStudioContext();

  const direction = getSlideDirection(state.previousStep, state.step);

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
        {renderScreen(state.step)}
      </motion.div>
    </AnimatePresence>
  );
}

function renderScreen(step: StudioStep) {
  switch (step) {
    case 'MEDIA_PICKER':
      return <MediaPickerScreen />;
    case 'COMPOSER':
      return <ComposerScreen />;
    case 'TRIM':
      return <PlaceholderScreen label="Trim" />;
    case 'POSTER':
      return <PlaceholderScreen label="Cover" />;
    case 'PUBLISH':
      return <PlaceholderScreen label="Publish" />;
    case 'SUCCESS':
      return <PlaceholderScreen label="Success" />;
    default:
      return null;
  }
}

/** Temporary placeholder for screens not yet built */
function PlaceholderScreen({ label }: { label: string }) {
  const { setStep } = usePostStudioContext();
  return (
    <div className="flex-1 flex flex-col">
      <StudioHeader
        title={label}
        leftAction={{ label: 'Back', onClick: () => setStep('COMPOSER') }}
      />
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">
          {label} — coming in next batch
        </p>
      </div>
    </div>
  );
}

function getSlideDirection(from: StudioStep | null, to: StudioStep): 'forward' | 'backward' {
  const order: StudioStep[] = ['MEDIA_PICKER', 'COMPOSER', 'TRIM', 'POSTER', 'PUBLISH', 'SUCCESS'];
  if (!from) return 'forward';
  return order.indexOf(to) >= order.indexOf(from) ? 'forward' : 'backward';
}

// ============================================================================
// INNER SHELL (inside provider)
// ============================================================================

function StudioInner({ onClose }: { onClose: () => void }) {
  const { state, setDiscarding, reset } = usePostStudioContext();

  // Handle discard confirmation
  const handleClose = useCallback(() => {
    if (state.isDirty) {
      setDiscarding(true);
    } else {
      reset();
      onClose();
    }
  }, [state.isDirty, setDiscarding, reset, onClose]);

  // Escape key handler
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
        {/* Discard confirmation overlay */}
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
          <StudioScreenRouter />
        </div>
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
