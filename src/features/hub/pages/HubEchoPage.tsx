/**
 * Hub Echo Page
 * 
 * Inline AI Chat interface within Hub (Phase 4).
 * Full chat experience with history and streaming.
 */

import React, { useState, useEffect } from 'react';
import { MessageSquare, History } from 'lucide-react';
import { TapButton } from '@/components/ui/TapButton';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useEchoConversations } from '@/features/echo/hooks/useEchoConversations';
import { useAIStream } from '@/features/echo/hooks/useAIStream';
import { ChatThread } from '@/features/echo/components/ChatThread';
import { ChatComposer } from '@/features/echo/components/ChatComposer';
import { HistoryPanel } from '@/features/echo/components/HistoryPanel';

export function HubEchoPage() {
  const [activeView, setActiveView] = useState<'chat' | 'history'>('chat');
  
  const {
    state,
    dispatch,
    conversations,
    activeConversation,
    isStreaming,
    createConversation,
    selectConversation,
    renameConversation,
    deleteConversation,
  } = useEchoConversations();

  const { sendMessage, abort } = useAIStream();

  // Track Echo tab open
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', analyticsEvents.hub.echo_open.event, {
        event_category: analyticsEvents.hub.echo_open.category,
        event_label: analyticsEvents.hub.echo_open.label,
      });
    }
  }, []);

  // Create first conversation if none exist
  useEffect(() => {
    if (conversations.length === 0) {
      createConversation();
    }
  }, [conversations.length, createConversation]);

  // Track view changes
  useEffect(() => {
    if (activeView === 'history' && typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', analyticsEvents.echo.history_opened.event, {
        event_category: analyticsEvents.echo.history_opened.category,
        event_label: analyticsEvents.echo.history_opened.label,
      });
    }
  }, [activeView]);

  const handleSendMessage = async (content: string) => {
    if (!activeConversation) return;

    // Track message sent
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', analyticsEvents.echo.message_sent.event, {
        event_category: analyticsEvents.echo.message_sent.category,
        event_label: analyticsEvents.echo.message_sent.label,
        message_length: content.length,
      });
    }

    // Add user message
    dispatch({ type: 'APPEND_USER', content });

    // Begin assistant response
    dispatch({ type: 'BEGIN_ASSISTANT' });

    // Send to AI
    await sendMessage(
      [...activeConversation.messages, { role: 'user', content }],
      activeConversation.id,
      {
        onChunk: (chunk) => {
          dispatch({ type: 'APPEND_ASSISTANT', content: chunk });
        },
        onComplete: (meta) => {
          dispatch({ type: 'END_ASSISTANT', meta });
        },
        onError: (error) => {
          dispatch({ type: 'ERROR_ASSISTANT', error });
        },
      }
    );
  };

  const handleStopStream = () => {
    abort();
    dispatch({ type: 'END_ASSISTANT' });
  };

  const handleSelectConversation = (id: string) => {
    selectConversation(id);
    setActiveView('chat');
  };

  const handleNewConversation = () => {
    createConversation();
    setActiveView('chat');
  };

  return (
    <div className="flex flex-col h-full">
      {/* View Toggle */}
      <div className="flex gap-2 bg-white/5 p-1 rounded-lg border border-white/10 mb-4">
        <TapButton
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
            activeView === 'chat'
              ? 'bg-white/15 text-white'
              : 'text-white/60 hover:text-white/80'
          }`}
          onClick={() => setActiveView('chat')}
          aria-selected={activeView === 'chat'}
        >
          <MessageSquare className="w-4 h-4 inline mr-1.5" />
          Chat
        </TapButton>
        <TapButton
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
            activeView === 'history'
              ? 'bg-white/15 text-white'
              : 'text-white/60 hover:text-white/80'
          }`}
          onClick={() => setActiveView('history')}
          aria-selected={activeView === 'history'}
        >
          <History className="w-4 h-4 inline mr-1.5" />
          History
        </TapButton>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 bg-background rounded-lg overflow-hidden">
        {activeView === 'chat' ? (
          <>
            <ChatThread 
              messages={activeConversation?.messages || []} 
              isStreaming={isStreaming}
            />
            <ChatComposer
              onSend={handleSendMessage}
              onStop={handleStopStream}
              disabled={!activeConversation || isStreaming}
              isStreaming={isStreaming}
            />
          </>
        ) : (
          <HistoryPanel
            conversations={conversations}
            activeConversationId={state.activeConversationId}
            onSelect={handleSelectConversation}
            onRename={renameConversation}
            onDelete={deleteConversation}
            onNew={handleNewConversation}
          />
        )}
      </div>
    </div>
  );
}
