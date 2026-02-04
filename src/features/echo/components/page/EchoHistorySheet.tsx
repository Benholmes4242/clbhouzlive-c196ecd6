/**
 * EchoHistorySheet - Bottom sheet for viewing past Echo conversations
 * Features: swipe-to-delete, delete confirmation, internal scrolling
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { Clock, ChevronRight, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEchoConversations } from '../../hooks/useEchoHistory';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

// Haptic feedback helper
function haptic(style: 'light' | 'medium' | 'heavy' = 'medium') {
  if ('vibrate' in navigator) {
    const patterns = { light: 10, medium: 20, heavy: 30 };
    navigator.vibrate(patterns[style]);
  }
}

// Delete mutation hook
function useDeleteEchoConversation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (conversationId: string) => {
      // Delete messages first (foreign key constraint)
      await supabase
        .from('echo_conversation_messages')
        .delete()
        .eq('conversation_id', conversationId);
      
      // Then delete conversation
      const { error } = await supabase
        .from('echo_conversations')
        .delete()
        .eq('id', conversationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['echo', 'conversations'] });
    },
  });
}

// Swipeable conversation item component
function SwipeableConversationItem({ 
  conv, 
  onSelect, 
  onDelete 
}: { 
  conv: EchoConversation; 
  onSelect: () => void; 
  onDelete: () => void;
}) {
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-100, -50], [1, 0]);
  const deleteScale = useTransform(x, [-100, -50], [1, 0.8]);
  
  const handleDragEnd = () => {
    const currentX = x.get();
    if (currentX < -60) {
      // Swiped far enough - keep delete visible
      animate(x, -72);
    } else {
      // Snap back
      animate(x, 0);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
    animate(x, 0);
  };

  const handleSelect = () => {
    // Only select if not swiped
    if (Math.abs(x.get()) < 5) {
      onSelect();
    } else {
      // Reset swipe if tapped while swiped
      animate(x, 0);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Delete button behind */}
      <motion.div 
        className="absolute right-0 top-0 bottom-0 w-[72px] bg-red-500 flex items-center justify-center rounded-r-2xl"
        style={{ opacity: deleteOpacity, scale: deleteScale }}
      >
        <button onClick={handleDelete} className="w-full h-full flex items-center justify-center">
          <Trash2 className="w-5 h-5 text-white" />
        </button>
      </motion.div>
      
      {/* Swipeable conversation card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -72, right: 0 }}
        dragElastic={{ left: 0.1, right: 0 }}
        onDragEnd={handleDragEnd}
        style={{ x }}
        onClick={handleSelect}
        className="relative flex items-center gap-4 p-4 bg-white border border-[#E5E5EA] rounded-2xl w-full text-left shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
      >
        {/* Mini orb */}
        <div className="w-10 h-10 rounded-full bg-[#FFBF66] flex items-center justify-center flex-shrink-0">
          <div className="flex items-center gap-[2px]">
            <div className="w-[2px] h-1.5 bg-white rounded-full" />
            <div className="w-[2px] h-2.5 bg-white rounded-full" />
            <div className="w-[2px] h-1.5 bg-white rounded-full" />
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-medium text-[#1D1D1F] truncate">
            {conv.title || 'Untitled conversation'}
          </p>
          <p className="text-[13px] text-[#86868B]">
            {formatRelativeDate(conv.last_message_at || conv.created_at)}
          </p>
        </div>
        
        {/* Chevron */}
        <ChevronRight className="w-5 h-5 text-[#C7C7CC] flex-shrink-0" />
      </motion.div>
    </div>
  );
}

export function EchoHistorySheet({ isOpen, onClose, onSelectConversation }: EchoHistorySheetProps) {
  const { data: conversations, isLoading, refetch } = useEchoConversations();
  const deleteConversation = useDeleteEchoConversation();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Refetch when sheet opens for fresh data
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/25 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#F8FAFC] rounded-t-[28px] h-[75vh] flex flex-col"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            {/* Drag handle - fixed */}
            <div className="flex-none flex justify-center pt-3 pb-4">
              <div className="w-9 h-1 bg-[#D1D5DB] rounded-full" />
            </div>
            
            {/* Title - fixed */}
            <div className="flex-none px-5 pb-4">
              <h2 className="text-[20px] font-semibold text-[#1D1D1F]">History</h2>
            </div>
            
            {/* Scrollable conversation list */}
            <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-8">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-[#FFBF66] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : !conversations || conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-14 h-14 rounded-full bg-[#F0F0F5] flex items-center justify-center mb-4">
                    <Clock className="w-6 h-6 text-[#C7C7CC]" />
                  </div>
                  <h3 className="text-[17px] font-semibold text-[#1D1D1F] mb-1">No history yet</h3>
                  <p className="text-[14px] text-[#86868B] text-center">
                    Your past conversations will appear here
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {conversations.map((conv) => (
                    <SwipeableConversationItem
                      key={conv.id}
                      conv={conv}
                      onSelect={() => onSelectConversation(conv.id)}
                      onDelete={() => handleDeleteRequest(conv.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Delete confirmation modal */}
          <AnimatePresence>
            {confirmDelete && (
              <>
                <motion.div
                  className="fixed inset-0 z-[60] bg-black/30"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setConfirmDelete(null)}
                />
                <motion.div 
                  className="fixed inset-0 z-[70] flex items-center justify-center px-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div 
                    className="bg-white rounded-2xl p-6 max-w-[300px] w-full shadow-xl"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.9 }}
                  >
                    <h3 className="text-[17px] font-semibold text-[#1D1D1F] mb-2">
                      Delete conversation?
                    </h3>
                    <p className="text-[14px] text-[#86868B] mb-6">
                      This can't be undone.
                    </p>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setConfirmDelete(null)}
                        className="flex-1 py-3 bg-[#F0F0F5] rounded-xl text-[15px] font-semibold text-[#1D1D1F] active:scale-95 transition-transform"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleConfirmDelete}
                        disabled={deleteConversation.isPending}
                        className="flex-1 py-3 bg-red-500 rounded-xl text-[15px] font-semibold text-white active:scale-95 transition-transform disabled:opacity-50"
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
