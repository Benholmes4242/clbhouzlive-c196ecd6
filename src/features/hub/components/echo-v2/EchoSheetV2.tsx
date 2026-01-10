/**
 * EchoSheetV2 - Premium AI assistant sheet
 * 
 * Matches Hub design language:
 * - Frosted glass aesthetics
 * - Clean typography
 * - Premium animations
 * - Same scroll-lock pattern as other sheets
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, MoreVertical, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptic } from '@/utils/haptics';
import { useEchoConversation } from '@/features/echo/hooks/useEchoConversation';
import { EchoMessageList } from './EchoMessageList';
import { EchoComposer } from './EchoComposer';
import { EchoEmptyState } from './EchoEmptyState';
import '../../home/hubThemeLight.css';

interface EchoSheetV2Props {
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string;
}

export function EchoSheetV2({
  isOpen,
  onClose,
  initialMessage = '',
}: EchoSheetV2Props) {
  const scrollYRef = useRef(0);
  const wasOpenRef = useRef(false);
  const composerInputRef = useRef<HTMLInputElement>(null);
  
  const [input, setInput] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  
  const {
    messages,
    sendMessage,
    isStreaming,
    streamingContent,
    abortStream,
  } = useEchoConversation({ resetOnMount: true });

  // Scroll-lock
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      scrollYRef.current = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollYRef.current}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      wasOpenRef.current = true;
    } else if (!isOpen && wasOpenRef.current) {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollYRef.current);
      wasOpenRef.current = false;
    }

    return () => {
      if (wasOpenRef.current) {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollYRef.current);
        wasOpenRef.current = false;
      }
    };
  }, [isOpen]);

  // Handle initial message
  useEffect(() => {
    if (isOpen && initialMessage) {
      setInput(initialMessage);
    }
  }, [isOpen, initialMessage]);

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setInput('');
        setShowMenu(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    haptic('light');
    onClose();
  }, [onClose]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    
    sendMessage(trimmed);
    setInput('');
  }, [input, isStreaming, sendMessage]);

  const handleChipClick = useCallback((prompt: string) => {
    setInput(prompt);
    // Auto-send after a brief delay
    setTimeout(() => {
      sendMessage(prompt);
      setInput('');
    }, 100);
  }, [sendMessage]);

  const handleFollowUp = useCallback((text: string) => {
    setInput(text);
    setTimeout(() => {
      sendMessage(text);
      setInput('');
    }, 100);
  }, [sendMessage]);

  const handleFocusInput = useCallback(() => {
    composerInputRef.current?.focus({ preventScroll: true });
  }, []);

  const handleClearChat = useCallback(() => {
    haptic('medium');
    setShowMenu(false);
    // The conversation resets on mount, so we close and reopen
    // For now, just close the menu - full clear requires page reload
    try {
      localStorage.removeItem('echo-current-conversation');
      window.location.reload();
    } catch (e) {
      console.warn('Could not clear chat:', e);
    }
  }, []);

  const hasMessages = messages.length > 0 || isStreaming;

  if (typeof document === 'undefined') return null;

  const portalRoot = document.getElementById('portal-root') || document.body;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[10001]"
            style={{
              background: 'rgba(0, 0, 0, 0.35)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
            onClick={handleClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-x-0 bottom-0 z-[10002] flex flex-col rounded-t-[28px] overflow-hidden"
            style={{
              height: '92svh',
              maxHeight: '92svh',
              background: '#F8FAFC',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grabber */}
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div 
                className="w-9 h-[3px] rounded-full"
                style={{ background: 'rgba(0, 0, 0, 0.1)' }}
              />
            </div>

            {/* Header */}
            <div 
              className="flex items-center justify-between px-5 pb-3 flex-shrink-0"
              style={{ 
                borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
              }}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)',
                    border: '1px solid rgba(168, 85, 247, 0.15)',
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5" style={{ color: '#a855f7' }} />
                </div>
                <h2 
                  className="text-[17px] font-semibold"
                  style={{ color: '#1e293b', letterSpacing: '-0.01em' }}
                >
                  Echo
                </h2>
              </div>
              
              <div className="flex items-center gap-1">
                {/* Menu button */}
                {hasMessages && (
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="p-2 rounded-full transition-all duration-150 hover:bg-black/5 active:scale-95"
                    >
                      <MoreVertical 
                        className="w-5 h-5"
                        style={{ color: 'rgba(100, 116, 139, 0.6)' }}
                      />
                    </button>
                    
                    {/* Dropdown */}
                    <AnimatePresence>
                      {showMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.95 }}
                          className="absolute right-0 top-full mt-1 w-40 rounded-xl overflow-hidden"
                          style={{
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(12px)',
                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                            border: '1px solid rgba(0, 0, 0, 0.06)',
                          }}
                        >
                          <button
                            onClick={handleClearChat}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-[13px] font-medium transition-all hover:bg-red-50"
                            style={{ color: '#ef4444' }}
                          >
                            <Trash2 className="w-4 h-4" />
                            Clear chat
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
                
                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="p-2 -mr-2 rounded-full transition-all duration-150 hover:bg-black/5 active:scale-95"
                >
                  <X 
                    className="w-5 h-5"
                    style={{ color: 'rgba(100, 116, 139, 0.6)' }}
                  />
                </button>
              </div>
            </div>

            {/* Body - Empty state or messages */}
            {!hasMessages ? (
              <EchoEmptyState
                onChipClick={handleChipClick}
                onFocusInput={handleFocusInput}
              />
            ) : (
              <EchoMessageList
                messages={messages}
                isStreaming={isStreaming}
                streamingContent={streamingContent}
                onFollowUp={handleFollowUp}
              />
            )}

            {/* Composer - Always visible */}
            <EchoComposer
              value={input}
              onChange={setInput}
              onSend={handleSend}
              onAbort={abortStream}
              isStreaming={isStreaming}
              autoFocus={hasMessages}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portalRoot
  );
}
