/**
 * EchoMessageList - Scrollable message container with smart auto-scroll
 * Only auto-scrolls if user was near bottom when streaming started
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { EchoResponseCard } from './EchoResponseCard';
import { EchoUserBubble } from './EchoUserBubble';
import { EchoThinkingCard } from './EchoThinkingCard';
import type { EchoMessage } from '@/features/echo/state/echoTypes';

interface EchoMessageListProps {
  messages: EchoMessage[];
  isStreaming: boolean;
  streamingContent: string;
  onFollowUp: (text: string) => void;
}

export function EchoMessageList({
  messages,
  isStreaming,
  streamingContent,
  onFollowUp,
}: EchoMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showNewMessagePill, setShowNewMessagePill] = useState(false);
  
  // Latch scroll behavior at stream start
  const shouldAutoScrollRef = useRef(true);
  const wasStreamingRef = useRef(false);

  // Check if user is near bottom
  const checkNearBottom = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return true;
    
    const threshold = 100;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceFromBottom < threshold;
  }, []);

  // Scroll handler - track user position
  const handleScroll = useCallback(() => {
    const nearBottom = checkNearBottom();
    
    // Hide pill if user scrolled to bottom
    if (nearBottom) {
      setShowNewMessagePill(false);
    }
  }, [checkNearBottom]);

  // Latch auto-scroll decision at stream start
  useEffect(() => {
    if (isStreaming && !wasStreamingRef.current) {
      // Stream just started - latch current scroll position
      shouldAutoScrollRef.current = checkNearBottom();
      wasStreamingRef.current = true;
    } else if (!isStreaming && wasStreamingRef.current) {
      // Stream ended
      wasStreamingRef.current = false;
    }
  }, [isStreaming, checkNearBottom]);

  // Auto-scroll during streaming (only if latched)
  useEffect(() => {
    if (isStreaming && streamingContent && shouldAutoScrollRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (isStreaming && streamingContent && !shouldAutoScrollRef.current) {
      // User was scrolled up - show pill instead
      setShowNewMessagePill(true);
    }
  }, [isStreaming, streamingContent]);

  // Scroll to bottom for new user messages
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'user') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      shouldAutoScrollRef.current = true; // Reset latch for new conversation turn
    }
  }, [messages]);

  // Handle new assistant message completion
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant' && !isStreaming) {
      if (shouldAutoScrollRef.current || checkNearBottom()) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        setShowNewMessagePill(false);
      }
    }
  }, [messages, isStreaming, checkNearBottom]);

  // Jump to bottom handler
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowNewMessagePill(false);
    shouldAutoScrollRef.current = true;
  }, []);

  // Get the last assistant message for follow-up generation
  const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');

  return (
    <div 
      ref={scrollRef}
      data-echo-scroll-container
      className="flex-1 overflow-y-auto overscroll-contain px-5 pt-5"
      style={{ 
        WebkitOverflowScrolling: 'touch',
        paddingBottom: 'calc(110px + env(safe-area-inset-bottom, 0px))',
      }}
      onScroll={handleScroll}
    >
      <div className="flex flex-col gap-4">
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {msg.role === 'user' ? (
                <EchoUserBubble content={msg.content} />
              ) : (
                <EchoResponseCard 
                  content={msg.content}
                  isLast={index === messages.length - 1 && !isStreaming}
                  lastResponse={lastAssistantMessage?.content}
                  onFollowUp={onFollowUp}
                  wasAborted={msg.meta?.aborted}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Streaming state: show EITHER thinking OR streaming response, never both */}
        {isStreaming && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {streamingContent ? (
              <EchoResponseCard 
                content={streamingContent}
                isStreaming
                onFollowUp={onFollowUp}
              />
            ) : (
              <EchoThinkingCard />
            )}
          </motion.div>
        )}
        
        {/* Scroll anchor */}
        <div ref={bottomRef} className="h-1" />
      </div>

      {/* New message pill */}
      <AnimatePresence>
        {showNewMessagePill && (
          <motion.button
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            onClick={scrollToBottom}
            className="fixed left-1/2 bottom-32 -translate-x-1/2 z-10 flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-semibold transition-all active:scale-95 bg-slate-900 text-white shadow-xl"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}
          >
            <ChevronDown className="w-4 h-4" />
            New message
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
