/**
 * EchoHistoryTab - History view for Echo conversations
 * Warm styling to match Hub sheets
 */

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Search, Pin, Trash2, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { haptic } from '@/utils/haptics';
import {
  useEchoConversations,
  usePinConversation,
  useDeleteConversation,
  type EchoConversationRow,
} from '@/features/echo/hooks/useEchoHistory';
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

interface EchoHistoryTabProps {
  onSelectConversation: (conversationId: string) => void;
  currentConversationId: string | null;
  onDeleteCurrentConversation?: () => void;
}

// Mini Echo Orb for conversation cards
function MiniEchoOrb() {
  return (
    <div className="w-10 h-10 rounded-full bg-[#FFBF66] flex items-center justify-center flex-shrink-0">
      <div className="flex items-center gap-[2px]">
        <div className="w-[2px] h-1.5 bg-white rounded-full" />
        <div className="w-[2px] h-2.5 bg-white rounded-full" />
        <div className="w-[2px] h-1.5 bg-white rounded-full" />
      </div>
    </div>
  );
}

// Muted orb for empty state
function MutedEchoOrb() {
  return (
    <div className="w-14 h-14 rounded-full bg-[#F5EDE5] flex items-center justify-center">
      <div className="flex items-center gap-[2px]">
        <div className="w-[2.5px] h-2 bg-[#D4C4B0] rounded-full" />
        <div className="w-[2.5px] h-3.5 bg-[#D4C4B0] rounded-full" />
        <div className="w-[2.5px] h-2 bg-[#D4C4B0] rounded-full" />
      </div>
    </div>
  );
}

export function EchoHistoryTab({ onSelectConversation, currentConversationId, onDeleteCurrentConversation }: EchoHistoryTabProps) {
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: conversations, isLoading } = useEchoConversations(search);
  const pinMutation = usePinConversation();
  const deleteMutation = useDeleteConversation();

  const handlePin = (e: React.MouseEvent, conv: EchoConversationRow) => {
    e.stopPropagation();
    haptic('light');
    pinMutation.mutate({ conversationId: conv.id, pinned: !conv.pinned });
  };

  const handleDeleteClick = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    haptic('medium');
    setDeleteTarget(conversationId);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      if (deleteTarget === currentConversationId && onDeleteCurrentConversation) {
        onDeleteCurrentConversation();
      }
      deleteMutation.mutate(deleteTarget);
      setDeleteTarget(null);
    }
  };

  const handleSelect = (conversationId: string) => {
    haptic('light');
    onSelectConversation(conversationId);
  };

  const clearSearch = () => {
    setSearch('');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Search input */}
      <div className="px-5 pb-4 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#AEAEB2]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your chats..."
            className="w-full h-[44px] pl-12 pr-10 rounded-[12px] text-[15px] bg-white border border-[#E8E0D8] text-[#1D1D1F] placeholder:text-[#AEAEB2] focus:outline-none focus:border-[#FFBF66] transition-colors duration-200"
          />
          {search && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[#F5EDE5] transition-colors"
            >
              <X className="w-4 h-4 text-[#86868B]" />
            </button>
          )}
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-6 h-6 border-2 border-[#E8E0D8] border-t-[#FFBF66] rounded-full animate-spin" />
            <p className="text-[13px] text-[#86868B]">Loading conversations...</p>
          </div>
        ) : !conversations || conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4">
              <MutedEchoOrb />
            </div>
            <h3 className="text-[17px] font-semibold text-[#1D1D1F] mb-1">
              {search ? 'No chats found' : 'No chat history yet'}
            </h3>
            <p className="text-[14px] text-[#86868B] text-center">
              {search ? 'Try a different search term' : 'Start a conversation in Chat to see it here'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Pinned section */}
            {conversations.some(c => c.pinned) && (
              <>
                <p className="px-1 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[#86868B]">
                  📌 Pinned
                </p>
                <AnimatePresence mode="popLayout">
                  {conversations.filter(c => c.pinned).map((conv) => (
                    <motion.div
                      key={conv.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                    >
                      <ConversationCard
                        conversation={conv}
                        isActive={conv.id === currentConversationId}
                        onSelect={() => handleSelect(conv.id)}
                        onPin={(e) => handlePin(e, conv)}
                        onDelete={(e) => handleDeleteClick(e, conv.id)}
                        isPinning={pinMutation.isPending}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </>
            )}

            {/* Recent section */}
            {conversations.some(c => !c.pinned) && (
              <>
                {conversations.some(c => c.pinned) && (
                  <p className="px-1 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[#86868B]">
                    Recent
                  </p>
                )}
                <AnimatePresence mode="popLayout">
                  {conversations.filter(c => !c.pinned).map((conv) => (
                    <motion.div
                      key={conv.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                    >
                      <ConversationCard
                        conversation={conv}
                        isActive={conv.id === currentConversationId}
                        onSelect={() => handleSelect(conv.id)}
                        onPin={(e) => handlePin(e, conv)}
                        onDelete={(e) => handleDeleteClick(e, conv.id)}
                        isPinning={pinMutation.isPending}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </>
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-[320px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface ConversationCardProps {
  conversation: EchoConversationRow;
  isActive: boolean;
  onSelect: () => void;
  onPin: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  isPinning: boolean;
}

function ConversationCard({ 
  conversation, 
  isActive, 
  onSelect, 
  onPin, 
  onDelete,
  isPinning,
}: ConversationCardProps) {
  const timeAgo = formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: false });

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-3 p-3 bg-white border border-[#F0E6DC] rounded-[14px] hover:bg-[#FFFAF5] transition-colors duration-150 active:scale-[0.98]",
        isActive && "ring-2 ring-[#FFBF66]/30 border-[#FFBF66]/40"
      )}
    >
      {/* Mini orb */}
      <MiniEchoOrb />
      
      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-1.5">
          {conversation.pinned && (
            <Pin className="w-3.5 h-3.5 flex-shrink-0 text-[#FFBF66]" />
          )}
          <p className="text-[15px] font-medium text-[#1D1D1F] truncate">
            {conversation.title || 'Untitled chat'}
          </p>
        </div>
        <p className="text-[13px] text-[#86868B]">
          {timeAgo} ago
        </p>
      </div>
      
      <ChevronRight className="w-5 h-5 text-[#C7C7CC] flex-shrink-0" />
    </button>
  );
}
