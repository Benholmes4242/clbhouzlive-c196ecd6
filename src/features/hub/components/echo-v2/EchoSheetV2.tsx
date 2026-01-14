/**
 * EchoSheetV2 - Premium AI assistant sheet
 * 
 * Features:
 * - Chat | History tabs
 * - Conversation persistence to Supabase
 * - Pin/Delete from history
 * - 30-day auto-purge (server-side)
 * - 80% viewport height as per design spec
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, MoreVertical, Trash2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptic } from '@/utils/haptics';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useEchoConversation } from '@/features/echo/hooks/useEchoConversation';
import { useDeleteConversation } from '@/features/echo/hooks/useEchoHistory';
import { EchoMessageList } from './EchoMessageList';
import { EchoComposer } from './EchoComposer';
import { EchoEmptyState } from './EchoEmptyState';
import { EchoHistoryTab } from './EchoHistoryTab';
import { EchoTabPills, type EchoTab } from './EchoTabPills';
import { HUB_SHEET, ECHO_ORANGE, ECHO_SHEET_HEIGHT } from './echoStyles';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const deleteMutation = useDeleteConversation();
  
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

  const handleDeleteChatClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    haptic('medium');
    setShowMenu(false);
    setShowDeleteDialog(true);
  }, []);

  const handleConfirmDeleteChat = useCallback(() => {
    if (conversationId) {
      deleteMutation.mutate(conversationId);
      resetConversation();
      setShowDeleteDialog(false);
      toast.success('Chat deleted');
    }
  }, [conversationId, deleteMutation, resetConversation]);

  const handleNewChat = useCallback(() => {
    haptic('light');
    resetConversation();
    setActiveTab('chat');
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

  const handleDeleteCurrentConversation = useCallback(() => {
    resetConversation();
  }, [resetConversation]);

  const handleTabChange = useCallback((tab: EchoTab) => {
    setActiveTab(tab);
    if (tab === 'history') {
      queryClient.invalidateQueries({ queryKey: ['echo', 'conversations'] });
      queryClient.refetchQueries({ queryKey: ['echo', 'conversations'] });
    }
  }, [queryClient]);

  const hasMessages = messages.length > 0 || isStreaming;

  if (typeof document === 'undefined') return null;

  const portalRoot = document.getElementById('portal-root') || document.body;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[10001] bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
            aria-label="Close Echo"
          />

          {/* Sheet - 80% viewport height */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ 
              type: 'spring', 
              damping: 30, 
              stiffness: 350,
              mass: 0.8
            }}
            className={cn(
              "fixed inset-x-0 bottom-0 z-[10002] flex flex-col rounded-t-[24px] overflow-hidden",
              HUB_SHEET
            )}
            style={{ 
              height: ECHO_SHEET_HEIGHT, 
              maxHeight: ECHO_SHEET_HEIGHT 
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Echo AI Assistant"
          >
            {/* Grabber - swipe indicator */}
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div 
                className="w-10 h-1 rounded-full bg-slate-300/80 transition-colors hover:bg-slate-400/80"
                aria-hidden="true"
              />
            </div>

            {/* Header */}
            <header className="flex items-center justify-between px-5 pb-3 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ 
                    background: `linear-gradient(145deg, ${ECHO_ORANGE}22 0%, ${ECHO_ORANGE}11 100%)`,
                    border: `1.5px solid ${ECHO_ORANGE}30`,
                    boxShadow: `0 2px 8px ${ECHO_ORANGE}15`,
                  }}
                >
                  <Sparkles className="w-4 h-4" style={{ color: ECHO_ORANGE }} />
                </div>
                <h2 
                  className="text-[18px] font-semibold text-slate-900" 
                  style={{ letterSpacing: '-0.02em' }}
                >
                  Echo
                </h2>
              </div>
              
              <div className="flex items-center gap-0.5">
                {/* New chat button - 44x44 touch target */}
                {(hasMessages || activeTab === 'history') && (
                  <button
                    onClick={handleNewChat}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all duration-150 hover:bg-black/5 active:scale-95"
                    title="New chat"
                    aria-label="Start new chat"
                  >
                    <Plus className="w-5 h-5 text-slate-600" />
                  </button>
                )}

                {/* Menu button - only in chat tab with messages */}
                {activeTab === 'chat' && hasMessages && (
                  <div className="relative">
                    <button
                      onClick={handleMenuClick}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all duration-150 hover:bg-black/5 active:scale-95"
                      aria-label="Chat options"
                      aria-expanded={showMenu}
                    >
                      <MoreVertical className="w-5 h-5 text-slate-600" />
                    </button>
                    
                    {/* Dropdown menu */}
                    <AnimatePresence>
                      {showMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-1 w-48 rounded-2xl overflow-hidden bg-white/98 backdrop-blur-lg border border-black/8 shadow-xl z-[10003]"
                        >
                          <button
                            onClick={handleClearChat}
                            className="w-full flex items-center gap-2.5 px-4 py-3 text-[14px] font-medium transition-colors hover:bg-slate-50 text-slate-700"
                          >
                            <Trash2 className="w-4 h-4 text-slate-500" />
                            Clear chat
                          </button>
                          {conversationId && (
                            <button
                              onClick={handleDeleteChatClick}
                              className="w-full flex items-center gap-2.5 px-4 py-3 text-[14px] font-medium transition-colors hover:bg-red-50 text-red-600 border-t border-black/5"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete this chat
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
                
                {/* Close button - 44x44 touch target */}
                <button
                  onClick={handleClose}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all duration-150 hover:bg-black/5 active:scale-95"
                  aria-label="Close Echo"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </header>

            {/* Tabs with animation */}
            <div className="px-5 pb-3 flex-shrink-0">
              <EchoTabPills activeTab={activeTab} onTabChange={handleTabChange} />
            </div>

            {/* Divider */}
            <div className="h-px mx-5 flex-shrink-0 bg-gradient-to-r from-transparent via-black/8 to-transparent" />

            {/* Body - Tab content */}
            <AnimatePresence mode="wait">
              {activeTab === 'chat' ? (
                <motion.div 
                  key="chat"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col overflow-hidden relative"
                >
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
                </motion.div>
              ) : (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  <EchoHistoryTab
                    onSelectConversation={handleSelectConversation}
                    currentConversationId={conversationId}
                    onDeleteCurrentConversation={handleDeleteCurrentConversation}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Delete confirmation dialog */}
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent className="max-w-[320px] rounded-2xl z-[10010]">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this conversation and all its messages.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmDeleteChat}
                  className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </AnimatePresence>,
    portalRoot
  );
}
