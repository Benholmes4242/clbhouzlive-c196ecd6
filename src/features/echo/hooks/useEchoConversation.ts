/**
 * Echo Conversation Hook
 * Manages a single conversation with messages and AI streaming
 */

import { useState, useCallback, useEffect } from 'react';
import { nanoid } from 'nanoid';
import type { EchoMessage } from '../state/echoTypes';
import { useAIStream } from './useAIStream';

export function useEchoConversation(opts?: { resetOnMount?: boolean }) {
  const resetOnMount = opts?.resetOnMount ?? false;

  const [messages, setMessages] = useState<EchoMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const { sendMessage: sendToAI, abort } = useAIStream();

  // Load messages from localStorage on mount (or reset if resetOnMount is true)
  useEffect(() => {
    if (resetOnMount) {
      // Fresh conversation: clear storage and in-memory state
      try {
        localStorage.removeItem('echo-current-conversation');
      } catch (e) {
        console.warn('[Echo] Failed to clear stored conversation', e);
      }
      setMessages([]);
      return;
    }

    // Legacy behaviour: load from storage if present
    try {
      const stored = localStorage.getItem('echo-current-conversation');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setMessages(parsed);
        }
      }
    } catch (e) {
      console.error('[Echo] Failed to load conversation from storage', e);
    }
  }, [resetOnMount]);

  // Save messages to localStorage (skip if resetOnMount is true)
  useEffect(() => {
    if (resetOnMount) return; // don't persist in "fresh" mode
    if (messages.length > 0) {
      localStorage.setItem('echo-current-conversation', JSON.stringify(messages));
    }
  }, [messages, resetOnMount]);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: EchoMessage = {
      id: nanoid(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);
    setStreamingContent('');

    const assistantMessageId = nanoid();
    let accumulatedContent = '';

    try {
      await sendToAI(
        [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
        'default-conversation',
        {
          onChunk: (chunk) => {
            accumulatedContent += chunk;
            setStreamingContent(accumulatedContent);
          },
          onComplete: () => {
            const assistantMessage: EchoMessage = {
              id: assistantMessageId,
              role: 'assistant',
              content: accumulatedContent,
              createdAt: new Date().toISOString(),
            };
            setMessages(prev => {
              const next = [...prev, assistantMessage];
              
              // Smooth scroll to bottom after message is added
              requestAnimationFrame(() => {
                const container = document.querySelector('[data-echo-scroll-container]');
                if (container) {
                  container.scrollTo({
                    top: (container as HTMLElement).scrollHeight,
                    behavior: 'smooth',
                  });
                }
              });
              
              return next;
            });
            setIsStreaming(false);
            setStreamingContent('');
          },
          onError: (error) => {
            const errorMessage: EchoMessage = {
              id: assistantMessageId,
              role: 'assistant',
              content: 'Sorry, I encountered an error. Please try again.',
              createdAt: new Date().toISOString(),
              meta: { error },
            };
            setMessages(prev => [...prev, errorMessage]);
            setIsStreaming(false);
            setStreamingContent('');
          },
        }
      );
    } catch (error) {
      console.error('Send message error:', error);
      setIsStreaming(false);
      setStreamingContent('');
    }
  }, [messages, sendToAI]);

  const abortStream = useCallback(() => {
    abort();
    setIsStreaming(false);
    setStreamingContent('');
  }, [abort]);

  return {
    messages,
    sendMessage,
    isStreaming,
    streamingContent,
    abortStream,
  };
}
