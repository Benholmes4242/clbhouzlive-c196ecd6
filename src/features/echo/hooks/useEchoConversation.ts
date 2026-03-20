/**
 * Echo Conversation Hook
 * Manages a single conversation with messages and AI streaming
 * Now persists to Supabase for history support
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { nanoid } from 'nanoid';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { EchoMessage } from '../state/echoTypes';
import { useAIStream, type RateLimitError } from './useAIStream';
import { useEchoProfile } from './useEchoProfile';
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

interface UseEchoConversationReturn {
  conversationId: string | null;
  messages: EchoMessage[];
  sendMessage: (content: string) => Promise<void>;
  isStreaming: boolean;
  streamingContent: string;
  abortStream: () => Promise<void>;
  resetConversation: () => void;
  wasAborted: boolean;
  loadConversation: (convId: string) => Promise<void>;
  rateLimitCooldown: number | null;
  /** True once hook has completed initialization and is ready to accept prompts */
  isReady: boolean;
  /** Refetch messages for the current conversation */
  refetchMessages: () => Promise<void>;
}

// Rate limit error messages with golf theme
const RATE_LIMIT_MESSAGES: Record<RateLimitError, { title: string; description: string }> = {
  RATE_LIMIT_MINUTE: {
    title: "Taking a breather! ⛳",
    description: "You're sending messages too quickly. Wait a few seconds."
  },
  RATE_LIMIT_HOUR: {
    title: "Hourly limit reached",
    description: "You've hit your hourly quota. Try again in a few minutes."
  },
  RATE_LIMIT_DAY: {
    title: "Daily limit reached",
    description: "You've reached your daily limit. Come back tomorrow!"
  },
  PROVIDER_RATE_LIMIT: {
    title: "Echo is busy",
    description: "Our AI service is handling high traffic. Try again in a moment."
  }
};

export function useEchoConversation(opts?: UseEchoConversationOptions) {
  const resetOnMount = opts?.resetOnMount ?? false;
  const queryClient = useQueryClient();
  const profile = useEchoProfile();

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<EchoMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [wasAborted, setWasAborted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [rateLimitCooldown, setRateLimitCooldown] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  const { sendMessage: sendToAI, abort } = useAIStream();
  const firstUserMessageRef = useRef<string | null>(null);
  const messagesRef = useRef<EchoMessage[]>([]);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initializingRef = useRef(false);
  
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

  // Reset state on mount if resetOnMount is true, then signal ready
  useEffect(() => {
    // Prevent double initialization in StrictMode
    if (initializingRef.current) return;
    initializingRef.current = true;
    
    // Start as not ready
    setIsReady(false);
    
    if (resetOnMount) {
      setConversationId(null);
      setMessages([]);
      firstUserMessageRef.current = null;
    }
  }, [resetOnMount]);

  // Signal ready only when userId is available
  useEffect(() => {
    if (userId && !isReady) {
      requestAnimationFrame(() => {
        setIsReady(true);
        initializingRef.current = false;
      });
    }
  }, [userId, isReady]);

  // Cleanup cooldown timer
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
    };
  }, []);

  // Load conversation from database
  const loadConversation = useCallback(async (convId: string) => {
    setConversationId(convId);

    const { data, error } = await supabase
      .from('echo_conversation_messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (error) {
      toast.error("Couldn't load conversation");
      return;
    }

    const loadedMessages: EchoMessage[] = (data ?? []).map((row: EchoMessageRow) => ({
      id: row.id,
      role: row.role as 'user' | 'assistant',
      content: row.content,
      createdAt: row.created_at,
    }));

    setMessages(loadedMessages);
    
    const firstUser = loadedMessages.find(m => m.role === 'user');
    firstUserMessageRef.current = firstUser?.content ?? null;
  }, []);

  // Refetch messages for current conversation
  const refetchMessages = useCallback(async () => {
    if (!conversationId) return;

    const { data, error } = await supabase
      .from('echo_conversation_messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      toast.error("Couldn't load messages");
      return;
    }

    const loadedMessages: EchoMessage[] = (data ?? []).map((row: EchoMessageRow) => ({
      id: row.id,
      role: row.role as 'user' | 'assistant',
      content: row.content,
      createdAt: row.created_at,
    }));

    setMessages(loadedMessages);
  }, [conversationId]);

  const sendMessage = useCallback(async (content: string) => {
    if (isStreaming || !userId || rateLimitCooldown) {
      return;
    }

    // Track echo query text for analytics
    analyticsEvents.track('echo_query', {
      query_text: content.slice(0, 500),
      query_length: content.length,
    });

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
              
              if (firstUserMessageRef.current) {
                await setConversationTitleIfEmpty(currentConvId, firstUserMessageRef.current);
              }
              
              queryClient.invalidateQueries({ queryKey: ['echo', 'conversations'] });
            }
          },
          onError: async (error, errorType) => {
            // Handle rate limit errors specially
            if (errorType && errorType in RATE_LIMIT_MESSAGES) {
              const rateLimitType = errorType as RateLimitError;
              const { title, description } = RATE_LIMIT_MESSAGES[rateLimitType];
              
              toast.warning(title, {
                description,
                duration: 5000,
              });

              if (rateLimitType === 'RATE_LIMIT_MINUTE') {
                setRateLimitCooldown(10);
                
                const countdown = () => {
                  setRateLimitCooldown(prev => {
                    if (prev === null || prev <= 1) {
                      return null;
                    }
                    cooldownTimerRef.current = setTimeout(countdown, 1000);
                    return prev - 1;
                  });
                };
                cooldownTimerRef.current = setTimeout(countdown, 1000);
              }

              setMessages(prev => prev.filter(m => m.id !== userMessage.id));
              setIsStreaming(false);
              setStreamingContent('');
              return;
            }

            // Regular error handling
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

            if (currentConvId) {
              await insertMessage(currentConvId, userId, 'assistant', errorMessage.content);
              queryClient.invalidateQueries({ queryKey: ['echo', 'conversations'] });
            }
          },
        },
        {
          firstName: profile.firstName,
          handicap: profile.handicap,
          homeClub: profile.homeClub,
          location: profile.location,
        }
      );
    } catch (error) {
      setIsStreaming(false);
      setStreamingContent('');
    }
  }, [sendToAI, isStreaming, userId, conversationId, queryClient, rateLimitCooldown, profile]);

  const abortStream = useCallback(async () => {
    abort();
    setWasAborted(true);
    
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

      if (conversationId && userId) {
        await insertMessage(conversationId, userId, 'assistant', sanitizedContent);
        queryClient.invalidateQueries({ queryKey: ['echo', 'conversations'] });
      }
    }
    
    setIsStreaming(false);
    setStreamingContent('');
  }, [abort, streamingContent, conversationId, userId, queryClient]);

  const resetConversation = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    setStreamingContent('');
    setIsStreaming(false);
    setWasAborted(false);
    setRateLimitCooldown(null);
    firstUserMessageRef.current = null;
    setIsReady(true);
    
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
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
    rateLimitCooldown,
    isReady,
    refetchMessages,
  } satisfies UseEchoConversationReturn;
}
