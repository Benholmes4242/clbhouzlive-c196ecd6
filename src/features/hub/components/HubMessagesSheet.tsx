/**
 * HubMessagesSheet - Bottom sheet for Messages
 * 
 * Single snap point at ~70% height
 * Swipe down or tap outside to close
 * Calm, intentional empty state
 */

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../home/hubThemeLight.css';

interface HubMessagesSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock conversations - empty for v1, will be replaced with real data
const MOCK_CONVERSATIONS: Array<{
  id: string;
  name: string;
  avatarUrl?: string;
  lastMessage: string;
  timestamp: string;
}> = [];

export const HubMessagesSheet: React.FC<HubMessagesSheetProps> = ({
  isOpen,
  onClose,
}) => {
  const rootScrollTopRef = useRef(0);
  const conversations = MOCK_CONVERSATIONS;
  const isEmpty = conversations.length === 0;

  // Scroll lock for #root container
  useEffect(() => {
    const rootEl = document.getElementById('root');
    if (!rootEl) return;

    if (isOpen) {
      rootScrollTopRef.current = rootEl.scrollTop;
      rootEl.style.overflow = 'hidden';
    }

    return () => {
      rootEl.style.overflow = '';
    };
  }, [isOpen]);

  // Restore scroll on close
  useEffect(() => {
    if (!isOpen) {
      const rootEl = document.getElementById('root');
      if (rootEl) {
        rootEl.style.overflow = '';
      }
    }
  }, [isOpen]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          
          {/* Sheet - 70% height snap point */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl overflow-hidden flex flex-col overscroll-contain"
            style={{ 
              height: '70vh',
              background: 'var(--hub-bg-start)',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            {/* Header with drag handle */}
            <div className="flex-shrink-0">
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-black/10" />
              </div>
              
              {/* Title bar with close button */}
              <div 
                className="flex items-center justify-between px-4 pb-3 border-b"
                style={{ borderColor: 'var(--hub-glass-border)' }}
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
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {isEmpty ? (
                /* Empty State - Calm, intentional design */
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <div 
                    className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                    style={{ 
                      background: 'var(--hub-glass-bg)',
                      opacity: 0.6,
                    }}
                  >
                    <MessageCircle 
                      className="w-7 h-7" 
                      style={{ color: 'var(--hub-text-dim)' }} 
                    />
                  </div>
                  <h3 
                    className="text-[17px] font-semibold mb-2"
                    style={{ color: 'var(--hub-text)' }}
                  >
                    Your conversations will live here
                  </h3>
                  <p 
                    className="text-[14px] leading-relaxed max-w-[280px]"
                    style={{ color: 'var(--hub-text-sub)' }}
                  >
                    Game chats, invites, and messages with golfers — all in one place.
                  </p>
                </div>
              ) : (
                /* Conversation list - for when messages exist */
                <div className="p-4 space-y-2">
                  {conversations.map(conv => (
                    <button
                      key={conv.id}
                      className="w-full flex items-center gap-3 p-3 rounded-xl transition"
                      style={{ background: 'var(--hub-glass-bg)' }}
                    >
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: 'var(--hub-glass-bg-hover)' }}
                      >
                        {conv.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div 
                          className="text-[14px] font-semibold truncate"
                          style={{ color: 'var(--hub-text)' }}
                        >
                          {conv.name}
                        </div>
                        <div 
                          className="text-[13px] truncate"
                          style={{ color: 'var(--hub-text-sub)' }}
                        >
                          {conv.lastMessage}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default HubMessagesSheet;
