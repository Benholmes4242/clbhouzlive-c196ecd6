/**
 * EchoSheetV2 - Premium AI assistant sheet
 * Clean design with warm orange accents on neutral #F8FAFC background
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, Trash2, Plus } from 'lucide-react';
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
import { type EchoTab } from './EchoTabPills';
import { HUB_SHEET } from './echoStyles';
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
    rateLimitCooldown,
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
    if (!trimmed || isStreaming || rateLimitCooldown) return;
    
    sendMessage(trimmed);
    setInput('');
  }, [input, isStreaming, sendMessage, rateLimitCooldown]);

  const sendPrompt = useCallback((prompt: string) => {
    if (isStreaming) {
      toast.info('Echo is still responding...');
      return;
    }
    if (rateLimitCooldown) {
      toast.warning(`Please wait ${rateLimitCooldown}s before sending`);
      return;
    }
    sendMessage(prompt);
    setInput('');
  }, [isStreaming, sendMessage, rateLimitCooldown]);

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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[10001] bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className={cn(
              "fixed inset-x-0 bottom-0 z-[10002] flex flex-col rounded-t-[28px] overflow-hidden",
              HUB_SHEET
            )}
            style={{ height: '90svh', maxHeight: '90svh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-4 flex-shrink-0 cursor-grab active:cursor-grabbing">
              <div className="w-9 h-1 bg-[#D1D5DB] rounded-full" />
            </div>

            {/* Tabs - Clean and minimal at top */}
            <div className="px-5 pb-4 flex-shrink-0">
              <div className="flex bg-[#F0F0F5] rounded-[12px] p-1">
                <button
                  onClick={() => handleTabChange('chat')}
                  className={cn(
                    "flex-1 py-2.5 rounded-[10px] text-[15px] font-semibold transition-all duration-200",
                    activeTab === 'chat' 
                      ? "bg-white shadow-sm text-[#1D1D1F]" 
                      : "text-[#86868B]"
                  )}
                >
                  Chat
                </button>
                <button
                  onClick={() => handleTabChange('history')}
                  className={cn(
                    "flex-1 py-2.5 rounded-[10px] text-[15px] font-semibold transition-all duration-200",
                    activeTab === 'history' 
                      ? "bg-white shadow-sm text-[#1D1D1F]" 
                      : "text-[#86868B]"
                  )}
                >
                  History
                </button>
              </div>
            </div>

            {/* New Chat button - only show in Chat tab when there are messages */}
            {activeTab === 'chat' && hasMessages && (
              <div className="px-5 pb-3 flex-shrink-0">
                <button
                  onClick={handleNewChat}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[10px] bg-white border border-[#E5E5EA] text-[14px] font-medium text-[#86868B] shadow-sm transition-all duration-150 hover:bg-[#F8FAFC] active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  New Chat
                </button>
              </div>
            )}

            {/* Body - Tab content */}
            {activeTab === 'chat' ? (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {!hasMessages ? (
                  <div className="flex-1 flex items-center justify-center">
                    <EchoEmptyState
                      onChipClick={handleChipClick}
                      onFocusInput={handleFocusInput}
                    />
                  </div>
                ) : (
                  <EchoMessageList
                    messages={messages}
                    isStreaming={isStreaming}
                    streamingContent={streamingContent}
                    onFollowUp={handleFollowUp}
                  />
                )}

                {/* Composer */}
                <EchoComposer
                  ref={composerInputRef}
                  value={input}
                  onChange={setInput}
                  onSend={handleSend}
                  onAbort={abortStream}
                  isStreaming={isStreaming}
                  autoFocus={hasMessages}
                  disabled={!!rateLimitCooldown}
                  cooldown={rateLimitCooldown}
                />
              </div>
            ) : (
              <EchoHistoryTab
                onSelectConversation={handleSelectConversation}
                currentConversationId={conversationId}
                onDeleteCurrentConversation={handleDeleteCurrentConversation}
              />
            )}
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
