/**
 * Echo Conversation Hook
 * Manages a single conversation with messages and AI streaming
 * Now persists to Supabase for history support
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { nanoid } from 'nanoid';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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

// Rate limit cooldown state
interface RateLimitState {
  isLimited: boolean;
  errorType?: string;
  retryAfter?: number;
  cooldownEnd?: number;
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
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({ isLimited: false });
  
  const { sendMessage: sendToAI, abort } = useAIStream();
  const firstUserMessageRef = useRef<string | null>(null);
  const messagesRef = useRef<EchoMessage[]>([]);
  
  // Keep messagesRef in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

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

  // Rate limit cooldown timer
  useEffect(() => {
    if (rateLimitState.isLimited && rateLimitState.cooldownEnd) {
      const remaining = rateLimitState.cooldownEnd - Date.now();
      if (remaining <= 0) {
        setRateLimitState({ isLimited: false });
        return;
      }

      const timer = setTimeout(() => {
        setRateLimitState({ isLimited: false });
      }, remaining);

      return () => clearTimeout(timer);
    }
  }, [rateLimitState]);

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

    // Check rate limit cooldown
    if (rateLimitState.isLimited) {
      const remaining = rateLimitState.cooldownEnd 
        ? Math.ceil((rateLimitState.cooldownEnd - Date.now()) / 1000)
        : 0;
      toast.warning(`⛳ Still on cooldown! Wait ${remaining}s before sending.`);
      return;
    }

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

    // Build messages list from ref to avoid stale closure state
    const currentMessages = [...messagesRef.current, userMessage];

    try {
      await sendToAI(
        currentMessages.map(m => ({ role: m.role, content: m.content })),
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
          onError: async (error: string, errorType?: string, retryAfter?: number) => {
            // Handle rate limit errors specially
            if (errorType?.startsWith('RATE_LIMIT')) {
              const cooldownMs = errorType === 'RATE_LIMIT_MINUTE' 
                ? (retryAfter || 60) * 1000
                : errorType === 'RATE_LIMIT_HOUR'
                  ? (retryAfter || 60) * 60 * 1000
                  : 0;

              setRateLimitState({
                isLimited: true,
                errorType,
                retryAfter,
                cooldownEnd: Date.now() + cooldownMs,
              });

              // Show toast with specific message
              toast.warning(error, {
                duration: 5000,
                icon: '⛳',
              });

              // Remove the user message since it wasn't processed
              setMessages(prev => prev.filter(m => m.id !== userMessage.id));
              setIsStreaming(false);
              setStreamingContent('');
              return;
            }

            // Handle other errors
            const errorMessage: EchoMessage = {
              id: assistantMessageId,
              role: 'assistant',
              content: error || 'Sorry, I encountered an error. Please try again.',
              createdAt: new Date().toISOString(),
              meta: { error: errorType || error },
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
  }, [messages, sendToAI, isStreaming, userId, conversationId, queryClient, rateLimitState]);

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
    rateLimitState,
  };
}
