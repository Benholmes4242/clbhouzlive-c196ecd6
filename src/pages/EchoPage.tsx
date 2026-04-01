/**
 * EchoPage - Full-page Echo AI chat experience
 * Routes: /echo, /echo/:conversationId
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { haptic } from '@/utils/haptics';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useEchoConversation } from '@/features/echo/hooks/useEchoConversation';
import { useEchoProfile } from '@/features/echo/hooks/useEchoProfile';
import { EchoPageHeader } from '@/features/echo/components/page/EchoPageHeader';
import { EchoPageWelcome } from '@/features/echo/components/page/EchoPageWelcome';
import { EchoPageMessageList } from '@/features/echo/components/page/EchoPageMessageList';
import { EchoPageComposer } from '@/features/echo/components/page/EchoPageComposer';
import { EchoHistorySheet } from '@/features/echo/components/page/EchoHistorySheet';
import { EchoPendingState } from '@/features/echo/components/page/EchoPendingState';


export default function EchoPage() {
  const navigate = useNavigate();
  const { conversationId: urlConversationId } = useParams<{ conversationId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const composerRef = useRef<HTMLInputElement>(null);
  const profile = useEchoProfile();
  
  const [input, setInput] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const returnToRef = useRef<string | null>(null);

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
    isReady,
    refetchMessages,
  } = useEchoConversation({ resetOnMount: !urlConversationId });

  // Capture prompt from URL on mount/navigation
  const initialPrompt = searchParams.get('prompt');
  const initialReturnTo = searchParams.get('returnTo');
  useEffect(() => {
    if (initialReturnTo) {
      returnToRef.current = decodeURIComponent(initialReturnTo);
    }
    if (initialPrompt) {
      const decodedPrompt = decodeURIComponent(initialPrompt);
      setPendingPrompt(decodedPrompt);
      setSearchParams({}, { replace: true });
    }
  }, [initialPrompt, initialReturnTo, setSearchParams]);

  // Process pending prompt once hook is ready
  useEffect(() => {
    if (pendingPrompt && isReady && !isStreaming) {
      const promptToSend = pendingPrompt;
      setPendingPrompt(null);
      sendMessage(promptToSend);
    }
  }, [pendingPrompt, isReady, isStreaming, sendMessage]);

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
    if (returnToRef.current) {
      const destination = returnToRef.current;
      returnToRef.current = null;
      navigate(destination);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  }, [navigate]);

  const handleNewChat = useCallback(() => {
    haptic('light');
    resetConversation();
    queryClient.invalidateQueries({ queryKey: ['echo', 'conversations'] });
    navigate('/echo', { replace: true });
  }, [resetConversation, queryClient, navigate]);

  const handleOpenHistory = useCallback(() => {
    haptic('light');
    setHistoryOpen(true);
  }, []);

  const handleCloseHistory = useCallback(() => {
    setHistoryOpen(false);
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    setHistoryOpen(false);
    setPendingPrompt(null);
    navigate(`/echo/${id}`);
  }, [navigate]);

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


  const hasMessages = messages.length > 0 || isStreaming;
  const showPendingState = pendingPrompt !== null && !hasMessages;

  return (
    <motion.div 
      className="fixed inset-0 flex flex-col"
      style={{ background: '#0c0c0e', paddingTop: 'max(env(safe-area-inset-top, 0px), 44px)', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <div className="relative z-10 flex flex-col h-full">
        <EchoPageHeader
          onBack={handleBack}
          onNew={handleNewChat}
          onHistory={handleOpenHistory}
          hasMessages={hasMessages}
        />

        <div className="flex-1 min-h-0">
          {showPendingState ? (
            <EchoPendingState prompt={pendingPrompt} />
          ) : !hasMessages ? (
            <EchoPageWelcome
              profile={profile}
              onChipSelect={handlePromptClick}
            />
          ) : (
            <div className="h-full flex flex-col">
              <EchoPageMessageList
                messages={messages}
                isStreaming={isStreaming}
                streamingContent={streamingContent}
                onFollowUp={handleFollowUp}
                onRefresh={async () => {
                  if (conversationId) {
                    await refetchMessages();
                  }
                }}
              />
            </div>
          )}
        </div>

        {/* Composer */}
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

      <EchoHistorySheet
        isOpen={historyOpen}
        onClose={handleCloseHistory}
        onSelectConversation={handleSelectConversation}
      />
    </motion.div>
  );
}