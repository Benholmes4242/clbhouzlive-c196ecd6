/**
 * EchoMessageList - Scrollable message container with auto-scroll
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
  const [isNearBottom, setIsNearBottom] = useState(true);

  // Check if user is near bottom
  const checkNearBottom = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return true;
    
    const threshold = 100;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceFromBottom < threshold;
  }, []);

  // Scroll handler
  const handleScroll = useCallback(() => {
    const nearBottom = checkNearBottom();
    setIsNearBottom(nearBottom);
    
    if (nearBottom) {
      setShowNewMessagePill(false);
    }
  }, [checkNearBottom]);

  // Auto-scroll when new messages arrive (only if near bottom)
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    const isAssistantMessage = lastMessage?.role === 'assistant';
    
    if (isNearBottom || isStreaming) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (isAssistantMessage && !isNearBottom) {
      setShowNewMessagePill(true);
    }
  }, [messages, isStreaming, streamingContent, isNearBottom]);

  // Jump to bottom handler
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowNewMessagePill(false);
  }, []);

  // Get the last assistant message for follow-up generation
  const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');

  return (
    <div 
      ref={scrollRef}
      data-echo-scroll-container
      className="flex-1 overflow-y-auto overscroll-contain px-5 pt-4"
      style={{ 
        WebkitOverflowScrolling: 'touch',
        paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 0px))',
      }}
      onScroll={handleScroll}
    >
      <div className="flex flex-col gap-4">
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {msg.role === 'user' ? (
                <EchoUserBubble content={msg.content} />
              ) : (
                <EchoResponseCard 
                  content={msg.content}
                  isLast={index === messages.length - 1 && !isStreaming}
                  lastResponse={lastAssistantMessage?.content}
                  onFollowUp={onFollowUp}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Streaming / Thinking state */}
        {isStreaming && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={scrollToBottom}
            className="fixed left-1/2 bottom-28 -translate-x-1/2 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all active:scale-95"
            style={{
              background: 'rgba(0, 0, 0, 0.85)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            }}
          >
            <ChevronDown className="w-3.5 h-3.5" />
            New message
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
