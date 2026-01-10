/**
 * Echo Conversation Hook
 * Manages a single conversation with messages and AI streaming
 * Now persists to Supabase for history support
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { nanoid } from 'nanoid';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { EchoMessage } from '../state/echoTypes';
import { useAIStream } from './useAIStream';
import { 
  createConversation, 
  insertMessage, 
  setConversationTitleIfEmpty,
  type EchoMessageRow 
} from './useEchoHistory';
import { sanitizeEchoText } from '../utils/echoFormat';

interface UseEchoConversationOptions {
  resetOnMount?: boolean;
}

export function useEchoConversation(opts?: UseEchoConversationOptions) {
  const resetOnMount = opts?.resetOnMount ?? false;
  const queryClient = useQueryClient();

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<EchoMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [wasAborted, setWasAborted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const { sendMessage: sendToAI, abort } = useAIStream();
  const firstUserMessageRef = useRef<string | null>(null);

  // Get current user on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  // Reset state on mount if resetOnMount is true
  useEffect(() => {
    if (resetOnMount) {
      setConversationId(null);
      setMessages([]);
      firstUserMessageRef.current = null;
    }
  }, [resetOnMount]);

  // Load conversation from database
  const loadConversation = useCallback(async (convId: string) => {
    setConversationId(convId);
    
    const { data, error } = await supabase
      .from('echo_conversation_messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[loadConversation] Error:', error);
      return;
    }

    const loadedMessages: EchoMessage[] = (data ?? []).map((row: EchoMessageRow) => ({
      id: row.id,
      role: row.role as 'user' | 'assistant',
      content: row.content,
      createdAt: row.created_at,
    }));

    setMessages(loadedMessages);
    
    // Store first user message for title
    const firstUser = loadedMessages.find(m => m.role === 'user');
    firstUserMessageRef.current = firstUser?.content ?? null;
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (isStreaming || !userId) return;

    const userMessage: EchoMessage = {
      id: nanoid(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };

    // Store first user message for title
    if (!firstUserMessageRef.current) {
      firstUserMessageRef.current = content;
    }

    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);
    setStreamingContent('');
    setWasAborted(false);

    // Create conversation if needed
    let currentConvId = conversationId;
    if (!currentConvId) {
      currentConvId = await createConversation(userId);
      if (currentConvId) {
        setConversationId(currentConvId);
      }
    }

    // Persist user message
    if (currentConvId) {
      await insertMessage(currentConvId, userId, 'user', content);
    }

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
          onComplete: async () => {
            const sanitizedContent = sanitizeEchoText(accumulatedContent);
            
            const assistantMessage: EchoMessage = {
              id: assistantMessageId,
              role: 'assistant',
              content: sanitizedContent,
              createdAt: new Date().toISOString(),
            };
            setMessages(prev => [...prev, assistantMessage]);
            setIsStreaming(false);
            setStreamingContent('');

            // Persist assistant message
            if (currentConvId) {
              await insertMessage(currentConvId, userId, 'assistant', sanitizedContent);
              
              // Set title from first user message
              if (firstUserMessageRef.current) {
                await setConversationTitleIfEmpty(currentConvId, firstUserMessageRef.current);
              }
              
              // Invalidate history queries
              queryClient.invalidateQueries({ queryKey: ['echo', 'conversations'] });
            }
          },
          onError: async (error) => {
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

            // Persist error message
            if (currentConvId) {
              await insertMessage(currentConvId, userId, 'assistant', errorMessage.content);
              queryClient.invalidateQueries({ queryKey: ['echo', 'conversations'] });
            }
          },
        }
      );
    } catch (error) {
      console.error('Send message error:', error);
      setIsStreaming(false);
      setStreamingContent('');
    }
  }, [messages, sendToAI, isStreaming, userId, conversationId, queryClient]);

  const abortStream = useCallback(async () => {
    abort();
    setWasAborted(true);
    
    // Keep partial content as a message marked as stopped
    if (streamingContent.trim()) {
      const sanitizedContent = sanitizeEchoText(streamingContent);
      const partialMessage: EchoMessage = {
        id: nanoid(),
        role: 'assistant',
        content: sanitizedContent,
        createdAt: new Date().toISOString(),
        meta: { aborted: true },
      };
      setMessages(prev => [...prev, partialMessage]);

      // Persist partial message
      if (conversationId && userId) {
        await insertMessage(conversationId, userId, 'assistant', sanitizedContent);
        queryClient.invalidateQueries({ queryKey: ['echo', 'conversations'] });
      }
    }
    
    setIsStreaming(false);
    setStreamingContent('');
  }, [abort, streamingContent, conversationId, userId, queryClient]);

  // Reset conversation without page reload
  const resetConversation = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    setStreamingContent('');
    setIsStreaming(false);
    setWasAborted(false);
    firstUserMessageRef.current = null;
  }, []);

  return {
    conversationId,
    messages,
    sendMessage,
    isStreaming,
    streamingContent,
    abortStream,
    resetConversation,
    wasAborted,
    loadConversation,
  };
}
