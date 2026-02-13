 /**
  * EchoPageMessageList - WhatsApp-style message list with bubble styling
  * Proper scroll behavior and new message indicator
  */
 
import React, { useRef, useEffect, useState, useCallback, TouchEvent } from 'react';
 import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Loader2 } from 'lucide-react';
 import { EchoResponseCard } from '@/features/hub/components/echo-v2/EchoResponseCard';
 import { EchoUserBubble } from '@/features/hub/components/echo-v2/EchoUserBubble';
 import { EchoThinkingCard } from '@/features/hub/components/echo-v2/EchoThinkingCard';
 import type { EchoMessage } from '@/features/echo/state/echoTypes';
 import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface EchoPageMessageListProps {
  messages: EchoMessage[];
  isStreaming: boolean;
  streamingContent: string;
  onFollowUp: (text: string) => void;
  onRefresh?: () => Promise<void>;
}

export function EchoPageMessageList({
  messages,
  isStreaming,
  streamingContent,
  onFollowUp,
  onRefresh,
}: EchoPageMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showNewMessagePill, setShowNewMessagePill] = useState(false);
   const prefersReduced = usePrefersReducedMotion();
 
  const shouldAutoScrollRef = useRef(true);
  const wasStreamingRef = useRef(false);
  
  // FIX 12: Pull to refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);

  const checkNearBottom = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return true;
    
    const threshold = 100;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceFromBottom < threshold;
  }, []);

  const handleScroll = useCallback(() => {
    const nearBottom = checkNearBottom();
    if (nearBottom) {
      setShowNewMessagePill(false);
    }
  }, [checkNearBottom]);

  // FIX 12: Pull to refresh handlers
  const handleTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(async (e: TouchEvent<HTMLDivElement>) => {
    const scrollTop = scrollRef.current?.scrollTop ?? 0;
    const pullDistance = e.changedTouches[0].clientY - touchStartY.current;

    if (scrollTop === 0 && pullDistance > 80 && onRefresh && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
  }, [onRefresh, isRefreshing]);

  // Latch auto-scroll decision at stream start
  useEffect(() => {
    if (isStreaming && !wasStreamingRef.current) {
      shouldAutoScrollRef.current = checkNearBottom();
      wasStreamingRef.current = true;
    } else if (!isStreaming && wasStreamingRef.current) {
      wasStreamingRef.current = false;
    }
  }, [isStreaming, checkNearBottom]);

  // Auto-scroll during streaming
  useEffect(() => {
    if (isStreaming && streamingContent && shouldAutoScrollRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (isStreaming && streamingContent && !shouldAutoScrollRef.current) {
      setShowNewMessagePill(true);
    }
  }, [isStreaming, streamingContent]);

  // Scroll to bottom for new user messages
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'user') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      shouldAutoScrollRef.current = true;
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

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowNewMessagePill(false);
    shouldAutoScrollRef.current = true;
  }, []);

  const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
   const animationVariants = {
     initial: prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 },
     animate: { opacity: 1, y: 0 },
     exit: prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: -12 },
     transition: prefersReduced ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' as const },
   };

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto overscroll-contain px-4 py-4"
      style={{ WebkitOverflowScrolling: 'touch' }}
      onScroll={handleScroll}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
       role="log"
       aria-live="polite"
    >
      <div className="max-w-[600px] mx-auto space-y-4">
        {/* FIX 12: Pull to refresh indicator */}
        {isRefreshing && (
          <div className="flex justify-center py-3">
            <Loader2 className="w-5 h-5 animate-spin text-[#FFBF66]" />
          </div>
        )}
        
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => (
            <motion.div
              key={msg.id}
               initial={animationVariants.initial}
               animate={animationVariants.animate}
               exit={animationVariants.exit}
               transition={animationVariants.transition}
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

        {/* Streaming state */}
        {isStreaming && (
          <motion.div
             initial={animationVariants.initial}
             animate={animationVariants.animate}
             transition={animationVariants.transition}
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
             initial={prefersReduced ? false : { opacity: 0, y: 10, scale: 0.95 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={prefersReduced ? undefined : { opacity: 0, y: 10, scale: 0.95 }}
            onClick={scrollToBottom}
             className="fixed left-1/2 bottom-28 -translate-x-1/2 z-10 flex items-center gap-1.5 px-4 py-2 rounded-full text-[0.75rem] font-semibold transition-all active:scale-95 bg-[#1D1D1F] text-white shadow-xl"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}
             aria-label="Scroll to new message"
          >
            <ChevronDown className="w-4 h-4" />
            New message
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
