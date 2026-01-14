/**
 * EchoHistoryTab - History view for Echo conversations
 * Explicit light styling to match Hub sheets
 */

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Search, Pin, Trash2, MessageSquare, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { haptic } from '@/utils/haptics';
import { HUB_INPUT, HUB_CARD, HUB_SECTION_HEADER, ECHO_ORANGE } from './echoStyles';
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
      // If deleting the currently open conversation, notify parent to reset chat
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
      <div className="px-5 py-3 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your chats..."
            className={cn(
              "w-full h-11 pl-10 pr-10 rounded-xl text-[14px]",
              HUB_INPUT
            )}
          />
          {search && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/5 transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
            <p className="text-[13px] text-slate-400">Loading conversations...</p>
          </div>
        ) : !conversations || conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div 
              className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-4", HUB_CARD)}
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
            >
              {search ? (
                <Search className="w-7 h-7 text-slate-300" />
              ) : (
                <Sparkles className="w-7 h-7" style={{ color: `${ECHO_ORANGE}60` }} />
              )}
            </div>
            <p className="text-[15px] font-medium text-slate-800">
              {search ? 'No chats found' : 'No chat history yet'}
            </p>
            <p className="text-[13px] text-slate-400 mt-1.5 max-w-[220px]">
              {search ? 'Try a different search term' : 'Start a conversation in Chat to see it here'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Pinned section */}
            {conversations.some(c => c.pinned) && (
              <>
                <p className={cn("px-1 pt-1 pb-1", HUB_SECTION_HEADER)}>
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
                  <p className={cn("px-1 pt-4 pb-1", HUB_SECTION_HEADER)}>
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
  const messageCount = conversation.message_count ?? 0;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left p-3.5 rounded-2xl transition-all duration-150",
        HUB_CARD,
        "hover:bg-white/95 hover:shadow-sm",
        "active:scale-[0.99]",
        isActive && `ring-2 ring-[${ECHO_ORANGE}]/20 border-[${ECHO_ORANGE}]/30`
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {conversation.pinned && (
              <Pin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: ECHO_ORANGE }} />
            )}
            <h3 className="text-[14px] font-medium text-slate-800 truncate leading-tight">
              {conversation.title || 'Untitled chat'}
            </h3>
          </div>
          <p className="text-[12px] text-slate-400 mt-1">
            {timeAgo} ago • {messageCount} message{messageCount !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={onPin}
            disabled={isPinning}
            className={cn(
              "p-2 rounded-lg transition-all active:scale-95",
              conversation.pinned 
                ? "hover:bg-amber-50" 
                : "text-slate-400 hover:bg-black/5 hover:text-slate-600"
            )}
            style={{ color: conversation.pinned ? ECHO_ORANGE : undefined }}
          >
            <Pin className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </button>
  );
}
