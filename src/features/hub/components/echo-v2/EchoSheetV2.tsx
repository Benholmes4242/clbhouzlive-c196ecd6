/**
 * EchoSheetV2 - Premium AI assistant sheet
 * 
 * Features:
 * - Chat | History tabs with warm aesthetic
 * - Conversation persistence to Supabase
 * - Pin/Delete from history
 * - 30-day auto-purge (server-side)
 * - 90% viewport height
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, MoreVertical, Trash2, Plus } from 'lucide-react';
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

// Echo Orb component - matches Hub page design
function EchoOrb({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { container: 'w-10 h-10', bars: 'gap-[2px]', bar1: 'w-[2px] h-1.5', bar2: 'w-[2px] h-2.5', bar3: 'w-[2px] h-1.5' },
    md: { container: 'w-11 h-11', bars: 'gap-[2px]', bar1: 'w-[2.5px] h-2', bar2: 'w-[2.5px] h-3.5', bar3: 'w-[2.5px] h-2' },
    lg: { container: 'w-16 h-16', bars: 'gap-[3px]', bar1: 'w-[3px] h-3', bar2: 'w-[3px] h-5', bar3: 'w-[3px] h-3' },
  };
  
  const s = sizes[size];
  
  return (
    <div className={`${s.container} rounded-full bg-[#FFBF66] flex items-center justify-center shadow-sm`}>
      <div className={`flex items-center ${s.bars}`}>
        <div 
          className={`${s.bar1} bg-white rounded-full`} 
          style={{ animation: 'gentleWave 3s ease-in-out infinite' }} 
        />
        <div 
          className={`${s.bar2} bg-white rounded-full`} 
          style={{ animation: 'gentleWave 3s ease-in-out infinite', animationDelay: '0.5s' }} 
        />
        <div 
          className={`${s.bar3} bg-white rounded-full`} 
          style={{ animation: 'gentleWave 3s ease-in-out infinite', animationDelay: '1s' }} 
        />
      </div>
    </div>
  );
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

  // Safe chip/follow-up handler that respects streaming state
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

          {/* Sheet - 90% viewport height with warm background */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[10002] flex flex-col rounded-t-[28px] overflow-hidden bg-[#FFFAF5]"
            style={{ height: '90svh', maxHeight: '90svh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grabber - warm tint */}
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-[#E5DDD5]" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <EchoOrb size="md" />
                <span className="text-[20px] font-semibold text-[#1D1D1F]">Echo</span>
              </div>
              
              <div className="flex items-center gap-2">
                {/* New chat button */}
                {(hasMessages || activeTab === 'history') && (
                  <button
                    onClick={handleNewChat}
                    className="w-9 h-9 rounded-full bg-white border border-[#E8E0D8] flex items-center justify-center transition-all duration-150 hover:bg-[#FFFAF5] active:scale-95"
                    title="New chat"
                  >
                    <Plus className="w-5 h-5 text-[#86868B]" />
                  </button>
                )}

                {/* Menu button - only in chat tab with messages */}
                {activeTab === 'chat' && hasMessages && (
                  <div className="relative">
                    <button
                      onClick={handleMenuClick}
                      className="w-9 h-9 rounded-full bg-white border border-[#E8E0D8] flex items-center justify-center transition-all duration-150 hover:bg-[#FFFAF5] active:scale-95"
                    >
                      <MoreVertical className="w-5 h-5 text-[#86868B]" />
                    </button>
                    
                    {/* Dropdown */}
                    <AnimatePresence>
                      {showMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-1 w-44 rounded-xl overflow-hidden bg-white border border-[#E8E0D8] shadow-lg z-[10003]"
                        >
                          <button
                            onClick={handleClearChat}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium transition-all hover:bg-[#FFFAF5] text-[#1D1D1F]"
                          >
                            <Trash2 className="w-4 h-4 text-[#86868B]" />
                            Clear chat
                          </button>
                          {conversationId && (
                            <button
                              onClick={handleDeleteChatClick}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium transition-all hover:bg-red-50 text-red-600 border-t border-[#F0E6DC]"
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
                
                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="w-9 h-9 rounded-full bg-white border border-[#E8E0D8] flex items-center justify-center transition-all duration-150 hover:bg-[#FFFAF5] active:scale-95"
                >
                  <X className="w-5 h-5 text-[#86868B]" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-5 pb-4 flex-shrink-0">
              <EchoTabPills activeTab={activeTab} onTabChange={handleTabChange} />
            </div>

            {/* Body - Tab content */}
            {activeTab === 'chat' ? (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                {!hasMessages ? (
                  /* Empty state - absolutely centered in the available space above composer */
                  <div className="absolute inset-0 bottom-[72px] flex items-center justify-center px-5">
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

                {/* Composer - Always visible in chat tab */}
                <div className="mt-auto flex-shrink-0">
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
