/**
 * EchoPage - Full-page Echo AI chat experience
 * Routes: /echo, /echo/:conversationId
 * Premium, spacious design with warm orange accents
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Plus } from 'lucide-react';
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
  const queryClient = useQueryClient();
  const composerRef = useRef<HTMLInputElement>(null);
  
  const [input, setInput] = useState('');

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
    <div className="fixed inset-0 flex flex-col bg-[#F8FAFC]">
      {/* Header */}
      <EchoPageHeader
        onBack={handleBack}
        onNewChat={handleNewChat}
        hasMessages={hasMessages}
      />

      {/* Content */}
      {!hasMessages ? (
        <EchoPageWelcome
          onPromptClick={handlePromptClick}
          onFocusInput={handleFocusInput}
        />
      ) : (
        <EchoPageMessageList
          messages={messages}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
          onFollowUp={handleFollowUp}
        />
      )}

      {/* Input Bar */}
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
  );
}
