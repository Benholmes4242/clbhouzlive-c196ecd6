/**
 * EchoPage - Full-page Echo AI chat experience
 * Routes: /echo, /echo/:conversationId
 * Premium, spacious design with warm orange accents
 * Immersive full-screen layout (no app header/bottom nav)
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { haptic } from '@/utils/haptics';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useEchoConversation } from '@/features/echo/hooks/useEchoConversation';
import { EchoPageHeader } from '@/features/echo/components/page/EchoPageHeader';
import { EchoPageWelcome } from '@/features/echo/components/page/EchoPageWelcome';
import { EchoPageMessageList } from '@/features/echo/components/page/EchoPageMessageList';
import { EchoPageComposer } from '@/features/echo/components/page/EchoPageComposer';

export default function EchoPage() {
  const navigate = useNavigate();
  const { conversationId: urlConversationId } = useParams<{ conversationId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const composerRef = useRef<HTMLInputElement>(null);
  
  const [input, setInput] = useState('');
  const initialPromptHandledRef = useRef(false);

  const {
    conversationId,
    messages,
    sendMessage,
    isStreaming,
    streamingContent,
    abortStream,
    resetConversation,
    loadConversation,
    rateLimitCooldown,
  } = useEchoConversation({ resetOnMount: !urlConversationId });

  // Handle initial prompt from URL parameter
  const initialPrompt = searchParams.get('prompt');
  useEffect(() => {
    if (initialPrompt && !initialPromptHandledRef.current && messages.length === 0 && !isStreaming) {
      initialPromptHandledRef.current = true;
      // Clear the URL parameter
      setSearchParams({}, { replace: true });
      // Send the prompt
      sendMessage(initialPrompt);
    }
  }, [initialPrompt, messages.length, isStreaming, sendMessage, setSearchParams]);

  // Load conversation from URL param
  useEffect(() => {
    if (urlConversationId && urlConversationId !== conversationId) {
      loadConversation(urlConversationId);
    }
  }, [urlConversationId, conversationId, loadConversation]);

  // Update URL when conversation changes
  useEffect(() => {
    if (conversationId && !urlConversationId) {
      navigate(`/echo/${conversationId}`, { replace: true });
    }
  }, [conversationId, urlConversationId, navigate]);

  const handleBack = useCallback(() => {
    haptic('light');
    navigate('/hub');
  }, [navigate]);

  const handleNewChat = useCallback(() => {
    haptic('light');
    resetConversation();
    queryClient.invalidateQueries({ queryKey: ['echo', 'conversations'] });
    navigate('/echo', { replace: true });
  }, [resetConversation, queryClient, navigate]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming || rateLimitCooldown) return;
    
    sendMessage(trimmed);
    setInput('');
  }, [input, isStreaming, sendMessage, rateLimitCooldown]);

  const handlePromptClick = useCallback((prompt: string) => {
    if (isStreaming) {
      toast.info('Echo is still responding...');
      return;
    }
    if (rateLimitCooldown) {
      toast.warning(`Please wait ${rateLimitCooldown}s before sending`);
      return;
    }
    haptic('light');
    sendMessage(prompt);
  }, [isStreaming, sendMessage, rateLimitCooldown]);

  const handleFollowUp = useCallback((text: string) => {
    haptic('light');
    if (isStreaming) {
      toast.info('Echo is still responding...');
      return;
    }
    sendMessage(text);
  }, [isStreaming, sendMessage]);

  const handleFocusInput = useCallback(() => {
    composerRef.current?.focus({ preventScroll: true });
  }, []);

  const hasMessages = messages.length > 0 || isStreaming;

  return (
    <motion.div 
      className="fixed inset-0 flex flex-col bg-[#F8FAFC]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* Header - minimal Apple-style */}
      <EchoPageHeader
        onBack={handleBack}
        onNewChat={handleNewChat}
        hasMessages={hasMessages}
      />

      {/* Content - flex-1 to fill remaining space */}
      <div className="flex-1 min-h-0">
        {!hasMessages ? (
          <EchoPageWelcome
            onPromptClick={handlePromptClick}
            onFocusInput={handleFocusInput}
          />
        ) : (
          <div className="h-full overflow-y-auto">
            <EchoPageMessageList
              messages={messages}
              isStreaming={isStreaming}
              streamingContent={streamingContent}
              onFollowUp={handleFollowUp}
            />
          </div>
        )}
      </div>

      {/* Input Bar - refined Apple-style */}
      <div 
        className="flex-none px-5 pt-4 bg-[#F8FAFC]"
        style={{ paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))' }}
      >
        <EchoPageComposer
          ref={composerRef}
          value={input}
          onChange={setInput}
          onSend={handleSend}
          onAbort={abortStream}
          isStreaming={isStreaming}
          disabled={!!rateLimitCooldown}
          cooldown={rateLimitCooldown}
        />
      </div>
    </motion.div>
  );
}
