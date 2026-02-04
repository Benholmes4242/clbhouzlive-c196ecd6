/**
 * EchoHistorySheet - Bottom sheet for viewing past Echo conversations
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronRight } from 'lucide-react';
import { useEchoChatHistory } from '../../hooks/useEchoChatHistory';

interface EchoHistorySheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (conversationId: string) => void;
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function EchoHistorySheet({ isOpen, onClose, onSelectConversation }: EchoHistorySheetProps) {
  const { data: conversations, isLoading } = useEchoChatHistory({ enabled: isOpen });

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
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#F8FAFC] rounded-t-[28px] max-h-[70vh] flex flex-col"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-4">
              <div className="w-9 h-1 bg-[#D1D5DB] rounded-full" />
            </div>
            
            {/* Title */}
            <div className="px-5 pb-4">
              <h2 className="text-[20px] font-semibold text-[#1D1D1F]">History</h2>
            </div>
            
            {/* History list */}
            <div className="flex-1 overflow-y-auto px-5 pb-8">
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
                    <button
                      key={conv.id}
                      onClick={() => onSelectConversation(conv.id)}
                      className="flex items-center gap-4 p-4 bg-white border border-[#E5E5EA] rounded-2xl hover:border-[#FFBF66]/40 hover:bg-[#FFFCFA] active:scale-[0.98] transition-all duration-150 shadow-sm"
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
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-[15px] font-medium text-[#1D1D1F] truncate">
                          {conv.title || 'Untitled conversation'}
                        </p>
                        <p className="text-[13px] text-[#86868B]">
                          {conv.relative_date || formatRelativeDate(conv.created_at)}
                        </p>
                      </div>
                      
                      {/* Chevron */}
                      <ChevronRight className="w-5 h-5 text-[#C7C7CC] flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
