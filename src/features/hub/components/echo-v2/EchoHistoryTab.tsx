/**
 * EchoHistoryTab - History view for Echo conversations
 */

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Search, Pin, Trash2, MessageSquare } from 'lucide-react';
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

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Search input */}
      <div className="px-5 py-3 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your chats..."
            className={cn(
              "w-full h-10 pl-9 pr-4 rounded-xl text-[14px]",
              "bg-muted/50 border border-border/50",
              "text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30",
              "transition-all duration-150"
            )}
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : !conversations || conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 border border-border/50 flex items-center justify-center mb-4">
              <MessageSquare className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-foreground/80">
              {search ? 'No chats found' : 'No chat history yet'}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
              {search ? 'Try a different search term' : 'Start a conversation in Chat to see it here'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Pinned section */}
            {conversations.some(c => c.pinned) && (
              <>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-1 pt-1">
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
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-1 pt-3">
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
        "w-full text-left p-3 rounded-xl transition-all duration-150",
        "bg-card border border-border/50 hover:border-border",
        "active:scale-[0.99]",
        isActive && "ring-2 ring-primary/20 border-primary/30"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {conversation.pinned && (
              <Pin className="w-3 h-3 text-primary flex-shrink-0" />
            )}
            <h3 className="text-[14px] font-medium text-foreground truncate">
              {conversation.title || 'Untitled chat'}
            </h3>
          </div>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {timeAgo} ago • {messageCount} message{messageCount !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onPin}
            disabled={isPinning}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              conversation.pinned 
                ? "text-primary hover:bg-primary/10" 
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <Pin className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </button>
  );
}
