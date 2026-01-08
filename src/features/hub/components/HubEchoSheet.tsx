/**
 * HubEchoSheet - Bottom sheet for Echo AI chat
 * 
 * V2: Uses shared EchoChatSurface with real AI wiring
 * - No navigation to external pages
 * - Real AI responses via useEchoConversation
 * - Empty state → Chat thread transition
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EchoChatSurface, EchoChatSurfaceRef } from '@/features/echo/components/EchoChatSurface';
import '../home/hubThemeLight.css';

interface HubEchoSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string;
}

// Prompt chips for quick start
const PROMPT_CHIPS = [
  'Fix my slice',
  'What club from 155y?',
  'Course tips for Portrush',
  'How does stableford work?',
];

export const HubEchoSheet: React.FC<HubEchoSheetProps> = ({
  isOpen,
  onClose,
  initialMessage = '',
}) => {
  const rootScrollTopRef = useRef(0);
  const wasOpenRef = useRef(false);
  const chatSurfaceRef = useRef<EchoChatSurfaceRef>(null);
  
  const [chatStarted, setChatStarted] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');

  // Complete scroll-lock: save position on open, restore on close
  useEffect(() => {
    const rootEl = document.getElementById('root');
    if (!rootEl) return;

    if (isOpen && !wasOpenRef.current) {
      rootScrollTopRef.current = rootEl.scrollTop;
      rootEl.style.overflow = 'hidden';
      wasOpenRef.current = true;
    } else if (!isOpen && wasOpenRef.current) {
      rootEl.style.overflow = '';
      rootEl.scrollTop = rootScrollTopRef.current;
      wasOpenRef.current = false;
    }

    return () => {
      if (wasOpenRef.current) {
        rootEl.style.overflow = '';
        rootEl.scrollTop = rootScrollTopRef.current;
        wasOpenRef.current = false;
      }
    };
  }, [isOpen]);

  // Reset state when sheet closes
  useEffect(() => {
    if (!isOpen) {
      setChatStarted(false);
      setPendingMessage('');
    }
  }, [isOpen]);

  // Handle initial message on open
  useEffect(() => {
    if (isOpen && initialMessage) {
      setPendingMessage(initialMessage);
      // Auto-focus when there's an initial message
      setTimeout(() => {
        chatSurfaceRef.current?.focus();
      }, 200);
    }
  }, [isOpen, initialMessage]);

  // Prevent clicks inside sheet from closing
  const handleSheetClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // Handle prompt chip click - send message immediately
  const handleChipClick = useCallback((prompt: string) => {
    setChatStarted(true);
    // Small delay to let the chat surface mount
    setTimeout(() => {
      chatSurfaceRef.current?.sendMessage(prompt);
    }, 50);
  }, []);

  // Callback when chat becomes active
  const handleChatStarted = useCallback(() => {
    setChatStarted(true);
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
          
          {/* Sheet - 80% height snap point */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-x-0 bottom-0 z-[10002] rounded-t-2xl overflow-hidden flex flex-col overscroll-contain"
            style={{ 
              height: '80vh',
              background: 'var(--hub-bg-start)',
            }}
            onClick={handleSheetClick}
          >
            {/* Header - always visible, sticky */}
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
                  className="text-[17px] font-semibold"
                  style={{ color: 'var(--hub-text)' }}
                >
                  Echo
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                  style={{ background: 'var(--hub-glass-bg)' }}
                  aria-label="Close"
                >
                  <X className="w-5 h-5" style={{ color: 'var(--hub-text-muted)' }} />
                </button>
              </div>
            </div>
            
            {/* Content */}
            {!chatStarted && !pendingMessage ? (
              /* Empty State - centered with breathing room */
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <div className="flex flex-col items-center justify-center text-center px-6 py-12 min-h-full -mt-8">
                  {/* Icon - subtle watermark feel */}
                  <div className="mb-5">
                    <div 
                      className="w-14 h-14 rounded-full flex items-center justify-center"
                      style={{ 
                        background: 'var(--hub-glass-bg)',
                        opacity: 0.45,
                      }}
                    >
                      <Sparkles 
                        className="w-7 h-7" 
                        style={{ color: 'var(--hub-text-dim)' }} 
                      />
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h3 
                    className="text-[19px] font-semibold mb-2"
                    style={{ color: 'var(--hub-text)' }}
                  >
                    Ask Echo
                  </h3>
                  
                  {/* Subtext */}
                  <p 
                    className="text-[14px] leading-relaxed mb-6"
                    style={{ 
                      color: 'var(--hub-text-sub)',
                      maxWidth: '260px',
                    }}
                  >
                    Tips, course info, rules, or just golf chat — right when you need it.
                  </p>
                  
                  {/* Prompt chips section */}
                  <div className="w-full max-w-[320px]">
                    {/* Label */}
                    <p 
                      className="text-[11px] uppercase tracking-wide mb-2.5"
                      style={{ color: 'var(--hub-text-dim)' }}
                    >
                      Try one of these
                    </p>
                    
                    {/* Chips */}
                    <div className="flex flex-wrap justify-center gap-2">
                      {PROMPT_CHIPS.map((chip) => (
                        <button
                          key={chip}
                          onClick={() => handleChipClick(chip)}
                          className="px-3 py-1.5 rounded-full text-[13px] font-medium transition-all active:scale-[0.97]"
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--hub-stroke)',
                            color: 'var(--hub-text-muted)',
                          }}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Chat Surface - real AI wiring */
              <EchoChatSurface
                ref={chatSurfaceRef}
                initialMessage={pendingMessage}
                onChatStarted={handleChatStarted}
                hubTheme
              />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};
