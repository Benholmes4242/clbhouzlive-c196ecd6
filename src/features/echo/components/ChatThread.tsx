/**
 * Chat Thread Component
 * Displays the message list with virtualization for performance
 */

import React, { useEffect, useRef, useMemo } from 'react';
import type { EchoMessage } from '../state/echoTypes';
import { VirtualList } from './virtual/VirtualList';

interface ChatThreadProps {
  messages: EchoMessage[];
  isStreaming: boolean;
}

const VIRTUALIZATION_THRESHOLD = 50;

export function ChatThread({ messages, isStreaming }: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const useVirtualization = messages.length > VIRTUALIZATION_THRESHOLD;

  // Auto-scroll to bottom on new messages (unless user scrolled up)
  useEffect(() => {
    if (shouldAutoScrollRef.current && !useVirtualization) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming, useVirtualization]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    shouldAutoScrollRef.current = isNearBottom;
  };

  const renderMessage = (message: EchoMessage) => (
    <div
      key={message.id}
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          message.role === 'user'
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-secondary-foreground'
        }`}
      >
        <div className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </div>
        {message.meta?.error && (
          <div className="mt-2 text-xs text-destructive">
            Error: {message.meta.error}
          </div>
        )}
        <div className="mt-1 text-xs opacity-60">
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );

  const streamingIndicator = isStreaming && (
    <div className="flex justify-start" aria-live="polite" aria-label="AI is responding">
      <div className="bg-secondary text-secondary-foreground rounded-2xl px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="animate-bounce" style={{ animationDelay: '0ms' }}>●</span>
            <span className="animate-bounce" style={{ animationDelay: '150ms' }}>●</span>
            <span className="animate-bounce" style={{ animationDelay: '300ms' }}>●</span>
          </div>
          <span className="text-sm">Echo is thinking...</span>
        </div>
      </div>
    </div>
  );

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <div className="text-4xl mb-4">💬</div>
          <h3 className="text-lg font-semibold text-foreground">Start a conversation</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Ask Echo anything about golf, get tips, or just chat
          </p>
        </div>
      </div>
    );
  }

  // Use virtualization for long threads
  if (useVirtualization) {
    return (
      <VirtualList
        count={messages.length}
        estimateSize={80}
        overscan={10}
        className="flex-1 p-4"
        render={(index) => (
          <div className="mb-4">
            {renderMessage(messages[index])}
          </div>
        )}
      />
    );
  }

  // Standard rendering for shorter threads
  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 space-y-4"
      style={{ overflowY: 'auto', height: '100%' }}
    >
      {messages.map((message) => renderMessage(message))}
      
      {streamingIndicator}
      
      <div ref={bottomRef} />
    </div>
  );
}
