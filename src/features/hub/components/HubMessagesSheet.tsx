/**
 * HubMessagesSheet - Bottom sheet for Messages
 * 
 * Single snap point at ~70% height
 * Swipe down or tap outside to close
 * "Coming Soon" empty state
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, MessageCircle, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../home/hubThemeLight.css';

interface HubMessagesSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HubMessagesSheet: React.FC<HubMessagesSheetProps> = ({
  isOpen,
  onClose,
}) => {
  const rootScrollTopRef = useRef(0);
  const wasOpenRef = useRef(false);

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
          
          {/* Sheet - 70% height snap point */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-x-0 bottom-0 z-[10002] rounded-t-2xl overflow-hidden flex flex-col overscroll-contain"
            style={{ 
              height: '70vh',
              background: 'var(--hub-bg-start)',
              paddingBottom: 'env(safe-area-inset-bottom)',
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
                  Messages
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
            
            {/* Content - Coming Soon Empty State */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="flex flex-col items-center justify-center h-full text-center px-6" style={{ paddingTop: '60px', paddingBottom: '80px' }}>
                {/* Icon container with gradient */}
                <div className="mb-6">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ 
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.08) 100%)',
                    }}
                  >
                    <MessageCircle 
                      className="w-8 h-8" 
                      style={{ color: '#3B82F6' }} 
                    />
                  </div>
                </div>
                
                {/* Title */}
                <h3 
                  className="text-[20px] font-semibold mb-2"
                  style={{ color: '#1e293b' }}
                >
                  Messaging Coming Soon
                </h3>
                
                {/* Subtitle */}
                <p 
                  className="text-[15px] leading-relaxed mb-6"
                  style={{ 
                    color: '#64748b',
                    maxWidth: '280px',
                  }}
                >
                  Soon you'll be able to chat with golfers, coordinate games, and manage trip invites — all in one place.
                </p>
                
                {/* Notification badge */}
                <div 
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                  style={{ 
                    background: 'rgba(59, 130, 246, 0.1)',
                  }}
                >
                  <Bell className="w-4 h-4" style={{ color: '#3B82F6' }} />
                  <span 
                    className="text-[13px] font-medium"
                    style={{ color: '#3B82F6' }}
                  >
                    We'll notify you when it's ready
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default HubMessagesSheet;
