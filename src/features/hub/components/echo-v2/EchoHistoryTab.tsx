/**
 * EchoHistoryTab - History view for Echo conversations
 * Polished with skeleton loading, empty states, and smooth animations
 */

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Search, Pin, Trash2, MessageSquare, X, Sparkles, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { haptic } from '@/utils/haptics';
import { HUB_INPUT, HUB_CARD, HUB_SECTION_HEADER, ECHO_ORANGE, ECHO_ORANGE_DARK } from './echoStyles';
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

  const handleClearSearch = () => {
    setSearch('');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden" role="tabpanel" id="history-panel">
      {/* Search input with clear button */}
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
            aria-label="Search conversations"
          />
          {search && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/5 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {isLoading ? (
          <HistorySkeleton />
        ) : !conversations || conversations.length === 0 ? (
          <HistoryEmptyState search={search} />
        ) : (
          <div className="space-y-2">
            {/* Pinned section */}
            {conversations.some(c => c.pinned) && (
              <>
                <p className={cn("px-1 pt-1 pb-1", HUB_SECTION_HEADER)}>
                  Pinned
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

/** Skeleton loading state */
function HistorySkeleton() {
  return (
    <div className="space-y-3 pt-2">
      {[1, 2, 3].map((i) => (
        <div 
          key={i} 
          className={cn("p-4 rounded-2xl", HUB_CARD)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded-md bg-slate-200/80 animate-pulse" />
              <div className="h-3 w-1/2 rounded-md bg-slate-200/60 animate-pulse" />
            </div>
            <div className="flex gap-1">
              <div className="w-8 h-8 rounded-lg bg-slate-200/60 animate-pulse" />
              <div className="w-8 h-8 rounded-lg bg-slate-200/60 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Empty state component */
function HistoryEmptyState({ search }: { search: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div 
        className={cn("w-18 h-18 rounded-2xl flex items-center justify-center mb-5", HUB_CARD)}
        style={{ width: 72, height: 72 }}
      >
        {search ? (
          <Search className="w-8 h-8 text-slate-300" />
        ) : (
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ 
              background: `linear-gradient(145deg, ${ECHO_ORANGE}15 0%, ${ECHO_ORANGE}08 100%)`,
            }}
          >
            <Sparkles className="w-6 h-6" style={{ color: ECHO_ORANGE }} />
          </div>
        )}
      </div>
      <p className="text-[15px] font-medium text-slate-700 mb-1">
        {search ? 'No chats found' : 'No chat history yet'}
      </p>
      <p className="text-[13px] text-slate-500 max-w-[240px] leading-relaxed">
        {search 
          ? 'Try a different search term' 
          : 'Start a conversation with Echo to see it here'}
      </p>
    </motion.div>
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
        "hover:bg-white/90 hover:shadow-md",
        "active:scale-[0.99]",
        isActive && "ring-2 ring-amber-500/20 border-amber-500/30 bg-amber-50/30"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            {conversation.pinned && (
              <Pin 
                className="w-3 h-3 flex-shrink-0" 
                style={{ color: ECHO_ORANGE }}
                fill={ECHO_ORANGE}
              />
            )}
            <h3 className="text-[14px] font-medium text-slate-900 truncate">
              {conversation.title || 'Untitled chat'}
            </h3>
          </div>
          <p className="text-[12px] text-slate-500">
            {timeAgo} ago • {messageCount} message{messageCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Action buttons with proper touch targets */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={onPin}
            disabled={isPinning}
            className={cn(
              "min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg transition-all duration-150",
              conversation.pinned 
                ? "text-amber-600 hover:bg-amber-50" 
                : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
            )}
            aria-label={conversation.pinned ? "Unpin chat" : "Pin chat"}
          >
            <Pin 
              className="w-4 h-4" 
              fill={conversation.pinned ? 'currentColor' : 'none'}
            />
          </button>
          <button
            onClick={onDelete}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 transition-all duration-150"
            aria-label="Delete chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </button>
  );
}
