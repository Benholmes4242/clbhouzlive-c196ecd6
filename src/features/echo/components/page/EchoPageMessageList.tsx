/**
 * EchoPageMessageList - Message list with bubble styling (light dispatch theme)
 */

import React, { useRef, useEffect, useState, useCallback, useMemo, TouchEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Loader2 } from 'lucide-react';
import { EchoResponseCard } from '@/features/echo/components/ui/EchoResponseCard';
import { EchoUserBubble } from '@/features/echo/components/ui/EchoUserBubble';
import { EchoThinkingCard } from '@/features/echo/components/ui/EchoThinkingCard';
import type { EchoMessage } from '@/features/echo/state/echoTypes';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface EchoPageMessageListProps {
  messages: EchoMessage[];
  isStreaming: boolean;
  streamingContent: string;
  onFollowUp: (text: string) => void;
  onRegenerate?: () => void;
  onRefresh?: () => Promise<void>;
}

export function EchoPageMessageList({
  messages,
  isStreaming,
  streamingContent,
  onFollowUp,
  onRegenerate,
  onRefresh,
}: EchoPageMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showNewMessagePill, setShowNewMessagePill] = useState(false);
  const prefersReduced = usePrefersReducedMotion();

  const shouldAutoScrollRef = useRef(true);
  const wasStreamingRef = useRef(false);
  
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

  useEffect(() => {
    if (isStreaming && !wasStreamingRef.current) {
      shouldAutoScrollRef.current = checkNearBottom();
      wasStreamingRef.current = true;
    } else if (!isStreaming && wasStreamingRef.current) {
      wasStreamingRef.current = false;
    }
  }, [isStreaming, checkNearBottom]);

  useEffect(() => {
    if (isStreaming && streamingContent && shouldAutoScrollRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (isStreaming && streamingContent && !shouldAutoScrollRef.current) {
      setShowNewMessagePill(true);
    }
  }, [isStreaming, streamingContent]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'user') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      shouldAutoScrollRef.current = true;
    }
  }, [messages]);

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

  const lastAssistantMessage = useMemo(
    () => [...messages].reverse().find(m => m.role === 'assistant'),
    [messages]
  );

  // Last 3 user messages, for follow-up dedup
  const recentUserMessages = useMemo(
    () => messages.filter(m => m.role === 'user').slice(-3).map(m => m.content),
    [messages]
  );

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
      style={{ background: '#F8FAFC', WebkitOverflowScrolling: 'touch' }}
      onScroll={handleScroll}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="log"
      aria-live="polite"
    >
      <div className="max-w-[600px] mx-auto space-y-4">
        {isRefreshing && (
          <div className="flex justify-center py-3">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#F7931E' }} />
          </div>
        )}
        
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => {
            const prev = index > 0 ? messages[index - 1] : null;
            const showAvatar = msg.role === 'assistant' && (!prev || prev.role !== 'assistant');
            const isLastMsg = index === messages.length - 1 && !isStreaming;
            return (
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
                    isLast={isLastMsg}
                    lastResponse={lastAssistantMessage?.content}
                    onFollowUp={onFollowUp}
                    onRegenerate={isLastMsg ? onRegenerate : undefined}
                    recentUserMessages={recentUserMessages}
                    showAvatar={showAvatar}
                    wasAborted={msg.meta?.aborted}
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

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
                showAvatar={messages[messages.length - 1]?.role !== 'assistant'}
              />
            ) : (
              <EchoThinkingCard />
            )}
          </motion.div>
        )}

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
            className="fixed left-1/2 bottom-28 -translate-x-1/2 z-10 flex items-center gap-1.5 px-4 py-2 rounded-full text-[0.75rem] font-semibold transition-all active:scale-95 shadow-lg"
            style={{
              background: '#ffffff',
              color: '#0F172A',
              border: '1px solid rgba(15,23,42,0.10)',
              boxShadow: '0 4px 16px rgba(15,23,42,0.12)',
            }}
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