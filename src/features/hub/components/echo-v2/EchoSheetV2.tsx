/**
 * EchoSheetV2 - Premium AI assistant sheet
 * 
 * Features:
 * - Chat | History tabs
 * - Conversation persistence to Supabase
 * - Pin/Delete from history
 * - 30-day auto-purge (server-side)
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, MoreVertical, Trash2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptic } from '@/utils/haptics';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useEchoConversation } from '@/features/echo/hooks/useEchoConversation';
import { EchoMessageList } from './EchoMessageList';
import { EchoComposer } from './EchoComposer';
import { EchoEmptyState } from './EchoEmptyState';
import { EchoHistoryTab } from './EchoHistoryTab';
import { EchoTabPills, type EchoTab } from './EchoTabPills';

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
  const queryClient = useQueryClient();
  
  const [input, setInput] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<EchoTab>('chat');
  
  const {
    conversationId,
    messages,
    sendMessage,
    isStreaming,
    streamingContent,
    abortStream,
    resetConversation,
    loadConversation,
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
        setActiveTab('chat');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!showMenu) return;
    
    const handleClickOutside = () => setShowMenu(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMenu]);

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

  // Safe chip/follow-up handler that respects streaming state
  const sendPrompt = useCallback((prompt: string) => {
    if (isStreaming) {
      toast.info('Echo is still responding...');
      return;
    }
    sendMessage(prompt);
    setInput('');
  }, [isStreaming, sendMessage]);

  const handleChipClick = useCallback((prompt: string) => {
    haptic('light');
    sendPrompt(prompt);
  }, [sendPrompt]);

  const handleFollowUp = useCallback((text: string) => {
    haptic('light');
    sendPrompt(text);
  }, [sendPrompt]);

  const handleFocusInput = useCallback(() => {
    composerInputRef.current?.focus({ preventScroll: true });
  }, []);

  const handleClearChat = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    haptic('medium');
    setShowMenu(false);
    resetConversation();
    toast.success('Chat cleared');
  }, [resetConversation]);

  const handleNewChat = useCallback(() => {
    haptic('light');
    resetConversation();
    setActiveTab('chat');
    // Invalidate history to show any pending changes
    queryClient.invalidateQueries({ queryKey: ['echo', 'conversations'] });
  }, [resetConversation, queryClient]);

  const handleMenuClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(prev => !prev);
  }, []);

  const handleSelectConversation = useCallback((convId: string) => {
    loadConversation(convId);
    setActiveTab('chat');
  }, [loadConversation]);

  const handleTabChange = useCallback((tab: EchoTab) => {
    setActiveTab(tab);
    if (tab === 'history') {
      // Refresh history when switching to it
      queryClient.invalidateQueries({ queryKey: ['echo', 'conversations'] });
    }
  }, [queryClient]);

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
            className="fixed inset-0 z-[10001] bg-black/35 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-x-0 bottom-0 z-[10002] flex flex-col rounded-t-[28px] overflow-hidden bg-background"
            style={{ height: '92svh', maxHeight: '92svh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grabber */}
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div className="w-9 h-[3px] rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div 
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ 
                    background: 'linear-gradient(135deg, hsl(var(--echo-accent, 270 60% 60%) / 0.12) 0%, hsl(var(--echo-accent-dark, 262 83% 58%) / 0.08) 100%)',
                    border: '1px solid hsl(var(--echo-accent, 270 60% 60%) / 0.15)',
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[hsl(var(--echo-accent,270_60%_60%))]" />
                </div>
                <h2 className="text-[17px] font-semibold text-foreground" style={{ letterSpacing: '-0.01em' }}>
                  Echo
                </h2>
              </div>
              
              <div className="flex items-center gap-1">
                {/* New chat button */}
                {(hasMessages || activeTab === 'history') && (
                  <button
                    onClick={handleNewChat}
                    className="p-2 rounded-full transition-all duration-150 hover:bg-muted active:scale-95"
                    title="New chat"
                  >
                    <Plus className="w-5 h-5 text-muted-foreground" />
                  </button>
                )}

                {/* Menu button - only in chat tab with messages */}
                {activeTab === 'chat' && hasMessages && (
                  <div className="relative">
                    <button
                      onClick={handleMenuClick}
                      className="p-2 rounded-full transition-all duration-150 hover:bg-muted active:scale-95"
                    >
                      <MoreVertical className="w-5 h-5 text-muted-foreground" />
                    </button>
                    
                    {/* Dropdown */}
                    <AnimatePresence>
                      {showMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.95 }}
                          className="absolute right-0 top-full mt-1 w-40 rounded-xl overflow-hidden bg-popover border border-border shadow-lg z-[10003]"
                        >
                          <button
                            onClick={handleClearChat}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-[13px] font-medium transition-all hover:bg-destructive/10 text-destructive"
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
                  className="p-2 -mr-2 rounded-full transition-all duration-150 hover:bg-muted active:scale-95"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-5 pb-3 flex-shrink-0">
              <EchoTabPills activeTab={activeTab} onTabChange={handleTabChange} />
            </div>

            {/* Divider */}
            <div className="h-px mx-5 flex-shrink-0 bg-border/30" />

            {/* Body - Tab content */}
            {activeTab === 'chat' ? (
              <>
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

                {/* Composer - Always visible in chat tab */}
                <EchoComposer
                  ref={composerInputRef}
                  value={input}
                  onChange={setInput}
                  onSend={handleSend}
                  onAbort={abortStream}
                  isStreaming={isStreaming}
                  autoFocus={hasMessages}
                />
              </>
            ) : (
              <EchoHistoryTab
                onSelectConversation={handleSelectConversation}
                currentConversationId={conversationId}
              />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portalRoot
  );
}
