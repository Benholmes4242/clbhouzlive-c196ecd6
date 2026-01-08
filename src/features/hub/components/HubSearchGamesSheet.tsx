/**
 * HubSearchGamesSheet - Bottom sheet for Search/Browse Games
 * 
 * Single snap point at ~90% height
 * Swipe down or tap outside to close
 * Contains SearchGamesSurface for all search logic
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchGamesSurface } from '@/features/nearby/components/SearchGamesSurface';
import { HubCreateGameSheet } from './HubCreateGameSheet';
import '../home/hubThemeLight.css';

interface HubSearchGamesSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HubSearchGamesSheet: React.FC<HubSearchGamesSheetProps> = ({
  isOpen,
  onClose,
}) => {
  const rootScrollTopRef = useRef(0);
  const wasOpenRef = useRef(false);
  const [isCreateGameSheetOpen, setIsCreateGameSheetOpen] = useState(false);

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

  const handleOpenCreate = () => {
    setIsCreateGameSheetOpen(true);
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
                  Games
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
            
            {/* Content - scrolls */}
            <div 
              className="flex-1 overflow-y-auto overscroll-contain"
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
              <SearchGamesSurface
                bottomPadding={24}
                onOpenCreate={handleOpenCreate}
              />
            </div>
          </motion.div>
          
          {/* Nested Create Game Sheet */}
          <HubCreateGameSheet 
            isOpen={isCreateGameSheetOpen} 
            onClose={() => setIsCreateGameSheetOpen(false)} 
          />
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default HubSearchGamesSheet;
