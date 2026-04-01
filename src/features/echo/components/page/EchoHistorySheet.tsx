/**
 * EchoHistorySheet - Bottom sheet for viewing past Echo conversations (dark theme)
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, animate, PanInfo } from 'framer-motion';
import { Clock, ChevronRight, Trash2, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEchoConversations } from '../../hooks/useEchoHistory';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { haptic } from '@/utils/haptics';
import { AnimatedEchoWave } from '@/features/echo/components/ui/AnimatedEchoWave';

interface EchoHistorySheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (conversationId: string) => void;
}

interface EchoConversation {
  id: string;
  title: string | null;
  last_message_at: string;
  created_at: string;
}

function formatRelativeDate(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}


function useDeleteEchoConversation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase
        .from('echo_conversations')
        .delete()
        .eq('id', conversationId);
      
      if (error) throw error;

      await supabase
        .from('echo_conversation_messages')
        .delete()
        .eq('conversation_id', conversationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['echo', 'conversations'] });
    },
  });
}

function HistorySkeleton() {
  return (
    <div className="px-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-0 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 rounded-full w-3/4" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <Skeleton className="h-3 rounded-full w-1/2" style={{ background: 'rgba(255,255,255,0.04)' }} />
          </div>
          <Skeleton className="h-3 rounded-full w-12" style={{ background: 'rgba(255,255,255,0.04)' }} />
        </div>
      ))}
    </div>
  );
}

function SwipeableConversationRow({ 
  conv, 
  onSelect, 
  onDelete,
  showDivider 
}: { 
  conv: EchoConversation; 
  onSelect: () => void; 
  onDelete: () => void;
  showDivider: boolean;
}) {
  const x = useMotionValue(0);
  
  const handleDragEnd = () => {
    const currentX = x.get();
    if (currentX < -60) {
      animate(x, -80);
    } else {
      animate(x, 0);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
    animate(x, 0);
  };

  const handleSelect = () => {
    if (Math.abs(x.get()) < 5) {
      onSelect();
    } else {
      animate(x, 0);
    }
  };

  const displayTitle = conv.title || 'New conversation';

  return (
    <div className="relative overflow-hidden">
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-destructive flex items-center justify-center" role="none">
        <button 
          onClick={handleDelete} 
          className="w-full h-full flex items-center justify-center"
          aria-label="Delete conversation"
        >
          <Trash2 className="w-5 h-5 text-white" />
        </button>
      </div>
      
      <motion.div
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={{ left: 0.1, right: 0 }}
        onDragEnd={handleDragEnd}
        style={{ x, background: '#161618' }}
        onClick={handleSelect}
        className="relative px-4 py-3 flex items-center gap-3 active:bg-white/[0.02] transition-colors cursor-pointer"
        role="listitem"
        aria-label={`Open conversation: ${displayTitle}`}
      >
        {/* Amber icon square */}
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: 42,
            height: 42,
            borderRadius: 13,
            background: 'linear-gradient(135deg, rgba(247,147,30,0.22), rgba(247,147,30,0.10))',
            border: '1px solid rgba(247,147,30,0.22)',
          }}
        >
          <AnimatedEchoWave size={18} color="#F7931E" active={true} />
        </div>
        
        <div className="flex-1 min-w-0">
          <span
            className="text-[14px] font-semibold truncate block"
            style={{ color: 'rgba(255,255,255,0.88)' }}
          >
            {displayTitle}
          </span>
          <p
            className="text-[12px] truncate"
            style={{ color: 'rgba(255,255,255,0.28)' }}
          >
            Tap to continue conversation
          </p>
        </div>

        <span
          className="text-[11px] flex-shrink-0 ml-1"
          style={{ color: 'rgba(255,255,255,0.22)' }}
        >
          {formatRelativeDate(conv.last_message_at || conv.created_at)}
        </span>
        
        <ChevronRight className="w-[13px] h-[13px] flex-shrink-0" style={{ color: 'rgba(247,147,30,0.35)' }} />
      </motion.div>
      
      {showDivider && (
        <div className="h-px ml-[62px]" style={{ background: 'rgba(255,255,255,0.05)' }} />
      )}
    </div>
  );
}

export function EchoHistorySheet({ isOpen, onClose, onSelectConversation }: EchoHistorySheetProps) {
  const { data: conversations, isLoading, refetch } = useEchoConversations();
  const deleteConversation = useDeleteEchoConversation();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const prefersReduced = usePrefersReducedMotion();
  const sheetY = useMotionValue(0);

  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);

  const handleDeleteRequest = (conversationId: string) => {
    setConfirmDelete(conversationId);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteConversation.mutateAsync(confirmDelete);
      haptic('medium');
      toast.success('Conversation deleted');
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Failed to delete conversation');
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleSheetDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
    animate(sheetY, 0, { type: 'spring', damping: 25, stiffness: 300 });
  };

  const handleNewConversation = () => {
    haptic('light');
    onClose();
  };

  const animationProps = prefersReduced 
    ? { initial: false, exit: undefined, transition: { duration: 0 } }
    : { initial: { opacity: 0 }, exit: { opacity: 0 }, transition: { duration: 0.2 } };

  const sheetAnimProps = prefersReduced
    ? { initial: false as const, exit: undefined, transition: { duration: 0 } }
    : { initial: { y: '100%' }, exit: { y: '100%' }, transition: { type: 'tween' as const, duration: 0.3, ease: 'easeOut' as const } };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.60)' }}
            initial={animationProps.initial}
            animate={{ opacity: 1 }}
            exit={animationProps.exit}
            onClick={onClose}
          />
          
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleSheetDragEnd}
            style={{ y: sheetY, background: '#0c0c0e' }}
            className="fixed bottom-0 inset-x-0 mx-auto z-50 w-full max-w-[480px] rounded-t-[22px] h-[75vh] flex flex-col"
            initial={sheetAnimProps.initial}
            animate={{ y: 0 }}
            exit={sheetAnimProps.exit}
            transition={sheetAnimProps.transition}
            role="dialog"
            aria-label="Conversation history"
          >
            {/* Drag handle */}
            <div 
              className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
              aria-label="Drag to close"
            >
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
            </div>
            
            {/* Header */}
            <div
              className="px-5 pb-3 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-center gap-2">
                <AnimatedEchoWave size={14} active={true} />
                <h2
                  className="text-[17px] font-bold"
                  style={{ color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.01em' }}
                >
                  Conversations
                </h2>
              </div>
              <button
                onClick={onClose}
                className="flex items-center justify-center active:scale-[0.95] transition-transform"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.07)',
                }}
                aria-label="Close history"
              >
                <X className="w-[16px] h-[16px]" style={{ color: 'rgba(255,255,255,0.45)' }} />
              </button>
            </div>
            
            <div 
              className="flex-1 min-h-0 overflow-y-auto" 
              role="list"
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
              {isLoading ? (
                <HistorySkeleton />
              ) : !conversations || conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    <Clock className="w-7 h-7" style={{ color: 'rgba(255,255,255,0.25)' }} />
                  </div>
                  <h3 className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>No history yet</h3>
                  <p className="text-[14px] text-center px-8" style={{ color: 'rgba(255,255,255,0.30)' }}>
                    Your past conversations will appear here
                  </p>
                </div>
              ) : (
                <>
                  <div className="px-3 pt-3 flex flex-col gap-[6px]">
                    {conversations.map((conv, index) => (
                      <SwipeableConversationRow
                        key={conv.id}
                        conv={conv}
                        onSelect={() => onSelectConversation(conv.id)}
                        onDelete={() => handleDeleteRequest(conv.id)}
                        showDivider={index < conversations.length - 1}
                      />
                    ))}
                  </div>

                  {/* New conversation CTA */}
                  <div className="px-4 mt-4">
                    <button
                      onClick={handleNewConversation}
                      className="w-full py-3 rounded-[13px] text-[14px] font-semibold active:scale-[0.98] transition-all"
                      style={{
                        background: 'rgba(247,147,30,0.10)',
                        border: '1px solid rgba(247,147,30,0.20)',
                        color: '#F7931E',
                      }}
                    >
                      ＋ New conversation
                    </button>
                  </div>

                  <p
                    className="text-center mt-3 text-[12px] pb-4"
                    style={{ color: 'rgba(255,255,255,0.18)' }}
                  >
                    Swipe left to delete a conversation
                  </p>
                </>
              )}
            </div>
          </motion.div>

          <AnimatePresence>
            {confirmDelete && (
              <>
                <motion.div
                  className="fixed inset-0 z-[60]"
                  style={{ background: 'rgba(0,0,0,0.50)' }}
                  initial={animationProps.initial}
                  animate={{ opacity: 1 }}
                  exit={animationProps.exit}
                  onClick={() => setConfirmDelete(null)}
                />
                <motion.div 
                  className="fixed inset-0 z-[70] flex items-center justify-center px-6"
                  initial={animationProps.initial}
                  animate={{ opacity: 1 }}
                  exit={animationProps.exit}
                >
                  <motion.div 
                    className="rounded-2xl p-6 max-w-[300px] w-full shadow-xl"
                    style={{ background: '#161618', border: '1px solid rgba(255,255,255,0.08)' }}
                    initial={prefersReduced ? false : { scale: 0.9 }}
                    animate={{ scale: 1 }}
                    exit={prefersReduced ? undefined : { scale: 0.9 }}
                    role="alertdialog"
                    aria-label="Confirm delete"
                  >
                    <h3
                      className="text-[1.0625rem] font-semibold mb-2"
                      style={{ color: 'rgba(255,255,255,0.90)' }}
                    >
                      Delete conversation?
                    </h3>
                    <p
                      className="text-[0.875rem] mb-6"
                      style={{ color: 'rgba(255,255,255,0.40)' }}
                    >
                      This can't be undone.
                    </p>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setConfirmDelete(null)}
                        className="flex-1 rounded-full text-[0.9375rem] font-semibold active:scale-[0.97] transition-transform"
                        style={{ background: 'rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.80)', height: 48 }}
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleConfirmDelete}
                        disabled={deleteConversation.isPending}
                        className="flex-1 bg-destructive rounded-full text-[0.9375rem] font-semibold text-white active:scale-[0.97] transition-transform disabled:opacity-50"
                        style={{
                          height: 48,
                          boxShadow: '0 4px 12px rgba(239,68,68,0.35)',
                        }}
                      >
                        {deleteConversation.isPending ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}