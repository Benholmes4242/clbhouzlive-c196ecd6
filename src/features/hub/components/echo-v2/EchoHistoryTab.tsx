/**
 * EchoHistoryTab - History view for Echo conversations
 * Polished design with orange accents matching Chat tab
 */

import React, { useState } from 'react';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { Search, Pin, Trash2, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { haptic } from '@/utils/haptics';
import { 
  HUB_SECTION_HEADER, 
  ECHO_ORANGE,
} from './echoStyles';
import { EchoOrb } from './EchoOrb';
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

// Format date in a friendly way
function formatConversationDate(dateString: string): string {
  const date = new Date(dateString);
  
  if (isToday(date)) {
    return `Today, ${format(date, 'h:mm a')}`;
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  if (isThisWeek(date)) {
    return format(date, 'EEEE'); // e.g., "Monday"
  }
  return format(date, 'd MMM'); // e.g., "27 Jan"
}

export function EchoHistoryTab({ 
  onSelectConversation, 
  currentConversationId, 
  onDeleteCurrentConversation 
}: EchoHistoryTabProps) {
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
    <div className="flex-1 flex flex-col overflow-hidden px-5">
      {/* Search bar - polished */}
      <div className="mb-6 flex-shrink-0">
        <div 
          className="flex items-center gap-3 h-[48px] bg-white border border-[#E5E5EA] rounded-[14px] px-4 shadow-sm focus-within:border-[#FFBF66] focus-within:shadow-[0_0_0_3px_rgba(255,191,102,0.1)] transition-all duration-200"
        >
          <Search className="w-5 h-5 text-[#AEAEB2] flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your chats..."
            className="flex-1 bg-transparent outline-none text-[15px] text-[#1D1D1F] placeholder:text-[#AEAEB2]"
          />
          {search && (
            <button
              onClick={clearSearch}
              className="p-1 rounded-full hover:bg-black/5 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-[#AEAEB2]" />
            </button>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto pb-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-6 h-6 border-2 border-[#E5E5EA] border-t-[#86868B] rounded-full animate-spin" />
            <p className="text-[13px] text-[#86868B]">Loading conversations...</p>
          </div>
        ) : !conversations || conversations.length === 0 ? (
          /* Empty state - polished with orange orb */
          <div className="flex-1 flex flex-col items-center justify-center pb-12" style={{ minHeight: '300px' }}>
            {search ? (
              /* No search results */
              <>
                <Search className="w-12 h-12 text-[#D1D5DB] mb-4" />
                <h3 className="text-[17px] font-semibold text-[#1D1D1F] mb-1">
                  No results found
                </h3>
                <p className="text-[14px] text-[#86868B] text-center">
                  Try a different search term
                </p>
              </>
            ) : (
              /* No history yet - orange orb with muted soundwave */
              <>
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-5 shadow-sm"
                  style={{ backgroundColor: ECHO_ORANGE }}
                >
                  <div className="flex items-center gap-[2.5px]">
                    <div className="w-[3px] h-2.5 bg-white/60 rounded-full" />
                    <div className="w-[3px] h-4 bg-white/60 rounded-full" />
                    <div className="w-[3px] h-2.5 bg-white/60 rounded-full" />
                  </div>
                </div>
                <h3 className="text-[20px] font-semibold text-[#1D1D1F] mb-2">
                  No chat history yet
                </h3>
                <p className="text-[15px] text-[#86868B] text-center px-8 leading-relaxed">
                  Start a conversation in Chat to see it here
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
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
  const formattedDate = formatConversationDate(conversation.last_message_at);

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-4 p-4 bg-white border border-[#E5E5EA] rounded-[16px] transition-all duration-150 active:scale-[0.98] shadow-sm",
        "hover:border-[#FFBF66]/40 hover:bg-[#FFFCFA]",
        isActive && "ring-2 ring-[#FFBF66]/30"
      )}
    >
      {/* Mini orb - orange with white soundwave */}
      <div 
        className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
        style={{ backgroundColor: ECHO_ORANGE }}
      >
        <div className="flex items-center gap-[2px]">
          <div className="w-[2.5px] h-2 bg-white rounded-full" />
          <div className="w-[2.5px] h-3 bg-white rounded-full" />
          <div className="w-[2.5px] h-2 bg-white rounded-full" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-1.5">
          {conversation.pinned && (
            <Pin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: ECHO_ORANGE }} />
          )}
          <p className="text-[16px] font-semibold text-[#1D1D1F] truncate">
            {conversation.title || 'Untitled chat'}
          </p>
        </div>
        <p className="text-[14px] text-[#86868B] mt-0.5">
          {formattedDate}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button
          onClick={onPin}
          disabled={isPinning}
          className={cn(
            "p-2 rounded-lg transition-all active:scale-95",
            conversation.pinned 
              ? "hover:bg-amber-50" 
              : "text-[#C7C7CC] hover:bg-black/5 hover:text-[#86868B]"
          )}
          style={{ color: conversation.pinned ? ECHO_ORANGE : undefined }}
        >
          <Pin className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 rounded-lg text-[#C7C7CC] hover:text-red-500 hover:bg-red-50 transition-all active:scale-95"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <ChevronRight className="w-5 h-5 text-[#C7C7CC] flex-shrink-0" />
    </button>
  );
}
