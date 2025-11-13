/**
 * Echo Conversation Hook
 * Manages a single conversation with messages and AI streaming
 */

import { useState, useCallback, useEffect } from 'react';
import { nanoid } from 'nanoid';
import type { EchoMessage } from '../state/echoTypes';
import { useAIStream } from './useAIStream';

export function useEchoConversation() {
  const [messages, setMessages] = useState<EchoMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const { sendMessage: sendToAI, abort } = useAIStream();

  // Load messages from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('echo-current-conversation');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setMessages(parsed);
      } catch (e) {
        console.error('Failed to load conversation:', e);
      }
    }
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('echo-current-conversation', JSON.stringify(messages));
    }
  }, [messages]);

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
            setMessages(prev => [...prev, assistantMessage]);
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
