/**
 * HubCreateGameSheet - Bottom sheet for Create Game
 * 
 * Single snap point at ~90% height
 * Swipe down or tap outside to close
 * Sticky footer with Create button
 * 
 * Reuses CreateGameSurface for all form logic
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreateGameSurface, CreateGameSurfaceRef } from '@/features/nearby/components/CreateGameSurface';
import { useGameBeacon } from '@/features/nearby/hooks/useGameBeacon';
import { haptic } from '@/utils/haptics';
import '../home/hubThemeLight.css';

interface HubCreateGameSheetProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledClub?: { id: string; name: string };
}

export const HubCreateGameSheet: React.FC<HubCreateGameSheetProps> = ({
  isOpen,
  onClose,
  prefilledClub,
}) => {
  const rootScrollTopRef = useRef(0);
  const wasOpenRef = useRef(false);
  const surfaceRef = useRef<CreateGameSurfaceRef>(null);
  const { createBeacon } = useGameBeacon();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Complete scroll-lock: save position on open, restore on close
  useEffect(() => {
    const rootEl = document.getElementById('root');
    if (!rootEl) return;

    if (isOpen && !wasOpenRef.current) {
      // Opening: save scroll position and lock
      rootScrollTopRef.current = rootEl.scrollTop;
      rootEl.style.overflow = 'hidden';
      wasOpenRef.current = true;
    } else if (!isOpen && wasOpenRef.current) {
      // Closing: unlock and restore scroll position
      rootEl.style.overflow = '';
      rootEl.scrollTop = rootScrollTopRef.current;
      wasOpenRef.current = false;
    }

    return () => {
      // Cleanup on unmount
      if (wasOpenRef.current) {
        rootEl.style.overflow = '';
        rootEl.scrollTop = rootScrollTopRef.current;
        wasOpenRef.current = false;
      }
    };
  }, [isOpen]);

  // Prevent clicks inside sheet from closing
  const handleSheetClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleCreate = async (input: any) => {
    await createBeacon(input);
    haptic('medium');
    onClose();
  };

  const handleSubmitClick = () => {
    surfaceRef.current?.submit();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - full viewport, tap to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/50 z-[10001]"
            style={{ touchAction: 'none' }}
            onClick={onClose}
          />
          
          {/* Sheet - 90% height snap point */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-x-0 bottom-0 z-[10002] rounded-t-2xl overflow-hidden flex flex-col overscroll-contain"
            style={{ 
              height: '90vh',
              background: 'var(--hub-bg-start)',
            }}
            onClick={handleSheetClick}
          >
            {/* Header - always visible, sticky within sheet */}
            <div 
              className="flex-shrink-0 sticky top-0 z-10"
              style={{ background: 'var(--hub-bg-start)' }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-black/10" />
              </div>
              
              {/* Title bar with close button */}
              <div 
                className="flex items-center justify-between px-4 pb-3 border-b"
                style={{ 
                  borderColor: 'var(--hub-glass-border)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <h2 
                  className="text-[18px] font-semibold"
                  style={{ color: 'var(--hub-text)' }}
                >
                  Create game
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                  style={{ background: 'var(--hub-glass-bg)' }}
                  aria-label="Close"
                >
                  <X className="w-5 h-5" style={{ color: 'var(--hub-text-sub)' }} />
                </button>
              </div>
            </div>
            
            {/* Content - scrolls, with bottom padding for sticky footer */}
            <div 
              className="flex-1 overflow-y-auto overscroll-contain"
              style={{ paddingBottom: 'calc(88px + env(safe-area-inset-bottom, 0px))' }}
            >
              <CreateGameSurface
                ref={surfaceRef}
                prefilledClub={prefilledClub}
                onSubmit={handleCreate}
                hideSubmitButton
                bottomPadding={0}
                onSubmittingChange={setIsSubmitting}
              />
            </div>

            {/* Sticky Footer - Create button */}
            <div 
              className="absolute bottom-0 left-0 right-0 z-20 border-t"
              style={{ 
                background: 'var(--hub-bg-start)',
                borderColor: 'var(--hub-glass-border)',
                padding: '12px 16px',
                paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
              }}
            >
              <button
                type="button"
                onClick={handleSubmitClick}
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl text-base font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-60"
                style={{
                  background: 'linear-gradient(to bottom right, #6E9277, #89A78C)',
                  color: 'white',
                  letterSpacing: '0.3px',
                }}
              >
                {isSubmitting ? 'Creating...' : 'Create game'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default HubCreateGameSheet;
